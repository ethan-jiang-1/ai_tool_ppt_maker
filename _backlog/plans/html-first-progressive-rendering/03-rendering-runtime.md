# 专题 03: Rendering Runtime 与 Visual Config

> 总控: [`../html-first-progressive-rendering.md`](../html-first-progressive-rendering.md)
> 状态: 架构已锁定 | 更新: 2026-07-17

## Visual config

`color_palette.json` 升级为 renderer-neutral、可执行的 visual config，继续作为单一结构化视觉真相；不新增会漂移的 `html-theme.json`。

需要补充：

- body 字体层级和 line-height
- spacing scale、grid、page margins
- card radius、padding、border 和 shadow policy
- chart tokens、icon tokens、callout tokens
- 各 layout family 的几何与容量参数

`deck_system.txt` 继续描述自然语言约束与禁忌。`style_master.jpg` 不再是基础 readiness 条件，只在 Image2 精修阶段作为参考。

为避免跨版本复用过时的 Image2 style reference，Change 2 同时定义 renderer-neutral 的 `style_reference_contract_fingerprint`。它只覆盖 visual config 中影响无文字图像色彩、材质、明暗和构图语言的 versioned token allowlist；`deck_system.txt` 仍是 Agent 解释的自然语言约束，JS 不解析或 hash 任意 prose。若自然语言视觉方向实质改变，Agent 必须同步更新相应结构化 visual tokens，和正文语义改变时同步更新 visual brief 使用同一纪律。fingerprint 不覆盖 slide 文案、family/slot geometry、provider profile 或已有 style-reference bytes。Change 4 生成 style reference 时把该 fingerprint 和 output SHA 写入 asset provenance。future Image2 plan 只有在 provenance fingerprint 等于 current contract 时才把它视为 current；否则保留 source asset，但把新的 setup attempt 和成本列入计划。这个 freshness 只控制未来候选生成，不让既有 accepted page asset 失效。

## HTML renderer profile

- Node.js 22 baseline
- Playwright library + pinned Chromium；不引入 Playwright Test runtime
- HTML runtime fixture 与新 HTML-first profile 使用固定 `1600x900` CSS viewport（精确 16:9），默认 DPR 2；Change 3 的最终 3200x1800 raster 进入 composition/PPTX
- self-contained HTML、内联 CSS、本地或 data URL assets
- framework-bundled、许可清楚的 WOFF2 Latin 与 Simplified Chinese (`Hans`) 字体；v1 不宣称完整 Traditional Chinese/Japanese/Korean coverage
- 等待 `document.fonts.ready`，再逐一验证 required fonts
- 禁止外部网络、service worker、动画、caret 和运行时浏览器下载
- 截图前执行 layout overflow 与资源完整性检查

正式可复现性承诺只适用于固定 Node/Chromium/font/runtime profile；不同 OS 的任意系统浏览器不承诺 pixel-identical。

这不授权 Change 1 修改现有 legacy visual config 的 `1672x941` canvas。Change 1 的静态 fixture 自带 HTML runtime geometry；Change 2/3 只为新 `html-first-v1` presets/source 定义精确 16:9 canvas。未迁移的 legacy deck 继续按其既有 canvas、fingerprint 和 Stage-3 合同运行；只有显式 clean-vNext 迁移才切换 canvas profile。

## Readiness 分层

### Base HTML readiness

- Node.js 22
- npm dependencies
- pinned Playwright 与已安装的 pinned Chromium
- bundled fonts 可加载且覆盖固定 Latin + Simplified-Chinese sentinel corpus
- local Chromium launch + bundled-font static-page smoke 成功

该层不检查 Image2 key、base URL 或 style master，也不读取 run-dir，所以不能声称已覆盖某一 deck 的实际文字。Change 1 只用固定静态页证明 browser/font runtime；Change 2 的 structured-plan validation 对 current source 做 code-point coverage preflight，Change 3 的 `ppt_flow build` 再对实际页面执行 font-load、pixel overflow 和完整 HTML composition。最终产品中，新用户必须能停留在这一层完成整个 deck。

### Image2 environment readiness

- `IMAGE2_API_KEY` + `IMAGE2_BASE_URL`
- in-framework Image2 transport/client 存在
- `ppt_flow doctor --image2` 只验证 base + Image2 presence，不联网、不读取 run-dir、不要求 plan、style reference 或授权
- `doctor --smoke` / `--probe-vendors` 显式 opt-in 时才验证 provider channel health；它们可能产生 provider submit，MD Controller 必须事先说明预计调用数并取得用户确认，不能把“诊断”当成免费或默认联网

这一层只说明“机器具备进入 Image2 工作流的环境条件”，不代表任何一批远端调用已经获得授权。

### Image2 transaction gate

- exact current plan 与 plan hash
- current slide scope、visual-contract fingerprints、profile 和预计调用数
- 与 current `style_reference_contract_fingerprint` 匹配的 style reference，或同一已授权 plan 中尚待执行的 style-reference setup attempt
- version-scoped exact attempt authorization 与未消费状态

这一层由 `image2 plan/authorize/generate` 与 state API 拥有，不属于 doctor。环境 READY 不能替代用户授权；已有授权也不能掩盖环境失败。

## 安装与运行约束

- Browser 安装/cache 是显式 setup 行为，render 不得 on-demand 下载。
- CI、macOS、Windows 和 Linux 使用同一 declared Chromium revision。
- HTML 页面不得读取公网字体、CDN 脚本或不受 provenance 管理的远程图片。
- Font 缺失或字形覆盖不足必须阻断，而不是静默 fallback 导致换行变化。doctor 只覆盖固定 sentinel；实际 source coverage 由 parse/build gate 负责。
- ECharts 等 browser-side 依赖固定版本并本地打包，不从 CDN 加载。

## Change 1 前置核验

只有两项是随时间变化的外部事实，必须在 `upgrade-html-render-runtime-readiness` propose 前重新核验：

1. 当前 Playwright 支持的 Node/Chromium 组合、browser cache 和离线安装方式。
2. 可随 framework 分发的 Latin 与 Simplified-Chinese (`Hans`) 字体文件、覆盖范围、体积与许可证义务。

核验结果进入 OpenSpec design 和测试，不直接写死为本 plan 的永久事实。

## 验收重点

- Change 1 后，无 Image2 凭据、无 style master 时 base doctor 和静态 browser/font smoke 成功；`doctor --image2` 只因 Image2 presence 缺失失败且不联网；Change 3 后完整 HTML build 也成功。
- Chromium 不在 render 时下载，所有外部网络请求被阻断。
- required fonts 加载失败或缺字时明确失败。
- 固定 profile 重复渲染得到相同尺寸、当前 fingerprint、稳定 layout 和非空像素。
- visual config 同时驱动 HTML layout 与 Image2 visual brief，不产生两套颜色/字体真相。
