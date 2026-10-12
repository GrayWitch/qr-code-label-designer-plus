import type { StickerLayout, StickerElement } from '@amethc/qrlayout-core'
import type { DeepPartial, DesignerI18nMessages, SupportedLocale } from './i18n/types'

export interface DesignerLayout extends StickerLayout {
    targetEntity?: string
}

export interface EntityField {
    name: string
    label: string
}

export interface EntitySchema {
    label: string
    fields: EntityField[]
    sampleData: Record<string, any>
}

export interface DesignerUIConfig {
    /** Whether to show the entire top header bar @default true */
    showHeader?: boolean
    /** Whether to show the top "Save Layout" button @default true */
    showSaveButton?: boolean
    /** Whether to show the top dark/light theme toggle button @default true */
    showThemeToggle?: boolean
    /** Whether to show the top undo/redo buttons @default true */
    showUndoRedo?: boolean
    /** Whether to show the "Target Entity" selector in layout settings @default true */
    showTargetEntity?: boolean
    /** Whether to show the "Layout Name" input in layout settings @default true */
    showLayoutName?: boolean
    /** Whether to show the "Size Preset" selector in layout settings @default true */
    showSizePreset?: boolean
    /** Whether to show the "Width / Height" inputs in layout settings @default true */
    showDimensions?: boolean
    /** Whether to show the "Unit" selector in layout settings @default true */
    showUnit?: boolean
    /** Whether to show the "Background" color picker in layout settings @default true */
    showBackground?: boolean
    /** Whether to show the "+ Text" button @default true */
    showAddText?: boolean
    /** Whether to show the "+ QR" button @default true */
    showAddQr?: boolean
    /** Whether to show the "+ Barcode" button @default true */
    showAddBarcode?: boolean
    /** Whether to show the "Edit Sample Data" button @default true */
    showSampleData?: boolean
    /** Whether to show the "Preview PDF" button @default true */
    showPdfPreview?: boolean
    /** Whether to show the "Preview ZPL" button @default true */
    showZplPreview?: boolean
    /** Whether to show the bottom "Snap to Grid" checkbox @default true */
    showSnapToGrid?: boolean
    /** Whether to show the bottom keyboard shortcuts hint @default true */
    showShortcutsHint?: boolean
    /** Whether to show the QR field separator input in the property panel @default true */
    showQrSeparator?: boolean
    /** Whether to show the Barcode format selector in the property panel @default true */
    showBarcodeFormat?: boolean
    /** Whether to show the Barcode "Show Text" checkbox in the property panel @default true */
    showBarcodeShowText?: boolean
}

export interface ElementDefaults {
    /** Default properties when adding a new Text element */
    text?: Partial<Omit<StickerElement, 'id' | 'type'>>
    /** Default properties when adding a new QR Code element */
    qr?: Partial<Omit<StickerElement, 'id' | 'type'>>
    /** Default properties when adding a new Barcode element */
    barcode?: Partial<Omit<StickerElement, 'id' | 'type'>>
}

export interface DesignerOptions {
    element: HTMLElement
    initialLayout?: StickerLayout
    entitySchemas?: Record<string, EntitySchema>
    onSave?: (layout: StickerLayout) => void
    locale?: SupportedLocale
    messages?: DeepPartial<DesignerI18nMessages>
    /** Control visibility of UI panels, inputs, and buttons */
    uiConfig?: DesignerUIConfig
    /** Custom default values when adding new text / QR / barcode elements */
    elementDefaults?: ElementDefaults
}
