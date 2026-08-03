# Plan: Page Authority 残余 Bug 收敛修复

> 类型: 已关闭设计 / 交付记录 | 状态: `CLS-019` 已完成 | 更新: 2026-08-04

## 结论

这 8 张 bug 卡不应产生 8 个 OpenSpec change。初始复核将它们按三条系统线收敛为
**最初 2 个** change；真实验收随后发现 `new-version` 无法把 clean Page Authority target
接入 authoring draft，因而新增了一个窄的 activation repair。随后真实 provider recovery
又暴露 successor attempt-chain 的错误拒绝，新增一个 implementation-only repair。随后又发现
已接受的 async task result 没有被 Page Authority adapter 消费；真实 v7 recovery 还揭示一条
历史双终态分叉。最后一次真实 provider 验收还确认：请求的 `2000x1125` 参数不等于返回 PNG
的尺寸，实际原生媒体契约为 `2048x1136`，因此新增一个窄的 native-media contract repair。
最终共 **7 个归档 change**，而不是按八张卡逐张拆分；
已合入的语义修复仍只做回归验收和卡片关闭。

本计划已完成：v7 Pure 的 25 页 raw、final 与 PPTX 均已交付并验收，8 张关联 bug 卡均已关闭，
当前没有 active OpenSpec change 或待执行 gate。下文保留的早期 checkpoint 仅作收敛过程证据，
不表示当前工作状态。

| 系统线 | 覆盖 bug | 处理方式 |
| --- | --- | --- |
| Source-to-provider 语义 | BUG-036、BUG-041、BUG-044 | 已由归档 change 实现；做端到端回归与 run-bundle 内容迁移，不新建 change |
| Provider I/O 边界 | BUG-037、BUG-042 | 新建 1 个 change |
| 页序的人类可见投影 | BUG-040、BUG-043、BUG-045 | 新建 1 个 change；BUG-043 作为既有 final 命名的回归项 |
| Clean target activation | 真实 run 验收前置 | 验收中发现；新建 1 个窄 change，已完成并归档 |
| Successor attempt recovery | 真实 provider recovery | 验收中发现；新建 1 个 implementation-only change，已完成并归档 |
| Async provider result resolution | 真实 provider recovery | Change 5 已完成真实 v7 recovery、delivery 与主规格同步，并归档为 `2026-08-04-resolve-async-page-authority-provider-results` |
| Divergent terminal attempt recovery | 真实 provider recovery | Change 6 已完成严格 owner projection、真实 v7 recovery、delivery 与主规格同步，并归档为 `2026-08-04-recover-divergent-page-authority-terminal-attempts` |
| Native provider-media contract | 真实 provider recovery | Change 7 已完成主规格同步、真实 v7 byte/media/visual 验收，并归档为 `2026-08-04-align-page-authority-native-media-contract` |

最终保持为三个主要系统边界和一个窄 recovery repair，同时避免按八张卡逐张开 change。

## 计数口径

- **3 条工作线**：语义、provider I/O、页序投影。
- **7 个 OpenSpec change**：原计划的 Change 1、Change 2，以及验收中发现的 Change 3、
  implementation-only Change 4；随后三个 repair 分别处理 async provider-result、历史双终态
  分叉与 native provider-media contract。七个 change 均已完成真实 v7 验收、主规格同步并归档。
- **1 条非 change 的语义收尾线**：已由两个归档 change 实现，只需回归验收和指定
  run bundle 的内容迁移。

不建议为了凑数量重开语义线：它当前没有新的 framework 行为契约。Change 3 不是重复
语义线，而是实际 new-version 验收揭示的可达性缺口；Change 4 则恢复已接受的 submitted
attempt reconciliation 契约，不新增 capability 或 durable schema。Change 5 只修复一次已授权
submit 内的 async result 读取，并在 direct `generate` 的远端边界完成 dotenv 凭据预检；它不增加
新的远端授权或 durable task state。Change 6 只在同一
direct-record evaluator 内投影一个已验证的冗余终态 pair，不增加 CLI、重试、lookup、迁移或
durable repair state。Change 7 不增加 provider 探测、fallback 或迁移；它只把已证实的
HTTP 请求参数与原生 PNG 响应尺寸分离为一个共享媒体契约。

## 背景 / 现状

近期的两个归档 change 已经吸收了一部分最初的问题：

- `fix-provider-clauses-and-visual-scene` 已把每页场景输入建模为显式的
  `VISUAL SCENE`，并把受 guard 的场景与 provider clauses 放入 Pure / Framed
  raw contract。
- `pure-text-delivery-and-nn-production-naming` 已让 Pure raw contract 携带
  `display` 和 `BODY`，并让 final manifest 使用 `NN_slideID.png`。

因此 BUG-036 不应以“把自由 CONCEPT prose 直接塞给 provider”的方式修。正确的
输入是由内容作者将 `Content structure` / `MUST communicate` 中真正要画的部分提炼为
`VISUAL SCENE`；这属于指定 run bundle 的内容迁移，不属于 framework change。

BUG-041、BUG-043、BUG-044 的 framework 行为已在真实 v7 run 上通过文字、文件命名和图文比例
验收并关闭；失败时才会回到对应归档 change 的回归测试定位，而不是另开重复 change。

provider 请求的可诊断投影、provider 返回图像的早期介质校验、PPTX 页码，以及 raw 等
人类浏览产物的页序命名一致性均已由 Change 1 / Change 2 完成。v7 Style Master 已接受。
2026-08-03 的实测确认所选 Image2 route 会在 submit `task_id` 后轮询任务结果；原 Page Authority
adapter 曾将该异步回执误归为“空图片”。随后归档的 Change 5 修复异步结果读取与 dotenv
credential preflight，Change 6 以受控 owner projection 恢复历史双终态分叉，Change 7 将
`2000x1125` transport request 与 `2048x1136` native PNG response 分离为共享媒体契约。
三项修复均已通过真实 v7 25 页 recovery、delivery 和视觉验收并归档。

## Bug 去向

| Bug | 当前判断 | 最终归属 |
| --- | --- | --- |
| BUG-036 | `VISUAL SCENE` 语义输入已在真实 v7 25 页 provider / delivery 验收 | 已关闭；语义回归线，无新增 change |
| BUG-037 | `2000x1125` request 与 `2048x1136` native response 已分离；真实 v7 无 resize 验收 | 已关闭；Change 7 已归档 |
| BUG-040 | 真实 v7 PPTX 的 25 个 ordinal footer 已交付并验收 | 已关闭；Change 2 已归档 |
| BUG-041 | Pure display、BODY 与 scene 文字通道已在真实 v7 visual review 验收 | 已关闭；语义回归线 |
| BUG-042 | 25-item secret-safe provider request inspection projection 已在真实 v7 验收 | 已关闭；Change 1 已归档 |
| BUG-043 | 真实 v7 final 25/25 均使用 `NN_slideID.png` | 已关闭；Change 2 回归项 |
| BUG-044 | Pure BODY 通道和图文比例已在真实 v7 visual review 验收 | 已关闭；语义回归线 |
| BUG-045 | 真实 v7 raw / final 25/25 均使用统一 `NN_slideID.png` 命名 | 已关闭；Change 2 已归档 |

在关闭 bug 卡前，已完成不含远端调用的 fixture 回归，并对 BUG-036、BUG-041、BUG-044 完成
经授权的真实 run 验收。未将任何 `deck_*` 当作 framework fixture，也未通过 change 自动迁移。

## Change 1: `harden-page-authority-provider-boundary`

**目的：** 把“发给 provider 什么”与“provider 返回的 bytes 能否成为 raw 事实”收束到同一
确定性边界，覆盖 BUG-037 和 BUG-042。

**建议 capability：** `image-generation` 为主，`cli-surface` 仅定义显式诊断入口的
输出与保密边界。控制 owner 是 JS；MD / 人类只决定是否查看投影和是否授权新的 provider
提交。对 run bundle 的影响是 `compatible`：新增可重建诊断投影，错误 provider 输出将更早
停止，不手改既有 `_generated/`。

### 必须交付

1. 在计划编译时产生一个可重建、与 `provider_request_sha256` 绑定的本地请求检查投影。
   它只含本次真正要提交的请求文本与非 secret 元数据，绝不含 API key、Authorization header、
   provider response body 或环境变量。
2. 为人类提供显式、按当前 plan / slide 精确寻址的检查路径；默认 JSON、stderr 和失败回执
   只给 digest、相对路径和下一步，不把 raw prompt/prose 无意打印到终端。该选择必须遵守
   `cli-surface` 的 secret-safe diagnostic 规则。
3. 在 selected adapter/provider-result 边界解码返回 PNG，并在任何 raw materialization、
   provenance 或 `succeeded` 状态之前验证精确 `2000x1125` 尺寸。
4. 非 PNG、空 bytes 或错误尺寸必须成为有界的 `known_failure`：记录可诊断的期望/实际介质
   事实，且不留下被接受的 raw bytes、raw digest 或 final 候选。不得静默 resize；resize 会把
   provider 返回的错误事实伪装成合格原件。

### 验收与测试

- Pure 与 Framed 共用该入站校验；合法的 `2000x1125` PNG 保持当前成功路径。
- 错误高度、错误宽度、损坏 PNG、空 bytes 分别都在 materialize 前停止，并允许现有重试 /
  授权模型按 `known_failure` 继续。
- 请求检查投影与实际提交 request 的 canonical digest 一致；正常 CLI 回执不泄露 prompt。
- 回归锁住语义契约：Pure request 含 display、body、scene 及工作流适配的 clauses；Framed
  保持本地 Text Frame 与无字 underlay。这样 BUG-036、BUG-041、BUG-044 不会被后续 I/O
  修复重新打穿。

### 非目标

- 不探测或承诺某个第三方 provider 一定遵守 `size` 参数；这是单独授权的 live probe。
- 不为错误尺寸添加自动缩放 fallback。
- 不把 prompt 作为常规 CLI error diagnostic 的一部分。

## Change 2: `unify-page-ordinal-projections`

**目的：** 让当前快照的 `position` 只在面向人类的文件名和 PPTX 页脚中投影，覆盖
BUG-040 与 BUG-045，并持续保护 BUG-043 已实现的 final 命名。

**建议 capability：** `image-generation`（raw / pilot 浏览投影）、`image-production`
（final manifest）、`pptx-assembly`（页脚）与 `slide-identity-and-ordering`（身份不变量）。
控制 owner 是 JS。对 run bundle 的影响是 `compatible`：重跑对应生成 / delivery 即获得新路径和
新 PPTX；不迁移或手改旧 `_generated/` 文件。

### 必须交付

1. 定义唯一的 `position + slide_id -> NN_slideID.png` 投影规则，至少两位补零，超过 99 页时
   自然扩展。所有人类浏览的逐页图片输出都复用它：final、raw 及 pilot / review 的逐页导出。
2. 明确区分人类浏览投影与证据存储：canonical receipt、CAS、attempt、provenance 和 raw
   contract 继续以稳定 `slide_id` / digest 寻址，绝不能把 `NN_` 写进逻辑身份或 raw contract。
3. 让 final manifest、其校验器和实际 delivery writer 使用同一命名规则；清理或对齐仍期待
   `${slide_id}.png` 的旧装配路径，避免日后回归为两套 schema。
4. PPTX assembly 在每页整图上方增加小型右下页脚，显示当前 `NN` position。默认开启；若保留
   deck 级关闭开关，必须只有一个受验证的配置点，且不影响 `slide_id`、raw evidence 或图片内容。

### 验收与测试

- `01_DeckGo.png`、`10_...png`、`100_...png` 的命名和 manifest 一致，所有声明的输出文件都存在。
- 仅重排页面时，`slide_id` 和语义 raw inputs 不变；文件名前缀与 PPTX 页脚随新的 `position`
  改变，且不会触发 provider 重新生成。
- 交付出的 PPTX 含每页对应页脚文本；用 XML 断言与渲染 / 视觉检查共同覆盖位置和可读性。
- 针对当前 final `NN_slideID` 行为保留回归测试，防止 BUG-045 的修复把 BUG-043 重新引入。

### 非目标

- 不将文件名前缀当作跨版本 ID，也不重命名 source heading 中的 formal ID。
- 不要求迁移已交付 run bundle；派生输出按现有重建路径更新即可。

## Change 3: `activate-clean-page-authority-versions`

**目的：** 让 `new-version` 创建的 clean Page Authority target 立即成为其已选 workflow
的 `create-deck` authoring draft，而不继承 source 的 production 或 paid-work lineage。

**验收中发现与完成：** 2026-08-03 在 `deck_ai_sdlc_keynote` 从 v5 创建 v7 时发现，旧路径
会让 target 在 provider-free validation 前卡在 `MODE_MISSING`。该 change 已覆盖 active / inactive
source、target lineage conflict 和 public CLI routing；主规格已同步，并归档为
`openspec/changes/archive/2026-08-03-activate-clean-page-authority-versions/`。

## Change 4: `fix-successor-provider-attempt-chain`

**目的：** 让 terminal predecessor 与合法 successor 的同一 slide/raw-contract tuple 共存时，
raw owner 将最新 batch 的 current attempt 用于进度投影，并继续只暴露 exact reconciliation。

**验收中发现与完成：** 2026-08-03，v7 generation 2 的 `InfoRev` submitted attempt 曾被错误
诊断为 `progressive_raw_attempt_chain_invalid`，而不是其唯一合法的 reconcile action。修复保留
batch-local attempt identity、全局 live-claim 互斥和 immutable history；回归覆盖 terminal unknown
predecessor、successor transport interruption 与 read-only workflow inspection。focused raw-owner
20/20、workflow inspection 8/8、`npm test`、strict validation 和 diff check 均通过，且 change
已归档为 `openspec/changes/archive/2026-08-03-fix-successor-provider-attempt-chain/`。

## Change 5: `resolve-async-page-authority-provider-results`（已归档）

**目的：** 让 Page Authority 在已经授权的一次 provider submit 中识别稳定 `task_id`，以同一
credential / base URL 有界轮询任务结果，并把完成任务中嵌套的 `bytes_base64` 交回当时生效的
selected Image2 ingress validator。同时只在 direct `image2 generate` 的远端边界加载 deck-root / cwd dotenv
的缺失项、预先解析同一个 credential pair；缺凭据必须在 raw owner 创建 claim 或 submitted
attempt 前停止。它不创建第二次 submit、后台 worker、持久 task ID、自动 failover 或 `.env` 写入。

**完成与归档：** `PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs` 已支持同步回执直通、
`pending -> completed` 异步结果、终态 task failure、poll HTTP failure 与 transport
interruption/timeout 的既有 known/unknown 语义；`page_authority_progressive_raw_owner.mjs` 只向
CLI 投影固定、secret-safe 的终态分类。该 async 部分的 adapter 单测、异步 CLI 正向/负向进程测试、
`npm test`、`openspec validate ... --strict` 与 `git diff --check` 已通过。2026-08-03 新发现的
dotenv preflight 已实现：direct `generate` 在 owner mutation 前按 deck-root、cwd 顺序加载缺失环境项，
解析一个 credential pair 并交给 submit/poll；新的 direct-process 回归证明 cwd dotenv 可成功生成，
缺凭据时零 attempt、零 HTTP。随后完成真实 v7 recovery 与 delivery；focused / direct CLI 回归、
`npm test`、strict validation 和 diff check 均通过，主规格已同步并归档为
`2026-08-04-resolve-async-page-authority-provider-results`。

**边界：** 该 change 不重写任何过去的 immutable attempt。历史双终态分叉已由独立的
Change 6 处理，native PNG 契约由独立的 Change 7 处理；不能借 Change 5 或手改 `_generated/`
绕过。

## Change 6: `recover-divergent-page-authority-terminal-attempts`（已归档）

**目的：** 仅在 direct-record evaluator 中接受一个严格的历史形态：同一 `submitted` 父节点
恰有 childless `known_failure` 与 `unknown` 两个终态子节点。两个 immutable record 均保留，
但只将 `known_failure` 派生为有效终态；其它分叉仍为 integrity hard-stop。

**完成与归档：** `validateAttemptState` 先验证所有直接 transition，再只对该精确 sibling
pair 构造有效链。focused raw-owner / workflow-inspection 31/31、`npm test`、strict OpenSpec
validation 和 `git diff --check` 均通过。v7 的历史 `TwinChn` pair 已被 read-time projection
恢复；没有任何 record rewrite、手改 `_generated/` 或额外 repair CLI。其后续 v7 recovery 已在
Change 7 的 profile-rebuild boundary 下完成，主规格已同步并归档为
`2026-08-04-recover-divergent-page-authority-terminal-attempts`。

## Change 7: `align-page-authority-native-media-contract`（已归档）

**目的：** 将历史上成功的 HTTP `size: "2000x1125"` 请求参数与 provider 实际返回的
`2048x1136` 原生 PNG 分开建模。Pure final 必须逐字节保留已接受的原生 raw；Framed 保留其
现有本地 `2000x1125` composition output。任何空、损坏或其它尺寸的 provider PNG 仍在
materialization 前成为 bounded `known_failure`，绝不 resize、crop 或 transcode。

**完成与归档：** v5 的两套完整 raw batch 与 25 张 final 都是 `2048x1136`，且其 provider
inspection 记录的 transport 请求仍为 `gpt-image-2` / `2000x1125`。2026-08-03 的 v7 `NewPart`
真实调用返回相同的 native PNG，并因旧错误契约成为
`known_failure`（attempt `466ae9ef1d7adfa394aa162a8a99471403fe1363b526974fb883f1460d5b15e6`）；
没有 raw materialization 或 bytes mutation。Change 7 已完成共享公开媒体契约、adapter / raw-owner /
Framed / Pure / delivery / bounded CURRENT assembly 的实现与回归；它把 transport request、native raw
和 workflow-final media 分开，并让 delivery 通过该契约而不是自行判断 workflow。2026-08-03 验证为：
focused suites、process diagnostics 12/12、non-process sweep 362/362、`npm test`、本 Change 和
Change 5/6 的 strict validation、`git diff --check` 均通过。旧 g9 scope 未被复用；owner 已按新
profile 重编译 v7 plan，完成 Pilot、25/25 generate、review 和 delivery。主规格已同步并归档为
`2026-08-04-align-page-authority-native-media-contract`。

## 逐步 To-do（按真实次序）

以下清单记录实际执行顺序，现为 10/10 完成。早期 checkpoint 文字用于说明当时的决策依据；
本文件顶部的关闭结论和第 10 步的收尾记录才是最终状态。

1. [x] **建立 baseline（非 change）**：运行与 Page Authority 相关的无远端 fixture 回归，
   记录 BUG-036/041/043/044 的当前契约结果；不修改 `_generated/`，不提交 provider 请求。
2. [x] **完成语义线验收（非 change）**：在用户指定的
   `deck_ai_sdlc_keynote/3_versions/v7` 中，官方 `validate` 通过 25 页；结构化
   source receipt 显示 `BODY` 25/25、`VISUAL SCENE` 25/25，且所有 slide ID 唯一。逐页
   人工语义复核确认 scene 承载各页的结构或隐喻，Pure 所需正文也已存在。这是 source-side
   readiness，不替代 provider 真实出图验收。
3. [x] **创建 Change 1 proposal**：以 `harden-page-authority-provider-boundary` 运行
   `openspec-propose`，生成 proposal、delta specs、design、tasks；先确认请求检查投影的
   secret-safe CLI 边界和错误 PNG 的 known-failure 语义。
4. [x] **实施并验证 Change 1**：完成 provider request 检查投影与入站 PNG 尺寸/格式校验；
   用 Pure、Framed、损坏 PNG、错误尺寸和正常 PNG 的测试覆盖其边界。
   验证于 2026-08-02：focused Page Authority 套件 53/53、直接 CLI 套件 7/7、`npm test`、
   `openspec validate harden-page-authority-provider-boundary --strict` 与 `git diff --check` 均通过。
5. [x] **归档 Change 1**：执行相关测试与 OpenSpec validation；通过后 archive，并把
   BUG-037、BUG-042 改为“待真实 run 验收”或关闭，取决于结果。
   2026-08-02：delta specs 已同步至 `image-generation` / `cli-surface` 主规格，Change 1
   已归档为 `2026-08-02-harden-page-authority-provider-boundary`；两张卡均待指定真实 run 验收。
6. [x] **创建 Change 2 proposal**：以 `unify-page-ordinal-projections` 运行
   `openspec-propose`，明确 `position` 的展示投影、内部 stable-ID 不变量、文件命名和 PPTX
   页脚规则。2026-08-02：proposal、3 份 delta specs、design 与 tasks 已创建，strict validation
   已通过。
7. [x] **实施并验证 Change 2**：统一人类浏览的 raw / pilot / final 命名，给 PPTX 增加页脚；
   覆盖 1、10、100 页，以及仅重排页面时不重新生成 provider raw 的场景。
   2026-08-02：focused artifact/raw-owner/Pure/Framed/delivery/process tests 与 `npm test`
   通过；PPTX XML 断言通过。`soffice` / `libreoffice` 不可用，视觉 renderer 验收保留给
   指定真实 run。
8. [x] **归档 Change 2**：执行相关测试、PPTX XML 断言和可读性检查；通过后 archive，并将
   BUG-040、BUG-045 关闭或标成待真实 run 验收，同时确认 BUG-043 未回归。
   2026-08-03：delta specs 已同步至 `image-generation`、`pptx-assembly` 与
   `slide-identity-and-ordering` 主规格，Change 2 已归档为
   `openspec/changes/archive/2026-08-03-unify-page-ordinal-projections/`；BUG-040、
   BUG-043 与 BUG-045 均待指定真实 run 验收。PPTX XML 断言通过；本机无
   `soffice` / `libreoffice`，视觉渲染验收保留给第 9 步。
9. [x] **真实 run 验收（非 change，需授权）**：对指定 run bundle 执行正确的 Generated Image
   Rebuild / delivery 重建；先完成 v7 Style Master plan / human selection，再以显式 provider
   authorization 生成、review、delivery。人类确认画面文字、场景表达、文件顺序和页脚。绝不手改
   `_generated/`，也不因验收而修改 framework 外的未指定 deck。
   2026-08-03 已完成无远端前置：v7 `validate` 和 `bundle_layout --check` 通过，source receipt
   为 25/25 非空 `BODY`、25/25 非空 `VISUAL SCENE`、25 个唯一 slide ID；Style Master 的零生成
   本地候选 plan `4907a3fd5150911d14bf15a7c2632a98b07c0d50f525733cd7e78b21448c15c6` 已接受为
   `local-existing`。其后异步 provider 协议已被实测并由随后归档的 Change 5 修复，不再把“收到
   task ID”误判为 provider 空媒体。

   **历史真实 checkpoint（2026-08-03）：** full plan 为
   `6dde499ec00d517943ef79266c9c6baafbf25a0e7fb126dfc1e2e867349c24ce`。为 `InfoRev`、`NewPart`、
   `TwinChn` 创建的 generation 8 batch
   `a50b86242385bc06c344a93f7a302ac400fd8a4a24d8de0473bc2991f8df5fd4` 及 grant
   `a4cae78f05b9bf6513bc8fd71ae19b5b0ec6b676368ea6d8e09248a1108314b2` 已 terminal。其三次 CLI
   generation 都先持久化了 submitted record，随后因 process 环境未加载 `.env` 而在本地 credential
   resolution 失败，并只能通过 exact reconcile 终结为 `unknown`；这些记录**不证明有 provider
   POST**，没有 raw materialization、重复 submit 或手改 attempt。

   generation 9 的 successor batch
   `05ec247ea394458bb564f862b18d7b8dcfcf55539a6a2dc7fa6719918c1a2313` 与 grant
   `c6a081b584197b3098658d9719040268cb65bfe921adcd5ba82628765ab15fbb` 已为同一三页建立。其
   `InfoRev` item 也因相同的 local credential gap exact-reconcile 为 `unknown`，同样没有远端
   POST。该 batch / grant 保留为 immutable evidence，不再作为下一步输入。native-media contract
   改变随后产生新的 profile digest；Change 7 的验证、owner replan 和后续 delivery 均已完成。

   **真实 provider 结果（2026-08-03）：** repaired g9 `NewPart` 的一次 `generate` 已实际到达
   provider 并收到 PNG；返回介质为 `2048x1136`，而 current raw contract 要求精确
   `2000x1125`。现有 Change 1 ingress validator 因而正确 terminalize 为 `known_failure`
   （attempt `466ae9ef1d7adfa394aa162a8a99471403fe1363b526974fb883f1460d5b15e6`），没有 raw
   materialization 或隐式 resize。这证明 dotenv / async transport 已通，也证明旧 ingress 的
   response-size 假设错误；因此创建了随后归档的 Change 7，而没有继续消耗 g9 的剩余 provider
   调用。Change 7 保留相同 HTTP 请求参数、接受已证实的原生 `2048x1136` PNG，并已完成 owner
   replan、25/25 生成、review 和 delivery。

   更早的 generation 3 `TwinChn` submitted attempt
   `1ed94629bf6ee2ef4b54912477b36776c6954f5e9f48715f6290b5981ee3d917` 有
   `known_failure` child `0dcb84e7d439b326ec04cb87a8b24f47b01af5618381569acd76051c8e966f5f` 与
   `unknown` child `ce940aadce08f3d4a56120f2881b74dc2f5fa4ab6704269ad1f7846d8b589e2b`。Change 6
   已严格将它投影为 `known_failure`，同时保留两个 immutable terminal records。当时没有 live
   attempt；owner 随后为这三个 formal ID 派生新的 successor Pilot scope 与新 grant，并完成了
   已授权 provider submit。

   **native-media recovery update（2026-08-03）：** Change 7 的 fresh Pure plan
   `a905c2ffd916b25f308ed6764c43eecdbbdda568cd14f7374e4154c6a15a0f5a` 已经完成新的
   Pilot、扩展 scope 和 25/25 native raw materialization，`known_failure` 与 `unknown` 均为 0。
   四张高密度 raw 页已在 `2048x1136` 原始分辨率通过视觉检查；owner 已以 `proceed` 接受
   complete review receipt
   `d7853817fb86d0c7e7c721f1ea1e67911d337894bcedffe96b63877fccb08464`，accepted raw evidence
   为 `c0bd7393e4c70f061cff3916bcebb10862eb96b44ae225f6532c19eca27d206e`。随后官方 `build`
   完成 Pure `publish_target_final_manifest` 和 delivery，未发生新的 provider authorization 或远端请求。

   **完成证据（2026-08-03）：** 官方 `build` 已生成 25 项 Pure final manifest 与 25 页 notes，
   delivery receipt 的 canonical final-manifest digest 为
   `511cb363a9f61d88d273176bb3dd9910d1bea00759140c147793c6cd8557ae87`，receipt 文件 digest 为
   `e6efe103d1efa8aff95c9967a22c559b19e51e55148d70205460ccda37694de8`。交付 PPTX 为
   `_generated/page_authority_image2/final/deck.pptx`，SHA-256 为
   `4bdc605caa94d4a682ff3318c55d741294c1bc8f1eeebcd9962d313dc8edf375`。逐项验证证明 25/25
   Pure final PNG 与其 accepted raw PNG 字节相同、PPTX 内的 25/25 media 与 final 顺序及哈希
   相同；ZIP integrity、run-bundle layout 均通过。最终 25 页 contact sheet 实际审阅没有空白、
   裁切、页序错位或明显失真。因此第 9 步完成。
10. [x] **簿记、归档与版本收尾（非 change）**：仅在第 2、9 步的真实 run 验收全部通过后执行：
    先记录八张卡的最终状态与仍存在的根因，再以 `git mv` 将 BUG-036、BUG-037、BUG-040、
    BUG-041、BUG-042、BUG-043、BUG-044、BUG-045 移入 `_backlog/_done/_fixed_bugs/`，并同步
    `_backlog/bugs/README.md`、`_backlog/_done/_fixed_bugs/README.md` 与
    `_backlog/_done/README.md` 的活跃列表、编号和计数；随后以 `git mv` 将本文件移入
    `_backlog/_done/_closed_plans/page-authority-production-repair.md`，分配归档当日的下一个
    `CLS-NNN`，并同步 `_backlog/plans/README.md`、`_backlog/_done/_closed_plans/README.md` 与
    `_backlog/_done/README.md`。最后按 `project-versioning` 决定版本更新是否需要人类确认。
    在真实 run 验收前不得移动任何待验收卡或本 plan。

    2026-08-04：七个 OpenSpec change 已完成主规格同步并全部归档；BUG-036、BUG-037、
    BUG-040、BUG-041、BUG-042、BUG-043、BUG-044、BUG-045 已写入真实 v7 closure evidence
    后移入 `_fixed_bugs/`，相关 active/fixed/done indexes 已同步。本文随后移入
    `_closed_plans/` 并分配 `CLS-019`。native provider-media contract 是向后不兼容的行为
    契约变更，按 `project-versioning` 规则执行 MINOR bump：`0.23.2` -> `0.24.0`，已同步
    `VERSION`、`VERSION_LOG.md`、`PPTMAKER_FRAMEWORK/README.md`、`package.json` 与
    `package-lock.json`。

第 3、6 步分别创建 Change 1、Change 2；验收中新发现的 Change 3 与 Change 4 已完成并归档。
Change 5、Change 6 与 Change 7 均已完成框架实现、真实 v7 closure、主规格同步和归档。第 10 步
也已完成，因此无待恢复 run、无未完成 gate、无 active change；本计划仅保留完整的执行顺序和验收事实。

## v7 收敛过程记录（历史）

native-media repair 后的 zero-remote owner replan 已生成 Pure plan
`a905c2ffd916b25f308ed6764c43eecdbbdda568cd14f7374e4154c6a15a0f5a`。它包含 25 个
`unsubmitted` item，`maximum_submissions` 为 25，本地 request-inspection projection 为
`a2550f077deb2e572cd07288ba059c8faf4af4771cdd91d739d83cd1143009a3`。该计划替换旧
`6dde...` profile scope，但没有重写任何 plan、batch、grant、attempt、receipt 或 generated
artifact；旧 g9 scope 继续只是 immutable evidence。

owner 已基于该计划建立新的 Pilot batch
`271616afcb1b9889ec251d02b75cc49c75f5dd5c4f41e63c702082db9792f9b2`，范围为
`InfoRev`、`NewPart`、`TwinChn`，最大 3 次提交；它不是旧 g9 batch 的复用。owner 已创建新 grant
`e70588fb8f7ba6ddc94f1da087f3add32ac08e6faed8f31eab1ebb6aef7f2ccd`，严格绑定上述 plan +
batch。当时唯一 owner action 是 `generate_progressive_raw_item`，每次最多提交一个 eligible item。
第一个真实 item `InfoRev` 已成功 materialize（attempt
`8c16f6a6bba311810db68014f0bab190bd110f70c46abcbed99e05eafaa6bd62`，provenance
`247dfedcb3248677d2ed7244959941e7effd4362ab50a7ca2438fbf83e450880`）；当时进度为
2/25 materialized，`known_failure` 与 `unknown` 均为 0。`NewPart`（此前因旧尺寸假设被拒的
真实 provider case）也已在新契约下成功 materialize（attempt
`748fce19da19b2e686fdd82be60c2b6e30b5d1052484f3d6417ea0d0c435984b`，provenance
`8e12043b91c7ddb7ab30b3210d253d0ad405d13af04f0b51881d188f96876ff9`）。相关 change task
文件当时已同步到这一状态，后续均已归档。`TwinChn` 也已成功 materialize（attempt
`77ef17704c9805e3f460e06d86146f7d94bd85ce38deb475b0283eadbca3abbe`，provenance
`ec54496f2678b64d41da91aad3dac4bf5fa3814045c6da69bef92001b2875439`），完成新的三页 Pilot；
当时进度为 3/25 materialized，`known_failure` 与 `unknown` 均为 0。历史双终态 records 保持不变。
Pilot review evidence `9635c5e0032eb8fd85a9eb2f8bd348ad881a20d5b2cd32b5a49430df6c56fd34` 已生成，
对 owner-published 的 `01_InfoRev`、`05_NewPart`、`17_TwinChn` PNG 已完成实际视觉检查：画布完整、
中文 display text 可读、diagram/detail 结构完整，无 crop 或 blank-media defect，且与 warm-editorial
视觉系统一致。Pilot 已以 `proceed` 接受（decision
`8f0556716cea04adbbc0e045de095aae83f2ae97aa6e360f875cd22e0a7f795e`）；当时 owner action 是
`plan_progressive_expansion`。owner 随后已派生唯一 expansion batch
`8b17d792f3d9d1762b0f4f594a77847d23e660941d4d230fb5bee78a7f6c5ef2`，含剩余 22 页、最大 22 次
提交；其新 grant 为
`702b355374da8412789ee2ae3941d2d93ce060f70f417b81e13abb71df98bf15`。全量 generation 已完成：
25/25 materialized（expansion 22/22），`known_failure` 与 `unknown` 均为 0。raw review
preparation evidence 为
`f426bd07295b6763ac8fe1d86c5eda7dc7db28abf67166ae5bed0c158b160a69`。随后已通过 owner
`accept` 以 `proceed` 正式接受：complete review receipt 为
`d7853817fb86d0c7e7c721f1ea1e67911d337894bcedffe96b63877fccb08464`，accepted raw evidence
为 `c0bd7393e4c70f061cff3916bcebb10862eb96b44ae225f6532c19eca27d206e`。随后 Pure workflow
完成 `publish_target_final_manifest`、delivery 和 archive。

在执行该 accept 前，已以原始分辨率实际审阅最密集的 `03_WhyCode`、`19_FourLyr`、
`21_MaerAI` 与 `23_MeasNot` PNG。四页均为完整 `2048x1136` 画布，正文、图表和边缘
均可读且未见裁切、空白或明显失真；视觉审阅结论为可接受，并已由上述 owner receipt 正式
接受；Markdown 只记录这一事实，不能替代 receipt。

官方 `build` 随后已成功完成 Pure finalization 与 delivery assembly，输出为
`_generated/page_authority_image2/final/deck.pptx`。delivery receipt 的 canonical final-manifest
digest 为 `511cb363a9f61d88d273176bb3dd9910d1bea00759140c147793c6cd8557ae87`，PPTX SHA-256 为
`4bdc605caa94d4a682ff3318c55d741294c1bc8f1eeebcd9962d313dc8edf375`。25/25 Pure final 与 raw
字节一致，PPTX 25/25 embedded media 与 final 按序哈希一致，25 页 notes、ZIP integrity 与
run-bundle layout 均已验证；final contact sheet 的 25 页均无空白、裁切、页序错位或明显失真。
真实 run 验收及第 10 步的归档、簿记和版本收尾均已完成。

### Expansion Generation Ledger

| Item | Outcome | Attempt | Materialization provenance |
| --- | --- | --- | --- |
| `TriYear` | `succeeded` | `626382e1b7c0504d8c178088a1c9d68a88ba1a8d8a4b3275787f9ea1f6670610` | `7e53bd3679946319224142ac5cd6f783067ca4f5227668394311843c606eea8f` |
| `WhyCode` | `succeeded` | `3674bcc995bfa91924f8fe566d9e67435203719d68bfbf128e86928f87fd1aad` | `33b0865d71aefa6879f725947825cfbe5f988caec79c780e91410191fe29e4df` |
| `OneTool` | `succeeded` | `280e1ab3668365e0417ac3634c3f988e2c440119b27cb3e97d7269958c5f1605` | `02075e97f589e0152eda532f3c26e8df2e2955b84b7820a751663a1e76ed395b` |
| `OldMap` | `succeeded` | `93a42732ed9ad7ea4c13988405a114ee2036aa19d7bc9fe9255ff3ec392ab600` | `ce67b50ab2081f42d56b36888fb9835d09f70375651810a6b73e0c25ea05972e` |
| `DeerVal` | `succeeded` | `dc6f8eab36aedc442145805a41d698e70845627adab138fc6eec6f507b46fe5d` | `6f56c0c10545f6e4aeef3ea38385c8e277d8c92d96b015f389f96b14c4c92591` |
| `BeckFow` | `succeeded` | `bd2f29158f4afcbafe84a58c33b90697a184d225ac491da2c2ce5ed45a76e827` | `745a57d98342748e0504fed3f2475f7075be2d4ee88e88655e8d2b3d569d6cc3` |
| `FabFive` | `succeeded` | `a482142d9660008258268a0aa598660998eb8f04c8d0e4e28bcd409bdbac5583` | `4d2d6e533bc4eab72ba21c1e67dc010d1d5b3ce0f2ed16cd34e36c5a4b399772` |
| `InfoProc` | `succeeded` | `9b522e58c1ad63c6df47cef9f00b353e6f931137df7853bc3134896f434183cf` | `51e6b4d3938da8182f7225fe7180428ad9e08aee47afff474759e90fc75baa15` |
| `RevGap` | `succeeded` | `eb06401a1747fb7df3c01d089ee8dd0e947efbfca65593c54d0af3aea3a3a549` | `38a40a9587646ff534aaf086374bff57caffdc1aa51ff48f0234020188690517` |
| `OnLoop` | `succeeded` | `50b7e22332d88d134628e5e603637efc712bae2490720ff54bfac0421e4eb5ef` | `6c0e3d2da81e60d2bd02f0abac4d06ff9a47b9bc767fa071849901cc5811e9aa` |
| `RiskMid` | `succeeded` | `90ca8e57434182bdf7d1508e8224a282cd3c885ace8293377a7cac10cce53488` | `b9e24b4ba2b249e719824d6cf56be07a095ad964c3b657eef42ca81d94474c3c` |
| `BlocRes` | `succeeded` | `6bb19240d1c1cbddda4e390c63ef378973b3b36119cdf634e0216caedf2553b2` | `9498c228124a47aec645505bde06c9b32120a99b40c80074265a58f0b0bb53fd` |
| `ClouDia` | `succeeded` | `5ec74856c4d6766d358292477b8340e1d92de426fcb93cd7673fd27b8427f571` | `c8839d39cefe965fe1e8393c94399eadf5d05bb4d2b9d942cfcb88ff09080222` |
| `ToBPM` | `succeeded` | `86f0bdfdb2e5bd515bf9f7f2513a6f19ac0f4cea4f3bc0bcbf5b8fb5ce2aeab3` | `69b821bafa97e889d4465dd14e55e6085015fe118c0cbdb0c5d01e8e4c80cf67` |
| `FramAut` | `succeeded` | `1abd1e3f58e27e202b5924d676cad0546cbccacc964062581e3aba08c54acba1` | `0b16519703993b019d9e3e95998a8166e6709e491c8314f797b21abc5b3b842d` |
| `FourLyr` | `succeeded` | `0c55c286ab1527f86cde597aca95a8e0f7e40ee51d70ed3f8356a7d9790d4fe0` | `1e3ce229efaabe24ace6f9f0ddafad0561779ef7c79561ea966478f53de55a31` |
| `AllNem` | `succeeded` | `adf516d592397668fd94e2ed2223a1b014504a8efa25afe906e46b6d8566c0d0` | `3992a8fcc2a49f35b4474148b2c462d8e98d4f06011ad57cabe751d60ca87129` |
| `MaerAI` | `succeeded` | `bbb9ae9667061d6d701e559e7ae47933f1226e6feea43e39d2b5ea3b76bc0b60` | `aa1908d1d2729b88dfabe6ebbd1b6ab3affc61f82a0ddabad7f11c744f04052f` |
| `RomPyr` | `succeeded` | `d106561a5bb360ea3d4d15a1ea33597adad06ed345a485799cb2bc68e7d07ef2` | `53f8955e034e8a72322ad9b6ae08ce5e6fde9280ae07dac30472449714ea4e1f` |
| `MeasNot` | `succeeded` | `ca560e2ea043deed1a9d305ba4cf364c54f0861dc74549e7adcb4bf4395751c7` | `c161bea898d25ecb082ab43d128437a435a8227202fd516e90f8eb7e802b7e98` |
| `TwoRiv` | `succeeded` | `c0817862ee387ee75722700a77cf6f8ecd470696519cd8a75a8b60bda517b970` | `50d724787c0b4c12bf22aaff1fbbe72d51864bde757d3dcace7be9b2fd0a287e` |
| `YourMov` | `succeeded` | `b6f890bd4403de638723c0c546bac698e8968ecc5913c56d3666b2b540b890b7` | `0e40bc61b2e94fdc66264a5208b7da3259f46a0d083f80772b9d74621e12e78e` |

## 风险 / 取舍

- [Prompt 可见性与泄露冲突] → 把完整请求限制在用户显式读取的本地可重建投影；默认 CLI
  诊断只输出安全索引，不输出 raw prose 或凭据。
- [把第三方尺寸偏差“修好”] → 已证实的 `2048x1136` native PNG 按共享契约接受；其它尺寸、
  损坏或空媒体仍在边界 hard-stop 为 known failure，绝不自动 resize。
- [页序污染稳定身份] → 只在派生展示层计算 `NN`，所有 lineage、授权与 raw contract 继续基于
  `slide_id` 和 digest。
- [一次性扩展所有文件] → 只统一人类浏览的按页 image projection；不触碰内部 CAS / attempt
  路径，避免为了美观扩大迁移面。

## 落地关联

本文件是 backlog 中的分析 / 设计记录，不是 active OpenSpec change。已实施并归档的 change 为：

1. `harden-page-authority-provider-boundary`
2. `unify-page-ordinal-projections`
3. `activate-clean-page-authority-versions`
4. `fix-successor-provider-attempt-chain`
5. `2026-08-04-align-page-authority-native-media-contract`
6. `2026-08-04-resolve-async-page-authority-provider-results`
7. `2026-08-04-recover-divergent-page-authority-terminal-attempts`

当前没有 active OpenSpec change；七个 change 均已归档。

已归档的 `fix-provider-clauses-and-visual-scene` 与
`pure-text-delivery-and-nn-production-naming` 是语义线的历史依据和回归基线，不应重新开启。
