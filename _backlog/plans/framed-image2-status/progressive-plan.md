# 渐进式计划：渲染完整性与前置人工反馈

> [README.md](README.md) 配套文档 | 状态：已对齐 policy 的推进顺序 | 更新：2026-07-30

## 如何使用本计划

进度以可观察 Gate 衡量，而不是以修改了多少文件衡量。每个 phase（阶段）结束时，repository 必须保持 green、只保留一条权威路径，并建立下一阶段所需契约。

未来四个 OpenSpec change 必须严格串行：

```text
converge-framed-render-contract
  Phase 0 -> Phase 1 -> Phase 2 -> Phase 3 -> Phase 4 -> Phase 5
                                                            |
                                                validate + archive
                                                            |
                                                            v
restore-target-raw-review-evidence
                                      Phase 6 -> Phase 7 -> validate + archive
                                                                      |
                                                                      v
establish-target-style-master-feedback
                                      Phase 8 -> Phase 9 -> validate + archive
                                                                      |
                                                                      v
introduce-target-pilot-runs
                         Phase 10 -> Phase 11 -> Phase 12 -> Phase 13
                                                                      |
                                                          validate + archive
```

这个顺序属于 administrative sequencing（管理顺序），不是新的 runtime Gate。它防止共享 raw-review 工作依赖尚未接受的 profile identity；在渐进提交前先建立已接受视觉参考；并让 Pilot Run 在不引入并行依赖的情况下，消费生产等价的 render/review contracts。

所有阶段都必须：

- 应用 [README.md](README.md) 链接的三项 policy；
- 优先删除或复用，不优先增加 validator、state field、retry 或 recovery branch；
- 在最早失效的 authority/prerequisite 处停止；
- 返回一个有界 root cause 和唯一最近合法动作；
- 通过 owner 修复，再重跑同一个 checkpoint；
- 绝不要求人重复执行 Agent 合法可做的常规机械工作；
- 绝不把人类决定变成绕过 integrity 或 authorization 的手段。

## Phase 0：冻结 Policy、权威与规格

**目标：** 在修改代码前，把本计划转化为 policy 完整、可执行的契约。

工作：

- 创建 OpenSpec change `converge-framed-render-contract`；
- 引用 `human-centered-gates.md`，为每个可见结果分类，并为每个 `hard-stop` 指明 protected invariant 与合法恢复路径；
- 引用 `agent-assistance-and-control.md`，记录直接 Source of Record（事实源），以及 human/Agent/runtime handoff；
- 引用 `simple-reliable-control.md`，回答全部五个 blocking-rule admission 问题，并证明 net simplification（净简化）；
- 记录四个领域词汇：preset、render profile、layout proof 和 derived output；
- 把规范化的浅色 `standard-v1` frame 指定为视觉权威；
- 规定 `render_profile_digest`、其精确输入/排除项，以及它与 raw contract 的传递性绑定；
- 按 owner 和用途区分 Framed render profile、provider generation profile 与 raw review projection/capture profile；
- 规定最短控制闭环：

```text
直接 source/profile/runtime 事实
  -> 一个 layout evaluator
  -> 一个 repair action，或成功后的 materialization
  -> 修复后重跑同一 checkpoint
```

- 在列出 Modified Capabilities 前审计既有 capabilities；只纳入 requirement-level 行为变化，绝不把纯实现/测试列入；
- 记录 framework source scope、JS 与 MD/Agent 的 control ownership，以及 `compatible` 的 run-bundle 影响：通过 owner rebuild 恢复，但不迁移 deck；
- 明确移除陈旧的 mixed-workflow 解释；
- 保留既有 raw-review 和 provider-authorization 决定，不发明新的 confirmation 或 waiver。

退出 Gate：

- `openspec validate converge-framed-render-contract --strict` 通过；
- proposal、specs、design、tasks 遵守 `openspec/config.yaml` 中各自规则；
- 每个确定性失败都有一个 owner、一个 outcome、一个 invariant、唯一最近动作和一个 focused negative scenario；
- 没有 delta 引入另一套 controller、approval、waiver、retry、fallback、持久化 layout proof 或 source-grammar field；
- compatibility 与 raw-rebuild policy 没有未决问题。

## Phase 1：规范事实并建立身份

**目标：** 在引入浏览器控制前建立确定性 identities。

工作：

- 规范化 `standard-v1`：移除重复 opacity、未使用 border 和非权威 padding，同时保留预期浅色 frame geometry；
- 引入规范 render-profile construction 与 digesting；
- 通过既有 plan hash，把 profile digest 绑定进 Framed raw-contract contribution 和 authorization scope；
- 定义与像素相关的 font render-inventory identity，以及稳定的 compiler、runtime 和 capture identities；
- 更新 refresh classification，使 profile drift 成为 raw-rebuild debt；
- 不把 source text、page measurements 和所选 per-page shard lists 纳入 profile identity；
- 不增加 parallel profile registry 或 state record。

Focused tests：

- canonical identity 不受 object insertion order 和 host paths 影响；
- 仅涉及 legal/provenance 的 font metadata 不触发 pixel invalidation；
- 每个与像素相关的 profile input 变化都会改变 digest；
- text-only 变化不改变 profile 或 underlay contract；
- preset/profile 漂移通过既有 owner 使旧 raw evidence 失效；
- 缺少 profile digest 的 Framed raw contract 不能物化 plan。

退出 Gate：

- identity 与 invalidation tests 在不启动 Chromium 的情况下通过；
- 直接 preset/font/runtime owners 保持权威；
- 既有 evidence 走已记录的 owner rebuild path，不存在静默 compatibility fallback。

## Phase 2：用一个 Renderer 替代竞争性检查

**目标：** 让一个私有 evaluator 同时拥有 proof 与 pixels。

工作：

- 引入私有 `framed_render_contract` 职责：`describeFrame`、`verifyFrames`、`composePages`；
- 实现一个内部 browser layout evaluator，由 plan verification 与 final composition 共同复用；
- HTML/CSS 只能从规范化 preset facts 派生；
- 为 inventory 与 code-point shard selection 增加窄接口 font-owner helper；
- 只嵌入所需 checked-in WOFF2 assets，禁止把 system fallback 或 network loading 当作成功；
- 检查精确 panel/field rectangles、scroll bounds、按 y 分组的 line counts、leaf markers，以及条件式 custom-font evidence；
- 移除 heuristic authorization authority、相互竞争的 hard-coded frame CSS、调用方可信的 `preflight`，以及公共任意 `compose` 注入；
- substitution 只保留在私有 runtime owner 之下。

前置条件顺序：

```text
source schema/identity
  -> preset + font inventory 完整性
  -> pinned runtime 就绪
  -> browser layout evaluation
```

更早的失败必须短路所有依赖症状。前置条件全部通过后，可以收集相互独立的 page/field failures，但只能形成有界集合，且只有一个动作：修复 source，并重跑同一 plan checkpoint。

Focused tests：

- 两种 callout variants 都精确复现 preset geometry 与浅色 palette；
- 可适配且被 Latin、Simplified Chinese 或混合 code points 覆盖的文字通过；
- 不支持的 code points 返回有界 source root cause；
- 已知 28 个 `W` 的 false acceptance 被拒绝；
- long tokens、额外 title lines、scroll overflow、错误 panels、缺失 markers、noncustom fallback、被禁止的 network access 和错误 capture size，都在各自所属 prerequisite/invariant 处失败；
- 一个 browser process 验证一个有界 multi-slide batch；
- 公共 Framed workflow 恰好只有一个 compositor/evaluator owner。

退出 Gate：

- 不再存在竞争性 fit authority 或 compositor CSS；
- 失败为 fail-closed，且无 fallback/retry；
- 所有 negative cases 都证明 provider submission 为零，且没有 wrong-owner write。

## Phase 3：先证明，后物化计划

**目标：** 防止未经证明的 frame 改变 state 或成为可授权计划。

工作：

- 把 planning 拆成只读 candidate source/contract compilation、一次有界 batch verification，以及成功后的 materialization；
- 引入只读 candidate source resolver，不在 proof 前调用当前会写入的 `resolveTargetSourceContext()`；
- 仅在整个 batch 通过后物化 source state/receipt 与 raw plan；
- partial write failure 时保留精确 source epoch 与 plan-hash ownership；绝不暴露绑定不一致的可授权计划；
- 让 authorize/generate/review/accept 通过只读 current-source context 加载并验证持久化 plan；
- 这些后续命令不重建/重写 plan，也不启动 Chromium；
- 最终合成使用同一内部 evaluator；任意页面失败时都不发布部分 final manifest。

Focused tests：

- 非法 source identity/schema 在 font/runtime/browser 症状之前停止；
- runtime 不可用时，在 browser 工作和 state writes 前停止；
- layout 失败时，不写 source receipt、state、raw plan 或下游 raw/final artifact；
- 成功 plan 只有在一次 batch proof 后才发出一个 exact hash；
- partial materialization 不能暴露绑定到另一 receipt/epoch 的 plan；
- 后续 raw commands 的 browser launch 为零，且不重写 plan；
- 陈旧 source/profile/plan hash 在 provider 工作前 `hard-stop`；
- repair 后重跑 `image2 plan`，通过同一路径成功；
- final composition 重跑 evaluator，失败时不发布任何内容。

退出 Gate：

- 可见闭环严格是 `direct facts -> evaluator -> one action -> same checkpoint rerun`；
- 不适配或结果未知的 layout 不能进入 provider authorization；
- 在 public boundary 断言 browser launch count、provider submission count 和 owner writes。

## Phase 4：加固 Refresh、Diagnostics 与 Readiness

**目标：** 保留低成本合法路径，同时让每条失败路径都有界且 owner 归属正确。

工作：

- 当 raw、safe-zone、provider 和 render-profile identity 不变时，为 Text Frame-only edits 保留 provider-free local composition；
- 在最终本地合成时证明刷新后的文字；
- notes-only refresh 保持 browser-free，并拒绝 pixel/profile drift；
- profile drift 走 Generated Image Rebuild，structural change 走 exact-hash Structural Versioning；
- 非法 literal/code-point/text fit 映射为 `source_validation`；
- 缺失/损坏 font 或 pinned runtime 未就绪映射为 `environment`；
- preset/compiler invariant contradiction 映射为 `internal`；
- 每项独立 diagnostic 只暴露最小 root set 与唯一最近合法动作，绝不提供 recovery routes 菜单；
- 保留 direct `env-check.mjs` 的 zero-static-dependency startup；只有 package prerequisites 通过后，才动态加载已安装 runtime/font checks；
- 在 `cli-surface` 更新 CLI producer 行为；验证 MD Controller 无需复制 schema 就能消费既有 envelope；
- 只有 consumer behavior 确实变化时，才增加 `node-specification` delta；
- 让 Agent 执行合法授权的机械修复并重跑同一 checkpoint；只有内容含义、provider authorization 或缺失 external power 才停下来交给人。

Focused tests：

- title-only refresh 复用精确 accepted raw bytes，不调用 provider；
- 不再适配的文字在最终发布前 `hard-stop`，且只有一个 source-repair action；
- notes-only refresh 不调用 browser 或 provider；
- profile drift 不能使用 local rebind，且只有一个 owner rebuild action；
- environment failure 只有一个 environment-repair action，绝不归因于 provider；
- internal invariant failure 绝不归因于 source/provider；
- 缺少 `node_modules` 时直接运行 env-check，仍输出正常 structured `guide`；
- producer diagnostics 有界、secret-safe、prerequisite-first，并能在不匹配散文文本的情况下被成功消费。

退出 Gate：

- refresh paths 继续匹配 final-pixel ownership；
- doctor 与 production 对 readiness facts 判断一致；
- 不要求人手工执行确定性 state/artifact repair；
- 不存在新的 CLI override、force flag、continuation、retry loop 或 fallback。

## Phase 5：验证并归档渲染收敛

**目标：** 在共享 raw-review 工作开始前完成第一个 change。

验证阶梯：

1. preset/profile/font-selection unit tests；
2. private compiler/evaluator/browser tests；
3. `tests/03-framed-image/test_framed_workflow.mjs`;
4. shared Image2 artifact/state 与 CLI integration tests；
5. target workflow mock E2E；
6. full `npm test`;
7. strict OpenSpec validation 与 spec/code terminology scan。

归档前：

- 确认陈旧的 `Mixed deck` scenario 不再与 homogeneous version workflow ownership 矛盾；
- 确认每条 blocking rule 都有 admission answers 与 focused negative test；
- 确认合法工作不会被仅涉及 presentation 的差异阻挡；
- 确认没有生产 `deck_*` 数据被用作 fixture/migration target；
- 通过正常 OpenSpec ownership 执行 sync/archive。

退出 Gate：

- `converge-framed-render-contract` 已验证并归档；
- accepted main specs 现已拥有规范 profile 与 control behavior；
- 该 change 没有遗留必需工作。

## Phase 6：恢复既有 Raw-Review 证据

**目标：** 恢复已经接受的人类审查证据，不增加新决定或另一权威。

只能在 Phase 5 完成后开始。

工作：

- 针对现已接受的 profile identity 创建 `restore-target-raw-review-evidence`；
- 引用全部三项 policy，并对当前 review behavior 分类：当前 projection 完整但无决定是 `confirm`；coverage 缺失/不完整/陈旧是 `hard-stop`；
- 在声明 capability changes 前，审计已接受的 `image-generation`、`run-bundle-layout`、`pipeline-orchestration` 和相关 specs；
- 若任务只是恢复既有 accepted behavior，不得虚构 Modified Capability；
- 让每个已选 workflow adapter 产生 ephemeral typed generic review contribution，同时共享 raw mechanics 保持 semantics-blind；
- Framed 提供 safe-zone rectangles 与 `render_profile_digest`；
- 在共享 contact sheet 渲染 guides 与 `position + formal slide_id + title`；
- 把既有 review coverage owner 绑定到精确 raw PNG hashes、workflow contribution digest 和 projection/capture-profile digest；
- raw bytes、safe zones、order 或 profile 漂移时，使 review 失效并重建；
- 保留既有人类 raw-review decision 语义和显式 provider authorization；
- 不增加 OCR、auto-pass、reason schema、waiver、approval、持久化 parallel contribution artifact 或新 state ledger。

在这里，人面对 complete/current review evidence 作出的 `proceed`，是 human content evaluator 的决定，不是对失败确定性检查的 waiver。若未来 proposal 增加 known-risk continuation，它必须绑定版本并记录规范化 human reason；该行为不属于这次恢复范围。

Focused tests：

- complete/current projection 进入既有人类 `confirm`；
- missing/stale coverage 在人类决定能代替检查之前 `hard-stop`；
- 两种 Framed variants 都展示精确 guides 和完整 labels；
- 除 generic evidence correctness 外，Pure 保持不变；
- shared raw mechanics 渲染 generic primitives，但不解释 Text Frame literals；
- repair 通过所属 owner 重建 projection，并返回同一 review checkpoint；
- 复制的 review/final artifact 不能满足当前 evidence。

退出 Gate：

- proposal/design 清楚区分 existing-spec conformance 与真实 requirement change；
- review 继续归人所有且 evidence-complete；
- 不引入额外 visible Gate 或 runtime authority。

## Phase 7：验证并归档 Raw Review

运行共享 raw-review、bundle-layout、orchestration、CLI、mock-E2E 和完整 regression suites。执行 strict OpenSpec validation，再通过正常 workflow sync/archive。

Raw-review Gate：

- 证明 [README.md](README.md) 成功定义中的 render/raw-review 部分；
- 每项 policy admission answer 在可执行行为中继续成立；
- 每次 repair 都通过所属接口返回同一 checkpoint；
- 不存在 production-facing test-only bypass；
- generated artifacts 只通过所属 owner 重建；
- 没有生产 `deck_*` 目录被用作 fixture 或 migration target。

## Phase 8: Specify Early Style Master Feedback

**Objective:** make visual direction an early actual-image decision before
page-scale generation.

Start only after Phase 7.

Work:

- create `establish-target-style-master-feedback` and cite all three policies;
- audit `style-master-generation`, `image-generation`, `visual-config`,
  `visual-asset-management`, `playbook-execution`, `pipeline-orchestration`,
  `cli-surface`, `node-specification`, `workflow-inspection`,
  `run-bundle-layout`, `run-bundle-management`, `environment-check`,
  `framework-charter`, `commands-reference`, and related accepted specs before
  declaring deltas;
- place the Style Master interaction after workflow selection and enough
  content context to judge direction, but before the complete raw plan;
- expose the interaction directly inside both selected-workflow Controller
  paths so neither branch requires a jump through its sibling;
- retain one deck-level Style Master owner and one accepted asset rather than
  duplicating bytes/state per workflow;
- specify provider-free candidate planning, exact one-submit authorization,
  candidate provenance, actual-image review, and promotion of canonical bytes
  only after `proceed`;
- place that authorization under the same state authority as a distinct typed
  `style-master` operation because no raw plan exists yet; prevent it from
  authorizing raw pages and prevent raw grants from authorizing Style Master;
- bind an owner-written acceptance receipt to the exact candidate bytes, style
  intent, and generation profile;
- retain rejected iterations under the existing
  `1_upstream_raw_material/style-master-iterations/` owner;
- allow an existing confined Style Master to be shown and adopted without a
  provider call while making no false historical-provenance claim;
- distinguish a ready scope awaiting authorization (`confirm`) from an
  attempted unauthorized submit (`hard-stop`);
- classify actual current candidate review as `confirm` and missing/stale
  candidate identity or provenance as `hard-stop`;
- restore the clear public name `style-master` as a current Page Authority
  surface by deliberately revising the CLI contract and retired-surface tests;
  do not reuse the removed whole-page adapter or state semantics.

Policy admission for the new durable acceptance fact:

1. Direct source: exact candidate bytes plus owner-written candidate/profile
   provenance and the current human decision.
2. Uncovered failure: file existence cannot prove that the person reviewed
   these exact bytes.
3. Complexity avoided: no metadata visual gate, chat-memory approval, copied
   file, or separate workflow-specific acceptance stores.
4. One recovery: rebuild or re-present through the Style Master owner, then
   rerun the same review.
5. Negative proof: stale bytes/profile cannot promote, wrong-workflow routing
   cannot occur, and a declined candidate makes zero later provider calls.

Exit gate:

- `openspec validate establish-target-style-master-feedback --strict` passes;
- the proposal/design names the one owner, writer, readers, freshness rule,
  lazy existing-byte adoption, and removal/invalidation path;
- Style Master review is neither a waiver nor a substitute for Pilot Run;
- no raw generation can consume an unreviewed newly generated candidate.

## Phase 9: Deliver And Archive Style Master Feedback

**Objective:** complete the early visual loop before adding scoped page
production.

Implementation and focused tests:

- use the retained in-framework Image2 credential/transport owner;
- publish a provider-free exact candidate scope before authorization;
- prove zero provider calls for decline, current reuse, and local adoption;
- write generated candidates to iteration history, not over canonical accepted
  bytes;
- show the actual candidate artifact and bind `proceed|repair|redirect` to it;
- promote exact bytes and acceptance evidence atomically through the owner;
- invalidate the raw generation profile, raw plan, review, and downstream
  evidence when accepted Style Master bytes change, without manufacturing a
  source epoch solely for profile drift;
- verify both Framed and Pure Controller journeys enter the same owner directly
  and never show the other workflow branch;
- test missing/partial/stale provenance, wrong scope, wrong workflow,
  unauthorized submit, interrupted promotion, and same-check repair;
- run focused CLI/Controller tests, target mock E2E, full `npm test`, and strict
  OpenSpec validation.

Exit gate:

- a person can establish, inspect, repair, redirect, and accept Style Master
  before page-scale production;
- accepted current bytes have one direct receipt and one invalidation path;
- `establish-target-style-master-feedback` is validated, synced, and archived.

## Phase 10: Specify Exact Pilot Run Batches

**Objective:** define one safe incremental-production contract for both modes
without creating a shared user-facing workflow.

Work:

- create `introduce-target-pilot-runs` against all three accepted prerequisite
  contracts;
- cite all three policies and answer the five admission questions for exact
  batch authorization, raw materialization provenance, and pilot review;
- compile one canonical complete provider-free raw plan, then project exact
  pilot and remaining batches from it;
- define batch identity as full plan hash plus exact ordered selected IDs,
  selected raw-contract digests, provider profile, source/execution identity,
  and maximum submissions;
- make 3-5 pages the normal Agent-proposed UX, not a hard validator limit;
- require the Agent to present `position + formal slide_id + title + reason`,
  current profile, exact maximum submissions, and remaining count;
- let the human adjust representatives inside the same exact authorization
  interaction instead of adding a selection approval;
- define independent Framed and Pure Controller nodes and review questions;
- define Pilot Run `proceed` as permission to reach expansion authorization,
  never as expansion authorization or partial raw acceptance;
- define a second exact authorization for only current remaining IDs;
- require exact current pilot bytes to survive unchanged into complete raw
  review and final production;
- let a complete scope of at most five pages use one pilot/full review artifact
  and decision rather than duplicate confirmations;
- preserve provider-free Framed Text Frame-only and notes-only refreshes;
- restore the clear public name `pilot` as a current Page Authority operation
  by deliberately updating `cli-surface`, help, command-count/retirement
  contracts, non-v2 fences, and producer diagnostics.

Policy admission for durable pilot facts:

1. Direct sources: the complete raw plan, sole authorization owner, exact raw
   bytes, owner-written materialization provenance, and bounded pilot decision.
2. Uncovered failure: the current all-or-nothing path cannot enforce a smaller
   spend scope or prove that retained pilot bytes came from its exact grant.
3. Complexity removed/avoided: no full-plan preauthorization, count-only grant,
   filename-based reuse, duplicate small-deck review, cross-workflow Controller,
   or second raw success authority.
4. One recovery: repair the named owner and rerun the same plan, authorization,
   materialization, or review checkpoint.
5. Negative proof: an unselected item cannot submit, partial evidence cannot
   finalize, an expansion request before pilot `proceed` returns the current
   pilot `confirm` with zero submit, and valid pilot bytes are not regenerated.

Exit gate:

- `openspec validate introduce-target-pilot-runs --strict` passes;
- every new durable fact has one owner/writer/read set/freshness/removal path;
- state migration and in-progress full-batch authorization behavior are
  explicit and owner-controlled, with no bulk production-deck rewrite;
- Framed/Pure path independence and semantics-blind shared mechanics are
  testable requirements, not documentation convention.

## Phase 11: Build Scoped Authorization And Materialization

**Objective:** establish the mechanical foundation before either workflow
publishes Pilot Run evidence.

Work:

- evolve the existing sole Page Authority authorization owner to retain exact
  immutable batch grants for one current complete plan;
- make the owner record one canonical cumulative grant set while each
  materialized item binds the individual grant that produced it;
- bind grants to exact selected IDs and raw-contract digests, not only count;
- make every provider submit recheck its exact current grant immediately before
  invocation;
- add one owner-written current raw-materialization record that binds each paid
  byte to plan, source, workflow, contract, profile, and authorization grant;
- make that record replace raw-file existence as pre-review provenance rather
  than compete with accepted raw evidence;
- generate only the exact authorized batch and publish no success for uncertain
  or partially unattributable bytes;
- compute remaining scope as complete plan minus validated current
  materializations;
- preserve current pilot items during expansion and reject copied/stale bytes;
- keep accepted raw evidence as the only complete-review finalization input;
- bind complete accepted evidence to the cumulative authorization-record
  digest, never only the latest expansion grant;
- add no inferred authorization, automatic retry, hidden fallback, watcher, or
  second state writer.

Focused tests:

- pilot authorization for IDs A/B/C cannot submit D or all plan items;
- the same count with different IDs fails scope validation;
- expansion authorization cannot retroactively enlarge the pilot grant;
- a latest-grant-only evidence binding cannot cover earlier pilot bytes;
- plan/profile/source/execution drift fails before submit;
- current materialization proves its exact bytes and grant across invocations;
- copied filename, wrong hash, foreign workflow, or missing provenance fails;
- valid pilot bytes are not submitted again during expansion;
- interruption returns one owner-issued exact regeneration action without
  manufacturing success;
- wrong-owner and stale-state writes are prevented with focused negative tests.

Exit gate:

- public integration tests prove exact provider-call IDs and counts for pilot
  and expansion;
- authorization/materialization state is simpler than the paid work it guards
  and has no parallel pass/fail authority;
- no workflow-specific semantics have entered shared raw mechanics.

## Phase 12: Deliver Independent Framed And Pure Pilot Paths

**Objective:** expose early real output while keeping each selected workflow
straight and self-contained.

Framed work:

- let the Agent propose Framed representatives by Text Frame, callout,
  safe-zone, identity, narrative-position, and composition risk;
- generate only authorized text-free underlays;
- compose preview-only pages through the accepted private Framed compiler,
  fonts, layout evaluator, and capture profile;
- show underlay safe-zone evidence and production-equivalent composed pages in
  one human Pilot Run decision;
- prevent preview composition from writing accepted raw evidence, final
  manifest, PPTX, notes, or delivery state;
- route `repair` to the nearest Framed source/visual owner and `redirect` to
  Style Master, with workflow switch remaining Structural Versioning.

Pure work:

- let the Agent propose Pure representatives by text density, complex
  composition, identity, narrative-position, and legibility risk;
- show the exact generated full-page bytes with complete identity/profile
  labels and coverage;
- never import Framed renderer, Text Frame, or safe-zone semantics;
- route `repair` to the nearest Pure source/visual owner and `redirect` to
  Style Master, with workflow switch remaining Structural Versioning.

Shared handoff work:

- on current Pilot Run `proceed`, present but do not infer the exact remaining
  authorization;
- after authorized expansion, build complete raw review from all exact current
  tuples, including unchanged pilot bytes;
- if pilot scope equals complete scope, reuse the complete projection and
  decision as accepted raw review rather than asking twice;
- keep complete review and delivery review human-owned and current-evidence
  bound.

Focused tests:

- both Controller journeys expose only their selected branch;
- the Agent proposal is risk-covering and human-adjustable while runtime exact
  IDs remain authoritative;
- Framed pilot and final composition use one renderer/evaluator;
- Pure pilot bytes equal the raw/final page bytes and invoke no Framed code;
- pilot `repair`/`redirect` invalidates the right evidence and returns to one
  nearest action;
- an expansion request before `proceed` returns the same current Pilot Run
  `confirm` with zero submit;
- expansion submit without exact authorization and partial pilot finalization
  hard-stop;
- 1-5-page scope has zero remaining submits and one visual decision;
- provider-free local refreshes do not enter Pilot Run.

Exit gate:

- real user-facing artifacts appear at Style Master and Pilot Run checkpoints;
- larger batches cannot submit remaining pages before current pilot feedback;
- each mode is independently understandable and complete.

## Phase 13: Validate And Archive Pilot Runs

Validation ladder:

1. exact batch/authorization/materialization unit tests;
2. Style Master/Pilot evidence and invalidation integration tests;
3. Framed production-equivalent pilot browser tests;
4. Pure exact-byte pilot tests;
5. independent Controller/CLI contract tests, including updated command-count,
   retirement, and non-v2 fences for the restored public names;
6. both target mock E2E journeys, including repair and small-scope paths;
7. full `npm test` and appropriate E2E tier;
8. strict OpenSpec validation and framework terminology/ownership scans.

Final gate:

- the complete definition of success in [README.md](README.md) and
  [pilot-run-plan.md](pilot-run-plan.md) is demonstrated;
- all four changes are validated, synced, and archived in sequence;
- every visible outcome maps to `guide`, `confirm`, or `hard-stop` exactly as
  specified;
- each deterministic failure has one direct owner and same-check recovery;
- no production `deck_*` data was used as source, fixture, or migration target;
- no remaining implementation or contract task is deferred implicitly.

## Stop Conditions

Stop and revise the design if any phase requires:

- another pass/fail authority for browser fit;
- Text Frame literals inside `render_profile_digest`;
- a browser launch in every lifecycle command or per field;
- a second persisted layout approval/evidence state;
- source state/receipt mutation before plan-time browser proof;
- shared raw mechanics interpreting Framed Text Frame semantics;
- a human manually repairing deterministic state/artifacts;
- more than one recovery action for the same root cause;
- a force/waiver across identity, integrity, authorization, or evidence
  completeness;
- hidden fallback, retry loop, watcher, daemon, inferred intent, or parallel
  success store;
- system font fallback as success;
- silent accepted-underlay reuse after profile drift;
- OCR as a prerequisite;
- mixed Framed/Pure slides in one version;
- canonical Style Master bytes overwritten before current human `proceed`;
- first-N or a fixed pilot count treated as the creative selection authority;
- a pilot grant that names only a count or authorizes the complete plan;
- remaining pages submitted before current pilot `proceed` and a separate exact
  expansion authorization;
- current pilot bytes silently regenerated during expansion;
- partial pilot evidence accepted as complete raw/final evidence;
- a shared user-facing pilot branch that makes one workflow reason about the
  other;
- a second authorization ledger or filename-based raw success inference.

Any of these means the quality-control layer has become more complex than the
work it validates.
