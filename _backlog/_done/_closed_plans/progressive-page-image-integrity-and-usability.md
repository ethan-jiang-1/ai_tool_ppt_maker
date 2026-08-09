# Plan: Progressive Page Image Integrity and Usability Repair

> 类型: 已关闭设计 / 交付记录 | 状态: 已完成（CLS-023） | 更新: 2026-08-09
> Changes 0–12 均已归档。真实 Pure `v1` 已完成 successor Pilot、Complete Page Review、finalization、PPTX/notes delivery，并已记录人类 delivery `proceed` 决策。

## 当前进度（2026-08-09）

### 最终状态

- [x] **Successor Pilot**：`DkfGo` 的 replacement Pilot scope 已获独立成本授权并完成；`DkfGo`、`TwoMet`、`PlatGo`
  全部为 current `materialized` evidence，未发生重复提交或超出授权的 provider request。
- [x] **Complete Page Review 与 finalization**：三页 current raw review 已接受；Pure final manifest、delivery media、PPTX
  与 speaker-notes receipt 已由 owner 发布，短 Human Navigation Path 已重建。
- [x] **交付办结**：人类对当前 final projection、PPTX 与 notes receipt 的 `proceed` 已通过 MD Controller
  `review-target-page-image-delivery` 记录。`ppt_flow state` 的 workflow inspection 为 `complete`，唯一结果为
  `complete-target-delivery`，无后续人类 action。
- [x] **最终核验**：`ppt_flow state --validate-state` 与 run-bundle `--check` 均通过。后续内容、视觉、notes 或结构请求
  必须从当前 owner 的 `classify-change` / Structural Versioning Path 重新开始，不复用本次授权或证据。

### 历史过程记录（已办结，非当前状态）

- [x] **工程与协议修复**：Changes 0–7 均已完成、验证、main-spec sync、archive；Change 7
  `restore-repair-raw-rebuild-routing` 已归档至
  `openspec/changes/archive/2026-08-09-restore-repair-raw-rebuild-routing/`。
- [x] **三页当前 Pure Pilot**：`DkfGo`、`TwoMet`、`PlatGo` 的 Style Master 选择、成本授权、raw materialization 与
  current-review locator 均已完成；未生成 final media、PPTX 或 delivery。
- [x] **Human Complete Page Review**：已对三张 provider pages / contact sheet 作出 `repair` 决定；既有 immutable
  decision record 已写入，final media、PPTX 和 delivery 仍不可用。
- [x] **repair routing**：owner 现在以 relation-aware selector 排除已被 `repair` 决定引用的 prepared review；
  当前唯一恢复动作是 `rebuild_progressive_raw_work`，历史 decision handoff 仅供审计。
- [x] **运行时复核**：2026-08-09 对真实 `v1` 执行只读 status/state 检查，确认 owner 当前只给出
  `rebuild_progressive_raw_work`；`complete_raw_review_sha256`、accepted evidence、final media、PPTX 与 delivery
  均不可用，三张既有 raw pages 仅保留为历史审计记录。
- [x] **视觉修订意图**：Agent 已对历史 Complete Page Review 作出 source-only 复盘；保留所有 claim、标题、stable ID
  与 speaker note，收紧 shared visual-language 为“大尺度简洁形式、无标记大表面、避免密集 control-room interface”，并从
  `TwoMet` / `PlatGo` 移除会放大密度的 `connected-nodes` motif。source literals 仍只由 Pure provider contract 绑定。
- [x] **恢复缺口已定位**：该 source-only edit 正确使旧 Style Master selection stale；raw-plan 因而先要求新的
  Style Master，但 `style-master inspect/plan` 又把同一 stale source/state binding 拒绝，形成无 provider、无 state
  mutation 的自引用阻塞。
- [x] **Change 8 / stale Style Master recovery（实施、验证、归档与提交完成）**：`recover-stale-style-master-scope` 已通过两轮
  planning-only polish 和 `APPLY` 后完成实现。它只允许从当前 validated candidate 发布 provider-free replacement Style
  Master plan；不发布 source epoch/raw plan、不复用旧 grant/selection、不生成 provider work；canonical
  `style_master.jpg` 仅可按既有 local-existing 规则重新快照，不能继承历史 authority。作为 `guide`，`style-master
  inspect/plan` 成功返回/执行 owner recovery，不把正常恢复误投影为 CLI failure；仅现有 evaluator 明确给出的 source
  identity/receipt drift 可进入该路，其他 state、workflow、lineage 或不确定性失败仍是 hard-stop。聚焦 Style Master、
  Pure、Framed、CLI suites 与 protected `npm test` 均通过；change/all-spec strict 和 diff check 均通过，未发生 provider
  或生产 deck mutation。main specs 已同步，change 已归档至
  `openspec/changes/archive/2026-08-09-recover-stale-style-master-scope/`。额外 opt-in CLI audit 为既存基线红灯：其 registry 引用了缺失的
  `tests/shared/run-bundle/test_page_image_layout.mjs`（27/28），与本 change 无关。
- [x] **BUG-057 runtime successor plan、授权与生成**：真实 Pure `v1` 已通过 Change 8 的 owner recovery 发布 Style Master
  generation 2 plan：一个重新验证的 local-existing candidate 与两个 generated slots。人类随后对该 exact plan 作出独立授权，
  owner grant 严格限制为 `candidate-001`、`candidate-002` 的两次提交；两次均成功并有 owner-validated PNG candidate
  bytes。中间一次只读 inspection 曾看到 `candidate-002: submitted`，随后 owner 重查自行完成；没有重试、追加提交、raw/source
  epoch 或 Page Image evidence mutation。
- [x] **授权前 handoff 缺口已定位**：该 successor plan 的 `image2 artifact-view` 错将 stale predecessor selection
  当作 current raw authority，返回 `style_master_selection_stale` internal diagnostic，而非现有授权 gate 所需的候选 view；
  未写入 state 或调用 provider。
- [x] **Change 9 / successor artifact view（实施、验证、归档与提交完成）**：
  `expose-style-master-successor-artifact-view` 已覆盖 `style-master-generation`、`image-generation` 和 `cli-surface`，
  并归档至 `openspec/changes/archive/2026-08-09-expose-style-master-successor-artifact-view/`、提交为 `e7365cc`。
  它只从 current successor plan 投影 owner-verified candidate locator；无可验证媒体的 generated slot 仅按
  owner-established lifecycle state 显示 unavailable，并在 raw owner 前结束 view。仅 pending-successor view 返回既有
  owner-issued `next_action`；不会使 stale predecessor selection、raw/final/delivery history 复活，也不会创建 state 或
  授权。按本次 archive 决策，其 delta specs 未同步至 main specs。
- [x] **真实 successor artifact view 已重建**：已对 `deck_dark_factory_current/3_versions/v1/` 成功执行
  provider-free `image2 artifact-view`。view 现在暴露三个待接受的 owner-verified Style Master candidates：local-existing
  `s-e5dc5294`、`candidate-001` `s-26a6f1f8` 与 `candidate-002` `s-97f3acb7`；provider input、raw/review、final 与
  delivery 仍不可用。owner 返回的唯一下一动作是 `review_style_master_candidates`。
- [x] **Change 10 / short physical human artifact paths（实施、验证、main-spec sync、归档与提交完成）**：`image2 artifact-view`
  现在将 owner-validated current artifacts 复制到 `_generated/nav/art/`，并将唯一 human entry 发布为
  `_generated/nav/index.md`。所有该树内的目录/文件 components 为 1–24 个安全 ASCII 字符；index 只给相对短
  physical locators，不给 source filename、canonical locator 或完整 SHA。旧 reference leaf 只会在新 nav tree
  成功替换后 best-effort 删除。实现采用 confined regular copy + staged root replacement；不改 immutable owner、
  不使用 symlink/hardlink，也不让 navigation path 成为 selector、state、evidence 或授权。用户已明确授权 APPLY；
  focused suites、protected `npm test`、change/all-spec strict 和 diff check 均通过，且没有 provider request 或生产
  deck mutation。五份 main specs 已同步，change 已归档至
  `openspec/changes/archive/2026-08-09-introduce-short-physical-human-artifact-paths/`，提交为 `d8b9389`。历史 run 不会被
  自动访问；它们只在下一次显式 `artifact-view` 时迁移这个可重建派生 surface。
- [x] **Release 版本决策**：人类已确认 Change 10 的 `0.25.1 → 0.26.0` MINOR；`VERSION`、`VERSION_LOG.md`、
  Harness README、`package.json` 与 lockfile 已同步更新。
- [x] **Change 11 / pending successor artifact view（实施、验证、main-spec sync、归档与提交完成）**：
  `fix-pending-successor-artifact-view` 已归档至
  `openspec/changes/archive/2026-08-09-fix-pending-successor-artifact-view/`，并提交为 `006ec59`。
  owner 以 predecessor identity 而非 style-intent/context/profile hash divergence 投影 matching-binding pending
  successor；exact promotion 回到 ordinary accepted-selection path，其他 selection mismatch 仍保留
  `style_master_selection_conflict`。不访问生产 deck、不写入 state、也不调用 provider。
- [x] **Style Master acceptance 与 current raw plan**：人类已作出 `proceed(candidate-001)`，owner 已接受该 current
  successor 并重建 compatibility Style Master JPEG。Agent 随后 provider-free 发布 source epoch 2 的 current raw plan：
  `DkfGo`、`TwoMet`、`PlatGo`，最多三次提交，三页均为 unsubmitted；没有 provider 请求或新授权。
- [x] **短导航已刷新为 current raw scope**：`_generated/nav/index.md` 与 `nav/art/` 现在给出已接受
  `candidate-001`、current raw work plan 与 provider-input inspection 的短 physical locators。
- [x] **三页 Pilot scope 与独立授权**：人类选择 `DkfGo`、`TwoMet`、`PlatGo`；owner 发布 exact Pilot batch，
  人类授权最多三次 `image2 / gpt-image-2 / PNG 2000x1125` raw 提交。该授权不包括 retry、replacement batch、final 或 delivery。
- [x] **三次既有 submission 已核对**：`DkfGo` 的原始 provider outcome 经 reconciliation 终态为 `unknown`，不得重试；
  `TwoMet` 的 exact attempt 同时保留 `succeeded` 与 `unknown` terminal siblings，已作为有效 materialization 继续；
  `PlatGo` 随后以既有第三次 exact submission materialize。没有 retry、第四次 provider request 或 grant 扩展。
- [x] **Change 12 / progressive raw terminal conflict repair（实施、验证、main-spec sync 与归档完成）**：
  `repair-progressive-raw-terminal-conflict` 只接受同一 submitted parent 下 childless、tuple-identical 且已通过既有
  provenance/raw-byte 验证的 `succeeded` + `unknown` pair；`succeeded` 是 effective terminal，`unknown` 保持 immutable audit
  history。对该 effective parent 的 reconcile 不 lookup、不追加 terminal record，也不写 grant/provenance/provider state。
  其他 sibling shape、descendant、identity/provenance/media 失效仍 hard-stop；公开 CLI 只返回 bounded
  `internal/report_internal`，不再谎称存在可执行的 `rebuild_progressive_raw_work`。owner 28/28、公开 CLI process、
  protected `npm test`、change/all-spec strict 与 diff check 已通过。两份 delta 已同步至 main specs，change 已归档至
  `openspec/changes/archive/2026-08-09-repair-progressive-raw-terminal-conflict/`；Harness 维护本身未调用 provider 或修改 deck。
- [x] **真实 owner 续跑确认与既有 grant 完成**：显式 provider-free `image2 plan` 确认 `PlatGo` 是既有 grant 下唯一
  eligible item；Agent 仅提交该一项。后续 owner inspection 将 `PlatGo` 与 `TwoMet` 证实为 materialized、`DkfGo` 保持
  unknown，短 `artifact-view` 已重建。没有 retry、第四次提交、grant 扩展、final 或 delivery。
- [x] **新的 successor Pilot scope / 人类确认**：人类已确认 `DkfGo` replacement Pilot scope，并在精确成本披露后
  独立授权一次提交。owner 完成 materialization、current Complete Page Review、finalization 与 delivery；旧 grant 与历史
  review 始终只保留审计用途。

**现存长路径（legacy audit-only；Harness 已不再将它作为 human entry）：**
`deck_dark_factory_current/3_versions/v1/_generated/page_image_workflow/reference/human-artifact-reference-v1.md`

该 legacy view 仅作历史审计。当前 short `nav/` tree 已在 delivery evidence 发布后重建；它仍然只是 read target，不能
充当 selector、authorization、state 或 evidence。

Change 1、2、3 均已完成实现、受保护基线验证、main-spec sync 和 OpenSpec archive。Change 3 归档于
`openspec/changes/archive/2026-08-08-add-human-artifact-reference-view/`；其完整覆盖的 BUG-056、063 已移至
`_done/_fixed_bugs/`。BUG-062 的产品边界已收敛为“机器 JSON 保持不变、Agent 不原样转述成功回执”；
Change 5 `add-human-cli-handoff-guidance` 已实现、验证、main-spec sync 和归档。它在 Charter 中将每个
successful direct Harness CLI 的人类转述收敛为 Purpose / Outcome / Next human action；current Page Image
额外使用现有 provider-free `image2 artifact-view` 的 stable IDs、typed display refs、read-only locators 和
bounded unavailable facts。普通 CLI success JSON、完整 SHA 参数、selector grammar 与运行时协议均保持不变；
BUG-062 已移至 `_done/_fixed_bugs/`。

Change 4 `bind-pure-deck-visual-system` 已完成 provider-free implementation/validation。它以
`visual-config`、`image-generation` 和 `run-bundle-layout` 三个 capability 定义并落实 version-level
Pure visual-system source/binding：新 bundle 获得闭合、可 version override 的
`pure-deck-visual-system.yaml`；Pure Core、raw contract、compiled provider input、ordinary/progressive raw plan 和
inspection 绑定同一 `deck_visual_system: { sha256, projection }`，而 common binding 的
`deck_visual_system_sha256` 为 Pure 必填、Framed 严格为 `null`。Style Master 保持已选色彩/参考 authority；编辑
Pure token 只产生既有的 raw rebuild debt，不生成或重选 Style Master candidate，不改变 source receipt 的
`slide-specifications.md` byte hash，也不写入 State 或历史 evidence。旧 Pure receipt fixture 已修复，
`tests/04-pure-image/test_pure_workflow.mjs` 为 14/14 通过。新增/相关 focused tests、protected `npm test`、
`git diff --check`、change strict 与 all-spec strict 已通过；未执行 provider-backed E2E 或 Pilot。

这些结果证明输入绑定和失效边界，不证明 provider 输出像素已经遵守该系统。三张页面已经完成既有成本授权和
Complete Page Review，且人类已作出 `repair` 决定；旧 raw bytes 和 decision 保持审计可用，但不再是 current
evidence。因此正式输出、PPTX 与 delivery 继续不可用，直到完成下一次受控 raw rebuild 和同一人类 review。

为避免把历史 `page-authority-image2-v2` source/state 伪装成 current protocol，已保留
`deck_dark_factory/` 的 v1--v3 原始 bytes，并新建
`deck_dark_factory_current/3_versions/v1/` 作为干净的 `page-image-workflow-v1` Pure target。它只重写
BUG-057 Pilot 所需的三页作者输入：`DkfGo`（editorial narrative）、`TwoMet`（metric/data-led）和
`PlatGo`（process/relationship-led）；三页共享一个 Pure visual-system binding，而 motif/relationship
selection 各不相同。`ppt_flow validate` 已通过 3 页 source receipt validation；Style Master、三页 raw provider
pages 和 Complete Page Review 已准备完成。新 target 的 content/visual gates 已明确批准，仍不继承旧 deck 的历史
approval；final images、PPTX 和 delivery 尚未生成。

## 执行看板（2026-08-09）

- [x] **Change 0**：归档 `add-jpeg-delivery-media`。
- [x] **Change 1 / BUG-059、BUG-060**：完成 raster projection integrity 修复、验证、main-spec sync 与归档。
- [x] **Change 2 / BUG-055**：完成有界 provider response-shape diagnostics、验证、main-spec sync 与归档。
- [x] **Change 3 / BUG-056、BUG-063**：完成 human artifact reference view、验证、main-spec sync 与归档。
- [x] **Change 4 / BUG-057（provider-free 部分）**：完成 Pure deck visual-system binding、验证、main-spec sync 与归档。
- [x] **Release**：确认并完成 `0.24.4 → 0.25.0` MINOR bump。
- [x] **Release**：确认并完成 `0.25.0 → 0.25.1` PATCH bump，记录 BUG-062 的 human-success-handoff 修复。
- [x] **BUG-057 current Pure target**：建立 `deck_dark_factory_current/3_versions/v1/`；保留 legacy
  `deck_dark_factory/` 不变，不复制其 state、receipts 或 `_generated/`。
- [x] **BUG-057 Pilot source**：以 current Pure source 重写 `DkfGo`、`TwoMet`、`PlatGo` 三页，写入共同的
  deck visual system 和闭合 visual-language registry；`ppt_flow validate` 通过 3 页。
- [x] **BUG-057 人类 source gates**：已确认该三页内容与 Pure visual-system source，且已记录新 target 的
  `content_gate` / `visual_gate: approved`；尚未产生 provider 请求。
- [x] **BUG-057 Style Master provider-free plan**：补齐 canonical `style-master-prompt.md` 后，owner 已为
  Pure `v1` 发布两个 generated slots（`candidate-001`、`candidate-002`）；profile 为
  `image2 / gpt-image-2 / PNG 2000x1125 / style-master-no-readable-text-v1`，最多两次提交。
- [x] **BUG-057 Style Master cost authorization**：人已对上述两个 slots 授权；owner grant 已限制为恰好两次
  提交，且两次额度均已消耗。
- [x] **BUG-057 Style Master candidate generation**：两个授权 submission 均已完成；`candidate-001` 与
  `candidate-002` 都有 owner-validated PNG candidate bytes。此前的 submitted 状态在 owner 重查时自行完成，
  因而 abandonment 不适用，也没有额外提交或重试。
- [x] **BUG-057 Style Master visual-direction decision**：人已在 owner review 的两个真实候选中选择
  `proceed(candidate-001)`；selection 已接受并投影为 compatibility JPEG。该候选为 narrative、metric 与
  process 三类 Pure 页面保留更稳定的标题区和更可复用的构图语法。
- [x] **BUG-057 three-page raw Pilot scope**：owner 已绑定 accepted Style Master、当前 Pure source 和三个 stable
  IDs：`DkfGo`、`TwoMet`、`PlatGo`。scope 是完整的三页 representative Pilot，最多三次新的 page-image
  提交；尚未授权、提交或产生页面像素。
- [x] **BUG-057 人类 raw Pilot authorization**：已对上述三个 exact page-image slots 明确授权成本范围；该授权独立于
  已耗尽的两次 Style Master 候选授权。
- [x] **BUG-057 three-page raw generation**：`DkfGo`、`TwoMet`、`PlatGo` 均已由 owner materialize；三次
  page-image submissions 均在授权 scope 内完成，Complete Page Review 已准备，未产生 final media、PPTX 或 delivery。
- [x] **BUG-057 current review locator availability**：`human-artifact-reference-v1.md` 已从 owner-validated
  undecided Complete Page Review 重建，按 full-plan 顺序列出三页 current provider page 和 contact sheet 的
  owner-issued locator；未使 final media 或 delivery 可用。
- [x] **Change 6 / current review locators proposal**：已创建 `expose-current-page-review-artifacts`，以 owner-validated
  undecided review 为唯一 display source，明确排除 repair 后的历史 prepared record；proposal、delta spec、design 与
  tasks 完整，经过两轮 planning-only polish，change/all-spec strict 与 scoped `git diff --check` 均通过。
- [x] **Change 6 / apply / validate / sync / archive**：已实现 raw-owner current-review reader、Pure/Framed
  presentation inspectors 和 provider-free artifact-view projection；focused owner/renderer/CLI、Pure workflow、
  protected `npm test`、strict checks 和 diff check 均已通过。main `image-generation` spec 已同步，change 已归档至
  `openspec/changes/archive/2026-08-08-expose-current-page-review-artifacts/`；真实 deck view 已重建，无 provider
  request、raw-evidence 变更、acceptance、final 或 delivery。
- [x] **BUG-062 产品探索**：确认普通 CLI JSON/精确 SHA 是 machine contract；`artifact-view` 是现有的人类检查面，但不会自动阻止 Agent 原样转述成功 JSON。
- [x] **BUG-062 proposal**：已创建 `add-human-cli-handoff-guidance`，包含 proposal、`harness-charter` delta spec、design 与 tasks。
- [x] **BUG-062 polish**：两轮 planning-only 审查、change/all-spec strict、diff check 与 `npm test` 均通过；随后取得人类 `APPLY` 授权。
- [x] **BUG-062 apply / validate / sync / archive**：Charter/test 已实现；focused handoff 5/5、protected `npm test`、change/all-spec strict 与 diff check 均通过；main `harness-charter` spec 已同步并归档 change。没有 provider 工作、CLI schema、state/receipt/immutable-record 或 production run-bundle 改动。
- [x] **Change 7 / apply / validate / sync / archive**：已统一 raw owner 的 relation-aware current-review selector，
  repair 后不再重放或二次决定历史 prepared evidence，且只返回 `rebuild_progressive_raw_work`；focused
  raw-owner test、protected `npm test`、strict checks 与 diff check 均通过。main `image-generation` spec 已同步，
  change 已归档至 `openspec/changes/archive/2026-08-09-restore-repair-raw-rebuild-routing/`，并提交为 `e2a74d6`；
  没有 provider 调用或 deck state/evidence 变更。
- [x] **BUG-057 repair-route runtime verification**：在真实
  `deck_dark_factory_current/3_versions/v1/` 上只读确认 `rebuild_progressive_raw_work` 是唯一 primary action；
  repair handoff 为 audit-only，且不存在 current review、accepted raw evidence、final manifest 或 delivery。
- [x] **BUG-057 source-only visual repair runtime check**：在真实 `v1` 上确认当前 source candidate 可验证，旧
  Style Master binding 由于 visual-language drift 变 stale；`image2 plan` 在 `target_style_master_stale` 前停止，
  `style-master inspect/plan` 均在 `style_master_scope_stale` 失败，且这些失败未写 state、raw record、grant、attempt
  或 provider request。
- [x] **Change 8 / stale Style Master recovery**：`recover-stale-style-master-scope` 已覆盖
  `style-master-generation`、`image-generation`、`cli-surface`，两轮 planning-only polish 后获 `APPLY` 并完成代码与
  回归验证。第一轮收紧 local-existing media 的重新快照/provenance 边界，第二轮限定显式 source identity/receipt drift
  且修正 CLI guide success 语义；聚焦 suites、protected `npm test`、change/all-spec strict 与 diff check 均通过。未执行
  provider-backed E2E 或 Pilot，也未写入真实 deck；main specs 已同步，change 已归档至
  `openspec/changes/archive/2026-08-09-recover-stale-style-master-scope/`，已提交。

## 办结结论（2026-08-09）

本计划的 Harness 修复、OpenSpec sync/archive、successor Pilot、current Complete Page Review、finalization 与 delivery
均已完成。`DkfGo` 的旧 `unknown` audit sibling 经过 successor scope 解决，当前三页均 materialized；当前 evidence 已接受并
投影为 PPTX、notes 和 delivery media。所有 active OpenSpec changes 已清空。本计划没有待办或待批复事项。

### BUG-057 三页 Pure Pilot（Deck production track）

- [x] **Agent（已获建立授权）**：建立 current `deck_dark_factory_current/3_versions/v1/`，并保留 legacy
  deck bytes 不变。
- [x] **Agent（已获简化范围授权）**：重写三个代表页：`DkfGo`、`TwoMet`、`PlatGo`；三页绑定同一
  Pure visual system，并有不同 motif/relationship selection。
- [x] **Human**：已确认新 target 的三页内容和 Pure visual-system source，并记录 content/visual gates；
  该确认不等于 provider 成本授权或 Complete Page Review。
- [x] **Agent**：已完成 owner 允许的 provider-free preparation，并发布 exact Style Master scope：
  `candidate-001`、`candidate-002`，Pure `v1`，`image2 / gpt-image-2 / PNG 2000x1125 /
  style-master-no-readable-text-v1`，最多两次提交。原始三页的 exact scope 必须在 Style Master selection 后由
  owner 另行生成。
- [x] **Human**：已明确授权当前两个 Style Master slots 的 exact provider 成本范围；其后仍须对另行披露的三页
  raw Pilot scope 做独立授权。
- [x] **Human**：已在完成 owner review 的候选中选择 `proceed(candidate-001)`；accepted Style Master 现可从
  current artifact view 定位。
- [x] **Agent**：已记录 visual-direction decision，并发布 `DkfGo`、`TwoMet`、`PlatGo` 的完整 representative
  Pilot scope；三页 raw work plan 与 provider-input inspection 均可从 current artifact view 定位。
- [x] **Human**：已明确授权当前三个 exact page-image Pilot slots 的 provider 成本范围；此授权独立于已耗尽的
  Style Master 候选授权。
- [x] **Agent**：已生成三张完整 Pure 页面并准备 owner Complete Page Review；未创建本地 header overlay、第二份
  页面证据或新 gate。
- [x] **Agent**：已提出、polish 并完成 `expose-current-page-review-artifacts`；raw owner 的 undecided-review binding
  恢复 current-review display surface，并排除 `repair` 后的历史 prepared evidence。
- [x] **Human**：已对该 change 给出 `APPLY` 授权；实施、验证、spec sync 和 archive 均不包含 provider 调用、页面重跑
  或交付。
- [x] **Agent**：已重建 current artifact view；三页 owner-issued complete-page evidence locator 已可供既有 review 使用。
- [x] **Human**：已从 current artifact view 检查三页 provider page / contact sheet，并作出 `repair` 决定；该决定不等于
  raw acceptance、final/delivery 授权或新的 provider 成本授权。
- [x] **Agent**：Change 7 `restore-repair-raw-rebuild-routing` 已实施、验证、main-spec sync 并归档至
  `openspec/changes/archive/2026-08-09-restore-repair-raw-rebuild-routing/`，并提交为 `e2a74d6`；该修复不修改
  deck evidence、不做 provider 调用。
- [x] **Agent**：已在真实 `v1` 上只读确认 routing 修复生效，当前 action 为
  `rebuild_progressive_raw_work`；历史 repair handoff 不会重新使 review/current evidence 可用。
- [x] **Agent**：已把 historical visual repair 转为 source-only 修订：shared registry 约束为大尺度简洁形式与无标记
  表面，`TwoMet` / `PlatGo` 移除高密度 motif；不改事实性 copy、stable IDs 或 speaker notes。
- [x] **Agent**：已复现并界定 source-only edit 后的无 provider recovery gap：raw owner 正确拒绝 stale Style Master，
  但 Style Master scope 又错误要求同一份 stale source/state；所有失败只读且未改变 deck evidence。
- [x] **Agent**：Change 8 `recover-stale-style-master-scope` 已完成两轮 polish、用户 `APPLY` 后的实施与验证；它让
  current validated candidate 进入现有 immutable Style Master successor lifecycle，不增加 state、不继承旧 selection/grant，
  且在新 selection 前不允许 raw rebuild。所有目标回归、protected baseline、strict validation 和 diff check 均已通过；
  无 provider 或真实 deck mutation；main specs 已同步，change 已归档至
  `openspec/changes/archive/2026-08-09-recover-stale-style-master-scope/`，已提交。
- [x] **Agent**：Change 9 `expose-style-master-successor-artifact-view` 已完成实施、验证、archive 与提交 `e7365cc`；
  它使 pending successor 可作为 provider-free human view 重建，且不同步其 delta specs 至 main specs。
- [x] **Human**：已对 generation 2 successor plan 的 `candidate-001`、`candidate-002` 明确授权；grant 最多允许两次
  Style Master 提交，不包含 raw page work。
- [x] **Agent**：已在该 exact grant 内提交并完成两个 Style Master candidates；owner 复核确认两张均为 succeeded、没有额外
  提交或 retry。
- [x] **Agent**：已对真实 `v1` 重建 owner-issued successor artifact view；它显示待接受的 local-existing `s-e5dc5294`、
  `candidate-001` `s-26a6f1f8`、`candidate-002` `s-97f3acb7`，并返回 `review_style_master_candidates`。
- [x] **Agent**：Change 11 `fix-pending-successor-artifact-view` 已完成实施、验证、main-spec sync、归档至
  `openspec/changes/archive/2026-08-09-fix-pending-successor-artifact-view/` 并提交为 `006ec59`；matching-binding
  pending successor 不再因 hash divergence 被拒绝，exact promotion 保持 ordinary path。未访问生产 deck，未发起 provider
  request，也未写入 state。
- [x] **Agent**：已对 exact `v1` 执行 provider-free `image2 artifact-view`，重建短 Human Navigation Path：
  `_generated/nav/index.md` 与 `nav/art/`。current owner view 只给出 local-existing `s-47d12ea5` 与
  `candidate-001` `s-9edcea6a`；未调用 provider、不创建或消费授权、不改变 owner/state/evidence。
- [x] **Human / Agent**：人类已明确 `proceed(candidate-001)`；owner 已接受 current successor，并由 Agent provider-free
  发布 source epoch 2 的 `DkfGo`、`TwoMet`、`PlatGo` 三页 raw plan。三页均 unsubmitted，最多三次提交；短导航已重建为
  accepted Style Master、current raw work plan 与 provider-input inspection。
- [x] **Human / Agent**：人类已选择全部三页 representative Pilot，并授权最多三次 exact raw submission；Agent 已发布
  batch scope、记录 grant，按 owner 逐页提交。没有 retry 或第 4 次提交。
- [x] **Agent**：DkfGo reconciliation 的 terminal outcome 为 `unknown`；TwoMet 产生 `succeeded` 与 `unknown` terminal
  sibling 分叉，随后由 Change 12 验证为 effective success；PlatGo 已在既有第三次 exact submission 内 materialize。
- [x] **Human / Agent**：已授权并完成 Change 12 `repair-progressive-raw-terminal-conflict` 的窄范围 Harness / OpenSpec
  repair；它不重试、手改 state、修改历史证据、创建 replacement scope 或 delivery。owner/CLI regressions、protected
  baseline、strict validation 与 diff check 均通过；两份 delta 已 main-spec sync，change 已归档至
  `openspec/changes/archive/2026-08-09-repair-progressive-raw-terminal-conflict/`。
- [x] **Agent**：以 provider-free `image2 plan` 读取 current `v1` owner action，并在既有 grant 中只提交 `PlatGo`；
  owner 现确认 `TwoMet`、`PlatGo` materialized，`DkfGo` unknown，短 artifact-view 已重建。未发生 retry、grant 扩展、
  final 或 delivery。
- [x] **Human / Agent**：人类确认并授权 `DkfGo` successor Pilot replacement scope；owner 完成其 materialization，
  随后完成三页 current Complete Page Review、finalization、delivery 与 controller-recorded final `proceed`。本计划无剩余
  provider debt、待批复 action 或交付 gate。

Change 3 已完成：main specs 已同步并归档至
`openspec/changes/archive/2026-08-08-add-human-artifact-reference-view/`。Change 4 已完成：main specs 已同步并归档至
`openspec/changes/archive/2026-08-08-bind-pure-deck-visual-system/`。两者均不再是 active implementation work。

## 背景 / 现状

本计划吸收 BUG-055、056、057、059、060、062、063 的分诊结论。它们不应按卡片逐个修补，
而应按四个稳定责任面收敛：

| 责任面 | 对应 bug | 当前缺口 |
| --- | --- | --- |
| Raster projection integrity | 059、060 | 已完成：共享 projector 已覆盖所有审计到的 derived canvas seam；16-bit/RGB provider PNG 和 Chromium RGB screenshot 不再被错误当作 8-bit RGBA。 |
| Provider diagnosis | 055 | 已完成：完整读取的非 JSON 响应在既有 `invalid_json` fact 中以闭集 shape 区分 empty、HTML-like 与 other，不泄露 provider 数据或改变成本控制。 |
| Human artifact navigation | 056、062、063 + D3 supersession | Change 3 的 logical reference view 与 BUG-062 的成功交接规则均已完成；Change 10 已将人类实际导航、复制和使用 artifact 收敛为短的物理目录/文件路径，完整 SHA-256 只保留为 owner 内部的 canonical identity。历史 run 仅在下一次显式 `artifact-view` 时迁移。 |
| Pure deck visual system | 057 | 已完成 provider-free binding：Pure 每页共享闭合 deck-level typography、colour-use、zones、whitespace 和 layout-family projection；尚待真实三页 Pilot 的人类像素验收。 |

`add-jpeg-delivery-media` 已于 2026-08-08 完成 main-spec sync 并 archive。其 delivery contact
projection 仍是 raster-to-canvas 调用点，因而纳入 Change 1；不再有两个 active change 重叠拥有 delivery
行为。

另外，`tests/04-pure-image/test_pure_workflow.mjs` 的 pre-replacement receipt fixture 已在 Change 4 中修复：
它现有 ordered `position` 且不再携带 retired per-slide `workflow`，focused suite 为 14/14 通过。该修复是
视觉系统实现前的绿色基线，不改变 provider/lifecycle ownership。

## 目标架构

```text
exact provider/screenshot PNG bytes
              |
              | immutable evidence stays unchanged
              v
      shared decoded-PNG projector
  validates depth/channels/byte count
  normalizes only derived pixels to RGBA8
              |
     +--------+---------+----------+
     |                  |          |
Style Master JPEG   Framed crop   review/delivery projections

owner records (full SHA-256, canonical internal identity)
              |
              v
owner-materialized Human Navigation Path tree
short physical directories + short physical filenames
              |
              v
short display refs and human-facing navigation/operations only
owner resolves an allowed short path to its exact canonical identity
```

Pure remains a separate branch: it binds one selected deck-level visual-system digest into every
provider input, while preserving Pure's rule that the provider page is the complete-page evidence.
There is no local Text Frame/compositor fallback for Pure.

## 决策 / 方案

### D1. 用一个深模块统一“decoded PNG -> derived RGBA8 pixels”

新增一个 internal shared module，提供小 interface：接受已验证的 decoded PNG 或 bytes，返回经过
严格 shape validation 的 opaque/alpha-preserving RGBA8 pixel buffer，或给出有限的输入不支持结果。
模块内部处理 8/16-bit 和 1/2/3/4 channel；调用方不再自行推断 `data.length`、row stride 或直接把
decoder buffer 写入 canvas ImageData。

这是正确的 seam：复杂的 depth/channel 转换、16-bit downsampling、grayscale expansion、alpha 填充和
长度校验只在一个地方出现；Style Master compatibility JPEG、Framed screenshot crop、complete-review/
inspection projection 和 delivery projection 只消费标准 RGBA8。原始 PNG bytes、hash、native dimensions、
selection 和 provenance 绝不改变。

### D2. 诊断只公开有限的“响应形状”，不公开响应内容

BUG-055 不增加 retry、failover、第二授权或持久状态。它扩展既有 known-failure 的 secret-safe facts：
解析失败时，只能报告有限枚举的本地分类（推荐至少区分 empty、HTML-like 和 other-non-JSON），不得输出
header、length、body digest、body 片段、task id 或 provider 名称。分类由同一 response reader 产生，
Style Master 和 Page Image 共用；其唯一作用是让已有的最近合法动作更可诊断。

此决策在 proposal 前须由 maintainer 明确确认：`HTML-like` 这类派生分类是否符合现有“不暴露 provider
response body”的保密边界。默认不采纳原 BUG 提出的 content-type/length/digest。

**确认（2026-08-08）**：允许在现有 `invalid_json` known-failure fact 中增加闭集
`response_shape: empty | html_like | other_non_json`。它仅表达本地 reader 对完整已读 body 的有限判断；不得
公开 header、长度、digest、body 片段、provider/task 身份，也不得改变 retry、授权、submission 或持久状态。

### D3. Human Navigation Path 必须是短的物理路径；SHA 只保留为 canonical internals

**新决定（2026-08-09，取代 D3 的旧完成范围）**：短 typed display ref 或 Markdown 中写出的 locator 都不等于
人类可用路径。人类实际进入、复制、传递或使用任何 artifact 时，必须只使用短的物理目录和短的物理文件名；不得
要求人类 `cd`、复制或输入含 64-hex SHA-256 的路径。这个路径类别称为 **Human Navigation Path**。

完整 SHA-256 仍是 immutable records、CAS locks、evidence binding 和 owner 内部精确解析的 canonical identity；
它不能再作为人类 artifact navigation 的物理路径。Human Navigation Path 必须由 owner 在限定 scope 内发布和解析，
collision-safe、可审计，并在内部唯一映射到相应 canonical identity。它本身不证明证据、不替代 source/receipt、
不隐式授权 provider work；显式 gate 和 owner validation 仍然适用。

因此，Change 3 的 rebuildable logical reference view 是已交付的中间能力，不再是 BUG-063 的产品完成定义。
Change 10 已提供实际存在于磁盘上的短路径树，并规定所有向人暴露的目录和文件 component 都使用受限、稳定、
collision-safe 的短名。human-facing locator 与 handoff 只可要求 Human Navigation Path；owner 可在内部解析为完整
SHA，但不得要求用户再接触完整 SHA。

Change 10 已明确 short tree 的受控 materialization/rebuild、删除/失效、跨 version scope、权限与 collision
规则，并为历史 run 提供不改写 evidence 的显式迁移路径。它不手工重命名 immutable SHA 根，也不以
alias/symlink 作为迁移；旧 Markdown view 可以保留审计价值，但不再声称满足短物理路径要求。

### D4. Pure 固定系统，provider 仍拥有全部页面像素

新增一个选定的 Pure deck visual-system profile。它只包含视觉 token：type hierarchy、字体风格、
颜色使用、标题/正文区域、grid/whitespace 和可用 layout family；不包含源文字、具体 claim 或自由
prompt ingress。其 canonical digest 进入 Page Image Core、raw contract、compiled provider input、plan
和 inspection projection，以便 token 变化精确触发 raw rebuild。

实际输出一致性仍要经过 human Complete Page Review；prompt/digest 测试证明“同一规则被提交”，不能伪称
证明 provider 像素相同。禁止把 Framed Text Frame 迁入 Pure，除非未来另行改变 Pure 完整 provider-page
语义。

## Progressive OpenSpec Changes

| 顺序 | 建议 change | 覆盖 | 主要 capability | 依赖 / 完成条件 |
| --- | --- | --- | --- | --- |
| 0 | archive `add-jpeg-delivery-media` | 既有完成 change | 已有 delivery capabilities | 已完成：先同步 delta specs，后 archive；不与后续 raster change 重叠。 |
| 1 | `harden-page-image-raster-projections` | BUG-059、BUG-060；审计发现的同类 derived projection exposure | `style-master-generation`、`html-render-runtime`、`image-generation`、`image-production` | **已完成**：通过 protected baseline、主 spec sync 后归档至 `openspec/changes/archive/2026-08-08-harden-page-image-raster-projections/`；BUG-059/060 已移入 `_done/_fixed_bugs/`。 |
| 2 | `add-bounded-provider-response-shape-diagnostics` | BUG-055 | `image-generation`、`cli-surface`、`style-master-generation` | **已完成**：主 spec 已同步，change 已归档至 `openspec/changes/archive/2026-08-08-add-bounded-provider-response-shape-diagnostics/`，BUG-055 已移入 `_done/_fixed_bugs/`。仅 `empty` / `html_like` / `other_non_json`；无 retry，Style Master 不新增持久化或 CLI field。 |
| 3 | `add-human-artifact-reference-view` | BUG-056、BUG-063（BUG-062 仍活跃） | `harness-charter`、`run-bundle-layout`、`image-generation`、`cli-surface`、`node-specification` | **已完成**：main specs 已同步，change 已归档至 `openspec/changes/archive/2026-08-08-add-human-artifact-reference-view/`；显式 provider-free `image2 artifact-view` 重建 run-scoped logical view；所有人类检查 handoff 都有 locator；storage/CLI exact args 与普通 machine JSON 不变。BUG-056/063 已移入 `_done/_fixed_bugs/`。 |
| 4 | `bind-pure-deck-visual-system` | BUG-057 + Pure fixture baseline | `visual-config`、`image-generation`、`run-bundle-layout` | **已完成**：main specs 已同步并归档至 `openspec/changes/archive/2026-08-08-bind-pure-deck-visual-system/`；closed deck-authored source record 已进入 Pure Core/raw contract/compiled input/plan binding；`deck_visual_system_sha256` 为 Pure-required / Framed-null 的 common binding slot，并在 ordinary/progressive raw-plan validation、invalidation、inspection 和 fixtures 同步。Style Master 保持色彩/参考 authority、不扩大 candidate scope。14/14 Pure fixture、focused suites、protected baseline 和 strict checks 已绿；仅待既有成本授权下的三张 representative Pilot 供人类视觉判断。 |
| 5 | `add-human-cli-handoff-guidance` | BUG-062 | `harness-charter` | **已完成**：main spec 已同步并归档至 `openspec/changes/archive/2026-08-08-add-human-cli-handoff-guidance/`；成功 direct CLI 对人只报告 Purpose / Outcome / Next human action，当前 Page Image 状态/行动用重建的 typed artifact view。普通 success JSON、full SHA CLI 参数、content-addressed storage 和 selector grammar 保持不变；BUG-062 已移入 `_done/_fixed_bugs/`。 |
| 6 | `expose-current-page-review-artifacts` | BUG-057 current Complete Page Review locator gap | `image-generation` | **已完成**：main spec 已同步并归档至 `openspec/changes/archive/2026-08-08-expose-current-page-review-artifacts/`；current Pure/Framed Complete Page Review 在 `proceed`/`repair` 前进入现有 provider-free artifact view，repair 后的 prepared record 不会在该 display view 复活；final/delivery 仍只认 accepted evidence。owner lifecycle 的独立 selector 漏洞由 Change 7 处理。 |
| 7 | `restore-repair-raw-rebuild-routing` | BUG-057 repair 后 owner lifecycle selector 漏洞 | `image-generation` | **已完成**：main spec 已同步并归档至 `openspec/changes/archive/2026-08-09-restore-repair-raw-rebuild-routing/`；统一 relation-aware current-review selector，repair 后不得重放/二次决定 historical prepared evidence，唯一合法下一步是 `rebuild_progressive_raw_work`。不改 records、CLI、grant、provider 或 deck bytes。 |
| 8 | `recover-stale-style-master-scope` | BUG-057 source-only visual repair 后的 Style Master replacement-plan deadlock | `style-master-generation`、`image-generation`、`cli-surface` | **已完成**：main specs 已同步，change 已归档至 `openspec/changes/archive/2026-08-09-recover-stale-style-master-scope/` 并已提交；current validated selected-workflow candidate 可 provider-free 地发布 Style Master successor plan；旧历史只作审计，新 selection 前 raw source epoch、plan、authorization、provider 与 evidence 全部保持不可用。目标回归、protected baseline 与 strict checks 已通过，无 provider 或真实 deck mutation。 |
| 9 | `expose-style-master-successor-artifact-view` | BUG-057 replacement Style Master plan 的授权前 human artifact-view gap | `style-master-generation`、`image-generation`、`cli-surface` | **已完成（未同步 main specs）**：已验证、归档至 `openspec/changes/archive/2026-08-09-expose-style-master-successor-artifact-view/` 并提交为 `e7365cc`；current successor plan 只将 owner-verified local/succeeded candidate locator 投影为 pending view，其他 generated slots 仅按 lifecycle state 显示 unavailable；stale predecessor selection 和 raw/final/delivery history 不会被投影为 current，pending view 只返回既有 owner `next_action`。 |
| 10 | `introduce-short-physical-human-artifact-paths` | D3 supersession：短 display ref / logical locator 不满足人类实际使用 artifact 的要求 | `run-bundle-layout`、`image-generation`、`style-master-generation`、`cli-surface`、`harness-charter` | **已完成**：main specs 已同步，change 已归档至 `openspec/changes/archive/2026-08-09-introduce-short-physical-human-artifact-paths/`，提交为 `d8b9389`。`_generated/nav/index.md` + `nav/art/` 是唯一 human-facing physical entry；owner-validated artifacts 以 staged regular copies materialize，full SHA 仅留 internal canonical identity。artifact-view 返回 index/root、不写 state、不做 provider work；unsupported v2 保持 hard-stop。历史 run 仅在下一次显式 provider-free artifact-view 重建时迁移，immutable evidence 不改写。人类已确认并完成 `0.25.1 → 0.26.0` MINOR version bump。 |
| 11 | `fix-pending-successor-artifact-view` | BUG-057 matching-binding pending successor 在短导航重建前被误报为 selection conflict | `style-master-generation`、`image-generation`、`cli-surface` | **已完成**：main specs 已同步，change 已归档至 `openspec/changes/archive/2026-08-09-fix-pending-successor-artifact-view/`，提交为 `006ec59`。pending successor 的匹配以 predecessor identity 为准，而非 style-intent/context/profile hash divergence；current successor 的 exact promotion 恢复 ordinary accepted-selection path，其他 selection mismatch 仍严格返回 `style_master_selection_conflict`。不访问生产 deck、不写 state、不调用 provider。 |
| 12 | `repair-progressive-raw-terminal-conflict` | BUG-057 的 `succeeded` + `unknown` terminal sibling race 把可验证 materialization 错投影为不可执行 rebuild | `image-generation`、`cli-surface` | **已完成**：只将 childless、tuple-identical、通过既有 provenance/raw-byte 验证的 pair 视为 effective success；unknown 仍不可变审计。reconcile 对 effective parent 为 provider-free no-write replay；无效 branches 维持 hard-stop，CLI 仅投影 bounded `report_internal`。owner 28/28、公开 CLI process、protected baseline、change/all-spec strict 与 diff check 通过。两份 delta 已同步，change 已归档至 `openspec/changes/archive/2026-08-09-repair-progressive-raw-terminal-conflict/`；Harness 维护本身未触碰生产 deck 或调用 provider。 |

Change 1 已在 2026-08-08 完成实施、验证、主 spec sync 和 archive：共享 raster projector 覆盖 Style
Master compatibility JPEG、Framed capture、Page Image review 与 delivery contact projection；delivery 还在
任何 final-root 写入前预计算 JPEG/contact projection，失败不改变已有 final artifacts。聚焦 90 项测试、
protected `npm test` 与归档后的 all-spec strict validation 均通过。

Changes 2 和 3 都是 display/control 变化，可在 Change 1 archive 后依次进行；不共享 durable lifecycle
state。Change 2 已在 2026-08-08 完成实施、主 spec sync 与 archive：两轮 planning-only review 解决了 Style
Master 不应持久化或投影该 diagnostic fact 的边界问题；9/9 tasks、74 项 targeted Image2 tests、12 项 process
diagnostics、`npm test`、change strict、all-spec strict 与 `git diff --check` 均通过。BUG-055 已按其“无安全
响应可见性”范围修复并归档；provider TLS 行为与自动 retry 仍为独立决策。Change 4 最后，因为它必须把
“统一”的 token 约束与最终人类视觉判断清楚分开，且后者有 provider 成本。

Change 3 已于 2026-08-08 完成 proposal、五份 delta specs、design 和 tasks；两轮 planning-only polish 已复核
proposal/spec/design/tasks 的完整链路，以及 Image2 dispatcher、task-projection tail、Style Master/raw/delivery
owner readers 与 architecture boundary。实施后的 `artifact-view` 在 generic Image2 task-projection tail 前返回，
保持 `_state` 不变；它从 public owner inspector 组成 Style Master、provider input、Pure/Framed Pilot、Complete
Page Review、final、PPTX、notes 和 delivery 的可读 view。渲染器只接受已验证、confined 的文件 locator，并可原子
覆盖手工编辑或删除的旧 view。70 项 focused tests、`npm test`、change strict、main-spec sync、archive 和
归档后的 all-spec strict validation 均通过；BUG-056/063 已归档，BUG-062 仍活跃。Change 4 的 proposal、
specs、design、tasks 经两轮 planning-only polish 后已完成实现。普通与 progressive raw-plan schema 的独立严格
validator 已以一个 `deck_visual_system_sha256` slot 同步扩展，Pure 必填、Framed 固定 null；不能仅改 Core。
`pure-deck-visual-system.yaml` 的 override/backbone resolver、closed parser、source-first failure、Core/raw
contract/compiled input/inspection binding、binding-drift invalidation 和 multi-page provider-free coverage 均已落地。
`tests/04-pure-image/test_pure_workflow.mjs` 的 baseline fixture 已修复至 14/14；focused suites、`npm test`、
`openspec validate bind-pure-deck-visual-system --strict`、`openspec validate --all --strict` 与 `git diff --check`
均通过。像素一致性仍留给已有授权的人工 Pilot/Complete Page Review；本 change 不把 binding 结果误记为 acceptance。

## Proposed Change 质量关

这条质量关适用于本计划的每一个 proposed change，包括 Change 1--4，以及后来为本计划新增的任何
change。它位于 `openspec-propose`（或手工完成 proposal/specs/design/tasks）之后、任何
`openspec-apply-change` 之前：**未通过不得动手实现。**

1. 先确保 proposal、全部 delta specs、design 和 tasks 完整，并通过该 change 的 strict validation。
2. 对 active change 运行 `$polish-openspec-change <change-name>`。它必须至少完成两轮不同的审查：第一轮
   检查 proposal → specs → design → tasks → verification 的整体验证链；第二轮以最高风险的 authority、
   state、兼容性、失败恢复或可验证性问题为中心，查阅权威 source/spec/test 后复核。
3. 可由该步骤修正的遗漏、术语不一致、缺失 task、错误验证边界，必须同步修正 change 内的 artifacts 并再审；
   不能由既有事实决定的产品/权限/风险选择必须升级给人类，结论为 `not ready`，不能以假设进入实现。
4. 只有 polish 的最终结论为 `ready for apply`，且 `openspec validate <change> --strict`、
   `git diff --check`、`openspec validate --all --strict` 以及仓库声明的适用 protected baseline 均通过，才可
   开始 apply。项目级检查的既有失败同样阻止该 change 宣称 ready；必须隔离并记录，不能静默绕过。
5. polish 是 planning-only：不执行 provider 工作、不修改 Harness/test 代码、不标记 implementation task 完成。
   通过后才进入正常的 apply → validate → spec sync → archive 顺序。

## 每个 Change 的验收与验证

### 1. Raster projections

- 真实 fixture 覆盖 8/16-bit 与 1/2/3/4-channel PNG；转换后 RGBA8 长度、alpha 和 dimensions 正确。
- 16-bit RGB Style Master accept 生成可解码、尺寸不变的 compatibility JPEG；既有 `caBX` regression 继续通过。
- Chromium RGB 和 RGBA screenshot 都正确裁出 2000x1125；不透明输入不产生 fabricated transparency；
  单页和 batch 共用同一路径。
- 所有 provider raw bytes、hash、native dimensions、selection/provenance 均保持 byte-identical；只允许
  derived JPEG/PNG/contact projections 改变。
- 定向 unit/integration tests；无 provider E2E。将 audit 找到的每一个 `decodePng -> canvas` 或
  `loadImage(provider bytes)` call site 列入 proposal design，明确改用 shared projector 或证明其输入已固定 RGBA。

### 2. Provider response shape diagnostics

- synthetic `200 + HTML-like`、empty、other non-JSON 和 valid JSON response 都经过同一 reader。
- stdout/stderr/known-failure records 不含 body、headers、length、digest、credential、prompt 或 task id。
- 已有 known-failure vs unknown/reconciliation、single submission 和 no-retry tests 保持不变。
- 只增加有界 fact，不新增 command、state、grant 或人类 gate；失败仍返回原 owner 的一个最近动作。

### 3. Human artifact reference view

- 每一个要求人类查看候选、Pilot/Complete Review、final PNG/PPTX、notes 或 delivery receipt 的 projection/
  guide 都给出 confined absolute locator，并标明 artifact 类型和检查目的。
- 所有 display refs 是 kind-prefixed、collision-aware，按 stable slide/candidate ID 排序；完整 digest 不出现在
  human card 的 display text。
- reference view 从 canonical owners rebuild；删除后不影响 current authority；不能被 CLI 当作 plan/batch/
  attempt selector；不授予 `_generated/` 手工编辑权限。
- current 64-hex storage container checks、CAS/lock paths、record hashes 和 public exact-hash arguments 维持。

### 4. Pure visual system

- 每个 Pure provider input 含同一个 selected visual-system digest 与 deterministic token projection；内容变化只
  改动允许变化的 per-slide facts。
- token 改变导致明确的 raw rebuild debt；未选 token 不造成 invalidation；视觉 token 不能供应/改写 literals。
- 现有 Pure “provider page is complete evidence / no local composite” requirements 保持。
- 修复旧 receipt fixture 后，Pure focused suite 全绿；再以经授权的 multi-page Pilot 做人类视觉 review，确认
  typography、layout、colour 和 whitespace 达到约定的一致性。

### Change 4 后续人工 Pilot 协议（待单独成本授权）

该协议只使用既有 Pure Pilot authorization 与 Complete Page Review，不创建新的 gate、State 字段、selector 或
acceptance 记录。授权前不得提交 provider work。

1. 人类先明确授权恰好三张 Pure slide 的 Pilot 范围，并从同一当前 source/version 选择三种需求：一张
   editorial narrative、 一张 metric/data-led、 一张 process/relationship-led。三页必须有不同的 literals 与
   visual-language selection，且都绑定同一 selected deck visual-system digest。
2. Agent 按既有 exact plan hash/batch authorization 生成并展示 provider complete-page evidence；Pure 不生成
   本地 header overlay、composite 或第二份页面证据。
3. 人类在既有 Complete Page Review 中跨三页评估：title/body hierarchy、Style-Master-derived colour use、
   title/content zones、whitespace 密度，以及是否落在允许的 layout family；同时确认各页仍满足其各自内容和
   构图任务。
4. 通过只证明该 deck/sample 的人工视觉结论；修复则返回现有 source edit → raw rebuild 路径。输入 digest/
   inspection 一致性本身不构成 pixel acceptance，也不会 bypass review。

## 风险 / 取舍

- [把 PNG normalizer 做成另一套媒体 authority] → 只用于 derived pixels；raw acceptance 仍由现有 exact-media
  contract 和原 bytes/provenance owning path 负责。
- [一次修复遗漏某个 canvas 调用点] → Change 1 proposal 必须以 grep inventory 为输入，并让每个调用点有
  明确 disposition；测试至少覆盖 Style Master、Framed capture、review/projection 与 delivery。
- [诊断为排错泄露 provider 数据] → D2 仅允许 closed enum；任何新增字段先以 secret-safety negative tests
  证明不会透出原文、header 或稳定 body fingerprint。
- [短物理路径碰撞，或因碰撞退回暴露长 SHA] → Human Navigation Path 由 owner 在限定 scope 内发布、稳定
  collision-safe 地解析；所有 human-facing path component 保持短，完整 SHA 只留在内部 mapping/evidence。
- [短物理树被误当作第二套证据、授权或可随意修改的 storage] → Change 10 已规定 owner-controlled
  materialization/rebuild 和 lifecycle boundary；路径可以作为人类导航入口，但仍须 owner 解析、validation 和显式
  authorization，不能靠路径本身建立 authority。
- [迁移破坏既有 immutable SHA evidence] → 不就地改名、不手工创建 alias/symlink；新 change 以可验证的
  projection/migration 处理历史 run，并保留 canonical owner records 不变。
- [Pure prompt 规则被误解为像素保证] → 把 deterministic binding 与 human visual acceptance 分开；无需新增
  quality state、自动 retry 或第二个 acceptance 流程。

## Gate / Control 纪律

- Change 1 的不支持 PNG layout 是 integrity hard-stop：保护 derived rendering 的正确性，修复后 rerun 原 owner。
- Change 2 不改变 provider submission/control；所有 invalid JSON 仍是既有 known failure，避免以自动 retry
  烧掉授权项。
- Change 3 是可重建 display projection；没有新 approval、waiver 或 state，不引入第二套 locator authority。
- Change 10 已将短物理 Human Navigation Path 设为唯一 human-facing artifact path，同时保留 SHA 作为 owner
  internals；它通过独立 OpenSpec proposal、migration/protocol 审查和 provider-free 回归验证，未用手工重命名或
  symlink 绕过现有 immutable/storage 控制，也未授权 provider work。其历史迁移仍须由各 run 的下一次显式
  artifact-view 触发。
- Change 4 的 token 定义与最终视觉满意度是人类决策；Agent 可完成 binding/test/prompt 机械工作，但只有在
  明确成本和样本 scope 后才请求 Pilot provider work。

这些边界遵循 `simple-reliable-control`：复用 direct owner facts、短路最早错误、只返回一个最近动作；并遵循
`human-centered-gates` 与 `agent-assistance-and-control`，不把诊断、task card 或 display view 变成证据/
授权真相。

## 进入实施前的三个确认

1. D2 已确认：允许公开 finite `response_shape`（`empty` / `html_like` / `other_non_json`），但不公开任何
   header、长度、digest 或内容。
2. **D3 已重新确认并落实（2026-08-09，取代旧范围）**：Change 3 的 logical, rebuildable human reference view
   已不再是 BUG-063 的产品完成定义。Change 10 已使人类只使用短的物理 Human Navigation Path（目录和文件名均短），
   完整 SHA-256 仅为 owner 内部 canonical identity；不会手工重命名 immutable SHA 目录，也不以 alias/symlink
   规避迁移。已存在 run 的 derived migration 只在下一次显式 artifact-view 中发生。
3. **D4 已完成 apply 与 provider-free validation**：Pure 保持 provider-owned complete page；closed source record
   指定 typography hierarchy、Style-Master-derived colour use、zones、whitespace 和 permitted layout families。source
   receipt 不吸收 profile digest；canonical runDir 选择 override/backbone record；`deck_visual_system_sha256` 同步
   进入 Core、raw contract、compiled input、ordinary/progressive plan binding、invalidation 与 inspection。14/14
   Pure fixture、focused suites、strict/diff/protected baseline 均已绿；main-spec sync/archive 已完成。之后仅能按
   既有成本授权申请三页 human Pilot，binding 测试不构成像素验收。

原 D1–D4 的 Change 1 → 2 → 3 → 4 顺序均已完成并归档。Change 10 已作为独立 proposal 通过自己的
protocol/migration 质量关，完成 APPLY、main-spec sync、archive 与提交 `d8b9389`；它不回写或重做已归档变更。
对应 navigation 记录与 `0.26.0` version surfaces 已更新。是否移入 `_done/_fixed_bugs/` 留待单独的 bug disposition 决定。
