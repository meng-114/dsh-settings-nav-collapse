# dsh-settings-nav-collapse

> 简体中文 | **[English](./README.en.md)**

面向 DeepSeek Harness（DSH）Web 界面的**纯客户端插件**：在设置面板标题栏（关闭按钮左侧）加一个按钮，把设置面板左侧那条 188px 的导航栏折成 **56px 图标轨道**，让正文列在手机等窄屏上重新变得可读。

## 解决什么问题

随包设置面板是固定布局，**没有任何响应式断点**：

```
panel   { width:800px; max-width:calc(100vw - 48px) }
nav     { width:188px; padding:22px 12px 0; flex:none }
content { flex:1; min-width:0 }
options { padding:0 24px 24px }
```

在 360px 宽的手机上：`panel = min(800, 360−48) = 312px`，`nav` 吃掉 188px，正文只剩 **124px**，扣掉内边距实际约 **76px** —— 设置项基本没法读。折成 56px 轨道后，同一视口下正文可用宽度回到 **208～256px**。

## 功能

- 设置面板标题栏一个按钮：**rail（56px 图标轨道）↔ 展开**；按钮图标随状态翻转，`aria-pressed` 反映**实际生效**的状态（不是"请求"状态）。
- 窄屏（`≤640px`）默认折叠，宽屏默认展开；用户手动点过之后，选择被记住（`localStorage["dsh.settingsNav"]`，按浏览器存储）。
- 导航行若没有内联 svg 图标，自动退化为 **compact（88px、保留文字标签）**，不会出现"一条什么也点不到的空白轨道"。
- 窄屏下把内容列变成可滚动视口（`overflow:auto` + `overscroll-behavior:contain` + 触摸惯性滚动），并用 `dvh` 让面板避开浏览器地址栏/工具栏。
- 极窄屏给设置页一块 **480px 画布**并允许横向平移，避免设置项被压成竖排单字。
- 只在**自己打的标记**上写样式（`html[data-dsh-settings-nav]` + 面板标记 `data-dsh-settings-nav-panel`），不碰哈希类名、不 import 任何官方 client 包、不使用 `!important`。

## 安装

**方式一（推荐，npm 发布版）**

```bash
dsh plugin add @mengli114/dsh-settings-nav-collapse
```

或走受保护流程（插件管理器界面 / `dshpm`）。

**方式二（GitHub 源）**

```bash
dsh plugin add github:meng-114/dsh-settings-nav-collapse
```

**方式三（本地开发）**

```bash
dsh plugin --profile web add link:/path/to/dsh-settings-nav-collapse
```

`cordis.patch.yml` 会被合并进 profile roster，**装完重启一次 Web**，然后打开设置面板即可看到标题栏右侧多出的按钮。

卸载：`dsh plugin remove @mengli114/dsh-settings-nav-collapse`（或插件管理器里禁用）。

## 兼容性

| 项 | 值 |
|---|---|
| DSH | `>=0.1.5-rc.1`（面板锚点已在 0.1.5-rc.1 与 0.1.7-rc.2 上逐条核对；**尚未做过浏览器渲染实测**，见下节「验证」） |
| Node | `^22.19.0 \|\| >=24.0.0` |
| 浏览器 | 需要 `MutationObserver`、`matchMedia`、CSS `min()/max()`、`dvh`（不支持的引擎自动回退到 `vh`） |

面板定位**不依赖包内私有属性**：插件从自己那个按钮向上 `closest('[role="dialog"][aria-modal="true"]')` 找到设置面板，再给它打上自己的 `data-dsh-settings-nav-panel` 标记，所有 CSS 都基于该标记。`[data-shortcut-modal="settings"]`（只在较新构建里存在）仅作为兜底选择器。

## 已知取舍

- **展开态也会拿到 480px 画布**：用户在窄屏手动展开时，正文列实际只有约 92px，却仍按 480px 布局并需要横向拖动。这是有意的——92px 的正文列不可用，横向拖动至少可读。若更希望"展开态就按实际宽度换行"，可以去掉 `@media` 里那条 `[data-slot="settings.section"] > *` 规则。
- **横向平移没有视觉提示**：极窄屏下部分内容在屏外，需要用户自己横拖。
- **隐藏的导航标题**：rail/compact 下导航栏顶端那行标题会被隐藏以省空间；但如果该节点正带着 `data-modal-autofocus`（即"没有任何设置分区"的极端情况），插件**不会**隐藏它——否则模态层的初始聚焦会落在一个不渲染的元素上。
- 状态存 `localStorage`，因此不同设备/浏览器各记各的。

## 验证

静态与契约层面的核对记录见 [`docs/verification.md`](./docs/verification.md)：包含对随包 shell 真实 DOM（`0.1.5-rc.1` / `0.1.7-rc.2` 两个版本）的逐条比对、每个 CSS 变量是否存在、`dsh.client.immediately` 等字段是否合法，以及**仍需在真机浏览器里人工确认**的清单。

仓库自带的不变量测试（不需要浏览器、不需要依赖）：

```bash
npm run check   # node --check index.js && node --check client.js
npm test        # 包名/patch/模块 id 一致性、锚点策略、必填字段、发布文件清单…
```

## 开发

```bash
git clone git@github.com:meng-114/dsh-settings-nav-collapse.git
cd dsh-settings-nav-collapse
npm run check && npm test
# 装到本地 profile 调试（改完刷新页面即可，客户端模块走 HMR）
dsh plugin --profile web add link:$PWD
```

## License

MIT © 2026 mengli114
