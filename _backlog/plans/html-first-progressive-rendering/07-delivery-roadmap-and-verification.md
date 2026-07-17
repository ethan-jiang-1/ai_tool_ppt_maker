# 专题 06: OpenSpec 路线与验收

> 总控: [`../html-first-progressive-rendering.md`](../html-first-progressive-rendering.md)
> 状态: 四个 change 边界已锁定，待 Change 1 propose | 更新: 2026-07-17

## 为什么是四个 Change

| 方案 | 判断 | 原因 |
|---|---|---|
| 3 个 | 太少 | runtime 外部事实、结构化 source contract、完整产品切片会被迫至少两项揉成巨型 change，难以独立验证或回退 |
| **4 个** | **采用** | runtime、content contract、HTML-first complete delivery、paid refinement 各有独立完成线和明确下游消费者 |
| 5 个 | 太多 | 只能把 Change 3 的 renderer/default workflow 或 Change 4 的 cost transaction/UX 硬拆，归档后会留下用户无法完整使用的中间态 |

四个是能保持每个 change 可独立 review、apply、archive 的最小数量。以后某一 change 实施时若暴露未知风险，优先在该 change 内用 spike/task 管理；只有其完成线本身被证伪，才回写本 plan 重新切割，不能为了文件数量好看机械加 change。

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

### OpenSpec 落地包

| 包 | 内容 | 主要 spec 归属 |
|---|---|---|
| 1A Runtime baseline | `package.json`/CI/文档统一 Node 22，锁定 Playwright library 与 Chromium revision，定义显式 browser install/cache | 新增 `html-render-runtime`；修改 `environment-check` |
| 1B Font distribution | 确定 Latin/CJK WOFF2、许可证、框架内 canonical path、coverage/static-page smoke | `html-render-runtime`；修改 `framework-directory-layout` |
| 1C Layered readiness | base doctor 只检查本地生产基础；Image2 presence/live probe 进入显式 refinement check；保留 secret-safe 输出 | 修改 `environment-check`、`cli-surface` |
| 1D Legacy guard | legacy Image2-first 的 pilot/build 在真正进入远端路径前继续强制 credentials/style master，不依赖 base doctor 代为阻断 | 修改 `pipeline-orchestration`、`bootstrap-env-guidance` |

Proposal 必须明确：`env-check` 保持 Node built-ins-only 的可启动入口，在 npm dependencies 已存在后才动态进入 browser/font smoke；本 change 的 smoke 使用固定静态 HTML fixture，不调用尚未存在的 slide renderer，不能把 Change 3 的完整 build 当成 Change 1 验收前置。

### 完成标准

- macOS/Windows/Linux/CI 的声明安装路径和失败诊断有测试。
- 无 Image2 key 时 base readiness 可通过；显式 Image2 check 仍失败并给现有修复路径。
- 用户入口固定为 `ppt_flow doctor` 检查 base，`ppt_flow doctor --image2` 检查 refinement presence；live smoke 仍需显式 flag，普通 doctor 不联网。
- Chromium 不在 render/smoke 时临时下载；静态 fixture 的字体缺失或缺字 fail closed。
- targeted tests、全量 `npm test` 和 OpenSpec strict validation 通过。

## Change 2: `add-structured-html-slide-contract`

### 目的

建立 renderer-neutral 的页面内容/layout 真相，使后续 HTML renderer 不解析自由文本 prompt，也不需要自行发明 family、slot 或 overflow 决策。

### 包含

- 新 top-level `production.pipeline: html-first-v1` marker；与 legacy `render.default/header-lock` 分支互斥。
- `SLIDE BODY` fenced YAML parser/serializer、schema version、round-trip 与 source diagnostics。
- 10 个 layout family 的 discriminated union、typed blocks、容量、slot geometry、fallback 和 overflow preflight。
- `primary_visual`、`selection` 与 renderer-neutral `visual_contract_fingerprint` 合同；Image2-specific `generation_fingerprint` 延后到 Change 4。
- renderer-neutral visual config 扩展：body typography、spacing、cards、charts、callout、family geometry。
- backbone + version override asset manifest 按 asset ID 合并，并让 resolver 保留每条 entry 的来源层级。
- 测试 fixture 与 opt-in authoring guidance 可以显式写 HTML-first source，但 production create-deck/template 默认尚不切换。

### 不包含

- Browser screenshot、final-slide composition、Stage 4 切换、远端 Image2 调用、默认用户 workflow。

### 依赖与交付接口

- 依赖 Change 1 的 Node/runtime profile。
- 归档后交付 `parse -> structured slide plan -> validate` interface、family registry 与 resolved asset/visual fingerprint interface。

### OpenSpec 落地包

| 包 | 内容 | 主要 spec 归属 |
|---|---|---|
| 2A Source branch | `production.pipeline` marker、`SLIDE BODY` fenced YAML、round-trip、legacy 互斥与 diagnostics | 新增 `html-slide-contract`；修改 `content-parsing` |
| 2B Family registry | 10 个 discriminated unions、typed blocks、grapheme/count preflight、canonical slot geometry 与 fallback schema | `html-slide-contract` |
| 2C Visual contract | `primary_visual`/selection schema、visual contract freshness、resolved structured plan；不需要 Image2 配置 | `html-slide-contract`；修改 `slide-identity-and-ordering` 的 fingerprint 场景 |
| 2D Visual config | renderer-neutral typography/spacing/card/chart/callout/family tokens、schema migration 和 fixture | 修改 `visual-config` |
| 2E Asset layering | backbone + version manifests 按 ID 合并、同 ID override、resolved origin/SHA；legacy directory resolver 保持兼容 | 修改 `visual-asset-management`、`run-bundle-layout` |

这一 change 的外部 interface 只暴露“解析并验证完毕的 structured slide plan”和“resolved asset catalog”。family validator、Markdown surgery 和目录层级合并留在模块实现内部，后续 renderer 不得各自重写。

### 完成标准

- 每个 family 有最小/最大/非法字段、callout on/off、中文/英文 fixture；Change 2 验证 grapheme/count preflight，不假装已经做 browser pixel measurement。
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

### OpenSpec 落地包

| 包 | 内容 | 主要 spec 归属 |
|---|---|---|
| 3A Deterministic composition | structured plan -> self-contained HTML -> browser measurement/screenshot -> verified `final-slide`；ECharts/local asset adapters | 新增 `html-slide-rendering`；消费 `html-render-runtime`、`html-slide-contract` |
| 3B Artifact pipeline | `html_pages`/`final_slides` manifests、fingerprints、target-owned materialization、contact sheet | 修改 `pipeline-orchestration`、`slide-identity-and-ordering` |
| 3C Provider-neutral delivery | Stage 4 不再按 selected engine 寻址，只按 plan order 消费唯一 current `final-slide`；Stage 5 继续按 ID 注 notes | 修改 `pptx-assembly`、`notes-injection` |
| 3D New-deck default | init/template/source 写 HTML-first marker，移除基础 Image2 onboarding，更新 intake/status/readiness/change classifier | 修改 `run-bundle-management`、`framework-charter`、`commands-reference`、`bootstrap-env-guidance` |
| 3E Compatibility/migration | legacy 路径保持；显式 clean vNext 迁移、对照 gate、零远端结构/重排 rebuild | 修改 `pipeline-orchestration`、`project-versioning`、相关 playbook specs |
| 3F Workflow migration | 原子迁移最终六个 workflow 目录、Phase 0-5 和 `method_module` enums、全部 active links/nodes；`04-refinement` 此时仅服务 legacy 维护 | 修改 `framework-directory-layout`、`framework-charter`、`node-specification`、`playbook-execution` |

Change 3 虽跨 JS 与 MD，但只有一条完成线：fresh init 在零 Image2 条件下沿新 Phase 0-5 workflow 交付完整 PPTX。若 renderer、assembly、目录/node schema 或默认 workflow 任一缺失，就不能归档；也不能先切默认再留下不可交付的 deck。

### 完成标准

- 新手 E2E 从 init/create-deck 到完整 PPTX 不接触 Image2 setup。
- 每个 family renderer 有非空像素、稳定 geometry、overflow 和 screenshot tests。
- 纯重排/删页用本地重建完成，零远端调用；notes 不 shift。
- legacy Image2-first E2E 保持现有行为；显式迁移产生新 vNext 和用户对照 gate。
- workflow 顶层恰为最终六目录；active link/frontmatter/node schema 全部使用新 Phase/module 名称，旧目录引用为零。
- targeted tests、全量 `npm test`、相关 `tests_e2e`、bundle self-check 和 OpenSpec strict validation 通过。

## Change 4: `add-image2-visual-slot-refinement`

### 目的

在不破坏 HTML 完整成品的前提下，增加一个透明、可授权、可逐页回退的专业视觉升级闭环。这是最后一个 change，不再拆 UX 与 runtime。

### 包含

- Agent 在 HTML 交付后按价值推荐 2-4 页，并展示原因、收益和调用数。
- `refine plan/authorize/generate/accept/use-html/clean` CLI、plan hash 与 state authorization。
- 每页一个 slot、首轮一个 candidate、style-reference setup 调用单列。
- exactly-once attempt state、可证明时的 provider 对账、不可证明的 `unknown-submit` 人工处置、部分失败和重新授权。
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

### OpenSpec 落地包

| 包 | 内容 | 主要 spec 归属 |
|---|---|---|
| 4A Recommendation/authorization | HTML 交付后的 2-4 页建议、canonical plan、所有计费 attempt、style setup 单列、exact-plan `authorize` 与 version-scoped evidence | 新增 `visual-slot-refinement`；修改相关 playbook/`node-specification` |
| 4B Cost-safe generation | persisted random attempt IDs、setup-output dependency、generation fingerprint finalization、submit state machine、partial failure、`unknown-submit` 人工处置 | `visual-slot-refinement`；修改 `image-generation`、`cli-surface` |
| 4C Review artifacts | candidate manifest、output SHA、同 prompt 多结果、同 geometry/crop 的 refinement preview、逐页 review state | `visual-slot-refinement`；修改 `run-bundle-layout` |
| 4D Promotion/recovery | write-ahead journal、accepted candidate 原子提升为 version asset、source selection commit、use-html、幂等恢复、state evidence | `visual-slot-refinement`；修改 `visual-asset-management`、`content-parsing`、`node-specification` |
| 4E Closeout/UX | recent rejected upstream archive、hash-bound cleanup、首次 Image2 onboarding、COMMANDS/BOOTSTRAP/playbooks | `visual-slot-refinement`；修改 `commands-reference`、`framework-charter`、`bootstrap-env-guidance` |

Image2 provider 是 true external dependency：remote transport 以注入 adapter 只置于显式 refinement generation module 内部，测试使用 fake adapter，并通过 CLI receipt 验证 observable behavior。普通 `composeSlide/build` 不持有这个 adapter；provider task schema 也不得泄漏成 Stage 4 或 slide source 的调用知识。

### 完成标准

- 未授权、stale plan、重复执行和扩大 scope 不产生额外 provider submit；`unknown-submit` 无可靠 provider evidence 时也不自动再提交。
- 相同 prompt/profile 的不同 SHA 候选共存；用户审核 preview 与 accept 使用相同 crop/geometry。
- 批次部分失败不影响成功页或 HTML 成品；重试使用新 attempt/plan/authorization。
- style setup 失败/未知时不提交依赖它的页面 attempts；setup 成功产物先成为 version source reference。
- accept/use-html/重复 accept/cleanup/crash recovery 保持 source/asset/state 自洽。
- 删除 `_generated` 后 accepted visual asset 仍按原 SHA 逐字节复用，final slide 可在固定 runtime 下零远端重合成；recent rejected 已按收尾规则归档。
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

`PPTMAKER_FRAMEWORK/` 的目录和逐文件迁移必须同时遵守 [`07-framework-directory-impact.md`](07-framework-directory-impact.md)。Change 3 的 workflow rename 必须原子更新 active cross-references 和 node schema，不能留下两套活跃方法论。
