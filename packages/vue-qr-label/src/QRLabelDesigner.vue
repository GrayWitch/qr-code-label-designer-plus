<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue';
import { QRLayoutDesigner } from '@amethc/qrlayout-ui';
import type {
    StickerLayout,
    EntitySchema,
    SupportedLocale,
    DesignerI18nMessages,
    DeepPartial,
    ZplOptions,
    ZplRenderOptions,
    DataUrlOptions,
    ExportPNGOptions,
    DesignerUIConfig,
    ElementDefaults,
} from '@amethc/qrlayout-ui';
import '@amethc/qrlayout-ui/style.css';

interface Props {
    initialLayout?: StickerLayout;
    entitySchemas?: Record<string, EntitySchema>;
    locale?: SupportedLocale;
    messages?: DeepPartial<DesignerI18nMessages>;
    uiConfig?: DesignerUIConfig;
    elementDefaults?: ElementDefaults;
    class?: string;
    style?: Record<string, string>;
}

const props = defineProps<Props>();

const emit = defineEmits<{
    save: [layout: StickerLayout];
}>();

const container = ref<HTMLDivElement | null>(null);
let designer: QRLayoutDesigner | null = null;

function mount() {
    if (!container.value) return;
    designer?.destroy();
    designer = new QRLayoutDesigner({
        element: container.value,
        initialLayout: props.initialLayout,
        entitySchemas: props.entitySchemas,
        locale: props.locale,
        messages: props.messages,
        uiConfig: props.uiConfig,
        elementDefaults: props.elementDefaults,
        onSave: (layout) => emit('save', layout),
    });
}

onMounted(mount);
onUnmounted(() => {
    designer?.destroy();
    designer = null;
});

// Re-create when layout ID, schemas, locale or custom messages change
watch(
    () => [props.initialLayout?.id, JSON.stringify(props.entitySchemas), props.locale, JSON.stringify(props.messages)],
    mount
);

watch(
    () => JSON.stringify(props.uiConfig),
    () => {
        if (designer) designer.setUIConfig(props.uiConfig || {});
    }
);

watch(
    () => JSON.stringify(props.elementDefaults),
    () => {
        if (designer) designer.setElementDefaults(props.elementDefaults || {});
    }
);

defineExpose({
    getDesigner: () => designer,
    save: () => designer?.save(),
    getLayout: () => designer?.getLayout(),
    setLayout: (layout: StickerLayout) => designer?.setLayout(layout),
    setUIConfig: (uiConfig: DesignerUIConfig) => designer?.setUIConfig(uiConfig),
    setElementDefaults: (elementDefaults: ElementDefaults) => designer?.setElementDefaults(elementDefaults),
    getZPL: (options?: ZplOptions & { data?: Record<string, any> }) =>
        designer ? designer.getZPL(options) : Promise.resolve(''),
    getZPLSync: (options?: ZplOptions & { data?: Record<string, any> }) =>
        designer ? designer.getZPLSync(options) : '',
    renderZPLPreview: (options?: ZplOptions & DataUrlOptions & { data?: Record<string, any> }) =>
        designer ? designer.renderZPLPreview(options) : Promise.resolve({ zpl: '', dataUrl: '' }),
    renderZPLToDataURL: (zpl: string, options?: ZplRenderOptions & DataUrlOptions) =>
        designer ? designer.renderZPLToDataURL(zpl, options) : Promise.resolve(''),
    exportImage: (
        options?: DataUrlOptions & { data?: Record<string, any>; download?: boolean; filename?: string }
    ) => (designer ? designer.exportImage(options) : Promise.resolve('')),
    exportPNG: (
        options?: ExportPNGOptions & { data?: Record<string, any>; download?: boolean; filename?: string }
    ) => (designer ? designer.exportPNG(options) : Promise.reject(new Error('Designer is not mounted'))),
    downloadImage: (filename?: string, options?: DataUrlOptions & { data?: Record<string, any> }) =>
        designer ? designer.downloadImage(filename, options) : Promise.resolve(''),
});
</script>

<template>
    <div
        ref="container"
        :class="props.class"
        :style="{ width: '100%', height: '100%', ...(props.style || {}) }"
    />
</template>
