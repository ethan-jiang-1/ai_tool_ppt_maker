# 专题 06: OpenSpec 路线与验收

> 总控: [`../html-first-progressive-rendering.md`](../html-first-progressive-rendering.md)
> 状态: 四个 change 边界已锁定，待 Change 1 propose | 更新: 2026-07-17

## Change 1: `upgrade-html-render-runtime-readiness`

### 目的

建立 HTML renderer 可以被后续 change 依赖的固定 runtime，并把“本地 HTML 就绪”与“Image2 就绪”从环境层分开；本 change 不引入 slide schema 或 renderer。

### 包含

- 全仓 Node.js baseline 从 18 升到 22，保持 ESM/无 build step。
- 引入 pinned Playwright library/Chromium 安装与 cache 合同；render 时禁止下载。
- 选择并随框架分发许可清楚的 Latin/CJK WOFF2 字体，加入 required-font/coverage smoke。
- `env-check`/doctor 输出 base readiness 与 Image2 refinement readiness 两组结果。
- legacy Image2-first build 仍在其实际执行入口强制检查 credentials/style master；base doctor 不再让新手被这些条件阻断。
- BOOTSTRAP 仅更新环境事实和分层诊断，不提前宣称 HTML workflow 已可用。

### 不包含

- `SLIDE BODY`、layout family、HTML 页面生成、PPTX 行为变化、Image2 精修 UX。

### 依赖与交付接口

- 依赖当前 main specs，无本计划内前置 change。
- 归档后交付一个可测试的 runtime profile：Node/Chromium/fonts 版本、安装状态和 local browser smoke。

### 完成标准

- macOS/Windows/Linux/CI 的声明安装路径和失败诊断有测试。
- 无 Image2 key 时 base readiness 可通过；显式 Image2 check 仍失败并给现有修复路径。
- Chromium 不在 render/smoke 时临时下载；字体缺失或缺字 fail closed。
- targeted tests、全量 `npm test` 和 OpenSpec strict validation 通过。

## Change 2: `add-structured-html-slide-contract`

### 目的

建立 renderer-neutral 的页面内容/layout 真相，使后续 HTML renderer 不解析自由文本 prompt，也不需要自行发明 family、slot 或 overflow 决策。

### 包含

- 新 top-level `production.pipeline: html-first-v1` marker；与 legacy `render.default/header-lock` 分支互斥。
- `SLIDE BODY` fenced YAML parser/serializer、schema version、round-trip 与 source diagnostics。
- 10 个 layout family 的 discriminated union、typed blocks、容量、slot geometry、fallback 和 overflow preflight。
- `primary_visual`、`selection` 与 `visual_contract_fingerprint` 合同。
- renderer-neutral visual config 扩展：body typography、spacing、cards、charts、callout、family geometry。
- backbone + version override asset manifest 按 asset ID 合并，并让 resolver 保留每条 entry 的来源层级。
- 新 template/source authoring guidance 可以显式生成 HTML-first fixture，但默认 create-deck 尚不切换。

### 不包含

- Browser screenshot、final-slide composition、Stage 4 切换、远端 Image2 调用、默认用户 workflow。

### 依赖与交付接口

- 依赖 Change 1 的 Node/runtime profile。
- 归档后交付 `parse -> structured slide plan -> validate` interface、family registry 与 resolved asset/visual fingerprint interface。

### 完成标准

- 每个 family 有最小/最大/非法字段、callout on/off、中文/英文 fixture。
- legacy 与 HTML-first parser 分支互不泄漏；冲突 marker/policy fail closed。
- reorder 不改变 semantic/visual contract fingerprint。
- source round-trip 保留其他 Markdown、speaker notes 和 identity/order invariants。
- targeted tests、全量 `npm test` 和 OpenSpec strict validation 通过。

## Change 3: `deliver-html-first-decks`

### 目的

用一个完整垂直切片交付真正可用的 HTML-first 产品：renderer、assembly 和默认用户 workflow 同时落地，避免仓库停在“代码能渲染但用户走不到”的中间状态。

### 包含

- self-contained HTML document、ECharts SVG/local asset adapters、strict network/font/overflow guard。
- `html_pages`、`final_slides` manifests 与 deep `composeSlide` interface。
- Stage 4 改为 provider-neutral verified final-slide consumer；Stage 5 notes 合同保持。
- contact sheet、PPTX、notes 和 local rebuild/materialization 流程。
- 新建 deck/template 默认写 `production.pipeline: html-first-v1`；intake 不询问 renderer。
- create-deck、BOOTSTRAP、COMMANDS、readiness、status 和 change classifier 改为“HTML 已是完整交付”。
- style master 与 Image2 credentials 从新 deck 基础路径移除；legacy Image2-first deck 保持旧 build/refresh 行为。
- legacy 显式迁移到 clean vNext：Agent 重写结构化 body、展示完整 HTML 对照稿、用户确认；不自动猜 prompt。

### 不包含

- Image2 visual-slot candidate、refinement commands、成本授权、promotion 或专业精修推荐。

### 依赖与交付接口

- 依赖 Change 2 的 structured plan、family registry 和 runtime profile。
- 归档后交付：任何新 deck 在无 Image2 key/style master 时都能生成完整 contact sheet/PPTX/notes；Stage 4 只认 final-slide。

### 完成标准

- 新手 E2E 从 init/create-deck 到完整 PPTX 不接触 Image2 setup。
- 每个 family renderer 有非空像素、稳定 geometry、overflow 和 screenshot tests。
- 纯重排/删页用本地重建完成，零远端调用；notes 不 shift。
- legacy Image2-first E2E 保持现有行为；显式迁移产生新 vNext 和用户对照 gate。
- targeted tests、全量 `npm test`、相关 `tests_e2e`、bundle self-check 和 OpenSpec strict validation 通过。

## Change 4: `add-image2-visual-slot-refinement`

### 目的

在不破坏 HTML 完整成品的前提下，增加一个透明、可授权、可逐页回退的专业视觉升级闭环。这是最后一个 change，不再拆 UX 与 runtime。

### 包含

- Agent 在 HTML 交付后按价值推荐 2-4 页，并展示原因、收益和调用数。
- `refine plan/generate/accept/use-html/clean` CLI、plan hash 与 state authorization。
- 每页一个 slot、首轮一个 candidate、style-reference setup 调用单列。
- exactly-once attempt state、unknown-submit 对账、部分失败和重新授权。
- candidate/output-SHA provenance、comparison preview 和 side-by-side review。
- `visual-refinement` reserved state record、review lifecycle 与 freshness contract。
- atomic promotion 到 version override asset、source selection binding、local recovery 与 idempotency。
- accepted/source asset、recent rejected upstream archive、deterministic cleanup plan。
- create/edit playbooks、COMMANDS、BOOTSTRAP 的可选专业精修入口和首次 Image2 onboarding。

### 不包含

- 多 visual slots、整页 Image2、自动重试、未授权 scope expansion、PowerPoint 原生可编辑对象。

### 依赖与交付接口

- 依赖 Change 3 已交付的完整 HTML deck、compose interface、final-slide assembly 和默认 workflow。
- 归档后整个总计划完成；后续能力只能作为新的 plan/change 扩展。

### 完成标准

- 未授权、stale plan、重复执行和扩大 scope 不产生额外 provider submit。
- 相同 prompt/profile 的不同 SHA 候选共存；用户审核 preview 与 accept 使用相同 crop/geometry。
- 批次部分失败不影响成功页或 HTML 成品；重试使用新 attempt/plan/authorization。
- accept/use-html/重复 accept/cleanup/crash recovery 保持 source/asset/state 自洽。
- 删除 `_generated` 后 accepted asset 可零远端逐字节重建；recent rejected 已按收尾规则归档。
- targeted tests、全量 `npm test`、专业精修 `tests_e2e` 和 OpenSpec strict validation 通过。

## 跨 Change Test Matrix

| 场景 | Ch1 | Ch2 | Ch3 | Ch4 |
|---|---:|---:|---:|---:|
| Node/Chromium/font readiness | owner | consume | E2E | consume |
| Structured body/family/overflow | - | owner | render | consume |
| 无 Image2 完整交付 | prerequisite | prerequisite | owner | preserve |
| Legacy Image2-first 兼容 | readiness | parser | owner | preserve |
| Stable ID/reorder/notes | - | fingerprint | owner | preserve |
| Cost authorization/exactly-once | - | - | - | owner |
| Candidate review/promotion/cleanup | - | selection contract | composition prerequisite | owner |

## 全局风险与缓解

| 风险 | 缓解 |
|---|---|
| 结构化 body 过重 | v1 固定 10 个 families 和 typed blocks；用户不手写 |
| Ch3 跨 JS + MD 较大 | 它是唯一有意的垂直切片；以“无 Image2 完整交付”E2E 为单一完成线 |
| Image2 候选占磁盘 | 本版全留；accepted 提升为 source asset，recent rejected 收尾归档一份后清理 |
| runtime 与字体跨平台漂移 | pinned Chromium + bundled licensed fonts + strict verification |
| state/manifest/source 漂移 | 各自只拥有 authorization、provenance、selection；fingerprint + receipt + recovery 验证 |

## Non-Goals

- 不输出 PowerPoint 原生可编辑文本/图表对象。
- 不允许任意 per-slide HTML/CSS authoring。
- 不允许一页多个独立 Image2 slot。
- 不让 Image2 绘制准确文字、数据图表或承担整页 layout。
- 不为旧 deck 自动解析 prompt 或自动迁移。
- 不在结构编辑、materialization 或普通 HTML build 中暗中调用 Image2。
- 不承诺不同 OS 的任意浏览器环境 pixel-identical。

## 执行纪律

每个 change 单独 propose、review、apply、validate、archive。后一个 change 只依赖已经归档并同步到 main specs 的行为，不能依赖聊天或未落地的未来 interface。四个 change 的 proposal/design/tasks 必须逐项覆盖本文件对应的“包含、完成标准”，若延期必须回写本 plan，不能在 change 中静默删项。
