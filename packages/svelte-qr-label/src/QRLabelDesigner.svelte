<script lang="ts">
    import { untrack } from 'svelte';
    import { QRLayoutDesigner } from 'qrlayout-ui';
    import type {
        StickerLayout,
        EntitySchema,
        DesignerUIConfig,
        ElementDefaults,
        ZplOptions,
        ZplRenderOptions,
        DataUrlOptions,
        ExportPNGOptions,
    } from 'qrlayout-ui';
    import 'qrlayout-ui/style.css';

    interface Props {
        initialLayout?: StickerLayout;
        entitySchemas?: Record<string, EntitySchema>;
        uiConfig?: DesignerUIConfig;
        elementDefaults?: ElementDefaults;
        onsave?: (layout: StickerLayout) => void;
        class?: string;
        style?: string;
    }

    let {
        initialLayout,
        entitySchemas,
        uiConfig,
        elementDefaults,
        onsave,
        class: className = '',
        style = '',
    }: Props = $props();

    let container: HTMLDivElement | undefined = $state();
    let designer: QRLayoutDesigner | null = null;

    $effect(() => {
        const layoutId = initialLayout?.id;
        const _b = JSON.stringify(entitySchemas);

        if (!container) return;

        untrack(() => {
            designer?.destroy();
            designer = new QRLayoutDesigner({
                element: container!,
                initialLayout,
                entitySchemas,
                uiConfig,
                elementDefaults,
                onSave: (layout) => onsave?.(layout),
            });
        });

        return () => {
            untrack(() => {
                designer?.destroy();
                designer = null;
            });
        };
    });

    $effect(() => {
        if (designer) {
            (designer as any).onSaveCallback = (layout: StickerLayout) => {
                onsave?.(layout);
            };
        }
    });

    $effect(() => {
        const _u = JSON.stringify(uiConfig);
        if (designer) {
            untrack(() => designer?.setUIConfig(uiConfig || {}));
        }
    });

    $effect(() => {
        const _e = JSON.stringify(elementDefaults);
        if (designer) {
            untrack(() => designer?.setElementDefaults(elementDefaults || {}));
        }
    });

    export function getDesigner() {
        return designer;
    }

    export function save() {
        return designer?.save();
    }

    export function getLayout() {
        return designer?.getLayout();
    }

    export function setLayout(layout: StickerLayout) {
        designer?.setLayout(layout);
    }

    export function setUIConfig(config: DesignerUIConfig) {
        designer?.setUIConfig(config);
    }

    export function setElementDefaults(defaults: ElementDefaults) {
        designer?.setElementDefaults(defaults);
    }

    export function getZPL(options?: ZplOptions & { data?: Record<string, any> }) {
        return designer ? designer.getZPL(options) : Promise.resolve('');
    }

    export function getZPLSync(options?: ZplOptions & { data?: Record<string, any> }) {
        return designer ? designer.getZPLSync(options) : '';
    }

    export function renderZPLPreview(options?: ZplOptions & DataUrlOptions & { data?: Record<string, any> }) {
        return designer ? designer.renderZPLPreview(options) : Promise.resolve({ zpl: '', dataUrl: '' });
    }

    export function renderZPLToDataURL(zpl: string, options?: ZplRenderOptions & DataUrlOptions) {
        return designer ? designer.renderZPLToDataURL(zpl, options) : Promise.resolve('');
    }

    export function exportImage(
        options?: DataUrlOptions & { data?: Record<string, any>; download?: boolean; filename?: string }
    ) {
        return designer ? designer.exportImage(options) : Promise.resolve('');
    }

    export function exportPNG(
        options?: ExportPNGOptions & { data?: Record<string, any>; download?: boolean; filename?: string }
    ) {
        return designer ? designer.exportPNG(options) : Promise.reject(new Error('Designer is not mounted'));
    }

    export function downloadImage(filename?: string, options?: DataUrlOptions & { data?: Record<string, any> }) {
        return designer ? designer.downloadImage(filename, options) : Promise.resolve('');
    }
</script>

<div
    bind:this={container}
    class={className}
    style="width:100%;height:100%;{style}"
></div>
