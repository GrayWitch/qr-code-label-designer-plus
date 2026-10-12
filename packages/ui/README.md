# @amethc/qrlayout-ui 详细说明与使用文档

**一个可嵌入、框架无关的拖拽式二维码/条形码标签设计器，全面支持 Vue 3、React、Svelte、Angular 及原生 HTML/JS。**

`@amethc/qrlayout-ui` 提供完整的可视化标签排版设计能力，并与 [`@amethc/qrlayout-core`](../core/README.md) 深度集成，支持：
- **拖拽式画布设计**：可视化添加、拖拽、缩放、对齐文本、二维码（QR Code）和条形码（Barcode）。
- **细粒度 DOM 显隐配置 (`uiConfig`)**：支持按需隐藏顶部栏、背景色设置、实体选择、条码格式等任意界面模块。
- **自定义元素默认值 (`elementDefaults`)**：可预设新增文本、二维码、条形码时的默认内容、尺寸、坐标、条码格式、字体样式等。
- **100% 本地离线 ZPL 预览与导出**：内置本地 ZPL 指令解析与 1-bit 黑白热敏点阵渲染引擎，无需联网即可预览与获取 ZPL 代码。
- **多格式导出**：一键导出 Base64 图片（PNG/JPG/WebP）、`Blob` 文件、触发浏览器图片下载、生成 PDF、生成同步/异步 ZPL 指令。
- **动态变量绑定**：支持 `{{variableName}}` 模板语法及多字段二维码分隔符拼接。
- **完整国际化 (i18n)**：内置中文 (`zh-CN`) 与英文 (`en-US`)，支持任意自定义语种与局部文案覆盖。

---

## 目录

1. [安装与快速开始](#1-安装与快速开始)
2. [模块导出项一览](#2-模块导出项一览)
3. [初始化参数详解 (`DesignerOptions`)](#3-初始化参数详解-designeroptions)
4. [界面 DOM 显隐配置详解 (`DesignerUIConfig`)](#4-界面-dom-显隐配置详解-designeruiconfig)
5. [新增元素默认值配置详解 (`ElementDefaults`)](#5-新增元素默认值配置详解-elementdefaults)
6. [核心数据结构详解 (`StickerLayout` / `StickerElement` / `EntitySchema`)](#6-核心数据结构详解-stickerlayout--stickerelement--entityschema)
7. [`QRLayoutDesigner` 实例方法与属性全集](#7-qrlayoutdesigner-实例方法与属性全集)
8. [`StickerPrinter` 渲染与打印引擎方法全集](#8-stickerprinter-渲染与打印引擎方法全集)
9. [国际化 (i18n) 与全部文案字典详解](#9-国际化-i18n-与全部文案字典详解)
10. [快捷键操作一览](#10-快捷键操作一览)
11. [主题定制与 CSS 变量说明](#11-主题定制与-css-变量说明)
12. [完整集成实战示例 (Vue 3 / React / 原生 JS)](#12-完整集成实战示例-vue-3--react--原生-js)

---

## 1. 安装与快速开始

### 安装依赖

```bash
npm install @amethc/qrlayout-ui @amethc/qrlayout-core
# 如需导出 PDF，可额外安装可选依赖 jspdf
npm install jspdf
```

### 快速上手

```ts
import { QRLayoutDesigner } from '@amethc/qrlayout-ui';
import '@amethc/qrlayout-ui/style.css';

const designer = new QRLayoutDesigner({
  element: document.getElementById('designer-container')!,
  locale: 'zh-CN',
  onSave: (layout) => {
    console.log('保存的布局 JSON:', layout);
  },
});
```

> **注意**：设计器会自动占满挂载容器的 `100%` 宽高，请确保外层容器具有明确的宽高（如 `width: 100%; height: 100vh;`）。

---

## 2. 模块导出项一览

从 `@amethc/qrlayout-ui`（以及 `@amethc/vue-qr-label` / `react-qr-label` / `svelte-qr-label`）可直接导入以下类和类型：

```ts
// 核心类与常量
import {
  QRLayoutDesigner, // 可视化标签设计器主类
  StickerPrinter,   // 标签渲染与打印引擎类（来自 qrlayout-core）
  I18nManager,      // 国际化管理类
  zhCN,             // 内置简体中文语言包常量
  enUS,             // 内置英文语言包常量
} from '@amethc/qrlayout-ui';

// TypeScript 类型定义
import type {
  DesignerOptions,      // 设计器构造函数配置项
  DesignerUIConfig,     // 界面 DOM 模块显隐配置
  ElementDefaults,      // 新增元素（文本/二维码/条码）的默认属性配置
  EntitySchema,         // 业务实体 Schema 定义（字段列表 + 测试数据）
  EntityField,          // 业务实体单个字段定义
  StickerLayout,        // 标签布局完整 JSON 结构
  StickerElement,       // 标签内单个元素（text | qr | barcode）结构
  BarcodeFormat,        // 条形码格式联合类型
  ZplOptions,           // ZPL 导出配置参数（dpi, qrErrorCorrection）
  ZplRenderOptions,     // 本地 ZPL 渲染画布参数（widthDots, heightDots）
  DataUrlOptions,       // 导出 Base64 图片参数（format, quality, canvas）
  ExportPNGOptions,     // 导出 PNG Blob 参数（canvas）
  ImageFormat,          // 图片格式 ('png' | 'jpeg' | 'jpg' | 'webp')
  DesignerI18nMessages, // 国际化完整字典接口
  DeepPartial,          // 深度可选工具类型
  SupportedLocale,      // 语言标识类型 ('zh-CN' | 'en-US' | string)
} from '@amethc/qrlayout-ui';
```

---

## 3. 初始化参数详解 (`DesignerOptions`)

实例化 `new QRLayoutDesigner(options)` 时接收的 `options` 参数说明如下：

| 参数名 | 类型 | 必填 | 默认值 | 详细说明 |
| :--- | :--- | :---: | :--- | :--- |
| **`element`** | `HTMLElement` | ✅ | — | 设计器挂载的目标 DOM 容器节点。 |
| **`initialLayout`** | `StickerLayout` | ❌ | `100×60mm` 空白布局 | 初始加载并展示的布局对象（用于回显已保存的布局）。未传时自动创建空白默认布局。 |
| **`entitySchemas`** | `Record<string, EntitySchema>` | ❌ | `{}` | 业务实体字段与示例数据配置。配置后可在左侧选择实体，并在右侧属性面板点击气泡快速插入 `{{字段名}}` 变量。 |
| **`onSave`** | `(layout: StickerLayout) => void` | ❌ | `undefined` | 点击顶部“保存布局”按钮或调用 `designer.save()` 时触发的回调函数，参数为当前布局深拷贝对象。 |
| **`locale`** | `'zh-CN' \| 'en-US' \| string` | ❌ | `'en-US'` | 界面语言标识。传 `'zh-CN'` 使用内置中文；传自定义字符串（如 `'mes'`）时配合 `messages` 使用。 |
| **`messages`** | `DeepPartial<DesignerI18nMessages>` | ❌ | `undefined` | 自定义文案字典，支持深度局部覆盖内置文案（只传需要修改的字段即可）。 |
| **`uiConfig`** | `DesignerUIConfig` | ❌ | `{}`（全部显示） | 控制设计器内各个 DOM 模块、输入框、按钮的显示与隐藏（详见第 4 节）。 |
| **`elementDefaults`** | `ElementDefaults` | ❌ | `{}` | 自定义点击“+ 文本 / + 二维码 / + 条形码”按钮时生成的新元素默认属性（详见第 5 节）。 |

> **Vue 兼容性提示**：`QRLayoutDesigner` 内部已内置 `unwrapRef` 自动解包逻辑，即使在 Vue 中将 `ref` / `computed` 对象直接传入（如 `uiConfig: uiConfigRef`），也能自动读取 `.value`，但仍推荐显式传递 `.value`。

---

## 4. 界面 DOM 显隐配置详解 (`DesignerUIConfig`)

通过 `uiConfig` 可以精细控制设计器中任意区域、表单项或按钮的显示与隐藏。**所有属性均为可选，默认值为 `true`（显示），设为 `false` 即隐藏对应 DOM**：

### 4.1 顶部导航栏 (`<header>`)

| 属性名 | 类型 | 默认值 | 说明 |
| :--- | :--- | :---: | :--- |
| **`showHeader`** | `boolean` | `true` | 是否显示整个顶部 `<header>` 导航栏。设为 `false` 时整个顶栏隐藏，**不会残留 64px 空白高度**。 |
| **`showUndoRedo`** | `boolean` | `true` | 是否显示顶部的“撤销”与“重做”图标按钮。 |
| **`showThemeToggle`** | `boolean` | `true` | 是否显示顶部的“切换暗色/亮色模式”图标按钮。 |
| **`showSaveButton`** | `boolean` | `true` | 是否显示顶部的“保存布局”主按钮。 |

> **自动折叠规则**：当 `showUndoRedo`、`showThemeToggle`、`showSaveButton` 全部设为 `false` 时，整个顶部 `<header>` 也会自动隐藏，不留空白。

### 4.2 左侧边栏 — 布局设置区

| 属性名 | 类型 | 默认值 | 说明 |
| :--- | :--- | :---: | :--- |
| **`showTargetEntity`** | `boolean` | `true` | 是否显示“目标实体”下拉选择框。 |
| **`showLayoutName`** | `boolean` | `true` | 是否显示“布局名称”输入框。 |
| **`showSizePreset`** | `boolean` | `true` | 是否显示“尺寸预设”下拉选择框。 |
| **`showDimensions`** | `boolean` | `true` | 是否显示“宽度 / 高度”数字输入框。 |
| **`showUnit`** | `boolean` | `true` | 是否显示“测量单位（mm/cm/in/px）”下拉选择框。 |
| **`showBackground`** | `boolean` | `true` | 是否显示“底色背景”颜色选择器与色值输入框。 |

> **自动折叠规则**：如果上述 6 个设置项全部设为 `false`，左侧的整个“布局设置”区块（含标题与底部分隔线）会自动隐藏。

### 4.3 左侧边栏 — 元素添加与底部工具区

| 属性名 | 类型 | 默认值 | 说明 |
| :--- | :--- | :---: | :--- |
| **`showAddText`** | `boolean` | `true` | 是否在元素列表标题旁显示“+ 文本”按钮。 |
| **`showAddQr`** | `boolean` | `true` | 是否在元素列表标题旁显示“+ 二维码”按钮。 |
| **`showAddBarcode`** | `boolean` | `true` | 是否在元素列表标题旁显示“+ 条形码”按钮。 |
| **`showSampleData`** | `boolean` | `true` | 是否在左侧底部显示“编辑测试数据”按钮。 |
| **`showPdfPreview`** | `boolean` | `true` | 是否在左侧底部显示“预览 PDF”按钮。 |
| **`showZplPreview`** | `boolean` | `true` | 是否在左侧底部显示“预览 ZPL”按钮。 |

> **自动折叠规则**：当 `showSampleData`、`showPdfPreview`、`showZplPreview` 全部设为 `false` 时，左侧底部整个操作区自动隐藏。

### 4.4 画布底部工具栏与右侧属性面板

| 属性名 | 类型 | 默认值 | 说明 |
| :--- | :--- | :---: | :--- |
| **`showSnapToGrid`** | `boolean` | `true` | 是否显示画布底部的“吸附到网格”复选框。 |
| **`showShortcutsHint`** | `boolean` | `true` | 是否显示画布底部的快捷键文字提示。 |
| **`showQrSeparator`** | `boolean` | `true` | 选中二维码元素时，右侧属性面板是否显示“字段分隔符”输入框。 |
| **`showBarcodeFormat`** | `boolean` | `true` | 选中条形码元素时，右侧属性面板是否显示“条码格式”下拉框及底部格式规则提示文字。 |
| **`showBarcodeShowText`** | `boolean` | `true` | 选中条形码元素时，右侧属性面板是否显示“显示文本”复选框。 |

### `uiConfig` 配置示例

```ts
const uiConfig: DesignerUIConfig = {
  showHeader: false,        // 隐藏整个顶部栏（使用外部自定义保存按钮）
  showBackground: false,    // 禁止用户修改标签底色
  showTargetEntity: false,  // 隐藏目标实体下拉框
  showBarcodeFormat: false, // 固定条码格式，不允许用户在属性面板切换
  showPdfPreview: false,    // 隐藏 PDF 预览按钮
};
```

---

## 5. 新增元素默认值配置详解 (`ElementDefaults`)

当用户点击界面上的 **`+ 文本`**、**`+ 二维码`**、**`+ 条形码`** 按钮时，设计器会将内置默认值与 `elementDefaults` 进行合并（`style` 对象也会独立深拷贝，互不污染）。

### 5.1 各类型元素的内置默认值与可覆盖字段

| 元素分类 | 配置路径 | 内置默认值 | 可配置的字段 (`Partial<Omit<StickerElement, 'id' \| 'type'>>`) |
| :--- | :--- | :--- | :--- |
| **文本** | `elementDefaults.text` | `{ x: 10, y: 10, w: 40, h: 10, content: i18n.elements.defaultTextContent }` | `x`, `y`, `w`, `h`, `content`, `style` (`fontSize`, `fontWeight`, `textAlign`, `verticalAlign`, `color`, `fontFamily`, `lineHeight`, `wordWrap`) |
| **二维码** | `elementDefaults.qr` | `{ x: 5, y: 5, w: 20, h: 20, content: '{{id}}' }` | `x`, `y`, `w`, `h`, `content`, `qrSeparator`, `style` |
| **条形码** | `elementDefaults.barcode` | `{ x: 5, y: 5, w: 50, h: 15, content: '{{id}}', barcodeFormat: 'CODE128' }` | `x`, `y`, `w`, `h`, `content`, `barcodeFormat`, `style` (`showText`, `color`, `backgroundColor`) |

### `elementDefaults` 配置示例

```ts
const elementDefaults: ElementDefaults = {
  // 点击“+ 条形码”时的默认属性
  barcode: {
    content: '690123456789',
    barcodeFormat: 'CODE128', // 'CODE128' | 'EAN13' | 'UPCA' | 'CODE39' | 'ITF14'
    x: 8,
    y: 35,
    w: 60,
    h: 18,
    style: {
      showText: false, // 默认不显示条码底部的人眼可读数字
    },
  },
  // 点击“+ 二维码”时的默认属性
  qr: {
    content: '{{employeeId}}{{fullName}}',
    qrSeparator: '|', // 多个变量之间自动用 | 拼接
    x: 5,
    y: 5,
    w: 25,
    h: 25,
  },
  // 点击“+ 文本”时的默认属性
  text: {
    content: '物料标签',
    x: 35,
    y: 8,
    w: 55,
    h: 10,
    style: {
      fontSize: 14,
      fontWeight: 'bold',
      textAlign: 'center',
      verticalAlign: 'middle',
    },
  },
};
```

---

## 6. 核心数据结构详解 (`StickerLayout` / `StickerElement` / `EntitySchema`)

### 6.1 `StickerLayout`（标签布局对象）

`save()`、`getLayout()`、`onSave` 返回的数据以及 `initialLayout`、`setLayout(layout)` 接收的数据结构：

```ts
interface StickerLayout {
  id: string;                      // 布局唯一标识，如 'layout-1710000000'
  name: string;                    // 布局名称，如 '标准工牌'
  width: number;                   // 标签宽度（数值，基于 unit）
  height: number;                  // 标签高度（数值，基于 unit）
  unit: 'mm' | 'cm' | 'in' | 'px'; // 物理/像素单位
  elements: StickerElement[];      // 标签内的所有图层元素数组
  targetEntity?: string;           // 关联的业务实体 key（对应 entitySchemas 的键名）
  backgroundColor?: string;        // 标签背景色（HEX 格式，如 '#ffffff'）
  backgroundImage?: string;        // 标签背景底图 URL 或 Base64 DataURL（可选）
}
```

### 6.2 `StickerElement`（单个图层元素对象）

```ts
interface StickerElement {
  id: string;                        // 元素唯一 ID
  type: 'text' | 'qr' | 'barcode';   // 元素类型：文本 | 二维码 | 条形码
  x: number;                         // 左上角 X 坐标（单位同 layout.unit）
  y: number;                         // 左上角 Y 坐标（单位同 layout.unit）
  w: number;                         // 元素宽度（单位同 layout.unit）
  h: number;                         // 元素高度（单位同 layout.unit）
  content: string;                   // 静态文本或带 {{变量名}} 的模板字符串
  qrSeparator?: string;              // 仅 type === 'qr' 有效：多个相邻 {{变量}} 之间的连接符，如 '|'
  barcodeFormat?: BarcodeFormat;     // 仅 type === 'barcode' 有效：条码格式，默认 'CODE128'
  style?: ElementStyle;              // 元素样式配置
}
```

### 6.3 `BarcodeFormat`（支持的条形码格式及数据规范）

| 格式值 | 适用场景 | 内容数据要求 |
| :--- | :--- | :--- |
| **`'CODE128'`** | 通用物流、仓储、工业编码（默认） | 支持任意 ASCII 字符（字母、数字、符号） |
| **`'EAN13'`** | 商品零售条码 | 必须为 **12 位纯数字**（第 13 位校验码自动计算） |
| **`'UPCA'`** | 北美零售商品码 | 必须为 **11 位纯数字**（第 12 位校验码自动计算） |
| **`'CODE39'`** | 传统工业、军工、资产管理 | 大写字母 `A-Z`、数字 `0-9` 及 `- . $ / + %` 和空格 |
| **`'ITF14'`** | 外箱包装、托盘物流码 | 必须为 **13 位纯数字**（第 14 位校验码自动计算） |

### 6.4 `ElementStyle`（元素样式属性）

```ts
interface ElementStyle {
  fontFamily?: string;                         // 字体族，默认 'sans-serif'
  fontSize?: number;                           // 字号（单位 pt，默认 12）
  fontWeight?: 'normal' | 'bold' | string | number; // 字重，默认 'normal'
  color?: string;                              // 文本颜色或条码线条颜色，默认 '#000000'
  backgroundColor?: string;                    // 条码背景色，默认 '#ffffff'
  textAlign?: 'left' | 'center' | 'right';     // 水平对齐方式，默认 'left'
  verticalAlign?: 'top' | 'middle' | 'bottom'; // 垂直对齐方式，默认 'top'
  lineHeight?: number;                         // 行高倍数，默认 1.25
  wordWrap?: boolean;                          // 文本是否自动换行，默认 true
  showText?: boolean;                          // 仅条形码有效：是否在条码下方显示可读文本，默认 true
}
```

### 6.5 `EntitySchema`（业务实体字段与示例数据配置）

```ts
interface EntityField {
  name: string;  // 字段变量名，插入模板时生成 {{name}}
  label: string; // 界面显示的字段中文/友好名称
}

interface EntitySchema {
  label: string;                  // 实体名称（显示在“目标实体”下拉框中）
  fields: EntityField[];          // 该实体包含的字段列表
  sampleData: Record<string, any>;// 预览时用于替换 {{name}} 的默认测试数据
}
```

---

## 7. `QRLayoutDesigner` 实例方法与属性全集

通过 `const designer = new QRLayoutDesigner(...)`（或在 Vue/React 组件中通过 `ref`）可调用以下全部公开方法：

### 7.1 布局获取、导入与保存

#### `designer.save(): StickerLayout`
- **功能**：主动触发保存操作。若配置了 `onSave` 回调，会同步调用 `onSave(layout)`，并返回当前布局对象的深拷贝。
- **适用场景**：隐藏了内置顶部栏（`showHeader: false` 或 `showSaveButton: false`）后，使用外部自定义按钮触发保存。
- **返回值**：`StickerLayout`

#### `designer.getLayout(): StickerLayout`
- **功能**：获取当前画布最新布局 JSON 的深拷贝（**不会**触发 `onSave` 回调）。
- **返回值**：`StickerLayout`

#### `designer.setLayout(layout: StickerLayout): void`
- **功能**：动态导入/替换当前设计器中的布局数据，自动同步左侧输入框、元素列表、属性面板并重新渲染画布预览（支持 Ctrl+Z 撤销回导入前状态）。
- **参数**：`layout: StickerLayout`

---

### 7.2 获取 ZPL 代码与本地 ZPL 预览图

#### `designer.getZPL(options?): Promise<string>`
- **功能**：**异步生成当前布局的 ZPL 指令字符串**（推荐使用）。当二维码尺寸较大或处于 300/600 高 DPI 下超出 ZPL 原生 `^BQ` 放大倍率限制（`mag > 10`）时，会自动将二维码渲染为 `^GFA` 十六进制位图指令，确保打印尺寸 100% 还原。
- **参数 `options`**（可选）：
  - `dpi?: 203 | 300 | 600 | number`：目标热敏打印机 DPI。未传时默认取设计器 ZPL 弹窗当前选中的 DPI（默认 `203`）。
  - `qrErrorCorrection?: 'L' | 'M' | 'Q' | 'H'`：二维码纠错级别，默认 `'M'`。
  - `data?: Record<string, any>`：用于替换 `{{变量}}` 的业务数据对象。未传时默认使用当前实体的 `sampleData`。
- **返回值**：`Promise<string>`（单张标签的 `^XA...^XZ` ZPL 字符串）

```ts
// 示例 1：使用默认 DPI (203) 和当前测试数据获取 ZPL
const zpl = await designer.getZPL();

// 示例 2：指定 300 DPI 和自定义业务数据获取 ZPL
const zpl300 = await designer.getZPL({
  dpi: 300,
  qrErrorCorrection: 'H',
  data: { employeeId: 'EMP-088', fullName: '李四' },
});
```

#### `designer.getZPLSync(options?): string`
- **功能**：**同步生成当前布局的 ZPL 指令字符串**（二维码始终使用原生 `^BQN` 指令，倍率限制在 1~10）。
- **参数 `options`**（可选）：同 `getZPL`（`{ dpi?, qrErrorCorrection?, data? }`）。
- **返回值**：`string`

#### `designer.renderZPLPreview(options?): Promise<{ zpl: string; dataUrl: string }>`
- **功能**：一步生成当前布局的 **ZPL 代码字符串** 以及 **100% 本地离线渲染的 ZPL 预览图 Base64 DataURL**（无需联网，模拟真实热敏打印机黑白点阵效果）。
- **参数 `options`**（可选）：
  - `dpi?: 203 | 300 | 600 | number`
  - `qrErrorCorrection?: 'L' | 'M' | 'Q' | 'H'`
  - `data?: Record<string, any>`
  - `format?: 'png' | 'jpeg' | 'jpg' | 'webp'`（默认 `'png'`）
  - `quality?: number`（0~1，仅 jpeg/webp 有效）
- **返回值**：`Promise<{ zpl: string; dataUrl: string }>`

```ts
const { zpl, dataUrl } = await designer.renderZPLPreview({ dpi: 203 });
console.log('ZPL 指令:', zpl);
previewImgEl.src = dataUrl; // 直接赋值给 <img> 即可展示黑白热敏预览图
```

#### `designer.renderZPLToDataURL(zpl: string, options?): Promise<string>`
- **功能**：将任意一段 ZPL 指令字符串在本地离线解析并渲染为 Base64 图片。
- **参数**：
  - `zpl: string`：ZPL 指令文本。
  - `options?: ZplRenderOptions & DataUrlOptions`：可选 `{ widthDots?: number, heightDots?: number, format?: ImageFormat, quality?: number, canvas?: HTMLCanvasElement }`。
- **返回值**：`Promise<string>`

---

### 7.3 导出图片（Base64 / Blob / 直接下载文件）

#### `designer.exportImage(options?): Promise<string>`
- **功能**：将当前标签布局导出为彩色/原样渲染的 **Base64 DataURL 图片**。
- **参数 `options`**（可选）：
  - `format?: 'png' | 'jpeg' | 'jpg' | 'webp'`：图片格式，默认 `'png'`。
  - `quality?: number`：图片质量 `0 ~ 1`（仅 `jpeg`/`jpg`/`webp` 有效）。
  - `data?: Record<string, any>`：注入的业务数据，未传则使用当前 `sampleData`。
  - `download?: boolean`：若设为 `true`，生成后会**自动触发浏览器下载该图片文件**。
  - `filename?: string`：当 `download: true` 时的下载文件名（默认 `${layout.name || 'label'}.${format}`）。
  - `canvas?: HTMLCanvasElement`：可选自定义渲染画布。
- **返回值**：`Promise<string>`（如 `'data:image/png;base64,...'`）

```ts
// 仅获取 Base64 字符串
const base64Url = await designer.exportImage({ format: 'png' });

// 获取 Base64 的同时触发浏览器下载
await designer.exportImage({ format: 'png', download: true, filename: '出库标签.png' });
```

#### `designer.exportPNG(options?): Promise<Blob>`
- **功能**：将当前标签导出为 PNG 格式的二进制 **`Blob` 对象**（非常适合通过 `FormData` 上传至后端文件服务）。
- **参数 `options`**（可选）：
  - `data?: Record<string, any>`：注入的业务数据。
  - `download?: boolean`：若设为 `true`，自动触发浏览器下载。
  - `filename?: string`：下载文件名（默认 `${layout.name || 'label'}.png`）。
  - `canvas?: HTMLCanvasElement`：可选自定义画布。
- **返回值**：`Promise<Blob>`

```ts
const blob = await designer.exportPNG();
const formData = new FormData();
formData.append('file', blob, 'label.png');
await fetch('/api/upload', { method: 'POST', body: formData });
```

#### `designer.downloadImage(filename?, options?): Promise<string>`
- **功能**：直接触发浏览器下载当前标签图片文件，并返回图片的 Base64 DataURL。
- **参数**：
  - `filename?: string`：自定义文件名（如 `'工牌标签'` 或 `'工牌标签.png'`，不带后缀会自动补全）。
  - `options?: DataUrlOptions & { data?: Record<string, any> }`：可选格式、质量及业务数据。
- **返回值**：`Promise<string>`

---

### 7.4 动态配置更新、国际化与生命周期方法

| 方法 / 属性 | 签名 | 说明 |
| :--- | :--- | :--- |
| **`setUIConfig`** | `(uiConfig: DesignerUIConfig) => void` | 运行时动态修改界面 DOM 显隐配置，并自动重建刷新 UI（不会丢失当前正在编辑的画布内容）。 |
| **`setElementDefaults`** | `(elementDefaults: ElementDefaults) => void` | 运行时动态修改后续点击“+ 文本 / + 二维码 / + 条形码”时的默认属性。 |
| **`setLocale`** | `(locale: SupportedLocale, customMessages?: DeepPartial<DesignerI18nMessages>) => void` | 动态切换界面语言及自定义文案字典，并自动刷新界面。 |
| **`updateMessages`** | `(customMessages: DeepPartial<DesignerI18nMessages>) => void` | 在保持当前语种不变的情况下，增量覆盖部分界面文案并刷新界面。 |
| **`updatePreview`** | `() => Promise<void>` | 手动触发画布与叠加层重新渲染。 |
| **`rebuildUI`** | `() => void` | 完全重建设计器内部 DOM 结构并恢复当前布局状态。 |
| **`destroy`** | `() => void` | 销毁设计器实例：清理定时器、移除全局键盘监听与 `ResizeObserver`、清空容器 DOM。组件卸载时务必调用。 |
| **`i18nManager`** | `readonly I18nManager` | 获取当前设计器的国际化管理器实例（只读属性）。 |

---

## 8. `StickerPrinter` 渲染与打印引擎方法全集

当你不需要展示设计器 UI，只想在列表页、打印服务或后台任务中根据保存的 `StickerLayout` JSON 进行批量渲染、导出图片、生成 PDF 或发送 ZPL 指令时，可直接使用导出的 `StickerPrinter` 类：

```ts
import { StickerPrinter } from '@amethc/qrlayout-ui'; // 或从 '@amethc/qrlayout-core' 导入

const printer = new StickerPrinter();
```

### `StickerPrinter` 全部方法一览

| 方法名 | 参数签名 | 返回值 | 详细说明 |
| :--- | :--- | :--- | :--- |
| **`renderToCanvas`** | `(layout: StickerLayout, data: StickerData, canvas: HTMLCanvasElement)` | `Promise<void>` | 将单个标签结合业务数据直接渲染到指定的 `<canvas>` 元素上。 |
| **`renderToDataURL`** | `(layout: StickerLayout, data: StickerData, options?: DataUrlOptions)` | `Promise<string>` | 将单个标签渲染为 Base64 DataURL 图片（默认 PNG）。 |
| **`exportToPNG`** | `(layout: StickerLayout, data: StickerData, options?: ExportPNGOptions)` | `Promise<Blob>` | 将单个标签渲染并导出为 PNG `Blob` 二进制对象。 |
| **`exportImages`** | `(layout: StickerLayout, dataList: StickerData[], options?: DataUrlOptions)` | `Promise<string[]>` | 批量将多条数据记录渲染为 Base64 DataURL 图片数组。 |
| **`exportToZPL`** | `(layout: StickerLayout, dataList: Record<string, any>[], options?: ZplOptions)` | `string[]` | **同步**批量生成每条数据的 ZPL 指令数组（二维码使用原生 `^BQN`）。 |
| **`exportToZPLAsync`** | `(layout: StickerLayout, dataList: Record<string, any>[], options?: ZplOptions)` | `Promise<string[]>` | **异步**批量生成每条数据的 ZPL 指令数组（当高 DPI 下二维码 `mag > 10` 时自动转为 `^GFA` 位图，保证物理尺寸精确）。 |
| **`renderZPLToCanvas`** | `(zpl: string, canvas: HTMLCanvasElement, options?: ZplRenderOptions)` | `Promise<void>` | **本地离线**解析 ZPL 指令字符串并在指定 `<canvas>` 上绘制 1-bit 黑白热敏点阵图。 |
| **`renderZPLToDataURL`** | `(zpl: string, options?: ZplRenderOptions & DataUrlOptions)` | `Promise<string>` | **本地离线**将 ZPL 指令字符串渲染为 Base64 图片。 |
| **`renderZPLPreview`** | `(layout: StickerLayout, data: StickerData, options?: ZplOptions & DataUrlOptions)` | `Promise<{ zpl: string; dataUrl: string }>` | **本地离线**一步生成单个标签的 ZPL 字符串及对应的黑白点阵预览图 DataURL。 |
| **`exportToPDF`** | `(layout: StickerLayout, dataList: Record<string, any>[])` | `Promise<PdfDoc>` | 批量将多条数据导出为一份多页 PDF 文档对象（需安装 `jspdf`，调用返回对象的 `.save('xxx.pdf')` 即可下载）。 |

---

## 9. 国际化 (i18n) 与全部文案字典详解

`@amethc/qrlayout-ui` 内置 `enUS`（默认）和 `zhCN` 两套完整语言包，并支持通过 `locale` + `messages` 进行任意颗粒度的文案定制或接入外部国际化系统（如 MES 系统的 `nlsMap`）。

### 9.1 `DesignerI18nMessages` 完整键值对照表

```ts
const customMessages: DeepPartial<DesignerI18nMessages> = {
  // 1. 顶部栏文案
  header: {
    undo: '撤销 (Ctrl+Z)',
    redo: '重做 (Ctrl+Y)',
    toggleTheme: '切换暗色模式',
    saveLayout: '保存布局',
  },

  // 2. 左侧布局设置文案
  settings: {
    title: '布局设置',
    targetEntity: '目标实体',
    selectEntityPlaceholder: '选择实体...',
    defaultLayoutName: '新建布局',
    layoutName: '布局名称',
    layoutNamePlaceholder: '标准工牌',
    sizePreset: '尺寸预设',
    presetCustom: '自定义',
    presetBadge: '工牌 — 100 × 60 mm',
    presetEuStandard: '欧标 — 100 × 50 mm',
    presetMiniTag: '迷你标签 — 50 × 25 mm',
    presetBrother: '兄弟标签 — 62 × 29 mm',
    presetShipping: '快递物流单 — 4" × 6"',
    presetAsset: '固定资产签 — 3" × 2"',
    presetSmall: '小型标签 — 2" × 1"',
    width: '宽度 ({unit})',   // 支持 {unit} 占位符自动替换
    height: '高度 ({unit})',  // 支持 {unit} 占位符自动替换
    unit: '测量单位',
    unitMm: '毫米 (mm)',
    unitCm: '厘米 (cm)',
    unitIn: '英寸 (in)',
    unitPx: '像素 (px)',
    background: '底色背景',
  },

  // 3. 左侧元素列表文案
  elements: {
    title: '元素列表',
    addText: '+ 文本',
    addTextTitle: '添加文本',
    addQr: '+ 二维码',
    addQrTitle: '添加二维码',
    addBarcode: '+ 条形码',
    addBarcodeTitle: '添加条形码',
    defaultTextContent: '新文本', // 点击“+ 文本”时的默认文字内容（若未配置 elementDefaults.text.content）
    typeText: '文本',
    typeQr: '二维码',
    typeBarcode: '条形码',
  },

  // 4. 画布底部工具栏文案
  toolbar: {
    snapToGrid: '吸附到网格',
    snapToGridTitle: '拖拽时按 1 个单位吸附对齐',
    shortcutsHint: 'Del — 删除 · 方向键 — 微调 · Shift+方向键 — 5倍微调 · Ctrl+D — 复制 · Ctrl+A — 全选 · Ctrl+点击 — 多选',
  },

  // 5. 右侧属性面板文案
  properties: {
    title: '元素属性',
    deleteElement: '删除元素',
    multiSelected: '已选中 {count} 个元素', // 支持 {count} 占位符
    multiSelectHint: '按住 Ctrl 点击可加选或减选',
    alignToEachOther: '元素间对齐',
    alignToLabel: '画布对齐',
    alignLeft: '左对齐',
    alignCenterH: '水平居中',
    alignRight: '右对齐',
    alignTop: '顶对齐',
    alignCenterV: '垂直居中',
    alignBottom: '底对齐',
    fieldSeparator: '字段分隔符',
    fieldSeparatorPlaceholder: '例如 | 或 -',
    barcodeFormat: '条码格式',
    barcodeFormatCode128: 'CODE128 — 通用 / 物流',
    barcodeFormatEan13: 'EAN-13 — 商品零售 (12位数字)',
    barcodeFormatUpca: 'UPC-A — 美标零售 (11位数字)',
    barcodeFormatCode39: 'CODE39 — 工业 / 仓储',
    barcodeFormatItf14: 'ITF-14 — 外箱包装 (13位数字)',
    showText: '显示文本',
    content: '内容',
    posX: 'X 坐标',
    posY: 'Y 坐标',
    width: '宽度',
    height: '高度',
    fontSize: '字体大小',
    fontWeight: '字重粗细',
    fontWeightNormal: '常规 (Normal)',
    fontWeightBold: '粗体 (Bold)',
    horizontalAlign: '水平对齐',
    alignLeftBtn: '左',
    alignCenterBtn: '中',
    alignRightBtn: '右',
    verticalAlign: '垂直对齐',
    alignTopBtn: '顶',
    alignMiddleBtn: '中',
    alignBottomBtn: '底',
    barcodeNotice: 'EAN-13 需 12 位数字 · UPC-A 需 11 位数字 · ITF-14 需 13 位数字',
  },

  // 6. 测试数据弹窗文案
  sampleData: {
    button: '编辑测试数据',
    modalTitle: '编辑测试数据',
    modalDesc: '在下方修改测试字段值，可实时查看画布上的预览效果。',
    noEntityHint: '请在左侧选择实体以查看对应字段',
    fieldPlaceholder: '请输入测试 {field}...', // 支持 {field} 占位符
    doneEditing: '完成编辑',
  },

  // 7. PDF 预览弹窗文案
  pdf: {
    button: '预览 PDF',
    buttonTitle: '以 PDF 格式预览',
    modalTitle: 'PDF 预览',
    generating: '正在生成 PDF…',
    download: '下载 PDF',
    jspdfNotice: 'PDF 导出需安装可选包 jspdf (npm install jspdf)。以下为 PNG 格式预览：',
    failedNotice: '预览失败，请确保画布中已有元素。',
    close: '关闭',
  },

  // 8. ZPL 预览弹窗文案
  zpl: {
    button: '预览 ZPL',
    buttonTitle: '预览热敏打印机 ZPL 指令',
    modalTitle: 'ZPL 预览',
    printerDpi: '打印机 DPI:',
    dpi203: '203 DPI — 标准桌面机',
    dpi300: '300 DPI — 高清',
    dpi600: '600 DPI — 超清',
    refresh: '刷新',
    copy: '复制 ZPL',
    codeTitle: 'ZPL 代码',
    previewTitle: 'ZPL 模拟渲染',
    loading: '正在加载渲染预览…',
    offlineNotice: '渲染失败。',
    offlineLinkText: '可复制上方 ZPL 代码并粘贴至',
    close: '关闭',
  },

  // 9. 移动端侧边栏切换提示
  common: {
    toggleSettings: '显示/隐藏设置',
    toggleProperties: '显示/隐藏属性',
  },
};
```

---

## 10. 快捷键操作一览

设计器画布处于激活状态（焦点不在输入框内）时支持以下键盘快捷键：

| 快捷键 | 功能说明 |
| :--- | :--- |
| **`Ctrl + Z`** / `Cmd + Z` | 撤销上一步操作（最多支持 20 步历史记录） |
| **`Ctrl + Y`** / `Ctrl + Shift + Z` | 重做下一步操作 |
| **`Ctrl + A`** | 全选画布上的所有元素 |
| **`Ctrl + 鼠标左键点击`** | 多选/加选或取消选中单个元素 |
| **`Ctrl + D`** | 复制当前选中的所有元素（自动偏移 `+5` 单位） |
| **`Delete`** / **`Backspace`** | 删除当前选中的所有元素 |
| **`↑` `↓` `←` `→` 方向键** | 将选中元素微调移动 `1` 个单位 |
| **`Shift + 方向键`** | 将选中元素快速移动 `5` 个单位 |
| **`Escape`** | 取消所有选中状态 |

---

## 11. 主题定制与 CSS 变量说明

设计器根元素带有 `.qrlayout-designer` 类名（暗色模式下带有 `.qrlayout-designer.dark-mode`）。你可以在外层通过覆盖以下 CSS 变量轻松接入 Element Plus、Ant Design 等组件库主题：

```css
.qrlayout-designer {
  --primary-color: #6366f1;   /* 主题色（按钮、选中边框、高亮态） */
  --primary-hover: #4f46e5;   /* 主题悬浮色 */
  --danger-color: #ef4444;    /* 危险/删除按钮颜色 */
  --success-color: #10b981;   /* 成功状态颜色 */

  --bg-color: #f1f5f9;        /* 画布工作区背景色 */
  --panel-bg: #ffffff;        /* 侧边栏、顶栏、弹窗背景色 */
  --panel-bg-alt: #f8fafc;    /* 次级面板/代码块背景色 */
  --input-bg: #ffffff;        /* 输入框、下拉框背景色 */

  --text-primary: #0f172a;    /* 主要文字颜色 */
  --text-secondary: #64748b;  /* 次要说明文字颜色 */
  --border-color: #e2e8f0;    /* 边框与分隔线颜色 */
}
```

---

## 12. 完整集成实战示例 (Vue 3 / React / 原生 JS)

### 12.1 Vue 3 完整封装组件示例（含自定义 UI 配置、默认元素配置、外部保存、导出图片与获取 ZPL）

```vue
<template>
  <div class="designer-page">
    <!-- 外部自定义工具栏（当隐藏内置 header 时使用） -->
    <div class="external-toolbar">
      <button @click="handleSave">保存布局</button>
      <button @click="handleGetZpl">获取 ZPL 代码</button>
      <button @click="handlePreviewZpl">本地预览 ZPL 图片</button>
      <button @click="handleDownloadPng">下载 PNG 图片</button>
    </div>

    <!-- 设计器挂载容器 -->
    <div ref="containerRef" class="designer-container" />
  </div>
</template>

<script setup lang="ts">
import { ref, shallowRef, onMounted, onBeforeUnmount } from 'vue';
import {
  QRLayoutDesigner,
  type StickerLayout,
  type EntitySchema,
  type DesignerUIConfig,
  type ElementDefaults,
  type ZplOptions,
  type DataUrlOptions,
} from '@amethc/qrlayout-ui';
import '@amethc/qrlayout-ui/style.css';

const containerRef = ref<HTMLDivElement | null>(null);
const designerInstance = shallowRef<QRLayoutDesigner | null>(null);

// 1. 控制界面 DOM 显隐
const uiConfig = ref<DesignerUIConfig>({
  showHeader: false,        // 隐藏内置顶部栏，使用上方自定义工具栏
  showBackground: false,    // 隐藏底色背景设置
  showTargetEntity: false,  // 隐藏目标实体选择
  showBarcodeFormat: false, // 禁止用户在右侧属性栏修改条码格式
});

// 2. 配置新增元素的默认值
const elementDefaults = ref<ElementDefaults>({
  barcode: {
    content: '690123456789',
    barcodeFormat: 'CODE128',
    x: 10,
    y: 10,
    w: 60,
    h: 20,
    style: { showText: false },
  },
  qr: {
    content: '{{code}}',
    w: 25,
    h: 25,
    qrSeparator: '|',
  },
  text: {
    content: '默认标题文本',
    w: 50,
    h: 12,
    style: { fontSize: 14, fontWeight: 'bold', textAlign: 'center' },
  },
});

const schemas: Record<string, EntitySchema> = {
  material: {
    label: '物料主数据',
    fields: [
      { name: 'code', label: '物料编码' },
      { name: 'name', label: '物料名称' },
    ],
    sampleData: {
      code: 'MAT-2025-001',
      name: '高精度传感器',
    },
  },
};

onMounted(() => {
  if (!containerRef.value) return;
  designerInstance.value = new QRLayoutDesigner({
    element: containerRef.value,
    locale: 'zh-CN',
    entitySchemas: schemas,
    uiConfig: uiConfig.value,
    elementDefaults: elementDefaults.value,
    onSave: (layout) => {
      console.log('触发 onSave 回调:', layout);
    },
  });
});

onBeforeUnmount(() => {
  designerInstance.value?.destroy();
  designerInstance.value = null;
});

// 外部按钮：触发保存并获取布局 JSON
function handleSave() {
  const layout = designerInstance.value?.save();
  console.log('当前布局 JSON:', layout);
}

// 外部按钮：获取 ZPL 指令字符串
async function handleGetZpl() {
  if (!designerInstance.value) return;
  const zpl = await designerInstance.value.getZPL({ dpi: 203 });
  console.log('生成的 ZPL 代码:\n', zpl);
}

// 外部按钮：同时获取 ZPL 代码和本地离线渲染的 ZPL 黑白点阵预览图
async function handlePreviewZpl() {
  if (!designerInstance.value) return;
  const { zpl, dataUrl } = await designerInstance.value.renderZPLPreview({ dpi: 300 });
  console.log('300 DPI ZPL:\n', zpl);
  console.log('本地 ZPL 预览图 Base64:', dataUrl);
}

// 外部按钮：直接下载 PNG 标签图片
async function handleDownloadPng() {
  await designerInstance.value?.downloadImage('物料标签.png');
}

// 向父组件暴露全部常用方法
defineExpose({
  designer: designerInstance,
  save: () => designerInstance.value?.save(),
  getLayout: () => designerInstance.value?.getLayout(),
  setLayout: (layout: StickerLayout) => designerInstance.value?.setLayout(layout),
  getZPL: (options?: ZplOptions & { data?: Record<string, any> }) =>
    designerInstance.value?.getZPL(options),
  getZPLSync: (options?: ZplOptions & { data?: Record<string, any> }) =>
    designerInstance.value?.getZPLSync(options),
  renderZPLPreview: (options?: ZplOptions & DataUrlOptions & { data?: Record<string, any> }) =>
    designerInstance.value?.renderZPLPreview(options),
  exportImage: (options?: DataUrlOptions & { data?: Record<string, any>; download?: boolean; filename?: string }) =>
    designerInstance.value?.exportImage(options),
  exportPNG: (options?: { data?: Record<string, any>; download?: boolean; filename?: string }) =>
    designerInstance.value?.exportPNG(options),
  downloadImage: (filename?: string, options?: DataUrlOptions & { data?: Record<string, any> }) =>
    designerInstance.value?.downloadImage(filename, options),
  setUIConfig: (config: DesignerUIConfig) => designerInstance.value?.setUIConfig(config),
  setElementDefaults: (defaults: ElementDefaults) => designerInstance.value?.setElementDefaults(defaults),
});
</script>

<style scoped>
.designer-page {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100vh;
}
.external-toolbar {
  display: flex;
  gap: 8px;
  padding: 8px 16px;
  border-bottom: 1px solid #e2e8f0;
}
.designer-container {
  flex: 1;
  width: 100%;
  overflow: hidden;
}
</style>
```

---

## 相关包链接

- **[`@amethc/qrlayout-core`](../core/README.md)** — 核心渲染与打印引擎（Canvas / PNG / PDF / ZPL 导出与本地 ZPL 渲染）
- **[`@amethc/vue-qr-label`](../vue-qr-label/README.md)** — Vue 3 开箱即用组件封装
- **[`react-qr-label`](../react-qr-label/README.md)** — React 开箱即用组件封装
- **[`svelte-qr-label`](../svelte-qr-label/README.md)** — Svelte 5 开箱即用组件封装

---

## 许可证

MIT，详见 [LICENSE](../../LICENSE)。
