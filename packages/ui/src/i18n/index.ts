import type { DeepPartial, DesignerI18nMessages, SupportedLocale } from './types'
import { enUS } from './locales/en-US'
import { zhCN } from './locales/zh-CN'

export * from './types'
export { enUS, zhCN }

export const BUILTIN_LOCALES: Record<string, DesignerI18nMessages> = {
    'en-US': enUS,
    'en': enUS,
    'zh-CN': zhCN,
    'zh': zhCN,
}

function deepClone<T>(obj: T): T {
    if (obj === null || typeof obj !== 'object') return obj
    if (Array.isArray(obj)) return obj.map(item => deepClone(item)) as unknown as T
    const result = {} as T
    for (const key of Object.keys(obj) as Array<keyof T>) {
        result[key] = deepClone(obj[key])
    }
    return result
}

export function deepMerge<T extends object>(target: T, source?: DeepPartial<T>): T {
    if (!source) return target
    const output = deepClone(target)
    for (const key of Object.keys(source) as Array<keyof T>) {
        const sourceVal = source[key]
        if (
            sourceVal &&
            typeof sourceVal === 'object' &&
            !Array.isArray(sourceVal) &&
            typeof output[key] === 'object' &&
            !Array.isArray(output[key])
        ) {
            output[key] = deepMerge(output[key] as object, sourceVal as object) as T[keyof T]
        } else if (sourceVal !== undefined) {
            output[key] = sourceVal as T[keyof T]
        }
    }
    return output
}

export class I18nManager {
    private _locale: string
    private _messages: DesignerI18nMessages

    constructor(locale: SupportedLocale = 'en-US', customMessages?: DeepPartial<DesignerI18nMessages>) {
        this._locale = locale
        const base = BUILTIN_LOCALES[locale] || enUS
        this._messages = deepMerge(base, customMessages)
    }

    get locale(): string {
        return this._locale
    }

    get msg(): DesignerI18nMessages {
        return this._messages
    }

    format(template: string, params?: Record<string, any>): string {
        if (!params) return template
        return template.replace(/\{(\w+)\}/g, (_, key) => {
            return params[key] !== undefined ? String(params[key]) : `{${key}}`
        })
    }

    setLocale(locale: SupportedLocale, customMessages?: DeepPartial<DesignerI18nMessages>): void {
        this._locale = locale
        const base = BUILTIN_LOCALES[locale] || enUS
        this._messages = deepMerge(base, customMessages)
    }

    updateMessages(customMessages: DeepPartial<DesignerI18nMessages>): void {
        this._messages = deepMerge(this._messages, customMessages)
    }
}
