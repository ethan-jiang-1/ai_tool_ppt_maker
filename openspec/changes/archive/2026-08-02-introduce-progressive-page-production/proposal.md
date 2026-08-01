## Why

Change 2 已使当前 Page Authority run 在页面级 raw production 前拥有一份经人确认、可恢复的
Style Master selection；但页面 raw lifecycle 仍把完整 plan 当成一次整批授权、整批生成和一次
review。用户在支付完整范围成本前看不到真实代表页，中断后也没有逐项可归属的 provider attempt、
consumption 和 bytes 事实可供安全恢复。

现在需要把既有的一份 provider-free full raw plan 保持为唯一 authority，并在其上建立 exact
Pilot、必要时的 Expansion、Complete Raw Review 和最终交付闭环。这样能把人类反馈移到仍可改变
方向的时点，同时不把 Pilot 变成 `--slides`、scratch script 或第二条生产路径。

## What Changes

- **BREAKING:** current Page Authority image2 authorization and generation move
  from a plan-only full-batch contract to an exact plan-plus-batch contract.
  The former authorize/generate forms without a batch identity are rejected;
  callers must use the registered progressive lifecycle rather than relying on
  an inferred full-plan scope.
- 将当前 page raw lifecycle 扩展为一份完整、provider-free raw work plan 上的渐进生产：plan 始终
  绑定当前 source receipt、selected workflow、ordered formal `slide_id`、typed raw contracts、effective
  Style Master generation profile 和 source/execution identity。Pilot 与 Expansion 只是该 plan 的精确
  projection，绝不生成竞争的 partial/full plan，也不以文件数、task checkbox、聊天或 `position`
  推断范围。每个 projection 区分 review sample、current reusable materializations 与仍需付费提交的
  paid-generation debt。同一 full plan 的 batch 形成 owner-derived predecessor/generation chain：相同
  当前请求只 exact-replay 同一 batch/grant，新的 paid scope 只能在其 terminal predecessor 后出现，绝不
  让并行或重叠的可提交 batch 重复花费同一 tuple。
- 以同一 raw materialization owner 保存 exact batch grants 和逐项 `claim -> submit -> commit` 事实。
  每个非零 grant 绑定 full-plan identity、ordered selected IDs、每项 raw-contract identity、profile、
  source/execution identity 和 maximum submissions；submit 前重检这些事实，commit 原子地写入 bytes、
  provenance、attempt terminality 和 grant consumption。没有终态结果的 `submitted` attempt 是
  recoverability hard-stop：先通过 owner 的 reconciliation/terminalization 对账，绝不自动 retry、猜测结果
  或用新的 grant 追溯授权旧 bytes。terminal `unknown` 永远不能重开旧 grant；任何后续 paid work 都必须从
  owner-derived successor scope 开始，重新披露并取得新 grant。`submitted` attempt 已经消耗其授权 slot；consumption 和 progress 都是 attempt
  records 的只读投影，不是第二 ledger。known failure 可以让同一 grant 的后续未提交 item 继续，但失败 item
  只能经 terminal batch 的新 exact projection 和新 grant 再次付费。
- 新增受控的 Pilot production stage。Agent 提出最小的、风险有据的 representative sample，人在
  看到 `position + formal slide_id + title`、exact scope、maximum submissions 和成本后作出范围/成本
  决定。Framed Pilot 必须用 Change 1 已确立的同一 private compiler、browser evaluator、fonts 和
  capture profile 生成 preview-only 的 underlay 与 production-equivalent Text Frame composite；它不写
  final manifest、PPTX、notes、accepted raw evidence 或 delivery receipt。Pure Pilot 只展示 exact
  full-page raw bytes，完全不触发 Framed compositor 或 safe-zone/Text Frame 语义。两条 Controller
  旅程各自展示本 workflow 的问题，shared mechanics 不解释 sibling semantics。存在超过五项 paid debt 的
  partial Pilot 必须包含至少一项需付费的 review tuple；`position` 和 `title` 只是供人确认的 display facts，
  永不替代 formal ID/hash 绑定。
- 明确 Pilot 的三个分支：paid debt 为 `1..5` 时完整 debt set 是唯一 paid Pilot scope，生成后直接进入
  覆盖 full current plan 的 Complete Raw Review，不产生 partial Pilot decision 或 Expansion grant；
  paid debt 为零时跳过 synthetic Pilot authorization/evidence，直接进入 complete-review owner；只有
  partial Pilot 的 current `proceed` 才允许 Controller 展示 remaining paid scope 的另一成本确认。
  `proceed` 不是 provider authorization、raw acceptance、finalization 或 delivery decision；Expansion
  只能复用已验证的 Pilot tuples，并只提交仍有效的 exact remaining debt。
- 保留既有 Framed Text Frame-only local-rebind 的窄路径：仅当既有 local-rebind validator 证明其全部
  raw/review retention 条件仍 exact 且不存在 unresolved submitted attempt 时，raw owner 才能以 provider-free 的
  v3 successor plan/evidence 重绑新 source receipt、复用已验证的逐项 provenance 和 Complete Raw Review reference，且不推进 source epoch。
  它不创建 Pilot、Expansion、grant 或新的 raw-quality confirm；任何条件不匹配都回到正常 full-plan debt path。
- 让 Complete Raw Review 重新成为唯一的 full-plan acceptance boundary：上面的 local-rebind 只保留既有
  complete boundary，不创造替代或 partial acceptance；其他情形必须在 runtime 已验证
  provider-free reuse、Pilot、Expansion 与任何显式 retry 的逐项 tuple/provenance 覆盖后，才向人展示
  full current projection 并记录 `proceed|repair|redirect`。partial Pilot evidence、最后一个 grant hash、
  文件存在或完成数都不能替代 accepted raw evidence。只有该 evidence current 时，selected workflow
  才能发布 final manifest，随后沿既有 shared PPTX、notes 和 Delivery Review owners 完成交付。
- 将现有 `image2` public surface 和 inspection/controller handoff 改为该 progressive lifecycle 的
  registered, owner-issued operations：官方 Pilot/Expansion/complete-review actions 使用 exact plan/scope
  hashes 和 formal IDs，不接受遗留 `--slides`、arbitrary provider/profile/prompt/path override、`--force`
  或 hidden retry。CLI 继续只发 producer-owned diagnostic；status/inspection 只报告 current head、
  progress、evidence 和一个最近合法动作，Controller 不从 Markdown 或 generated artifacts 重建 route。
  每次恢复先重新读取 exact run/controller identity 和 owner facts，只推进被证明为未提交的 item。任何
  submitted-but-unresolved attempt 必须先以其 exact persisted identity reconcile/terminalize，才允许
  successor plan、batch 或 grant；即使 source/profile 已 drift，reconcile 也只结清历史事实，绝不把它
  重新当作 current evidence。

Gate 和恢复遵循 [human-centered-gates.md](../../policies/human-centered-gates.md)：可确定的 projection
或 derived-artifact rebuild 是 `guide`；Pilot/Expansion 的精确成本承担、真实 Pilot 的质量判断、
Complete Raw Review 和 Delivery Review 是互不替代的 `confirm`，分别记录人的 scope/cost、质量或交付
判断；identity、scope/hash/bytes/provenance、authorization/consumption、coverage、CAS ownership 和
provider outcome recoverability 任何不确定都是不可 bypass 的 `hard-stop`。每个 hard-stop 保护
“一项 provider 工作只能有一条可归属事实链、一次明确成本边界、完整 current evidence 才能发布”的
不变量，并返回所属 owner 的一个 repair-and-rerun 或 reconciliation action，不提供 waiver/force。

控制路径遵循 [agent-assistance-and-control.md](../../policies/agent-assistance-and-control.md) 与
[simple-reliable-control.md](../../policies/simple-reliable-control.md)：人只决定 representative scope、
每次精确 provider 成本、真实质量和最终交付；Agent 根据当前 workflow 提出样本、呈现 direct facts，
并在 owner-issued authorization 后执行机械步骤；JS/CLI 是 plan/grant/attempt/bytes/provenance/CAS 的
唯一 writer 和 evaluator。本 change 复用既有 selected-workflow adapters、raw owner、review owner 和
delivery chain，而不是增加批处理脚本、第二 full plan、parallel ledger 或 Controller side evaluator。
失败一律在最早缺失的 direct fact 短路，修复后重跑同一 checkpoint。

## Capabilities

### New Capabilities

- None. Progressive production extends existing raw lifecycle, finalization, CLI, state/inspection, Controller,
  and run-bundle ownership boundaries; a new capability would duplicate those stable owners.

### Modified Capabilities

- `image-generation`: define the full-plan projection, exact Pilot/Expansion grants, durable per-item
  claim/submit/commit lifecycle, current materialization reuse, reconciliation hard-stop, Pilot/complete-review
  evidence bindings, and full-plan accepted raw evidence.
- `image-production`: expose preview-only Framed Pilot composition through the same private compiler/evaluator/
  capture contract as finalization, while keeping Pure Pilot full-page bytes and final publication workflow-isolated.
- `pipeline-orchestration`: route one selected workflow through full plan, Pilot, conditional Expansion,
  Complete Raw Review, finalization, delivery, and same-check recovery without reviving full-batch shortcuts.
- `cli-surface`: define the registered progressive page-production operations, fixed exact arguments, bounded
  progress/reconciliation diagnostics, and rejection of `--slides`, bypasses, inferred authorization, and retry flags.
- `node-specification`: preserve only typed Controller decision/evidence handoffs needed for progressive resume;
  keep raw plan, grant, attempt, consumption and materialization facts under their raw owner rather than generic
  node state, and retire the v2 generic raw-authorization record from progressive routing.
- `playbook-execution`: replace the current one-shot raw authorization/generation/review handoff with separate
  selected-workflow Pilot, conditional Expansion, Complete Raw Review and Delivery Review nodes, including the
  small-debt and zero-debt branches; publish one rebuildable, run-scoped Controller collaboration task projection
  that carries only owner-issued references/progress and the typed human decision plus its optional persisted note.
- `run-bundle-layout`: assign canonical, confined owners for append-mostly full-plan containers and immutable plan,
  batch-grant, attempt, provenance, and evidence records without making `_generated/`,
  file names, task projections or directory order authoritative; declare the task projection's rebuildable,
  non-authoritative `_state` location.
- `workflow-inspection`: project the owner-validated progressive lifecycle, current batch progress and one
  nearest legal action read-only for exact runs, including reconciliation, no-debt, and retained Framed local-rebind branches.

## Impact

- **Framework source:** `PPTMAKER_FRAMEWORK/scripts/shared/image2/`, selected `03-framed-image` and
  `04-pure-image` adapters, the private Framed compositor/evaluator, `05-delivery` call ordering,
  `ppt_flow.mjs`, workflow inspection/state interfaces, controller manifest/playbooks, and run-bundle path/layout
  validation. No new runtime dependency, Python path, shell production pipeline or external skill is introduced.
- **OpenSpec:** eight delta specs above. `style-master-generation` remains the only owner of accepted visual
  direction; `slide-identity-and-ordering` remains the only selector/identity authority; `pptx-assembly` and
  `notes-injection` retain their existing final-manifest lineage contracts. This change consumes those contracts
  rather than duplicating their schemas.
- **Tests:** add focused canonical plan/grant/attempt/provenance/CAS and unknown-outcome tests; Framed browser
  proof/composite and Pure-isolation tests; exact pilot/expansion/no-debt/small-debt routing tests; CLI and
  inspection diagnostic/recovery tests; Controller-node/manifest tests; finalization/PPTX/notes regression tests;
  and fresh/resume mock E2E journeys for both Framed and Pure. Test fixtures are minimal synthetic fixtures under
  `tests/` / `tests_e2e/`, never production `deck_*` or `dpt_*` data.
- **Control owner:** JS/CLI owns deterministic validation, persistence and provider submission; MD Controller /
  Agent owns semantic sample recommendation and evidence presentation; humans own explicit cost, Pilot quality,
  complete raw quality and delivery decisions. Controller and task projections only consume runtime records.
- **Run-bundle contract:** `migration`. Existing raw plan/evidence remains inspectable and byte-preserved, but it
  cannot be silently recast as progressive current evidence: an explicitly selected run must be replanned or
  rebuilt through the new owner path. There is no bulk migration, deck scan or automatic production mutation;
  `_generated/` remains rebuildable and is never hand-edited.
- **Out of scope:** a second renderer/review/authorization/materialization authority, per-slide workflow choice,
  parallel provider submissions, direct provider tools, manual state/receipt/hash repair, caller-selected prompt/
  provider/profile overrides, `--slides` compatibility, acceptance of partial Pilot as final evidence, and any
  change to Style Master candidate/promotion semantics or structural-versioning protocol.
