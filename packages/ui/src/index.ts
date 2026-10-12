import {
    StickerPrinter,
    StickerLayout,
    StickerElement,
    ZplOptions,
    ZplRenderOptions,
    DataUrlOptions,
    ExportPNGOptions,
    ImageFormat,
} from '@amethc/qrlayout-core'
import './styles.css'

import { DesignerState } from './state'
import { CanvasManager } from './canvas-manager'
import { PropertyPanel, MultiSelectCallbacks } from './property-panel'
import { buildTemplate } from './template'
import { I18nManager, enUS, zhCN } from './i18n'
import type { DesignerI18nMessages, DeepPartial, SupportedLocale } from './i18n'
import type { DesignerLayout, EntitySchema, DesignerOptions, DesignerUIConfig, ElementDefaults } from './types'

export { StickerPrinter, I18nManager, enUS, zhCN }
export type {
    StickerLayout,
    StickerElement,
    ZplOptions,
    ZplRenderOptions,
    DataUrlOptions,
    ExportPNGOptions,
    ImageFormat,
}
export type { BarcodeFormat } from '@amethc/qrlayout-core'
export type { EntityField, EntitySchema, DesignerOptions, DesignerUIConfig, ElementDefaults } from './types'
export type { DesignerI18nMessages, DeepPartial, SupportedLocale } from './i18n'

const VALID_HEX = /^#[0-9A-F]{6}$/i

/** Automatically unwrap Vue ref / computed objects if passed directly */
function unwrapRef<T>(val: T): T {
    if (
        val &&
        typeof val === 'object' &&
        ('__v_isRef' in (val as any) || ('value' in (val as any) && '_value' in (val as any)))
    ) {
        return (val as any).value
    }
    return val
}

export class QRLayoutDesigner {
    private readonly container: HTMLElement
    private readonly state: DesignerState
    private readonly entitySchemas: Record<string, EntitySchema>
    private readonly onSaveCallback?: (layout: StickerLayout) => void
    private readonly i18n: I18nManager
    private uiConfig: DesignerUIConfig
    private elementDefaults: ElementDefaults
    private canvasMgr!: CanvasManager
    private propPanel!: PropertyPanel
    private selectedIds: Set<string> = new Set()
    private isDarkMode = false

    private _keyHandler!: (e: KeyboardEvent) => void
    private _resizeObserver!: ResizeObserver
    private _previewTimer: ReturnType<typeof setTimeout> | null = null

    private elementsContainer!: HTMLDivElement
    private leftSidebar!: HTMLElement
    private rightSidebar!: HTMLElement
    private sampleDataContainer!: HTMLDivElement
    private undoBtn!: HTMLButtonElement
    private redoBtn!: HTMLButtonElement
    private toggleRight!: HTMLButtonElement
    private pdfModal!: HTMLDivElement
    private pdfContainer!: HTMLDivElement
    private zplModal!: HTMLDivElement
    private zplCodeEl!: HTMLTextAreaElement
    private zplImageContainer!: HTMLDivElement
    private zplDpiSelect!: HTMLSelectElement

    private inputs!: {
        entity: HTMLSelectElement
        name: HTMLInputElement
        width: HTMLInputElement
        height: HTMLInputElement
        unit: HTMLSelectElement
        labelWidth: HTMLLabelElement
        labelHeight: HTMLLabelElement
        bg: HTMLInputElement
        bgPicker: HTMLInputElement
    }

    constructor(options: DesignerOptions) {
        this.container = unwrapRef(options.element)
        this.entitySchemas = unwrapRef(options.entitySchemas) || {}
        this.onSaveCallback = options.onSave
        this.i18n = new I18nManager(unwrapRef(options.locale), unwrapRef(options.messages))
        this.uiConfig = unwrapRef(options.uiConfig) || {}
        this.elementDefaults = unwrapRef(options.elementDefaults) || {}

        const initialLayout = unwrapRef(options.initialLayout)
        const layout = (initialLayout as DesignerLayout) || {
            id: 'layout-' + Date.now(),
            name: this.i18n.msg.settings.defaultLayoutName,
            targetEntity: '',
            width: 100,
            height: 60,
            unit: 'mm',
            backgroundColor: '#ffffff',
            elements: []
        }

        this.state = new DesignerState(layout, () => this.updateUndoButtons())
        this.init()
    }

    private get layout(): DesignerLayout {
        return this.state.layout
    }

    public get i18nManager(): I18nManager {
        return this.i18n
    }

    public setLocale(locale: SupportedLocale, customMessages?: DeepPartial<DesignerI18nMessages>): void {
        this.i18n.setLocale(unwrapRef(locale), unwrapRef(customMessages))
        this.rebuildUI()
    }

    public updateMessages(customMessages: DeepPartial<DesignerI18nMessages>): void {
        this.i18n.updateMessages(unwrapRef(customMessages))
        this.rebuildUI()
    }

    public setUIConfig(uiConfig: DesignerUIConfig): void {
        this.uiConfig = unwrapRef(uiConfig) || {}
        this.rebuildUI()
    }

    public setElementDefaults(elementDefaults: ElementDefaults): void {
        this.elementDefaults = unwrapRef(elementDefaults) || {}
    }

    private init() {
        this.container.classList.add('qrlayout-designer')
        this.container.innerHTML = buildTemplate(this.i18n, this.uiConfig)
        this.cacheDOM()
        this.renderEntityOptions()
        this.syncInputsFromLayout()
        this.bindEvents()
        this.renderSampleDataEditor()
        this.renderElementsList()
        this.updatePreview()
    }

    public rebuildUI() {
        if (this._previewTimer !== null) {
            clearTimeout(this._previewTimer)
            this._previewTimer = null
        }
        if (this._keyHandler) {
            document.removeEventListener('keydown', this._keyHandler)
        }
        if (this._resizeObserver) {
            this._resizeObserver.disconnect()
        }

        this.container.innerHTML = buildTemplate(this.i18n, this.uiConfig)
        this.cacheDOM()
        this.renderEntityOptions()
        this.syncInputsFromLayout()
        this.bindEvents()
        this.renderSampleDataEditor()
        this.renderElementsList()
        this.refreshPropertyPanel()
        this.updatePreview()
    }

    private cacheDOM() {
        const q = <T extends HTMLElement>(sel: string) => this.container.querySelector<T>(sel)!
        const qi = <T extends HTMLElement>(key: string) => this.container.querySelector<T>(`[data-input="${key}"]`)!

        const canvas = q<HTMLCanvasElement>('[data-el="preview-canvas"]')
        const overlay = q<HTMLDivElement>('[data-el="editor-overlay"]')
        this.canvasMgr = new CanvasManager(canvas, overlay, new StickerPrinter())

        const panel = q<HTMLDivElement>('[data-el="property-panel"]')
        const content = q<HTMLDivElement>('[data-el="prop-content"]')
        this.propPanel = new PropertyPanel(panel, content, this.i18n, this.uiConfig)

        this.elementsContainer = q<HTMLDivElement>('[data-el="elements-container"]')
        this.leftSidebar = q('.sidebar')
        this.rightSidebar = q('.sidebar-right')

        // Click on blank canvas to deselect
        overlay.addEventListener('mousedown', (e) => {
            if ((e.target as HTMLElement) === overlay) this.selectElement(null)
        })
        this.undoBtn = q<HTMLButtonElement>('[data-el="undo-btn"]')
        this.redoBtn = q<HTMLButtonElement>('[data-el="redo-btn"]')
        this.toggleRight = q<HTMLButtonElement>('#toggle-right')
        this.sampleDataContainer = q<HTMLDivElement>('[data-el="sample-data-container"]')
        this.pdfModal = q<HTMLDivElement>('[data-el="pdf-preview-modal"]')
        this.pdfContainer = q<HTMLDivElement>('[data-el="pdf-preview-container"]')
        this.zplModal = q<HTMLDivElement>('[data-el="zpl-preview-modal"]')
        this.zplCodeEl = q<HTMLTextAreaElement>('[data-el="zpl-code"]')
        this.zplImageContainer = q<HTMLDivElement>('[data-el="zpl-preview-image"]')
        this.zplDpiSelect = q<HTMLSelectElement>('[data-el="zpl-dpi"]')

        this.inputs = {
            entity: qi<HTMLSelectElement>('entity'),
            name: qi<HTMLInputElement>('name'),
            width: qi<HTMLInputElement>('width'),
            height: qi<HTMLInputElement>('height'),
            unit: qi<HTMLSelectElement>('unit'),
            labelWidth: q<HTMLLabelElement>('[data-label="width"]'),
            labelHeight: q<HTMLLabelElement>('[data-label="height"]'),
            bg: qi<HTMLInputElement>('bg'),
            bgPicker: qi<HTMLInputElement>('bg-picker'),
        }
    }

    private renderEntityOptions() {
        const select = this.inputs.entity
        while (select.options.length > 1) select.remove(1)

        Object.entries(this.entitySchemas).forEach(([key, schema]) => {
            const opt = document.createElement('option')
            opt.value = key
            opt.text = schema.label || key
            select.add(opt)
        })
    }

    private syncInputsFromLayout() {
        this.inputs.entity.value = this.layout.targetEntity || ''
        this.inputs.name.value = this.layout.name
        this.inputs.width.value = String(this.layout.width)
        this.inputs.height.value = String(this.layout.height)
        this.inputs.unit.value = this.layout.unit
        this.inputs.labelWidth.innerText = this.i18n.format(this.i18n.msg.settings.width, { unit: this.layout.unit })
        this.inputs.labelHeight.innerText = this.i18n.format(this.i18n.msg.settings.height, { unit: this.layout.unit })
        const bg = this.layout.backgroundColor || '#ffffff'
        this.inputs.bg.value = bg
        if (VALID_HEX.test(bg)) this.inputs.bgPicker.value = bg
    }

    private bindEvents() {
        this.bindThemeAndSave()
        this.bindModalAndNav()
        this.bindLayoutInputs()
        this.bindElementToolbar()
        this.bindKeyboard()
        this.bindResizeObserver()
        this.bindPreviewModals()
    }

    private bindThemeAndSave() {
        this.undoBtn.addEventListener('click', () => this.undo())
        this.redoBtn.addEventListener('click', () => this.redo())

        this.container.querySelector('[data-action="toggle-theme"]')?.addEventListener('click', (e) => {
            this.isDarkMode = !this.isDarkMode
            this.container.classList.toggle('dark-mode', this.isDarkMode)
            const btn = e.currentTarget as HTMLElement
            ;(btn.querySelector('.sun-icon') as HTMLElement).style.display = this.isDarkMode ? 'block' : 'none'
            ;(btn.querySelector('.moon-icon') as HTMLElement).style.display = this.isDarkMode ? 'none' : 'block'
        })

        this.container.querySelector('[data-action="save"]')?.addEventListener('click', () => {
            this.save()
        })
    }

    private bindModalAndNav() {
        this.container.querySelector('[data-action="edit-sample-data"]')?.addEventListener('click', () => {
            this.renderSampleDataEditor()
            this.container.querySelector('[data-el="sample-data-modal"]')?.classList.add('show')
        })
        this.container.querySelectorAll('[data-action="close-modal"]').forEach(btn => {
            btn.addEventListener('click', () => {
                this.container.querySelector('[data-el="sample-data-modal"]')?.classList.remove('show')
            })
        })
        this.container.querySelector('#toggle-left')?.addEventListener('click', () => {
            this.leftSidebar.classList.toggle('show')
        })
        this.toggleRight.addEventListener('click', () => {
            this.rightSidebar.classList.toggle('show')
        })
    }

    private bindLayoutInputs() {
        this.inputs.entity.onchange = (e) => {
            this.layout.targetEntity = (e.target as HTMLSelectElement).value
            this.renderSampleDataEditor()
            this.refreshPropertyPanel()
            this.updatePreview()
        }
        this.inputs.name.oninput = (e) => {
            this.layout.name = (e.target as HTMLInputElement).value
        }
        this.inputs.width.oninput = (e) => {
            const val = Number.parseFloat((e.target as HTMLInputElement).value)
            if (val > 0) { this.layout.width = val; this.schedulePreview() }
        }
        this.inputs.height.oninput = (e) => {
            const val = Number.parseFloat((e.target as HTMLInputElement).value)
            if (val > 0) { this.layout.height = val; this.schedulePreview() }
        }
        this.inputs.unit.onchange = (e) => {
            this.layout.unit = (e.target as HTMLSelectElement).value as any
            this.inputs.labelWidth.innerText = this.i18n.format(this.i18n.msg.settings.width, { unit: this.layout.unit })
            this.inputs.labelHeight.innerText = this.i18n.format(this.i18n.msg.settings.height, { unit: this.layout.unit })
            this.updatePreview()
        }
        this.inputs.bg.oninput = (e) => {
            const val = (e.target as HTMLInputElement).value
            this.layout.backgroundColor = val
            if (VALID_HEX.test(val)) this.inputs.bgPicker.value = val
            this.schedulePreview()
        }
        this.inputs.bgPicker.oninput = (e) => {
            const val = (e.target as HTMLInputElement).value
            this.layout.backgroundColor = val
            this.inputs.bg.value = val
            this.schedulePreview()
        }
    }

    private bindElementToolbar() {
        this.container.querySelector('[data-action="add-text"]')?.addEventListener('click', () => {
            this.state.snapshot()
            const id = 't' + Date.now()
            const defaults = this.elementDefaults.text
            this.layout.elements.push({
                x: 10,
                y: 10,
                w: 40,
                h: 10,
                content: this.i18n.msg.elements.defaultTextContent,
                ...defaults,
                ...(defaults?.style ? { style: { ...defaults.style } } : {}),
                id,
                type: 'text',
            })
            this.selectElement(id)
            this.updatePreview()
        })
        this.container.querySelector('[data-action="add-qr"]')?.addEventListener('click', () => {
            this.state.snapshot()
            const id = 'q' + Date.now()
            const defaults = this.elementDefaults.qr
            this.layout.elements.push({
                x: 5,
                y: 5,
                w: 20,
                h: 20,
                content: '{{id}}',
                ...defaults,
                ...(defaults?.style ? { style: { ...defaults.style } } : {}),
                id,
                type: 'qr',
            })
            this.selectElement(id)
            this.updatePreview()
        })
        this.container.querySelector('[data-action="add-barcode"]')?.addEventListener('click', () => {
            this.state.snapshot()
            const id = 'b' + Date.now()
            const defaults = this.elementDefaults.barcode
            this.layout.elements.push({
                x: 5,
                y: 5,
                w: 50,
                h: 15,
                content: '{{id}}',
                barcodeFormat: 'CODE128',
                ...defaults,
                ...(defaults?.style ? { style: { ...defaults.style } } : {}),
                id,
                type: 'barcode',
            })
            this.selectElement(id)
            this.updatePreview()
        })
        this.container.querySelector('[data-action="delete-element"]')?.addEventListener('click', () => {
            this.deleteSelectedElement()
        })
        this.container.querySelector('[data-action="toggle-grid"]')?.addEventListener('change', (e) => {
            this.canvasMgr.snapToGrid = (e.target as HTMLInputElement).checked
            this.refreshOverlay()
        })
        const presetSelect = this.container.querySelector<HTMLSelectElement>('[data-input="preset"]')
        presetSelect?.addEventListener('change', (e) => {
            const val = (e.target as HTMLSelectElement).value
            if (val) { this.applyPreset(val); (e.target as HTMLSelectElement).value = '' }
        })
    }

    private bindKeyboard() {
        this._keyHandler = (e: KeyboardEvent) => this.handleKeyDown(e)
        document.addEventListener('keydown', this._keyHandler)
    }

    private handleKeyDown(e: KeyboardEvent) {
        const tag = (document.activeElement as HTMLElement)?.tagName
        if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return

        const ctrl = e.ctrlKey || e.metaKey
        if (ctrl && e.key === 'z' && !e.shiftKey) { e.preventDefault(); this.undo() }
        else if (ctrl && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) { e.preventDefault(); this.redo() }
        else if (ctrl && e.key === 'a') { e.preventDefault(); this.selectAll() }
        else if ((e.key === 'Delete' || e.key === 'Backspace') && this.selectedIds.size > 0) { e.preventDefault(); this.deleteSelectedElement() }
        else if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key) && this.selectedIds.size > 0) { e.preventDefault(); this.nudgeSelected(e.key, e.shiftKey ? 5 : 1) }
        else if (ctrl && e.key === 'd' && this.selectedIds.size > 0) { e.preventDefault(); this.duplicateSelected() }
        else if (e.key === 'Escape') { this.selectElement(null) }
    }

    private bindResizeObserver() {
        this._resizeObserver = new ResizeObserver(() => {
            if (this.container.offsetWidth > 768) {
                this.leftSidebar.classList.remove('show')
                this.rightSidebar.classList.remove('show')
            }
            this.refreshPropertyPanel()
        })
        this._resizeObserver.observe(this.container)
    }

    private refreshOverlay() {
        this.canvasMgr.updateOverlay(
            this.layout.elements,
            this.selectedIds,
            (id, ctrlKey) => this.selectElement(id, ctrlKey),
            (e, el, item) => {
                this.state.snapshot()
                const companions = this.layout.elements.filter(x => this.selectedIds.has(x.id) && x.id !== el.id)
                this.canvasMgr.startDrag(e, el, item, companions, () => this.refreshPropertyPanel(), () => { this.updatePreview(); this.refreshPropertyPanel() })
            },
            (e, el, item) => {
                this.state.snapshot()
                this.canvasMgr.startResize(e, el, item, () => this.refreshPropertyPanel(), () => { this.updatePreview(); this.refreshPropertyPanel() })
            }
        )
    }

    private renderSampleDataEditor() {
        if (!this.sampleDataContainer) return

        const entity = this.layout.targetEntity
        if (!entity || !this.entitySchemas[entity]) {
            this.sampleDataContainer.innerHTML = `
                <div style="font-size: 0.75rem; color: var(--text-secondary); padding: 12px; background: var(--panel-bg-alt); border-radius: 8px; border: 1px dashed var(--border-color); text-align: center; display: flex; flex-direction: column; gap: 8px; align-items: center;">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="opacity: 0.5;"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>
                    <span>${this.i18n.msg.sampleData.noEntityHint}</span>
                </div>
            `
            return
        }

        const schema = this.entitySchemas[entity]
        this.sampleDataContainer.innerHTML = ''
        const grid = document.createElement('div')
        grid.className = 'sample-data-grid-container'

        schema.fields.forEach(field => {
            const group = document.createElement('div')
            group.className = 'form-group'
            group.style.margin = '0'

            const label = document.createElement('label')
            label.style.display = 'flex'
            label.style.justifyContent = 'space-between'
            label.innerHTML = `
                <span>${field.label || field.name}</span>
                <code style="font-size: 0.625rem; opacity: 0.6; background: var(--panel-bg-alt); padding: 1px 4px; border-radius: 3px;">{{${field.name}}}</code>
            `

            const input = document.createElement('input')
            input.type = 'text'
            input.value = schema.sampleData[field.name] || ''
            input.placeholder = this.i18n.format(this.i18n.msg.sampleData.fieldPlaceholder, {
                field: field.label || field.name
            })
            input.style.fontSize = '0.8125rem'
            input.oninput = (e) => {
                schema.sampleData[field.name] = (e.target as HTMLInputElement).value
                this.schedulePreview()
            }

            group.appendChild(label)
            group.appendChild(input)
            grid.appendChild(group)
        })

        this.sampleDataContainer.appendChild(grid)
    }

    private getElementTypeName(type: string): string {
        switch (type) {
            case 'text': return this.i18n.msg.elements.typeText
            case 'qr': return this.i18n.msg.elements.typeQr
            case 'barcode': return this.i18n.msg.elements.typeBarcode
            default: return type.toUpperCase()
        }
    }

    private renderElementsList() {
        this.elementsContainer.innerHTML = ''
        this.layout.elements.forEach(el => {
            const div = document.createElement('div')
            div.className = `element-item ${this.selectedIds.has(el.id) ? 'active' : ''}`
            div.innerHTML = `
                <div class="element-info">
                    <span class="element-name">${this.getElementTypeName(el.type)}</span>
                    <span class="element-sub">${String(el.content).substring(0, 20)}</span>
                </div>
            `
            div.onclick = (e) => this.selectElement(el.id, e.ctrlKey || e.metaKey)
            this.elementsContainer.appendChild(div)
        })
    }

    private selectElement(id: string | null, addToSelection = false) {
        if (id === null) {
            this.selectedIds.clear()
        } else if (addToSelection) {
            if (this.selectedIds.has(id)) this.selectedIds.delete(id)
            else this.selectedIds.add(id)
        } else if (!this.selectedIds.has(id) || this.selectedIds.size > 1) {
            this.selectedIds = new Set([id])
        }
        this.renderElementsList()
        this.refreshPropertyPanel()
        this.refreshOverlay()

        if (this.selectedIds.size > 0 && this.container.offsetWidth <= 768) {
            this.rightSidebar.classList.add('show')
        }
    }

    private selectAll() {
        this.selectedIds = new Set(this.layout.elements.map(e => e.id))
        this.renderElementsList()
        this.refreshPropertyPanel()
        this.refreshOverlay()
    }

    private refreshPropertyPanel() {
        const isMobile = this.container.offsetWidth <= 768

        if (this.selectedIds.size === 0) {
            this.propPanel.hide(this.toggleRight)
            return
        }

        if (this.selectedIds.size > 1) {
            this.propPanel.showMultiSelection(this.selectedIds.size, this.toggleRight, isMobile, {
                alignRelative: (dir) => this.alignElementsRelative(dir),
                alignToLabel: (dir) => this.alignAllToLabel(dir),
            } as MultiSelectCallbacks)
            return
        }

        const el = this.layout.elements.find(e => this.selectedIds.has(e.id)) ?? null
        if (!el) { this.propPanel.hide(this.toggleRight); return }

        const schema = this.layout.targetEntity
            ? (this.entitySchemas[this.layout.targetEntity] ?? null)
            : null

        this.propPanel.show(el, schema, this.toggleRight, isMobile, {
            snapshot: () => this.state.snapshot(),
            capture: () => this.state.capture(),
            pushRaw: (raw) => this.state.pushRaw(raw),
            update: () => this.schedulePreview(),
            align: (dir) => this.alignElement(dir),
            refreshPanel: () => this.refreshPropertyPanel(),
        })
    }

    public async updatePreview() {
        if (this._previewTimer !== null) {
            clearTimeout(this._previewTimer)
            this._previewTimer = null
        }

        if (!this.canvasMgr.canvas || !this.layout) return

        const sampleData = (this.layout.targetEntity && this.entitySchemas[this.layout.targetEntity])
            ? this.entitySchemas[this.layout.targetEntity].sampleData
            : {}

        if (!this.canvasMgr.isDragging) {
            await this.canvasMgr.render(this.layout, sampleData)
        }

        this.refreshOverlay()
    }

    /** Debounced preview — used for typing inputs to avoid canvas thrashing */
    private schedulePreview() {
        if (this._previewTimer !== null) clearTimeout(this._previewTimer)
        this._previewTimer = setTimeout(() => {
            this._previewTimer = null
            this.updatePreview()
        }, 80)
    }

    private undo(): void {
        const layout = this.state.undo()
        if (!layout) return
        this.selectedIds.clear()
        this.syncInputsFromLayout()
        this.renderSampleDataEditor()
        this.renderElementsList()
        this.refreshPropertyPanel()
        this.updatePreview()
        this.updateUndoButtons()
    }

    private redo(): void {
        const layout = this.state.redo()
        if (!layout) return
        this.selectedIds.clear()
        this.syncInputsFromLayout()
        this.renderSampleDataEditor()
        this.renderElementsList()
        this.refreshPropertyPanel()
        this.updatePreview()
        this.updateUndoButtons()
    }

    private updateUndoButtons(): void {
        this.undoBtn.disabled = !this.state.canUndo
        this.redoBtn.disabled = !this.state.canRedo
    }

    private nudgeSelected(key: string, step: number): void {
        const els = this.layout.elements.filter(e => this.selectedIds.has(e.id))
        if (els.length === 0) return
        this.state.snapshot()
        els.forEach(el => {
            if (key === 'ArrowLeft')  el.x = Math.max(0, el.x - step)
            if (key === 'ArrowRight') el.x += step
            if (key === 'ArrowUp')    el.y = Math.max(0, el.y - step)
            if (key === 'ArrowDown')  el.y += step
        })
        this.updatePreview()
        this.refreshPropertyPanel()
    }

    private duplicateSelected(): void {
        const els = this.layout.elements.filter(e => this.selectedIds.has(e.id))
        if (els.length === 0) return
        this.state.snapshot()
        const newEls: StickerElement[] = els.map(el => ({
            ...el,
            id: el.type[0] + Date.now() + Math.random().toString(36).slice(2, 4),
            x: el.x + 5,
            y: el.y + 5,
        }))
        this.layout.elements.push(...newEls)
        this.selectedIds = new Set(newEls.map(e => e.id))
        this.renderElementsList()
        this.refreshPropertyPanel()
        this.updatePreview()
    }

    private deleteSelectedElement(): void {
        if (this.selectedIds.size === 0) return
        this.state.snapshot()
        this.layout.elements = this.layout.elements.filter(e => !this.selectedIds.has(e.id))
        this.selectElement(null)
        this.updatePreview()
    }

    private alignElement(direction: string): void {
        const el = this.layout.elements.find(e => this.selectedIds.has(e.id))
        if (!el) return
        this.state.snapshot()
        const { width, height } = this.layout
        switch (direction) {
            case 'left':     el.x = 0; break
            case 'center-h': el.x = (width - el.w) / 2; break
            case 'right':    el.x = width - el.w; break
            case 'top':      el.y = 0; break
            case 'center-v': el.y = (height - el.h) / 2; break
            case 'bottom':   el.y = height - el.h; break
        }
        this.updatePreview()
        this.refreshPropertyPanel()
    }

    private alignElementsRelative(direction: string): void {
        const els = this.layout.elements.filter(e => this.selectedIds.has(e.id))
        if (els.length < 2) return
        this.state.snapshot()
        const minX = Math.min(...els.map(e => e.x))
        const maxX = Math.max(...els.map(e => e.x + e.w))
        const minY = Math.min(...els.map(e => e.y))
        const maxY = Math.max(...els.map(e => e.y + e.h))
        switch (direction) {
            case 'left':     els.forEach(e => { e.x = minX }); break
            case 'center-h': els.forEach(e => { e.x = (minX + maxX) / 2 - e.w / 2 }); break
            case 'right':    els.forEach(e => { e.x = maxX - e.w }); break
            case 'top':      els.forEach(e => { e.y = minY }); break
            case 'center-v': els.forEach(e => { e.y = (minY + maxY) / 2 - e.h / 2 }); break
            case 'bottom':   els.forEach(e => { e.y = maxY - e.h }); break
        }
        this.updatePreview()
        this.refreshPropertyPanel()
    }

    private alignAllToLabel(direction: string): void {
        const els = this.layout.elements.filter(e => this.selectedIds.has(e.id))
        if (els.length === 0) return
        this.state.snapshot()
        const { width, height } = this.layout
        els.forEach(el => {
            switch (direction) {
                case 'left':     el.x = 0; break
                case 'center-h': el.x = (width - el.w) / 2; break
                case 'right':    el.x = width - el.w; break
                case 'top':      el.y = 0; break
                case 'center-v': el.y = (height - el.h) / 2; break
                case 'bottom':   el.y = height - el.h; break
            }
        })
        this.updatePreview()
        this.refreshPropertyPanel()
    }

    private applyPreset(value: string): void {
        const presets: Record<string, { width: number; height: number; unit: 'mm' | 'in' | 'cm' | 'px' }> = {
            '100x60mm': { width: 100, height: 60,  unit: 'mm' },
            '100x50mm': { width: 100, height: 50,  unit: 'mm' },
            '50x25mm':  { width: 50,  height: 25,  unit: 'mm' },
            '62x29mm':  { width: 62,  height: 29,  unit: 'mm' },
            '4x6in':    { width: 4,   height: 6,   unit: 'in' },
            '3x2in':    { width: 3,   height: 2,   unit: 'in' },
            '2x1in':    { width: 2,   height: 1,   unit: 'in' },
        }
        const preset = presets[value]
        if (!preset) return
        this.layout.width = preset.width
        this.layout.height = preset.height
        this.layout.unit = preset.unit
        this.syncInputsFromLayout()
        this.updatePreview()
    }

    private bindPreviewModals(): void {
        this.container.querySelector('[data-action="preview-pdf"]')?.addEventListener('click', () => this.openPdfPreview())
        this.container.querySelector('[data-action="preview-zpl"]')?.addEventListener('click', () => this.openZplPreview())
        this.container.querySelectorAll('[data-action="close-pdf-modal"]').forEach(b =>
            b.addEventListener('click', () => this.pdfModal.classList.remove('show'))
        )
        this.container.querySelectorAll('[data-action="close-zpl-modal"]').forEach(b =>
            b.addEventListener('click', () => this.zplModal.classList.remove('show'))
        )
        this.container.querySelector('[data-action="refresh-zpl-preview"]')?.addEventListener('click', () => {
            void this.refreshZplPreview()
        })
        this.container.querySelector('[data-action="copy-zpl"]')?.addEventListener('click', () => {
            navigator.clipboard.writeText(this.zplCodeEl.value).catch(() => {})
        })
        this.zplDpiSelect.addEventListener('change', () => { void this.refreshZplPreview() })
    }

    private getSampleData(): Record<string, any> {
        return (this.layout.targetEntity && this.entitySchemas[this.layout.targetEntity])
            ? this.entitySchemas[this.layout.targetEntity].sampleData
            : {}
    }

    private toInches(value: number, unit: string): number {
        switch (unit) {
            case 'in': return value
            case 'mm': return value / 25.4
            case 'cm': return value / 2.54
            case 'px': return value / 96
            default:   return value / 25.4
        }
    }

    private openPdfPreview(): void {
        this.pdfModal.classList.add('show')
        this.pdfContainer.innerHTML = `<div style="text-align:center;padding:40px;color:var(--text-secondary);">${this.i18n.msg.pdf.generating}</div>`
        void this.generatePdfPreview()
    }

    private async generatePdfPreview(): Promise<void> {
        const sampleData = this.getSampleData()
        try {
            const doc = await this.canvasMgr.printer.exportToPDF(this.layout, [sampleData])
            const blob = (doc as any).output('blob') as Blob
            const url = URL.createObjectURL(blob)
            this.pdfContainer.innerHTML = `
                <div style="margin-bottom:10px;display:flex;gap:8px;">
                    <a href="${url}" download="${this.layout.name || 'label'}.pdf" class="btn btn-outline btn-sm">${this.i18n.msg.pdf.download}</a>
                </div>
                <iframe src="${url}" style="width:100%;height:480px;border:1px solid var(--border-color);border-radius:6px;"></iframe>
            `
        } catch {
            try {
                const dataUrl = await this.canvasMgr.printer.renderToDataURL(this.layout, sampleData)
                this.pdfContainer.innerHTML = `
                    <p style="font-size:0.8125rem;color:var(--text-secondary);margin-bottom:12px;padding:8px 12px;background:var(--panel-bg-alt);border-radius:6px;border:1px solid var(--border-color);">
                        ${this.i18n.msg.pdf.jspdfNotice}
                    </p>
                    <img src="${dataUrl}" style="max-width:100%;border:1px solid var(--border-color);border-radius:4px;display:block;">
                `
            } catch {
                this.pdfContainer.innerHTML = `<div style="color:red;padding:20px;">${this.i18n.msg.pdf.failedNotice}</div>`
            }
        }
    }

    private openZplPreview(): void {
        this.zplModal.classList.add('show')
        void this.refreshZplPreview()
    }

    private async refreshZplPreview(): Promise<void> {
        const sampleData = this.getSampleData()
        const dpi = Number.parseInt(this.zplDpiSelect.value, 10) as 203 | 300 | 600
        const [zpl] = await this.canvasMgr.printer.exportToZPLAsync(this.layout, [sampleData], { dpi })
        this.zplCodeEl.value = zpl

        this.zplImageContainer.innerHTML = `<div style="color:var(--text-secondary);font-size:0.8125rem;padding:20px;">${this.i18n.msg.zpl.loading}</div>`

        try {
            const prevUrl = await this.canvasMgr.printer.renderZPLToDataURL(zpl)
            this.zplImageContainer.innerHTML = `
                <img src="${prevUrl}" alt="ZPL label preview" style="max-width:100%;max-height:400px;display:block;margin:auto;image-rendering:pixelated;">
            `
        } catch {
            this.zplImageContainer.innerHTML = `
                <div style="font-size:0.8125rem;color:var(--text-secondary);padding:20px;text-align:center;line-height:1.7;">
                    <div style="margin-bottom:6px;">&#9888; ${this.i18n.msg.zpl.offlineNotice}</div>
                    <div>${this.i18n.msg.zpl.offlineLinkText}
                        <a href="https://labelary.com/viewer.html" target="_blank" rel="noopener" style="color:var(--primary-color);">labelary.com/viewer.html</a>
                    </div>
                </div>
            `
        }
    }

    public destroy() {
        if (this._previewTimer !== null) clearTimeout(this._previewTimer)
        if (this._keyHandler) document.removeEventListener('keydown', this._keyHandler)
        if (this._resizeObserver) this._resizeObserver.disconnect()
        this.container.innerHTML = ''
        this.container.classList.remove('qrlayout-designer')
    }

    /**
     * Trigger the `onSave` callback with the current layout and return a deep copy of the layout.
     */
    public save(): StickerLayout {
        const snapshot = this.getLayout()
        this.onSaveCallback?.(snapshot)
        return snapshot
    }

    /**
     * Get a deep copy of the current layout configuration.
     */
    public getLayout(): StickerLayout {
        return JSON.parse(JSON.stringify(this.layout))
    }

    /**
     * Load/replace the current layout configuration and refresh the designer UI.
     */
    public setLayout(layout: StickerLayout): void {
        this.state.snapshot()
        this.state.replace(JSON.parse(JSON.stringify(layout)) as DesignerLayout)
        this.selectedIds.clear()
        this.syncInputsFromLayout()
        this.renderSampleDataEditor()
        this.renderElementsList()
        this.refreshPropertyPanel()
        void this.updatePreview()
        this.updateUndoButtons()
    }

    /**
     * Asynchronously generate the ZPL code string for the current layout.
     * Supports high-DPI large QR codes via ^GFA bitmap graphics.
     */
    public async getZPL(options?: ZplOptions & { data?: Record<string, any> }): Promise<string> {
        const sampleData = options?.data ?? this.getSampleData()
        const selectedDpi = Number.parseInt(this.zplDpiSelect?.value || '203', 10)
        const dpi = options?.dpi ?? (Number.isNaN(selectedDpi) ? 203 : selectedDpi)
        const [zpl] = await this.canvasMgr.printer.exportToZPLAsync(this.layout, [sampleData], {
            ...options,
            dpi,
        })
        return zpl
    }

    /**
     * Synchronously generate the ZPL code string for the current layout.
     */
    public getZPLSync(options?: ZplOptions & { data?: Record<string, any> }): string {
        const sampleData = options?.data ?? this.getSampleData()
        const selectedDpi = Number.parseInt(this.zplDpiSelect?.value || '203', 10)
        const dpi = options?.dpi ?? (Number.isNaN(selectedDpi) ? 203 : selectedDpi)
        const [zpl] = this.canvasMgr.printer.exportToZPL(this.layout, [sampleData], {
            ...options,
            dpi,
        })
        return zpl
    }

    /**
     * Generate both the ZPL code string and its local offline preview image Data URL.
     */
    public async renderZPLPreview(
        options?: ZplOptions & DataUrlOptions & { data?: Record<string, any> }
    ): Promise<{ zpl: string; dataUrl: string }> {
        const sampleData = options?.data ?? this.getSampleData()
        const selectedDpi = Number.parseInt(this.zplDpiSelect?.value || '203', 10)
        const dpi = options?.dpi ?? (Number.isNaN(selectedDpi) ? 203 : selectedDpi)
        return this.canvasMgr.printer.renderZPLPreview(this.layout, sampleData, {
            ...options,
            dpi,
        })
    }

    /**
     * Render any ZPL command string into a local offline preview image Data URL.
     */
    public async renderZPLToDataURL(
        zpl: string,
        options?: ZplRenderOptions & DataUrlOptions
    ): Promise<string> {
        return this.canvasMgr.printer.renderZPLToDataURL(zpl, options)
    }

    /**
     * Export the current label as a Base64 Data URL image (png/jpg).
     * Pass `download: true` to automatically trigger a browser file download.
     */
    public async exportImage(
        options?: DataUrlOptions & { data?: Record<string, any>; download?: boolean; filename?: string }
    ): Promise<string> {
        const sampleData = options?.data ?? this.getSampleData()
        const format = options?.format || 'png'
        const dataUrl = await this.canvasMgr.printer.renderToDataURL(this.layout, sampleData, {
            format,
            quality: options?.quality,
            canvas: options?.canvas,
        })

        if (options?.download) {
            const ext = format.toLowerCase() === 'jpg' ? 'jpg' : format.toLowerCase()
            const name = options.filename || `${this.layout.name || 'label'}.${ext}`
            this.triggerDownload(dataUrl, name)
        }

        return dataUrl
    }

    /**
     * Export the current label as a PNG Blob.
     * Pass `download: true` to automatically trigger a browser file download.
     */
    public async exportPNG(
        options?: ExportPNGOptions & { data?: Record<string, any>; download?: boolean; filename?: string }
    ): Promise<Blob> {
        const sampleData = options?.data ?? this.getSampleData()
        const blob = await this.canvasMgr.printer.exportToPNG(this.layout, sampleData, {
            canvas: options?.canvas,
        })

        if (options?.download) {
            const name = options.filename || `${this.layout.name || 'label'}.png`
            const url = URL.createObjectURL(blob)
            this.triggerDownload(url, name)
            URL.revokeObjectURL(url)
        }

        return blob
    }

    /**
     * Trigger a browser download of the current label as an image file (default PNG) and return its Data URL.
     */
    public async downloadImage(
        filename?: string,
        options?: DataUrlOptions & { data?: Record<string, any> }
    ): Promise<string> {
        const format = options?.format || 'png'
        const ext = format.toLowerCase() === 'jpg' ? 'jpg' : format.toLowerCase()
        const finalName = filename
            ? (/\.(png|jpe?g|webp)$/i.test(filename) ? filename : `${filename}.${ext}`)
            : `${this.layout.name || 'label'}.${ext}`

        return this.exportImage({
            ...options,
            format,
            download: true,
            filename: finalName,
        })
    }

    private triggerDownload(href: string, filename: string): void {
        const link = document.createElement('a')
        link.href = href
        link.download = filename
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
    }
}
