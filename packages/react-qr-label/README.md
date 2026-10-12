# react-qr-label：React 标签组件

用于设计和打印二维码标签的 React 组件。

通过一个组件即可在 React 应用中嵌入完整的标签设计器。用户可以拖拽元素、绑定业务数据中的 `{{variables}}`、实时预览，并导出 PDF、PNG 或用于 Zebra 热敏打印机的 ZPL。

本组件属于标签设计器工作区，其他框架的封装见下方相关包。

---

## 本地示例

参见 [集成示例](../../examples/react-qr-label-demo/README.md)。

---

## 功能特性

- **拖拽设计器**：在画布上可视化放置文本、二维码、条形码并调整尺寸。
- **多选操作**：使用 Ctrl+单击 或 Ctrl+A 选择多个元素，并整体拖动。
- **对齐工具**：将选中元素相互对齐，或对齐到标签边缘。
- **可见边界**：始终显示元素轮廓，编辑时可清楚看到所有元素的位置。
- **实时预览**：设计过程中使用示例数据预览标签。
- **PDF / ZPL 预览**：内置预览按钮，支持 PDF 与 ZPL 图片预览，可选择 203 / 300 / 600 DPI。
- **`{{variable}}` 数据绑定**：绑定业务实体中的 `{{name}}`、`{{id}}`、`{{department}}` 等字段。
- **多变量二维码**：通过可配置的分隔符，将多个字段合并为一个二维码内容。
- **文本样式**：支持字号、字重、对齐、颜色、字体、换行及行高设置。
- **尺寸预设**：内置常见运输标签、工牌和吊牌尺寸。
- **网格吸附**：拖动时可按 1 个单位吸附到网格。
- **撤销 / 重做**：支持 20 步历史记录，快捷键为 Ctrl+Z / Ctrl+Y。
- **快捷键**：支持 Delete 删除、方向键微调、Shift+方向键快速移动、Ctrl+D 复制、Ctrl+A 全选及 Escape 取消选择。
- **暗色模式**：内置亮色与暗色主题。
- **多种单位**：支持毫米、厘米、英寸和像素。
- **JSON 输出**：生成简洁的布局 JSON，便于保存到后端。

---

## 安装

```bash
npm install react-qr-label
```

`qrlayout-core` 和 `qrlayout-ui` 已作为直接依赖包含在内，无需额外安装。

---

## 快速开始

```tsx
import { QRLabelDesigner } from 'react-qr-label';
import 'react-qr-label/style.css';
import type { StickerLayout, EntitySchema } from 'react-qr-label';

const SCHEMAS: Record<string, EntitySchema> = {
  employee: {
    label: '员工',
    fields: [
      { name: 'fullName',    label: '姓名'    },
      { name: 'employeeId',  label: '员工编号'  },
      { name: 'department',  label: '部门'   },
    ],
    sampleData: {
      fullName: '张三',
      employeeId: 'EMP-001',
      department: '工程部',
    },
  },
};

export default function LabelsPage() {
  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <QRLabelDesigner
        entitySchemas={SCHEMAS}
        onSave={(layout) => {
          console.log('已保存：', layout);
        }}
      />
    </div>
  );
}
```

---

## 属性

| 属性 | 类型 | 必填 | 说明 |
| :--- | :--- | :---: | :--- |
| `initialLayout` | `StickerLayout` | ❌ | 挂载时加载的初始布局 |
| `entitySchemas` | `Record<string, EntitySchema>` | ❌ | 用于 `{{variable}}` 绑定和实时预览的字段定义 |
| `onSave` | `(layout: StickerLayout) => void` | ❌ | 点击“保存布局”时调用 |
| `className` | `string` | ❌ | 容器 `<div>` 的 CSS 类名 |
| `style` | `React.CSSProperties` | ❌ | 容器 `<div>` 的行内样式 |

---

## 保存与打印流程

设计器输出普通 JSON 布局对象。将布局和业务数据传入 `StickerPrinter`（从 `react-qr-label` 导出），即可生成 PDF、PNG 或 ZPL。

### 导出 PDF

> 需要安装 `jspdf`：`npm install jspdf`

```typescript
import { StickerPrinter } from 'react-qr-label';

const printer = new StickerPrinter();
const pdf = await printer.exportToPDF(layoutJSON, records);
pdf.save('badges.pdf');
```

### 导出 ZPL（Zebra 热敏打印机）

```typescript
import { StickerPrinter } from 'react-qr-label';

const printer = new StickerPrinter();

// 同步导出，适用于 203 DPI
const zplPages = printer.exportToZPL(layoutJSON, records, { dpi: 203 });

// 300/600 DPI 可使用异步导出，以确保较大二维码的打印尺寸正确
const zpl300Pages = await printer.exportToZPLAsync(layoutJSON, records, { dpi: 300 });
```

### 导出 PNG

```typescript
const printer = new StickerPrinter();

for (const record of records) {
  const blob = await printer.exportToPNG(layoutJSON, record);
  const a = Object.assign(document.createElement('a'), {
    href: URL.createObjectURL(blob),
    download: `${record.id}.png`,
  });
  a.click();
}
```

---

## TypeScript 类型

```typescript
interface StickerLayout {
  id: string;
  name: string;
  width: number;
  height: number;
  unit: 'mm' | 'cm' | 'in' | 'px';
  backgroundColor?: string;
  targetEntity?: string;
  elements: StickerElement[];
}

interface StickerElement {
  id: string;
  type: 'text' | 'qr' | 'barcode';
  x: number;
  y: number;
  w: number;
  h: number;
  content: string;
  qrSeparator?: string;
  barcodeFormat?: 'CODE128' | 'EAN13' | 'UPCA' | 'CODE39' | 'ITF14';
  style?: {
    fontSize?: number;
    fontWeight?: 'normal' | 'bold';
    textAlign?: 'left' | 'center' | 'right';
    verticalAlign?: 'top' | 'middle' | 'bottom';
    fontFamily?: string;
    color?: string;
    backgroundColor?: string;
    wordWrap?: boolean;
    lineHeight?: number;
  };
}

interface EntitySchema {
  label: string;
  fields: EntityField[];
  sampleData: Record<string, string | number>;
}

interface EntityField {
  name: string;
  label: string;
}
```

---

## 使用场景

| 行业 | 应用场景 |
| :--- | :--- |
| 🏭 制造与仓储 | 装箱单、库位标签、运输标签 |
| 🎟️ 活动与会议 | 带二维码签到功能的参会证 |
| 🏥 医疗 | 患者腕带、样本标签、资产追踪 |
| 📦 库存与零售 | SKU 标签、价格标签、商品二维码 |
| 🏢 人事与门禁 | 员工工牌、访客通行证 |
| 🔧 维修与维护 | 带可扫描维护记录链接的设备资产标签 |

---

## 相关包

| 包 | 说明 |
| :--- | :--- |
| [`qrlayout-core`](../core/README.md) | 无界面渲染引擎，可生成 PNG、PDF 和 ZPL |
| [`qrlayout-ui`](../ui/README.md) | 不依赖框架的设计器，使用原生 TypeScript |
| [`vue-qr-label`](../vue-qr-label/README.md) | Vue 3 组件封装 |
| [`svelte-qr-label`](../svelte-qr-label/README.md) | Svelte 5 组件封装 |

---

## 许可证

MIT，详见 [LICENSE](../../LICENSE)。

---
