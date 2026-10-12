# @amethc/qrlayout-core：标签渲染引擎

**不依赖前端框架的二维码标签渲染引擎，适用于 Node.js 和浏览器。**

创建精确排版的二维码标签，并导出为 **PNG**、**PDF** 或 **ZPL**（用于 Zebra 热敏打印机）。模板定义后可重复使用。

> [!TIP]
> 本包提供**无界面的渲染引擎**。如需交互式可视化布局设计器，可搭配 **[`@amethc/qrlayout-ui`](../ui/README.md)** 使用。
> 支持 **React、Vue、Angular、Svelte 以及原生 JS/Node.js**。

---

## 本地示例

参见 [React](../../examples/react-demo/README.md)、[Vue](../../examples/vue-demo/README.md)、[Svelte](../../examples/svelte-demo/README.md) 和 [Angular](../../examples/angular-demo/README.md) 示例。

---

## 功能特性

- **精确尺寸**：支持 `mm`、`cm`、`in` 和 `px` 单位，不受屏幕 DPI 差异影响。
- **ZPL 支持**：直接导出用于工业热敏标签打印机的 Zebra 打印指令。
- **离线 ZPL 预览**：本地解析支持的 ZPL 指令，渲染到 Canvas 或生成图片 Data URL，无需外部 API。
- **批量数据合并**：在模板中定义 `{{variable}}` 占位符，一次调用即可生成多条个性化标签。
- **多种输出环境**：通过统一 API 生成浏览器 Canvas、PDF（`jspdf`）或 ZPL 字符串；Node.js 图片渲染需要兼容的 Canvas 环境。
- **多变量二维码**：使用 `qrSeparator` 将多个字段拼接为一个二维码，例如 `EMP-001|张三|工程部`。
- **文本自动换行**：PNG 和 PDF 中的长文本会在元素边界内换行，可通过 `style.wordWrap` 和 `style.lineHeight` 分别配置。
- **条形码支持**：通过 `jsbarcode` 支持 `CODE128`、`EAN13`、`UPCA`、`CODE39` 和 `ITF14`，适用于 PNG、PDF 和 ZPL。
- **无需 UI 依赖**：可独立用于服务端生成、自动化任务或命令行工具。

---

## 安装

```bash
npm install @amethc/qrlayout-core
```

---

## 快速开始

### 1. 定义布局模板

```typescript
import { type StickerLayout } from "@amethc/qrlayout-core";

const template: StickerLayout = {
  id: "employee-badge",
  name: "员工工牌",
  width: 100,
  height: 60,
  unit: "mm",
  elements: [
    {
      id: "employee-name",
      type: "text",
      x: 5, y: 5, w: 90, h: 12,
      content: "{{name}}",
      style: { fontSize: 16, fontWeight: "bold", textAlign: "center" }
    },
    {
      id: "dept-label",
      type: "text",
      x: 5, y: 18, w: 90, h: 8,
      content: "{{department}}",
      style: { fontSize: 10, textAlign: "center", color: "#555555" }
    },
    {
      id: "id-qr",
      type: "qr",
      x: 35, y: 28, w: 30, h: 30,
      content: "{{id}}",
      qrSeparator: "|"
    }
  ]
};
```

### 2. 渲染到 Canvas（浏览器预览）

```typescript
import { StickerPrinter } from "@amethc/qrlayout-core";

const printer = new StickerPrinter();
const data = { name: "张三", department: "工程部", id: "EMP-001" };
const canvas = document.getElementById("preview") as HTMLCanvasElement;

await printer.renderToCanvas(template, data, canvas);
```

### 3. 批量导出 ZPL（热敏打印机）

```typescript
import { StickerPrinter } from "@amethc/qrlayout-core";

const printer = new StickerPrinter();

const employees = [
  { name: "张三",   department: "工程部",  id: "EMP-001" },
  { name: "李四",       department: "人事部",            id: "EMP-002" },
  { name: "王五", department: "仓储部",     id: "EMP-003" },
];

const zplPages = printer.exportToZPL(template, employees);
console.log(zplPages[0]);
```

### 4. 导出 PNG

```typescript
// 生成 Blob，用于下载或文件 API
const blob = await printer.exportToPNG(template, data);
const url  = URL.createObjectURL(blob);
const a    = document.createElement("a");
a.href     = url;
a.download = "badge-emp-001.png";
a.click();
URL.revokeObjectURL(url);

// 生成 Data URL，用于 <img src> 或 Canvas
const dataUrl = await printer.renderToDataURL(template, data, { format: "png" });
```

---

## PDF 导出

PDF 功能使用可选依赖，以减小核心包体积。

```bash
npm install jspdf
```

```typescript
import { exportToPDF } from "@amethc/qrlayout-core/pdf";

const pdf = await exportToPDF(template, employees);
pdf.save("all-badges.pdf");

// 也可以通过 StickerPrinter 调用
const pdf = await printer.exportToPDF(template, employees);
pdf.save("all-badges.pdf");
```

> [!NOTE]
> PDF 中的文本会根据元素宽度自动换行，与 PNG 输出一致。
> 如需关闭某个元素的自动换行，设置 `style.wordWrap: false`。

---

## ZPL 导出（Zebra 打印机）

> [!IMPORTANT]
> `dpi` 参数必须与打印机的**实际 DPI 设置**一致。
> DPI 设置错误会使元素位置、宽高和字号
> 在实际标签上以错误比例打印。

```typescript
import { StickerPrinter } from "@amethc/qrlayout-core";

const printer = new StickerPrinter();

// 203 DPI：标准桌面 Zebra 打印机（默认）
const zpl203 = printer.exportToZPL(template, employees);

// 300 DPI：中高质量打印机
const zpl300 = printer.exportToZPL(template, employees, { dpi: 300 });

// 600 DPI，使用高二维码纠错等级，适合较恶劣的使用环境
const zpl600 = printer.exportToZPL(template, employees, { dpi: 600, qrErrorCorrection: "H" });
```

### ZPL 参数

| 参数 | 类型 | 默认值 | 说明 |
|---|---|---|---|
| `dpi` | `number` | `203` | 打印机分辨率，必须与设备实际 DPI 一致，常用值为 `203`、`300`、`600`。 |
| `qrErrorCorrection` | `L \| M \| Q \| H` | `"M"` | 二维码纠错等级。`H` 可恢复约 30% 的数据，适合可能污损或磨损的标签。 |

### 打印机参考

| DPI | 每毫米打印点数（`dpmm`） | 常见 Zebra 型号 |
|---|---|---|
| `203`（默认） | 约 8.0 点/毫米 | ZT230, ZD420, GX430t, 大部分桌面型号 |
| `300` | 约 11.8 点/毫米 | ZT410, ZD620, ZD510 |
| `600` | 约 23.6 点/毫米 | ZT610, ZT620, ZD621 |

> [!NOTE]
> 数据中包含 `^` 或 `~` 等 ZPL 控制字符时，`exportToZPL()` 会自动通过 `^FH` 十六进制编码转义，无需提前处理。

---

## ZPL 转图片（本地离线）

使用 `renderZPLToDataURL()` 解析已有的 ZPL 标签并返回 Base64 图片 Data URL。渲染在本地完成，生成黑白预览图，无需外部服务。

```typescript
import { StickerPrinter } from "@amethc/qrlayout-core";

const printer = new StickerPrinter();
const zpl = `^XA
^PW400
^LL200
^FO20,20^A0N,30,30^FDHello ZPL^FS
^XZ`;

// 自动从 ^PW 和 ^LL 读取宽高，默认输出 PNG。
const dataUrl = await printer.renderZPLToDataURL(zpl);
const image = document.createElement("img");
image.src = dataUrl;
document.body.appendChild(image);
```

### 标签尺寸与参数

尺寸单位为**打印点（dots）**，一个打印点对应一个 Canvas 像素。`^PW` 指定宽度，`^LL` 指定高度，优先于对应的备用参数。缺少某个指令时，使用 `widthDots` 或 `heightDots`；未设置对应参数时，宽度默认为 **800**、高度默认为 **480**。渲染器不会根据内容推算尺寸。

```typescript
// 此 ZPL 不含 ^PW 和 ^LL，因此使用指定的备用宽高。
const zplWithoutDimensions = "^XA^FO20,20^A0N,30,30^FDHello ZPL^FS^XZ";
const dataUrl = await printer.renderZPLToDataURL(zplWithoutDimensions, {
  widthDots: 400,
  heightDots: 200,
  format: "png",
});
```

| 参数 | 类型 | 默认值 | 说明 |
|---|---|---|---|
| `widthDots` | `number` | `800` | 缺少 `^PW` 时使用的备用宽度，不覆盖 ZPL 中的 `^PW`。 |
| `heightDots` | `number` | `480` | 缺少 `^LL` 时使用的备用高度，不覆盖 ZPL 中的 `^LL`。 |
| `format` | `"png" \| "jpeg" \| "jpg" \| "webp"` | `"png"` | Data URL 图片格式，以当前 Canvas 环境支持的格式为准。 |
| `quality` | `number` | Canvas 默认值 | JPEG、WebP 等格式的编码质量，取值范围为 `0` 到 `1`。 |
| `canvas` | `HTMLCanvasElement` | 通过 `document` 创建 | `renderZPLToDataURL()` 使用的 Canvas，宽高会重设为标签尺寸。 |

毫米转换为打印点的公式为 `dots = mm × dpi / 25.4`，结果取整。渲染已有 ZPL 时无需传 `dpi`；该参数用于从布局生成 ZPL。

### 渲染到 Canvas 或预览布局

```typescript
// 将已有 ZPL 绘制到 Canvas，此接口只接受 widthDots/heightDots 备用尺寸参数。
const canvas = document.createElement("canvas");
await printer.renderZPLToCanvas(zpl, canvas);
document.body.appendChild(canvas);

// 使用“快速开始”中的 template 和 data，同时生成 ZPL 与预览图片。
const preview = await printer.renderZPLPreview(template, data, {
  dpi: 203,
  qrErrorCorrection: "M",
  format: "png",
});
console.log(preview.zpl);
image.src = preview.dataUrl;
```

`renderZPLPreview()` 接受 ZPL 导出参数（`dpi`、`qrErrorCorrection`）及 Data URL 参数（`format`、`quality`、`canvas`）。标签尺寸来自布局，并由生成的 `^PW`、`^LL` 指令指定。

### 支持的指令与运行环境要求

渲染器支持部分 ZPL 指令，主要兼容本包生成的指令形式：`^PW`、`^LL`、`^FO`、`^A0N`、`^FB`、`^BQN`、未压缩十六进制 `^GFA`、`^BCN`（CODE128）、`^BEN`（EAN13）、`^BUN`（UPCA）、`^B3N`（CODE39）、`^BIN`（ITF14）、使用下划线十六进制转义的 `^FH`、`^FD` 和 `^FS`。

每次渲染一张标签。预览效果为近似模拟，并非完整的 Zebra 打印机解释器；不支持的指令可能被忽略，字体、条形码和二维码尺寸也可能与实际打印结果不同。

浏览器需支持 Canvas。在 Node.js 中，必须显式提供兼容的 Canvas（通过 Data URL 接口的 `options.canvas` 或 `renderZPLToCanvas` 的 Canvas 参数）。二维码渲染还使用 `Image`，条形码渲染会通过 `document.createElement("canvas")` 创建临时 Canvas，因此这些路径还需要兼容的浏览器全局对象。

---

## API 参考

### `StickerLayout` 数据结构

| 属性 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `id` | `string` | ✅ | 布局唯一标识 |
| `name` | `string` | ✅ | 布局名称 |
| `width`, `height` | `number` | ✅ | 标签宽高 |
| `unit` | `mm \| cm \| in \| px` | ✅ | 尺寸单位 |
| `elements` | `StickerElement[]` | ✅ | 可视元素数组 |
| `backgroundColor` | `string` | ❌ | 背景填充色（十六进制） |
| `backgroundImage` | `string` | ❌ | 背景图片 URL |

### `StickerElement` 数据结构

| 属性 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `id` | `string` | ✅ | 元素唯一标识 |
| `type` | `text \| qr \| barcode` | ✅ | 元素类型 |
| `content` | `string` | ✅ | 静态文本或含 `{{variable}}` 的模板 |
| `x`, `y` | `number` | ✅ | 相对于左上角原点的位置，使用布局单位 |
| `w`, `h` | `number` | ✅ | 元素宽高，使用布局单位 |
| `qrSeparator` | `string` | ❌ | 将相邻的 `{{variables}}` 拼接为一个二维码的内容 |
| `barcodeFormat` | `CODE128 \| EAN13 \| UPCA \| CODE39 \| ITF14` | ❌ | `type` 为 `barcode` 时必须设置 |
| `style.fontSize` | `number` | ❌ | 字号单位为**点（pt）**，PNG、PDF、ZPL 中一致，默认值为 `12`。 |
| `style.fontWeight` | `normal \| bold` | ❌ | 字重 |
| `style.textAlign` | `left \| center \| right` | ❌ | 文本水平对齐方式 |
| `style.verticalAlign` | `top \| middle \| bottom` | ❌ | 文本垂直对齐方式 |
| `style.fontFamily` | `string` | ❌ | CSS 字体，例如 `'Inter, sans-serif'` |
| `style.color` | `string` | ❌ | 文本颜色，使用十六进制，例如 `'#333333'` |
| `style.backgroundColor` | `string` | ❌ | 元素背景填充色（十六进制） |
| `style.wordWrap` | `boolean` | ❌ | 文本超过元素宽度时自动换行，默认值为 `true`。 |
| `style.lineHeight` | `number` | ❌ | 行高倍数，默认值为 `1.25`。 |

### `StickerPrinter` 方法

| 方法 | 返回值 | 说明 |
|---|---|---|
| `renderToCanvas(layout, data, canvas)` | `Promise<void>` | 将单张标签渲染到已有的 HTML Canvas 元素 |
| `renderToDataURL(layout, data, options?)` | `Promise<string>` | 导出图片 Data URL，支持 `png`、`jpeg` 和 `webp` |
| `exportToPNG(layout, data, options?)` | `Promise<Blob>` | 将单张标签导出为 PNG Blob |
| `exportImages(layout, dataList, options?)` | `Promise<string[]>` | 将多条记录批量导出为图片 Data URL |
| `exportToPDF(layout, dataList)` | `Promise<jsPDF>` | 将所有记录批量导出为多页 PDF，需要安装 `jspdf` |
| `exportToZPL(layout, dataList, options?)` | `string[]` | 将所有记录批量导出为 ZPL 字符串 |
| `exportToZPLAsync(layout, dataList, options?)` | `Promise<string[]>` | 导出 ZPL，二维码尺寸超过原生放大倍率上限时使用 `^GFA` 位图 |
| `renderZPLToCanvas(zpl, canvas, options?)` | `Promise<void>` | 将单张 ZPL 标签本地渲染到 Canvas，接受备用尺寸参数 `widthDots` 和 `heightDots` |
| `renderZPLToDataURL(zpl, options?)` | `Promise<string>` | 将单张 ZPL 标签本地渲染为图片 Data URL，默认为 PNG |
| `renderZPLPreview(layout, data, options?)` | `Promise<{ zpl: string; dataUrl: string }>` | 为单条布局数据生成 ZPL 及本地图片预览 |

---

## 使用场景

| 行业 | 应用场景 |
| :--- | :--- |
| 🏭 制造与仓储 | 装箱单、运输标签、库位标签 |
| 🎟️ 活动与会议 | 带二维码签到功能的参会证 |
| 🏥 医疗 | 患者腕带、资产追踪、样本标签 |
| 📦 库存与零售 | SKU 标签、价格标签、商品二维码 |
| 🏢 人事与门禁 | 员工工牌、访客通行证 |
| 🔧 维修与维护 | 带可扫描维护记录链接的设备资产标签 |

---

## 相关资源

- **[`@amethc/qrlayout-ui`](../ui/README.md)** — 基于本引擎的可视化拖拽设计器
- **[Git 仓库](https://github.com/GrayWitch/qr-code-label-designer-plus)** — 源码、示例及问题反馈。

---

## 许可证

MIT，详见 [LICENSE](../../LICENSE)。

---
