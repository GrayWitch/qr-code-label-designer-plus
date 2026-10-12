import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import {
  QRLayoutDesigner,
  type DesignerOptions,
  type DesignerUIConfig,
  type ElementDefaults,
  type StickerLayout,
  type SupportedLocale,
  type DesignerI18nMessages,
  type DeepPartial,
  type ZplOptions,
  type ZplRenderOptions,
  type DataUrlOptions,
  type ExportPNGOptions,
} from 'qrlayout-ui';
import 'qrlayout-ui/style.css';

export { StickerPrinter, I18nManager, enUS, zhCN } from 'qrlayout-ui';
export type {
  StickerLayout,
  StickerElement,
  BarcodeFormat,
  EntitySchema,
  EntityField,
  DesignerOptions,
  DesignerUIConfig,
  ElementDefaults,
  DesignerI18nMessages,
  DeepPartial,
  SupportedLocale,
  ZplOptions,
  ZplRenderOptions,
  DataUrlOptions,
  ExportPNGOptions,
  ImageFormat,
} from 'qrlayout-ui';

export interface QRLabelDesignerRef {
  getDesigner: () => QRLayoutDesigner | null;
  save: () => StickerLayout | undefined;
  getLayout: () => StickerLayout | undefined;
  setLayout: (layout: StickerLayout) => void;
  setUIConfig: (uiConfig: DesignerUIConfig) => void;
  setElementDefaults: (elementDefaults: ElementDefaults) => void;
  getZPL: (options?: ZplOptions & { data?: Record<string, any> }) => Promise<string>;
  getZPLSync: (options?: ZplOptions & { data?: Record<string, any> }) => string;
  renderZPLPreview: (options?: ZplOptions & DataUrlOptions & { data?: Record<string, any> }) => Promise<{ zpl: string; dataUrl: string }>;
  renderZPLToDataURL: (zpl: string, options?: ZplRenderOptions & DataUrlOptions) => Promise<string>;
  exportImage: (options?: DataUrlOptions & { data?: Record<string, any>; download?: boolean; filename?: string }) => Promise<string>;
  exportPNG: (options?: ExportPNGOptions & { data?: Record<string, any>; download?: boolean; filename?: string }) => Promise<Blob>;
  downloadImage: (filename?: string, options?: DataUrlOptions & { data?: Record<string, any> }) => Promise<string>;
}

export interface QRLabelDesignerProps extends Omit<DesignerOptions, 'element'> {
  className?: string;
  style?: React.CSSProperties;
}

export const QRLabelDesigner = forwardRef<QRLabelDesignerRef, QRLabelDesignerProps>(function QRLabelDesigner(
  { className, style, ...options },
  ref
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const designerRef = useRef<QRLayoutDesigner | null>(null);

  useImperativeHandle(ref, () => ({
    getDesigner: () => designerRef.current,
    save: () => designerRef.current?.save(),
    getLayout: () => designerRef.current?.getLayout(),
    setLayout: (layout: StickerLayout) => designerRef.current?.setLayout(layout),
    setUIConfig: (uiConfig: DesignerUIConfig) => designerRef.current?.setUIConfig(uiConfig),
    setElementDefaults: (elementDefaults: ElementDefaults) => designerRef.current?.setElementDefaults(elementDefaults),
    getZPL: (opts) => (designerRef.current ? designerRef.current.getZPL(opts) : Promise.resolve('')),
    getZPLSync: (opts) => (designerRef.current ? designerRef.current.getZPLSync(opts) : ''),
    renderZPLPreview: (opts) =>
      designerRef.current ? designerRef.current.renderZPLPreview(opts) : Promise.resolve({ zpl: '', dataUrl: '' }),
    renderZPLToDataURL: (zpl, opts) =>
      designerRef.current ? designerRef.current.renderZPLToDataURL(zpl, opts) : Promise.resolve(''),
    exportImage: (opts) => (designerRef.current ? designerRef.current.exportImage(opts) : Promise.resolve('')),
    exportPNG: (opts) =>
      designerRef.current ? designerRef.current.exportPNG(opts) : Promise.reject(new Error('Designer is not mounted')),
    downloadImage: (filename, opts) =>
      designerRef.current ? designerRef.current.downloadImage(filename, opts) : Promise.resolve(''),
  }));

  // Use refs to handle changing event handlers without re-instantiating the designer
  const onSaveRef = useRef(options.onSave);
  onSaveRef.current = options.onSave;

  const initialLayoutId = options.initialLayout?.id;
  const entitySchemasStr = JSON.stringify(options.entitySchemas);
  const messagesStr = JSON.stringify(options.messages);
  const uiConfigStr = JSON.stringify(options.uiConfig);
  const elementDefaultsStr = JSON.stringify(options.elementDefaults);

  useEffect(() => {
    if (!containerRef.current) return;

    if (designerRef.current) {
      designerRef.current.destroy();
      designerRef.current = null;
    }

    designerRef.current = new QRLayoutDesigner({
      element: containerRef.current,
      ...options,
      onSave: (layout) => {
        if (onSaveRef.current) {
          onSaveRef.current(layout);
        }
      }
    });

    return () => {
      if (designerRef.current) {
        designerRef.current.destroy();
        designerRef.current = null;
      }
    };
  }, [initialLayoutId, entitySchemasStr, options.locale, messagesStr]);

  useEffect(() => {
    if (designerRef.current) {
      (designerRef.current as any).onSaveCallback = (layout: StickerLayout) => {
        if (onSaveRef.current) {
          onSaveRef.current(layout);
        }
      };
    }
  }, [options.onSave]);

  useEffect(() => {
    if (designerRef.current) {
      designerRef.current.setUIConfig(options.uiConfig || {});
    }
  }, [uiConfigStr]);

  useEffect(() => {
    if (designerRef.current) {
      designerRef.current.setElementDefaults(options.elementDefaults || {});
    }
  }, [elementDefaultsStr]);

  return (
    <div 
      ref={containerRef} 
      className={className} 
      style={{ width: '100%', height: '100%', ...style }} 
    />
  );
});
