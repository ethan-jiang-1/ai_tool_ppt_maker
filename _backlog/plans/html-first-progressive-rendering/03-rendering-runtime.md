# 专题 03: Rendering Runtime 与 Visual Config

> 总控: [`../html-first-progressive-rendering.md`](../html-first-progressive-rendering.md)
> 状态: 架构决策完成；版本/许可证事实待 Change 1 核验 | 更新: 2026-07-17

## Visual config

`color_palette.json` 升级为 renderer-neutral、可执行的 visual config，继续作为单一结构化视觉真相；不新增会漂移的 `html-theme.json`。

需要补充：

- body 字体层级和 line-height
- spacing scale、grid、page margins
- card radius、padding、border 和 shadow policy
- chart tokens、icon tokens、callout tokens
- 各 layout family 的几何与容量参数

`deck_system.txt` 继续描述自然语言约束与禁忌。`style_master.jpg` 不再是基础 readiness 条件，只在 Image2 精修阶段作为参考。

## HTML renderer profile

- Node.js 22 baseline
- Playwright library + pinned Chromium；不引入 Playwright Test runtime
- 固定 `1672x941` viewport，默认 DPR 2
- self-contained HTML、内联 CSS、本地或 data URL assets
- framework-bundled、许可清楚的 WOFF2 Latin 与 CJK 字体
- 等待 `document.fonts.ready`，再逐一验证 required fonts
- 禁止外部网络、service worker、动画、caret 和运行时浏览器下载
- 截图前执行 layout overflow 与资源完整性检查

正式可复现性承诺只适用于固定 Node/Chromium/font/runtime profile；不同 OS 的任意系统浏览器不承诺 pixel-identical。

## Readiness 分层

### Base HTML readiness

- Node.js 22
- npm dependencies
- pinned Playwright 与已安装的 pinned Chromium
- bundled fonts 可加载且覆盖当前 slide 语言
- local Chromium launch + bundled-font static-page smoke 成功

该层不检查 Image2 key、base URL 或 style master。Change 1 只用固定静态页证明 browser/font runtime；Change 3 接入真实 slide renderer 后，`ppt_flow build` 才把完整 HTML composition 纳入 readiness。最终产品中，新用户必须能停留在这一层完成整个 deck。

### Image2 refinement readiness

- 已绑定且仍当前的 refinement plan / scope authorization
- `IMAGE2_API_KEY` + `IMAGE2_BASE_URL`
- current style reference，或同一已授权 plan 中尚待执行的 style-reference setup attempt
- provider smoke / channel health
- 每页 profile 与预计调用数

第二层只在用户明确选择专业精修后运行。

## 安装与运行约束

- Browser 安装/cache 是显式 setup 行为，render 不得 on-demand 下载。
- CI、macOS、Windows 和 Linux 使用同一 declared Chromium revision。
- HTML 页面不得读取公网字体、CDN 脚本或不受 provenance 管理的远程图片。
- Font 缺失或字形覆盖不足必须阻断，而不是静默 fallback 导致换行变化。
- ECharts 等 browser-side 依赖固定版本并本地打包，不从 CDN 加载。

## Change 1 前置核验

只有两项是随时间变化的外部事实，必须在 `upgrade-html-render-runtime-readiness` propose 前重新核验：

1. 当前 Playwright 支持的 Node/Chromium 组合、browser cache 和离线安装方式。
2. 可随 framework 分发的 Latin/CJK 字体文件、覆盖范围、体积与许可证义务。

核验结果进入 OpenSpec design 和测试，不直接写死为本 plan 的永久事实。

## 验收重点

- Change 1 后，无 Image2 凭据、无 style master 时 base doctor 和静态 browser/font smoke 成功；Change 3 后完整 HTML build 也成功。
- Chromium 不在 render 时下载，所有外部网络请求被阻断。
- required fonts 加载失败或缺字时明确失败。
- 固定 profile 重复渲染得到相同尺寸、当前 fingerprint、稳定 layout 和非空像素。
- visual config 同时驱动 HTML layout 与 Image2 visual brief，不产生两套颜色/字体真相。
