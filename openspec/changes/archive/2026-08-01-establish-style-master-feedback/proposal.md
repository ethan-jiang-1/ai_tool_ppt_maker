## Why

当前 Page Authority 把 `style_master.jpg` 当作 raw-plan 的静态 reference：文件存在即可进入页面级
raw planning，但没有一等的 candidate plan、精确 provider authorization、candidate bytes/provenance、
人类视觉决定或 effective-style promotion。这样用户仍可能在页面级付费生成前没有见到真实视觉方向，
同时一个 layout-resolved compatibility payload 的覆盖会被误认为单一 version 的局部操作：既有
`overrides/visual-style/` 文件优先，否则使用 shared backbone default，但这两种物理路径都不是 selection authority。

Change 1 已使 Framed 的 final pixels 与 raw-review evidence 可信；现在应在任何页面级 raw provider
call 之前完成 Style Master feedback loop。这个 change 只建立“真实 Style Master -> 人类方向决定 ->
可恢复 effective selection”的闭环，故意把 exact Pilot/Expansion scope、逐页 paid materialization、
complete raw review 与 delivery 留给顺序上的 Change 3。

## What Changes

- 将 `style-master-generation` 从遗留的 style sample primitive 收敛为唯一的 Style Master candidate
  lifecycle owner：它从 layout-resolved canonical `visual-style/style-master-prompt.md`、当前闭集视觉语言的
  style-only context、selected workflow、固定 candidate-generation profile、显式的 `0..4` 新 candidate count、从
  `<run-dir>` 解析的单一 `run-version + workflow` selection scope，以及 previous canonical selection record 的
  `previous_selection_sha256` 编译 provider-free
  candidate plan。owner 还维护一个按 scope CAS 的 current lifecycle head，并为每个新 plan 分配单调 generation、绑定 predecessor
  plan 与本地 candidate 的 exact copied-byte digest，使相同输入在 terminal plan 后仍能产生新的、可恢复且不误选历史的 plan。
  immutable grant 以 exact canonical JSON 与外部 digest 只授权该 plan 的 ordered generated slots；每个 slot 的 monotonic attempt
  固定绑定该 grant digest，先持久化 claim，再记录 submit/terminal 状态。attempt 与 unknown-abandonment 同样具有 exact
  canonical schema/external digest，grant consumption 由已进入 submit 的 attempt 直接推导。candidate 计划、授权、attempt 与 bytes 都不复用或改写页面 raw
  plan/evidence 的 owner。
- candidate bytes 只有在完整、当前、可归属后才可被呈现：generated slot 必须通过 exact grant-bound
  `succeeded` attempt、provider request、bytes/provenance 链，local-existing slot 只通过其 immutable local provenance 链。
  人看到真实 bytes 后作出 `proceed`、`repair`
  或 `redirect` 的视觉方向决定；`proceed` 还必须绑定当前 plan 中的一个 exact candidate ID。三种决定都不构成 Pilot
  通过、页面 raw authorization、raw acceptance 或 waiver。`repair` 返回 style-intent/candidate owner；`redirect` 返回视觉
  方向选择；workflow switch 仍走既有 Structural Versioning Path。
- 由同一 owner 在 `proceed` 后使用 compare-and-swap 与 atomic promotion 写入每个 exact scope 的一个 canonical
  effective-selection/acceptance record，绑定实际 candidate bytes、scope、current decision 与 `previous_selection_sha256`。
  未经审查的 candidate 不得覆盖 canonical selection；已有受目录约束但没有 historical provenance 的 `style_master.jpg`
  只能经同一审查路径被本地采用，不能伪造旧 attempt。Structural vNext 首次发布保留源版本 record，但不得把它复制、
  重绑或推断成目标版本 selection；目标版本必须完成自己的 exact-scope acceptance。相同 structural plan 的幂等重放则
  必须走现有 Structural Versioning Path 的 exact-target revalidation branch：仅当已发布 target 的 source bytes、receipt、
  workflow 与 source-epoch state identity 和原 plan 全部匹配时，才作为 no-publish replay 返回；它不得重新 stage/rename target、清空 target
  Controller execution、改写 target-owned selection 或 compatibility payload。任何 drift 都必须 hard-stop 并要求新的 preview，
  不能把后续 Style Master 工作清掉。
- raw generation profile 从“路径上有一个 style image”提升为“当前 accepted effective-style selection
  指向的 exact immutable bytes”，且 provider submitter 必须使用同一 resolver 返回的 bytes，不能重新读取 compatibility path。
  style intent、canonical style context、candidate bytes、selection、scope 或 generation-profile drift 必须
  由 owning interfaces 使相关 full raw plan、raw review、final/delivery evidence 陈旧，但不得仅为 profile
  drift 伪造 source epoch，也不得自动重绑旧 style bytes。
- 恢复一个仅面向 current v2 Page Authority 的 `style-master` CLI family，并通过现有 producer-owned
  diagnostic envelope 暴露 owner-issued inspect、plan、授权、进度、review、promotion 和 unknown-plan abandonment actions。
  `plan` 仅接受边界内的 `--candidate-count` 运行控制；`review` 与 `accept` 都绑定 exact plan hash，`accept proceed`
  还必须提供 candidate ID。`--candidate-count 0` 的 local-existing plan 不创建 grant 或进入 generate。CLI 不接受 legacy
  mode、`--force`、任意 path/prompt/provider override、inferred authorization 或 hidden retry；abandon 只关闭 exact current
  unknown plan 并保留 unknown attempt，后续新 plan 仍需新的成本授权。
  `inspect --plan-hash` 是 current-head assertion，不会为 historical plan 生成可执行 next action。若 selection CAS 已提交但
  compatibility projection 失败，非零诊断通过既有 `diagnostic.subject` 报告 committed selection digest，并在
  `diagnostic.next.invocation` 原样保留 exact accept 参数边界；失败出口不发出成功 receipt stdout。
  该 top-level family 会同步更新 registered unified CLI inventory、help 与 command-count contract：当前已注册的
  11 个 top-level commands 加上该 family 后为 12。main `cli-surface` 中陈旧的 `fixed 14-command` 描述会显式
  更新为 `fixed 12-command`，不与实际 surface 冲突。
- 在 Framed 与 Pure Controller 中各自增加 Style Master entry/review/promotion handoff；fresh v2 authoring draft 复用
  selected-workflow 已有的 read-only candidate-source resolver，从 source marker、active run 与 selected workflow 验证 scope，
  不把当前会物化 source receipt/state 的 `ppt_flow validate` 当作 Style Master 前置，也不提前物化 page
  source receipt/mode/evidence。现有只接受 workflow-selection node 的 draft route 会改为消费 node-declared、
  controller-manifest-validated 的 `draft_route: true` 投影，仅覆盖 create-deck 的 workflow-selection、content、visual-system、
  selected-workflow Style Master 与 first-raw handoff 节点，直至首次 raw-plan materialization；不会用任意 `current_node`
  字符串、phase 数字或 router 列表放宽
  draft。existing run 则要求 exact current pair。Node conditions
  与 run-bundle layout 只消费 canonical effective-selection/acceptance record。`style_master_accepted` 只是只读 Boolean
  readiness predicate；其它诊断与恢复动作仍只能来自 Style Master owner。共享 JS 可复用 identity、CAS、
  authorization、attempt/progress 与 byte checking，但不解释 Framed safe-zone 或 Pure display semantics。
- Change 2 结束时页面级 raw provider calls 必须仍为零；不引入 Pilot/Expansion batch grants、per-page
  materialization ledger、Pilot projection、complete raw-review changes、finalization 或 delivery changes。

Gate 分类遵循 [human-centered-gates.md](../../policies/human-centered-gates.md)：一份完整 current
含 generated slots 的 candidate plan 等待成本授权，以及真实 current candidate bytes 等待视觉方向决定，都是 `confirm`；
zero-generated local-existing plan 不制造成本 gate。可确定的
plan/projection rebuild 是 `guide`；candidate/selection identity、byte integrity、authorization、attempt
recoverability、CAS ownership 或 promotion currentness 不确定时为不可绕过的 `hard-stop`。每个 hard-stop
保护精确 scope、可归属 bytes、单一 writer 或 provider cost boundary，并只返回所属 owner 的一个最近合法动作。
unknown submit 不被改写成成功或失败；owner 只能在保存 unknown fact 与人类 reason 后 abandon 该 exact plan，再允许新 plan
进入独立授权。没有 waiver、force、自动 retry 或由人手工修 state/hash 的路径。

控制路径遵循 [agent-assistance-and-control.md](../../policies/agent-assistance-and-control.md) 与
[simple-reliable-control.md](../../policies/simple-reliable-control.md)：人只回答“是否为当前视觉方向继续”、
是否承担这一次 candidate 成本，以及是否用 reason 保留并 abandon 一次无法判定 outcome 的 exact plan；
Agent 在取得 owner-issued reference 后执行机械步骤；runtime owner
保存不可重建的 plan/grant/attempt/selection facts。新 lifecycle 取代“文件存在即 style ready”、legacy
generator 的 direct overwrite、CLI `--force` 与分散的 status 推断，形成一个 direct-fact -> one check ->
one action -> same-check rerun 的闭环，而不增加平行 ledger 或 control route。

## Capabilities

### New Capabilities

- None. Style Master generation、raw lifecycle、Controller execution、CLI diagnostics、state conditions and
  run-bundle ownership already have stable capability homes; this change extends them without creating a
  second production family.

### Modified Capabilities

- `style-master-generation`: define the provider-free candidate plan, exact candidate authorization,
  per-scope lifecycle head, durable attempt/provenance and derived progress, current-byte review, human decision,
  unknown-plan abandonment, CAS promotion, effective selection, acceptance receipt, invalidation and
  same-check recovery.
- `image-generation`: require a current accepted effective-style selection when compiling a page raw
  generation profile, and fail closed before page raw plan/provider work when that binding is absent or stale.
- `pipeline-orchestration`: place the selected workflow's Style Master loop before page raw planning while
  preserving one homogeneous Framed or Pure trajectory and routing style/profile drift to its owner.
- `cli-surface`: restore the current-v2 `style-master` command family, its bounded observation/progress and
  producer-owned diagnostics, without reopening retired CLI modes or bypass flags.
- `node-specification`: admit the optional schema-v5 canonical effective-style acceptance record, add its
  read-only readiness condition and typed decision/evidence handoff, and keep candidate lifecycle state out of
  generic node status.
- `playbook-execution`: define independent Framed and Pure Style Master Controller entries and their
  current evidence/decision exits; task projection remains a read-only collaboration view, not runtime truth.
- `run-bundle-layout`: declare confined canonical locations and rebuild owners for immutable candidate history,
  the CAS scope head, effective-style selection and acceptance receipt, while preserving the layout-resolved
  compatibility-asset rule for `style_master.jpg` (declared version override first, backbone default otherwise)
  without creating an override or a version-local selection record.
- `slide-identity-and-ordering`: make an already-published target Structural Versioning Path plan replayable only as
  an exact no-publish revalidation, so the state owner can preserve later target-owned Style Master evidence without
  reopening, rewriting, or creating a version.

## Impact

- **Framework source:** `PPTMAKER_FRAMEWORK/scripts/` Style Master owner and current Image2 client boundary,
  Page Authority target runtime/raw profile checks, `ppt_flow.mjs`, state conditions, Controller playbooks,
  run-bundle layout constants/validation, and the existing target structural-version preview/apply owner. No new
  production dependency or external skill is introduced.
- **OpenSpec:** eight delta specs above. `visual-config` remains the authoritative closed visual-language input;
  `style-master-generation` owns parsing and binding canonical `style-master-prompt.md` intent; and
  `environment-check` remains the existing Image2 readiness owner. This change must consume rather than
  duplicate their schemas or diagnostics.
- **Tests:** canonical prompt/context/profile/scope, local-byte digest, plan generation/predecessor and candidate-count
  plan-hash tests; exact immutable grant/attempt/abandonment field/digest, atomic exact-replay and derived consumption; per-candidate success/failure/unknown-abandonment
  tests; candidate-ID selection and CAS/promotion/invalidation tests; draft/current state tests; CLI diagnostic and
  zero-bypass tests; structural-vNext non-inheritance/idempotent-preservation tests, including replay of a persisted
  exact plan while the target Controller is active; separate Framed/Pure Controller journeys; and a regression proving zero page raw submits
  throughout Change 2.
- **Control owner:** JS/CLI owns deterministic plan/grant/attempt/byte/CAS validation and durable writes;
  MD Controller/Agent presents direct owner facts and performs authorized mechanical work; the human owns
  candidate cost authorization, visual-direction decision, and the bounded decision to abandon an exact
  unknown-cost plan without rewriting its outcome.
- **Run-bundle contract:** `migration`. Existing physical `style_master.jpg` files and schema-v5 state remain
  readable and byte-preserved, but legacy raw plans/evidence lack the new exact selection binding and therefore
  cannot be silently rebound or treated as current. An explicitly selected run must adopt its confined layout-resolved local file
  through the normal zero-generated review/promotion path and then use Generated Image Rebuild for stale raw lineage.
  There is no bulk migration command or automatic scan: no production `deck_*` or `dpt_*` is used as a fixture or
  mutated by repository maintenance; `_generated/` remains rebuildable and never hand-edited.
- **Out of scope:** page-level raw provider calls, Pilot/Expansion grants, exact slide batch selection,
  paid raw materialization/reconciliation, Pilot/complete raw-review evidence, finalization, PPTX/notes,
  delivery review, cross-version Style Master selection batches, and workflow migration. These remain
  Change 3 or a later dedicated change.
