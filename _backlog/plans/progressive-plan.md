# Progressive Plan: Page Authority 第一阶段收官

> 类型：总控计划（program control） | 状态：进行中 | 更新：2026-08-01
>
> Change 1 已于 2026-07-31 archive 并提交（`fb1940d`）。Change 2 已于 2026-08-01 sync 并 archive；Change 3 尚未创建。

## 目的

把 [framed-image2-status/](framed-image2-status/README.md) 与 [production-conventions/](production-conventions/README.md) 里的未完成工作收成一条直线，完成 Page Authority 第一阶段：

1. 先让 Framed 的 plan-time proof、final pixels 和 raw-review evidence 可信且一致。
2. 再让用户在页面级生产前看到并确认真实 Style Master。
3. 最后用 exact Pilot/Expansion batches 完成可恢复的渐进生产和交付。

## 总进度

下面三个总 checkbox 只在对应 change archive 后勾选，严格从上往下做：

- [x] Change 1：`converge-framed-render-and-review`
- [x] Change 2：`establish-style-master-feedback`
- [ ] Change 3：`introduce-progressive-page-production`

总共只做这 3 个 OpenSpec change，不再拆小，也不并行。前一个 change 没有完成 apply、测试、sync 和 archive，就不 propose 下一个。每个 change 的 Scope checklist 是归档前必须全部交付的范围；具体实现细项由该 change 的 `tasks.md` 跟踪。

## Change 1: Converge Framed Render And Review

**目的：** 先证明 Framed 最终像素与 raw-review evidence 可信。这个 change 不增加新的人类决定。

**Scope 来源：** [现状研究](framed-image2-status/research.md)、[render-contract 设计](framed-image2-status/render-contract-plan.md)、[proposal](../../openspec/changes/archive/2026-07-31-converge-framed-render-and-review/proposal.md)、[design](../../openspec/changes/archive/2026-07-31-converge-framed-render-and-review/design.md)、[tasks](../../openspec/changes/archive/2026-07-31-converge-framed-render-and-review/tasks.md)。

**Scope checklist：**

- [x] [`visual-config`](../../openspec/changes/archive/2026-07-31-converge-framed-render-and-review/specs/visual-config/spec.md) 与 [`html-render-runtime`](../../openspec/changes/archive/2026-07-31-converge-framed-render-and-review/specs/html-render-runtime/spec.md)：规范化 `standard-v1`、render profile 和 checked-in fonts。
- [x] [`image-production`](../../openspec/changes/archive/2026-07-31-converge-framed-render-and-review/specs/image-production/spec.md)：用一个私有 compiler/evaluator/compositor 统一 description、browser proof 和 final composition。
- [x] [`image-generation`](../../openspec/changes/archive/2026-07-31-converge-framed-render-and-review/specs/image-generation/spec.md)：在写 source state、receipt、raw plan 或调用 provider 前完成真实 browser proof；后续命令只读 stored plan。
- [x] [`image-generation`](../../openspec/changes/archive/2026-07-31-converge-framed-render-and-review/specs/image-generation/spec.md) 与 [`run-bundle-layout`](../../openspec/changes/archive/2026-07-31-converge-framed-render-and-review/specs/run-bundle-layout/spec.md)：让 Framed/Pure raw review 都有完整、当前、可归属的 labels、guides 和 coverage。
- [x] [`pipeline-orchestration`](../../openspec/changes/archive/2026-07-31-converge-framed-render-and-review/specs/pipeline-orchestration/spec.md)：保留 Text Frame-only、notes-only 与 structural refresh 的正确边界。
- [x] [`environment-check`](../../openspec/changes/archive/2026-07-31-converge-framed-render-and-review/specs/environment-check/spec.md) 与 [`cli-surface`](../../openspec/changes/archive/2026-07-31-converge-framed-render-and-review/specs/cli-surface/spec.md)：统一 readiness、failure category 和唯一最近合法动作。

**按顺序完成：**

- [x] Propose [`converge-framed-render-and-review`](../../openspec/changes/archive/2026-07-31-converge-framed-render-and-review/proposal.md)，完成 proposal、8 个 capability delta、design、[43 项 tasks](../../openspec/changes/archive/2026-07-31-converge-framed-render-and-review/tasks.md) 和初始 strict validation。
- [x] 按 `tasks.md` 完成全部 43 项实现与测试，不隐式延期。
- [x] 跑 focused、private-browser、integration、CLI、Framed/Pure mock E2E、完整 `npm test` 和适当 E2E tier。
- [x] 再次 strict validate，把 delta specs sync 到 main specs，并 archive `converge-framed-render-and-review`（commit `fb1940d`）。

## Change 2: Establish Style Master Feedback

**目的：** 在任何页面级 raw production 前，让用户先看到真实 Style Master candidate，并把选择变成可恢复、可失效的 accepted visual direction。

**Scope 来源：** [生产约定](production-conventions/README.md)、[Style Master/Pilot 设计](production-conventions/pilot-run-plan.md)、[Style Master tasks](production-conventions/tasks/style-master-tasks.md)、[tasks 投影规则](production-conventions/tasks-overview.md)、[proposal](../../openspec/changes/archive/2026-08-01-establish-style-master-feedback/proposal.md)、[design](../../openspec/changes/archive/2026-08-01-establish-style-master-feedback/design.md)、[24 项 tasks](../../openspec/changes/archive/2026-08-01-establish-style-master-feedback/tasks.md)。

**Scope checklist：**

- [x] [`style-master-generation`](../../openspec/changes/archive/2026-08-01-establish-style-master-feedback/specs/style-master-generation/spec.md)：建立 provider-free candidate plan，绑定 style intent、workflow、generation profile、candidate count、selection scope 与 previous effective-style digest。
- [x] [`style-master-generation`](../../openspec/changes/archive/2026-08-01-establish-style-master-feedback/specs/style-master-generation/spec.md)：取得精确 `style-master` authorization，并由唯一 owner 保存 grant、attempt、consumption、bytes 与 provenance。
- [x] [`style-master-generation`](../../openspec/changes/archive/2026-08-01-establish-style-master-feedback/specs/style-master-generation/spec.md)：每个 candidate 完成后提供可恢复 progress；uncertain outcome 先对账，不自动 retry。
- [x] [`style-master-generation`](../../openspec/changes/archive/2026-08-01-establish-style-master-feedback/specs/style-master-generation/spec.md)：展示真实 candidate bytes 后取得 `proceed | repair | redirect`，未经审查的 bytes 不能成为 effective style。
- [x] [`style-master-generation`](../../openspec/changes/archive/2026-08-01-establish-style-master-feedback/specs/style-master-generation/spec.md)、[`image-generation`](../../openspec/changes/archive/2026-08-01-establish-style-master-feedback/specs/image-generation/spec.md)、[`pipeline-orchestration`](../../openspec/changes/archive/2026-08-01-establish-style-master-feedback/specs/pipeline-orchestration/spec.md) 与 [`run-bundle-layout`](../../openspec/changes/archive/2026-08-01-establish-style-master-feedback/specs/run-bundle-layout/spec.md)：通过 CAS/atomic promotion 保存 effective selection 与 acceptance receipt，并正确失效下游 plan/review/final/delivery evidence。
- [x] [`playbook-execution`](../../openspec/changes/archive/2026-08-01-establish-style-master-feedback/specs/playbook-execution/spec.md)、[`node-specification`](../../openspec/changes/archive/2026-08-01-establish-style-master-feedback/specs/node-specification/spec.md) 与 [`cli-surface`](../../openspec/changes/archive/2026-08-01-establish-style-master-feedback/specs/cli-surface/spec.md)：Framed/Pure 各自拥有独立 Controller entry，同时恢复 current `style-master` CLI、diagnostics、task projection 和 tests。
- [x] [`image-generation`](../../openspec/changes/archive/2026-08-01-establish-style-master-feedback/specs/image-generation/spec.md) 与 [`pipeline-orchestration`](../../openspec/changes/archive/2026-08-01-establish-style-master-feedback/specs/pipeline-orchestration/spec.md)：Change 2 结束时页面级 raw provider calls 仍为零；不提前建立 raw batch lifecycle。

**按顺序完成：**

- [x] Change 1 archive 后，重新读取 main specs/runtime truth；propose [`establish-style-master-feedback`](../../openspec/changes/archive/2026-08-01-establish-style-master-feedback/proposal.md)，完成 7 个 capability delta、[design](../../openspec/changes/archive/2026-08-01-establish-style-master-feedback/design.md)、[24 项 tasks](../../openspec/changes/archive/2026-08-01-establish-style-master-feedback/tasks.md) 和初始 strict validation。
- [x] 完成该 change 的全部 tasks；页面级 raw provider calls 必须保持为零。
- [x] 跑 focused、Controller、CLI、Framed/Pure mock E2E 和完整 regression。
- [x] 再次 strict validate，把 delta specs sync 到 main specs，并 archive `establish-style-master-feedback`。

## Change 3: Introduce Progressive Page Production

**目的：** 在一份完整 provider-free raw plan 上，用 exact Pilot 和 Expansion batches 完成长程生产、恢复、完整审查与交付。

**Scope 来源：** [渐进生产设计](production-conventions/pilot-run-plan.md)、[slide identity](production-conventions/slide-naming.md)、[Pilot tasks](production-conventions/tasks/pilot-run-tasks.md)、[Expansion/Reviews tasks](production-conventions/tasks/expansion-and-reviews-tasks.md)、[历史 negative case](production-conventions/observations/deck-ai-sdlc-keynote-v4-2026-07-30.md)。

**Scope checklist：**

- [ ] 先建立覆盖 full paid-generation range 的 provider-free raw plan，并只用 `mnemonic-v1` formal slide IDs 表达 exact scope。
- [ ] Pilot/Expansion grant 绑定 ordered IDs、raw-contract digests、plan/profile/source identity 与 maximum submissions；不接受 count-only 或 plan-wide inferred authorization。
- [ ] 每项付费工作走 `claim -> submit -> commit`，保存 attempt、consumption、bytes、provenance、progress 与 uncertain-outcome reconciliation。
- [ ] Framed Pilot 使用 Change 1 的同一 renderer 展示 underlay 与 production-equivalent composite，不发布 partial accepted/final evidence。
- [ ] Pure Pilot 展示精确 full-page bytes，不调用 Framed code，也不暴露 Framed 语义。
- [ ] Pilot `proceed` 后才请求 exact Expansion grant；Expansion 原样复用 current Pilot bytes，只提交 remaining paid debt。
- [ ] Complete Raw Review 覆盖 Pilot、Expansion、provider-free reuse 与 retry provenance；partial Pilot 不能 finalization。
- [ ] 1-5 页 paid debt 只做一次完整审查；零 paid debt 不创建 synthetic Pilot；resume 不重复 submit 已完成或 uncertain item。
- [ ] 完成 current `pilot` CLI、task projections、Complete Raw Review、finalization、PPTX、notes、Delivery Review 与两条完整 E2E。

**按顺序完成：**

- [ ] Change 2 archive 后，重新读取 main specs/owners/journeys；propose `introduce-progressive-page-production`，一次完成全部 planning artifacts 和初始 strict validation。
- [ ] 先完成 exact grants 与逐项 materialization/recovery foundation。
- [ ] 再完成 Framed Pilot 和 Pure Pilot 两条独立 journey。
- [ ] 再完成 Expansion、complete raw review、final delivery 和 resume。
- [ ] 跑 focused、browser、integration、CLI/Controller、两条完整 mock E2E、完整 `npm test` 和适当 E2E tier。
- [ ] 再次 strict validate，把 delta specs sync 到 main specs，并 archive `introduce-progressive-page-production`。

## 第一阶段结束

三个 change 都归档后，只做一次最终收口：

- [ ] `openspec status --json` 没有遗留 active change。
- [ ] 三个 archived change 合起来完整覆盖 main specs、framework code、tests 和 Controller 文档。
- [ ] Framed 与 Pure 都通过 fresh/resume 的完整 journey，且每个状态只有一个 owner 和一个最近合法动作。
- [ ] 没有 inferred authorization、hidden retry/fallback、parallel ledger、cross-workflow Controller 或手改 `_generated/`。
- [ ] 没有把生产 `deck_*` / `dpt_*` 当 framework source、fixture 或自动 migration target。
- [ ] 两个原计划目录没有未归属或隐式 deferred 的事项。
- [ ] 将本计划移入 `_done/_closed_plans/`，Page Authority 第一阶段结束。

## 原材料归属

| 原材料 | 唯一归属 |
| --- | --- |
| [Framed research](framed-image2-status/research.md)、[render-contract plan](framed-image2-status/render-contract-plan.md)、[旧 Phase 0-7 映射](framed-image2-status/progressive-plan.md) | Change 1 |
| 原 raw-review restoration 工作 | 合并进 Change 1，不单开 change |
| [旧 Phase 8-9](framed-image2-status/progressive-plan.md)、[Style Master 设计](production-conventions/pilot-run-plan.md)与 [tasks](production-conventions/tasks/style-master-tasks.md) | Change 2 |
| [旧 Phase 10-13](framed-image2-status/progressive-plan.md)、[Pilot/Expansion/recovery 设计](production-conventions/pilot-run-plan.md)与 [tasks](production-conventions/tasks-overview.md) | Change 3 |
| [slide naming](production-conventions/slide-naming.md) | Accepted baseline，由 Change 3 复用，不单开 change |
| [历史 observation](production-conventions/observations/deck-ai-sdlc-keynote-v4-2026-07-30.md) | 只作为 Change 3 negative test 输入，不读取或迁移 production run |

## 不变边界

- 任一时刻最多一个 active change。
- 不增加第二个 renderer、review、authorization 或 materialization authority。
- 不用 waiver/force 跨过 identity、integrity、authorization 或 evidence completeness。
- 不把可重建 proof、remaining scope 或 Markdown checkbox 写成 runtime truth。
- 不让 shared mechanics 理解 Framed/Pure 语义，也不让用户理解未选择的 sibling workflow。
