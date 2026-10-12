# QR Layout Tool

# 此项目是对 qr-code-label-designer 的扩展版本，扩展了core 与 layout ui的能力

原项目 https://github.com/shashi089/qr-code-label-designer

packages目录内有各个包的使用文档，打包后即可使用

# 预览
📥 第一步：克隆仓库
在终端中执行以下命令，将项目下载到本地：

bash
git clone https://github.com/shashi089/qr-code-label-designer.git
cd qr-code-label-designer
📦 第二步：安装依赖
项目根目录下执行：

bash
npm install
注意：该项目是一个 pnpm monorepo，根目录的 package.json 脚本中使用了 pnpm --filter 语法（例如 dev:ui 实际执行的是 pnpm --filter qrlayout-ui dev）。因此，你需要先全局安装 pnpm：

bash
npm install -g pnpm
然后再执行 pnpm install 来安装所有工作区依赖：

bash
pnpm install
🚀 第三步：启动开发服务器
依赖安装完成后，运行 UI 开发服务器：

bash
npm run build:core
npm run dev:ui
这会启动 qrlayout-ui 包的 Vite 开发服务器，浏览器访问终端提示的地址（通常是 http://localhost:5173），即可看到可拖拽的标签设计器界面。



