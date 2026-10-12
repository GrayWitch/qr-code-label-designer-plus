export type DeepPartial<T> = {
    [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P]
}

export interface DesignerI18nMessages {
    header: {
        undo: string
        redo: string
        toggleTheme: string
        saveLayout: string
    }
    settings: {
        title: string
        targetEntity: string
        selectEntityPlaceholder: string
        defaultLayoutName: string
        layoutName: string
        layoutNamePlaceholder: string
        sizePreset: string
        presetCustom: string
        presetBadge: string
        presetEuStandard: string
        presetMiniTag: string
        presetBrother: string
        presetShipping: string
        presetAsset: string
        presetSmall: string
        width: string
        height: string
        unit: string
        unitMm: string
        unitCm: string
        unitIn: string
        unitPx: string
        background: string
    }
    elements: {
        title: string
        addText: string
        addTextTitle: string
        addQr: string
        addQrTitle: string
        addBarcode: string
        addBarcodeTitle: string
        defaultTextContent: string
        typeText: string
        typeQr: string
        typeBarcode: string
    }
    toolbar: {
        snapToGrid: string
        snapToGridTitle: string
        shortcutsHint: string
    }
    properties: {
        title: string
        deleteElement: string
        multiSelected: string
        multiSelectHint: string
        alignToEachOther: string
        alignToLabel: string
        alignLeft: string
        alignCenterH: string
        alignRight: string
        alignTop: string
        alignCenterV: string
        alignBottom: string
        fieldSeparator: string
        fieldSeparatorPlaceholder: string
        barcodeFormat: string
        barcodeFormatCode128: string
        barcodeFormatEan13: string
        barcodeFormatUpca: string
        barcodeFormatCode39: string
        barcodeFormatItf14: string
        showText: string
        content: string
        posX: string
        posY: string
        width: string
        height: string
        fontSize: string
        fontWeight: string
        fontWeightNormal: string
        fontWeightBold: string
        horizontalAlign: string
        alignLeftBtn: string
        alignCenterBtn: string
        alignRightBtn: string
        verticalAlign: string
        alignTopBtn: string
        alignMiddleBtn: string
        alignBottomBtn: string
        barcodeNotice: string
    }
    sampleData: {
        button: string
        modalTitle: string
        modalDesc: string
        noEntityHint: string
        fieldPlaceholder: string
        doneEditing: string
    }
    pdf: {
        button: string
        buttonTitle: string
        modalTitle: string
        generating: string
        download: string
        jspdfNotice: string
        failedNotice: string
        close: string
    }
    zpl: {
        button: string
        buttonTitle: string
        modalTitle: string
        printerDpi: string
        dpi203: string
        dpi300: string
        dpi600: string
        refresh: string
        copy: string
        codeTitle: string
        previewTitle: string
        loading: string
        offlineNotice: string
        offlineLinkText: string
        close: string
    }
    common: {
        toggleSettings: string
        toggleProperties: string
    }
}

export type SupportedLocale = 'en-US' | 'zh-CN' | string
