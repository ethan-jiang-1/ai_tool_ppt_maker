# 专题 07: OpenSpec 路线与验收

> 总控: [`../html-first-progressive-rendering.md`](../html-first-progressive-rendering.md)
> 状态: 架构已锁定；Change 1/2 已完成并归档；Change 3 已完成首版 Propose artifacts，待多轮 Review | 更新: 2026-07-18

## 为什么是四个 Change

| 方案 | 判断 | 原因 |
|---|---|---|
| 3 个 | 太少 | runtime 外部事实、结构化 source contract、完整产品切片会被迫至少两项揉成巨型 change，难以独立验证或回退 |
| **4 个** | **采用** | runtime、content contract、HTML-first complete delivery、paid refinement 各有独立完成线和明确下游消费者 |
| 5 个 | 太多 | 只能把 Change 3 的 renderer/default workflow 或 Change 4 的 cost transaction/UX 硬拆，归档后会留下用户无法完整使用的中间态 |

四个是能保持每个 change 可独立 review、apply、archive 的最小数量。以后某一 change 实施时若暴露未知风险，优先在该 change 内用 spike/task 管理；只有其完成线本身被证伪，才回写本 plan 重新切割，不能为了文件数量好看机械加 change。

## Change 实施追踪

| Change | Propose | Review | Apply | Validate | Sync + Archive |
|---|---|---|---|---|---|
| 1 `upgrade-html-render-runtime-readiness` | [x] | [x] | [x] | [x] | [x] |
| 2 `add-structured-html-slide-contract` | [x] | [x] | [x] | [x] | [x] |
| 3 `deliver-html-first-decks` | [x] | [ ] | [ ] | [ ] | [ ] |
| 4 `add-image2-visual-slot-refinement` | [ ] | [ ] | [ ] | [ ] | [ ] |

勾选纪律：只有对应动作已经完成且其强制校验通过才可标记 `[x]`；`Review` 指 proposal/design/specs/tasks 已经过质量审查并达到 apply-ready；`Validate` 指实现后的 targeted/full tests 与 strict OpenSpec validation 全部通过；`Sync + Archive` 必须在 delta specs 同步 main specs 且 change 正式归档后一起勾选。任一步失败或返工时保持未勾选，并在该 change 的 artifacts/tasks 中记录阻塞，不用聊天状态代替此表。

`openspec/changes/archive/2026-07-17-upgrade-html-render-runtime-readiness/` 已完成整套替换、多轮对抗性 Review、当前 Mac 实施验收、main-spec 同步和归档。追加轮次修复了 Node 支持集合过宽、mutable Noto 分片事实、字体 fallback 伪阳性、browser smoke 无界等待、package discovery/load 分裂、远程 guard 过早、live redirect/重试超额提交、JSON stdout 污染与 confirm-write 重复 probe。当前 Mac 的 `doctor`、paired Chromium/font smoke、focused/full Vitest、相关 E2E、strict validation 和范围审计全部通过；Windows/Linux/CI 执行明确不作为本 change 门槛。

`openspec/changes/archive/2026-07-18-add-structured-html-slide-contract/` 已完成 Change 2 的多轮 Review、Apply、完整回归/结构 E2E/依赖与范围审计、main-spec 同步和归档。它交付 renderer-neutral structured slide plan、10-family/68-variant geometry、严格 source/config/catalog/font/fallback/selection/fingerprint 合同和 validation-only authoring guidance，未引入浏览器渲染、PPTX/default workflow 或 Image2 refinement。

`openspec/changes/deliver-html-first-decks/` 已生成 Change 3 首版 proposal、design、13 个 capability delta specs 和 tasks，覆盖 deterministic HTML composition、provider-neutral final-slide/PPTX、fresh HTML-first default、real-artifact gates/local rebuild、legacy maintenance/migration，以及最终六目录/Phase/node/state 原子迁移。当前只表示 `Propose` artifacts 已建立；尚未经过系统性 Review，也未进入 Apply。

## Change 1: `upgrade-html-render-runtime-readiness`

### 目的

建立 HTML renderer 可以被后续 change 依赖的固定 runtime，并把“本地 HTML 就绪”与“Image2 就绪”从环境层分开；本 change 不引入 slide schema 或 renderer。

### 包含

- 全仓 Node.js engine floor 从 18 升到 `>=22`，Change 1 profile 支持 `22.x` / `24.x` / `26.x`，保持 ESM/无 build step。
- 引入 pinned Playwright library/Chromium 安装与 cache 合同；render 时禁止下载。
- 选择并随框架分发许可清楚的 Latin + Simplified-Chinese (`Hans`) WOFF2 字体，加入 required-font/coverage smoke；不宣称完整 Traditional Chinese/Japanese/Korean coverage。
- `env-check`/doctor 输出 base readiness 与 Image2 environment readiness 两组结果；plan/authorization 属于 Change 4 的 transaction gate，不进入 doctor。
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
| 1A Runtime baseline | `package.json` 使用 `>=22` engine floor，runtime/CI/文档锁定支持 `22.x` / `24.x` / `26.x`，并锁定 Playwright library、Chromium revision 与显式 browser install/cache | 新增 `html-render-runtime`；修改 `environment-check` |
| 1B Font distribution | 确定 Latin + Simplified-Chinese WOFF2、许可证、框架内 canonical path、coverage/static-page smoke | `html-render-runtime`；修改 `framework-directory-layout` |
| 1C Layered readiness | base doctor 只检查本地生产基础；`--image2` 只加 Image2 presence，off-path Phase 0 `probe-image-channels` 仍通过现有显式 live flags 工作；live 诊断先披露调用数并确认，style-master 不再充当通道探针；plan/authorization 不进入 doctor | 修改 `environment-check`、`cli-surface`、`playbook-execution`、`image-generation` |
| 1D Legacy guard | legacy Image2-first 的 pilot/build 在真正进入远端路径前继续强制 credentials/style master，不依赖 base doctor 代为阻断 | 修改 `pipeline-orchestration`、`bootstrap-env-guidance` |

Proposal 必须明确：`env-check` 保持 Node built-ins-only 的可启动入口，在 npm dependencies 已存在后才动态进入 browser/font smoke；本 change 的 smoke 使用固定静态 HTML fixture，不调用尚未存在的 slide renderer，不能把 Change 3 的完整 build 当成 Change 1 验收前置。

Change 1 的 fixture viewport 不得改写 legacy deck/preset 的现有 `1672x941` canvas 或使旧 Stage-3 fingerprints 失效；精确 16:9 HTML-first visual config 由 Change 2/3 对新 pipeline marker 拥有，legacy 仅在显式迁移时切换。

### 完成标准

- 当前 Mac 的声明安装路径和失败诊断有实测；Windows/Linux/CI 只保留为后续可执行的 portability guidance，不作为本 change 完成门槛。
- 无 Image2 key 时 base readiness 可通过；显式 Image2 check 仍失败并给现有修复路径。
- 用户入口固定为 `ppt_flow doctor` 检查 base，`ppt_flow doctor --image2` 检查 refinement presence；live smoke 仍需显式 flag，普通 doctor 不联网。
- doctor 的 font smoke 只验证固定 Latin + Simplified-Chinese sentinel；实际 deck code-point coverage 与 pixel overflow 由后续 structured-plan/build gate 负责，不能由无 run-dir 的 doctor 冒充。
- `--smoke` / `--probe-vendors` 的 live submit 必须由 Controller 先披露预计调用数并取得用户确认；它们不产生 page refinement authorization。
- `probe-image-channels` 保持 Phase 0 / `00-setup` 的共享环境诊断 controller；legacy 和未来 modern refinement 都通过 playbook switch 复用，不能把它注册成 Change 3 的 modern Phase 4 execution。
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
| 2D Visual config | renderer-neutral typography/spacing/card/chart/callout/family tokens、schema migration、visual/style-reference contract dependency projections 和 fixtures | 修改 `visual-config` |
| 2E Asset layering | backbone + version manifests 按 ID 合并、同 ID override、resolved origin/SHA；legacy directory resolver 保持兼容 | 修改 `visual-asset-management`、`run-bundle-layout` |

这一 change 的外部 interface 只暴露“解析并验证完毕的 structured slide plan”和“resolved asset catalog”。family validator、Markdown surgery 和目录层级合并留在模块实现内部，后续 renderer 不得各自重写。

### 完成标准

- 每个 family 有最小/最大/非法字段、callout on/off、中文/英文 fixture；Change 2 验证 grapheme/count preflight，不假装已经做 browser pixel measurement。
- legacy 与 HTML-first parser 分支互不泄漏；冲突 marker/policy fail closed。
- reorder 不改变 semantic/visual contract fingerprint。
- selection resolution 统一产出 `fallback|selected|stale|broken`；null/stale 可完成 HTML build，current binding 的 asset 缺失、未登记或 SHA 不符 fail closed。所有 fallback 无条件验证，selection current 也不能遮蔽损坏；允许 `primary_visual` 的 family 在零 Image2 条件下都有完整 fallback fixture。
- source round-trip 保留其他 Markdown、speaker notes 和 identity/order invariants。
- targeted tests、全量 `npm test` 和 OpenSpec strict validation 通过。

## Change 3: `deliver-html-first-decks`

### 目的

用一个完整垂直切片交付真正可用的 HTML-first 产品：renderer、assembly 和默认用户 workflow 同时落地，避免仓库停在“代码能渲染但用户走不到”的中间状态。

### 包含

- self-contained HTML document、ECharts SVG/local asset adapters、strict network/font/overflow guard。
- `_generated/html_production/html_pages`、`final_slides` manifests 与 deep `composeSlide` interface；Image2 候选只在独立 `_generated/image2_refinement/` 下存在。
- Stage 4 改为 provider-neutral verified final-slide consumer；Stage 5 notes 合同保持。
- contact sheet、PPTX、notes 和 local rebuild/materialization 流程。
- 新建 deck/template 默认写 `production.pipeline: html-first-v1`；intake 不询问 renderer。
- create-deck、BOOTSTRAP、COMMANDS、readiness、status 和 change classifier 改为“HTML 已是完整交付”。
- style master 与 Image2 credentials 从新 deck 基础路径移除；legacy Image2-first deck 保持旧 build/refresh 行为。
- legacy 显式迁移到 clean vNext：Agent 重写结构化 body、展示完整 HTML 对照稿、用户确认；不自动猜 prompt。

### 不包含

- Image2 visual-slot candidate、`image2` commands、成本授权、promotion 或专业精修推荐。

### 依赖与交付接口

- 依赖 Change 2 的 structured plan、family registry 和 runtime profile。
- 归档后交付：任何新 deck 在无 Image2 key/style master 时都能生成完整 contact sheet/PPTX/notes；Stage 4 只认 final-slide。

### OpenSpec 落地包

| 包 | 内容 | 主要 spec 归属 |
|---|---|---|
| 3A Deterministic composition | structured plan -> self-contained HTML -> browser measurement/screenshot -> verified `final-slide`；ECharts/local asset adapters | 新增 `html-slide-rendering`；消费 `html-render-runtime`、`html-slide-contract` |
| 3B Artifact pipeline | `html_production/html_pages`/`final_slides` manifests、fingerprints、target-owned materialization、contact sheet；不读取 Image2 candidate 目录 | 修改 `pipeline-orchestration`、`slide-identity-and-ordering`、`run-bundle-layout` |
| 3C Provider-neutral delivery | Stage 4 不再按 selected engine 寻址，只按 plan order 消费唯一 current `final-slide`；Stage 5 继续按 ID 注 notes | 修改 `pptx-assembly`、`notes-injection` |
| 3D New-deck default | init/template/source 写 HTML-first marker，按 pipeline marker 分支 content/visual gate evidence与 preview/publication readiness，移除基础 Image2 onboarding，更新 intake/status/readiness/change classifier | 修改 `run-bundle-management`、`pipeline-orchestration`、`framework-charter`、`commands-reference`、`bootstrap-env-guidance`、`playbook-execution` |
| 3E Compatibility/migration | legacy 路径保持；显式 clean vNext 迁移、对照 gate、零远端结构/重排 rebuild | 修改 `pipeline-orchestration`、`project-versioning`、相关 playbook specs |
| 3F Workflow/playbook migration | 原子迁移最终六个 workflow 目录、`03-html-production` / README-only unavailable `04-image2-refinement` stub / legacy controller、Phase 0-5、`method_module` enums、全部 active links/nodes 和既有 state 续跑解释；Change 3 不注册 Phase 4 execution，legacy maintenance 固定为 Phase 5/`05-iteration` | 修改 `framework-directory-layout`、`framework-charter`、`node-specification`、`playbook-execution` |

Change 3 虽跨 JS 与 MD，但只有一条完成线：fresh init 在零 Image2 条件下沿新 Phase 0-5 workflow 交付完整 PPTX。若 renderer、assembly、目录/node schema 或默认 workflow 任一缺失，就不能归档；也不能先切默认再留下不可交付的 deck。

### 完成标准

- 新手 E2E 从 init/create-deck 到完整 PPTX 不接触 Image2 setup。
- create-deck 在 HTML/PPTX/notes 交付后已完成；Image2 目录和 pending node 均不存在，用户结束不会留下“未完成精修”假状态。
- 每个 family renderer 有非空像素、稳定 geometry、overflow 和 screenshot tests。
- 纯重排/删页用本地重建完成，零远端调用；notes 不 shift。
- HTML-first content/visual gates 使用真实 HTML preview 且不要求 style master；visual freshness 绑定 visual config、runtime/renderer/family/recipe/compositor versions 与代表页 fallback asset SHAs。普通文案重建不使整册 gate 失效；page-local fallback asset 变化必须展示受影响页面，并在同一 visual gate record 的 `page_reviews[slide_id]` 刷新 composition/preview/asset evidence。当前有 accepted selection 时强制展示 fallback variant，不能用 accepted 图代审；也不接受 legacy gate evidence。
- classifier 对 HTML-first 单页、全局 visual config、notes 和结构改动分别走 Local Slide/Deck Rebuild、Notes-Only、Structural 路径；普通维护零远端。
- legacy Image2-first E2E 保持现有行为；显式迁移产生新 vNext 和用户对照 gate。
- workflow 顶层恰为最终六目录；Change 3 的 `04-image2-refinement/` 只有 unavailable README，active playbook 不注册 modern Phase 4 execution；HTML production、HTML/local iteration 和 legacy maintenance 路由清晰，active link/frontmatter/node schema 全部使用新 Phase/module 名称，旧目录引用为零。
- 新 HTML-first run bundle 的 `_generated/html_production/` 与 lazy optional `_generated/image2_refinement/`、`_scratch/image2_refinement/`、accepted `overrides/.../refined/image2/{style-reference,visual-slots}/` 通过 bundle self-check 互不混淆；未进入 Image2 的 deck 不创建后三者仍 conformant，`1_upstream_raw_material/` 不接受 rejected/generated Image2 history。
- 已有 HTML/legacy deck 的 `_state` 经确定性 heal 后保留可映射进度并可续跑；不可映射执行要求人类确认 replacement，不静默重置。
- targeted tests、全量 `npm test`、相关 `tests_e2e`、bundle self-check 和 OpenSpec strict validation 通过。

## Change 4: `add-image2-visual-slot-refinement`

### 目的

在不破坏 HTML 完整成品的前提下，增加一个透明、可授权、可逐页回退的 Image2 visual-slot 资产升级闭环。这是最后一个 change，不再拆 UX 与 runtime；普通 HTML/local iteration 不属于本 change。

### 包含

- Agent 在 HTML 交付后按价值推荐 2-4 页，并展示原因、收益和调用数。
- `image2 plan/authorize/generate/accept/use-html/clean` CLI、plan hash 与 state authorization；普通 HTML/local iteration 不进入此命令组。
- 每页一个 slot、首轮一个 candidate、style-reference setup 调用单列。
- exactly-once attempt state、可证明时的 provider 对账、不可证明的 `unknown-submit` 人工处置、部分失败和重新授权。
- candidate/output-SHA provenance、comparison preview 和 side-by-side review。
- `image2-refinement` reserved state record、review lifecycle 与 freshness contract；HTML/local progress 不复用该 record。
- atomic promotion 到 version override asset、source selection binding、local recovery 与 idempotency。
- accepted/source asset、Image2 派生区内每页至多一个 recent-rejected 像素 + provenance、deterministic cleanup plan；不把 rejected 候选写进 `1_upstream_raw_material/`。
- create/edit playbooks、COMMANDS、BOOTSTRAP 的可选专业精修入口和首次 Image2 onboarding。

### 不包含

- 多 visual slots、整页 Image2、自动重试、未授权 scope expansion、PowerPoint 原生可编辑对象。

### 依赖与交付接口

- 依赖 Change 3 已交付的完整 HTML deck、compose interface、final-slide assembly 和默认 workflow。
- 归档后整个总计划完成；后续能力只能作为新的 plan/change 扩展。

### OpenSpec 落地包

| 包 | 内容 | 主要 spec 归属 |
|---|---|---|
| 4A Recommendation/authorization | HTML 交付后的 2-4 页建议、canonical plan、所有计费 attempt、style-reference contract freshness、setup 单列、exact-plan `image2 authorize` 与 version-scoped evidence | 新增 `visual-slot-refinement`；修改相关 playbook/`node-specification` |
| 4B Cost-safe generation | persisted random attempt IDs、setup-output dependency、generation fingerprint finalization、submit state machine、partial failure、`unknown-submit` 人工处置 | `visual-slot-refinement`；修改 `image-generation`、`cli-surface` |
| 4C Review artifacts | 独立 `image2_refinement` candidate manifest、output SHA、同 prompt 多结果、同 geometry/crop 的 comparison preview、逐页 review state | `visual-slot-refinement`；修改 `run-bundle-layout` |
| 4D Promotion/recovery | setup 与 accepted-candidate write-ahead journals、framework-reserved current style-reference binding、version asset 原子提升、source selection commit、use-html、幂等恢复、state evidence | `visual-slot-refinement`；修改 `visual-asset-management`、`content-parsing`、`node-specification` |
| 4E Closeout/UX | Image2 派生区内每页至多一个 recent-rejected 像素 + provenance、hash-bound cleanup、首次 Image2 onboarding、COMMANDS/BOOTSTRAP/playbooks；独立 legacy maintenance controller/reference | `visual-slot-refinement`；修改 `commands-reference`、`framework-charter`、`bootstrap-env-guidance` |

Image2 provider 是 true external dependency：remote transport 以注入 adapter 只置于显式 `image2` generation module 内部，测试使用 fake adapter，并通过 CLI receipt 验证 observable behavior。普通 `composeSlide/build` 和 HTML/local iteration 不持有这个 adapter；provider task schema 也不得泄漏成 Stage 4 或 slide source 的调用知识。

### 完成标准

- 未授权、stale plan、重复执行和扩大 scope 不产生额外 provider submit；`unknown-submit` 无可靠 provider evidence 时也不自动再提交。
- 相同 prompt/profile 的不同 SHA 候选共存；用户审核 preview 与 accept 使用相同 crop/geometry。
- 批次部分失败不影响成功页或 HTML 成品；重试使用新 attempt/plan/authorization。
- 用户拒绝建议或在 HTML 交付处结束时，不创建 Image2 plan/directory/authorization，也不留下 pending controller node；选择继续时启动独立 `image2-refine` execution。
- `ppt_flow image2 ...` 对 legacy deck fail closed，modern visual-slot controller 也不调用 legacy whole-page pilot/build；两个 Image2 模型有双向隔离测试。
- current style reference 可按 source provenance 零远端复用；style-reference contract stale 时新 setup 及成本进入 exact plan；asset broken 时 fail closed。setup 失败/未知时不提交依赖它的页面 attempts，setup 成功产物先成为 version source reference。
- setup/accept/use-html/重复 accept/cleanup/crash recovery 保持 source/asset/state 自洽；setup commit 前后崩溃均不重复 provider submit，也不靠目录顺序猜 current style reference。
- vNext 复制完整 `slide-specifications.md + overrides/` source/control delta并在 target 重判 selection/style-reference freshness；不继承未接受 candidates、scratch plans 或 Image2 authorization，新版本远端调用必须重新 plan/authorize。
- vNext publication 复制完整 source/control delta 后在 target 重新 resolve；不得靠隐式编辑 source 来删除 stale binding。`selected` 使用正式像素，`stale` 明确 fallback，`broken` 阻断 publication/build。
- cleanup 在 review evidence 缺失或 recent-rejected 顺序歧义时 fail closed，不猜测删除；人类明确选择后才可重新 plan。
- 删除 `_generated` 后 accepted visual asset 仍按原 SHA 逐字节复用，final slide 可在固定 runtime 下零远端重合成；每页至多一个 recent rejected 只在 Image2 派生区内按 cleanup 规则保留，删除整个 `_generated` 前明确提示其不可逐像素重生，不伪装成 upstream material。
- targeted tests、全量 `npm test`、专业精修 `tests_e2e` 和 OpenSpec strict validation 通过。

## 跨 Change Test Matrix

| 场景 | Ch1 | Ch2 | Ch3 | Ch4 |
|---|---:|---:|---:|---:|
| Node/Chromium/font readiness | owner | consume | E2E | consume |
| Structured body/family/overflow | - | owner | render | consume |
| 无 Image2 完整交付 | prerequisite | prerequisite | owner | preserve |
| Legacy Image2-first 兼容 | readiness | parser | owner | preserve |
| Stable ID/reorder/notes | - | fingerprint | owner | preserve |
| Workflow dirs/Phase/node enums | - | - | owner | preserve |
| Run-bundle HTML/Image2 artifact separation | - | asset contract | owner | owner |
| Playbook routing and legacy isolation | - | - | owner | owner |
| HTML-first gates/local refresh | - | contract | owner | preserve |
| Cost authorization/exactly-once | - | - | - | owner |
| Candidate review/promotion/cleanup | - | selection contract | composition prerequisite | owner |
| Selection applicability vs asset integrity | - | owner | enforce | promotion E2E |

## 五条端到端验收路径

这五条路径是跨文档一致性的最终反证，不是只测 CLI happy path。每条都必须同时检查用户叙事、playbook route、run-bundle 写入、state ownership、远端调用计数和最终交付物。

| 路径 | 用户可见流程 | 必须成立的系统事实 |
|---|---|---|
| Fresh HTML-only deck | init -> content/family/fallback -> HTML preview/visual gate -> build -> PPTX/notes -> 结束 | 无 Image2 key/style reference 也完成；不创建 Image2 lazy dirs、plan、authorization 或 pending node；Stage 4 只读 verified final-slide |
| Ordinary HTML/local edit | classifier -> Local Slide/Deck Rebuild 或 Notes-Only -> 更新交付物 | 不进入 Phase 4，不持有 provider adapter；selection 仍 current 时本地重合成，变 stale 时明确 fallback；asset broken 时阻断并给修复路径 |
| Structural vNext | preview/confirm -> hidden target publication -> target-local parse/resolve/build | source version 不变；target 复制 source/control delta但不复制 candidates/scratch/state authorization；selected/stale/broken 在 target 重判；全程零远端 |
| Modern Image2 refinement | HTML 已完成 -> 推荐 -> exact plan/authorize -> generate -> compare -> accept/use-html -> local recompose -> optional clean | 每个 submit 有授权 attempt；candidate 只在派生区；accept 才 promotion 到 overrides/source；逐页决定不影响其余 HTML 成品；普通 build 不感知 provider |
| Legacy maintenance/migration | pipeline marker 先分类 -> legacy maintenance，或用户选择 clean vNext migration -> HTML 对照 gate | legacy 与 modern Image2 双向 fail closed；maintenance 保留旧合同；migration 不猜 prompt、不继承旧 authorization，不满意可留旧版、另起 vNext 或新 deck |

验收还必须包含两条跨路径恢复：删除 `_generated/` 后 Fresh/accepted modern deck 均可零远端重建；进程在 Image2 `submitting` 或 promotion commit 前后崩溃时，恢复不得重复计费或产生 source 指向不存在 asset 的半提交。

## 每次归档后的最低可用状态

| 归档点 | 仓库必须真实可做什么 | 明确尚不可声称什么 |
|---|---|---|
| Change 1 | 固定 Node/browser/font runtime 可安装、可诊断；legacy 行为未回归 | 还不能从 slide source 渲染 HTML deck，也没有 Image2 visual-slot workflow |
| Change 2 | opt-in HTML-first source 可 parse/validate，family、fallback、selection resolution 和 merged catalog 可独立测试 | create-deck 默认仍未切换；没有 browser composition/PPTX complete path |
| Change 3 | fresh user 无 Image2 可完整交付；workflow/playbook/run-bundle/state 已迁入最终 ownership；legacy 有独立维护入口；Phase 4 只有 README-only unavailable stub 且不进入 active node index | Phase 4 visual-slot refinement 明确 unavailable，不能显示可点击/可执行的专业升级 |
| Change 4 | 付费 plan、generation、review、promotion、fallback、cleanup 与恢复完整闭环 | 不支持多 slot、整页 Image2、自动重试或未授权扩 scope |

任何 change 若只能靠后一个未归档 change 才通过其本行完成定义，就必须回到 proposal 重新切 scope，不能用 future task 掩盖不可用中间态。

## 全局风险与缓解

| 风险 | 缓解 |
|---|---|
| 结构化 body 过重 | v1 固定 10 个 families 和 typed blocks；用户不手写 |
| Ch3 跨 JS + MD 较大 | 它是唯一有意的垂直切片；以“无 Image2 完整交付”E2E 为单一完成线 |
| Image2 候选占磁盘 | 候选留在 version-owned `image2_refinement/`；accepted 提升为 source asset，rejected 由显式 cleanup plan 处理，不写入 upstream material |
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

`PPTMAKER_FRAMEWORK/` 的目录和逐文件迁移必须同时遵守 [`06-framework-directory-impact.md`](06-framework-directory-impact.md)。Change 3 的 workflow rename 必须原子更新 active cross-references 和 node schema，不能留下两套活跃方法论。
