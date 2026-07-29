# Plan: Page Authority Workflow OpenSpec Progressive Delivery

> 类型: OpenSpec 落地规划 | 更新: 2026-07-29 | 状态: 原 change 与 compatibility hygiene change 均已归档并提交、主规格已同步；H.10 的项目版本决策仍待用户授权。其后的 legacy 吸收与退休已登记为独立的未来阶段，尚未提案或实施。

## 进度跟踪

### 当前快照

| 工作流 / 阶段 | 状态 | 完成信号 / 下一步 |
| --- | --- | --- |
| 规划基线 | 已完成 | one-change 决策、范围与 CURRENT/TARGET 不变量已由 archived change 吸收。 |
| Phase A - OpenSpec artifacts | 已完成 | 39/39 tasks、proposal、design 与 14 个 delta 已验收并归档。 |
| Wave 0 - Baseline | 已完成 | CURRENT v1 边界与 provider-free baseline 保持覆盖。 |
| Wave 1 - Artifact seams | 已完成 | typed raw/evidence/final-manifest seams 与 shared-boundary 测试已完成。 |
| Wave 2 - Workflow owners | 已完成 | `03-framed-image` 与 `04-pure-image` 独立 owner 已上线。 |
| Wave 3 - Shared delivery | 已完成 | `05-delivery` 成为 Framed、Pure 与 CURRENT compatibility 的唯一 delivery owner。 |
| Wave 4 - TARGET routing and iteration | 已完成 | v2 marker/state/controller/inspection 与 `06-iteration` 已上线。 |
| Wave 5 - CURRENT boundary and activation | 已完成 | fresh Framed、fresh Pure、CURRENT mixed boundary 全部通过 E2E。 |
| Wave 6 - Cleanup and change close | 已完成 | superseded owners 清理、inventory 审计、focused/完整验证与 main-spec review 均完成。 |
| Archive / handoff | 已完成（版本决策待授权） | `H.1`–`H.9` 已完成：specs 同步、archive 与 commit 已完成；`H.10` 的项目版本决策待用户授权。 |
| Post-archive compatibility hygiene | 已完成并归档 | `HC.2`–`HC.8`、`HC.CP` 已由 cleanup change 的 focused/process/E2E、ownership/docs、full core verification、main-spec sync 与 archive/commit 直接证明。 |
| Legacy absorption and retirement | 已规划，未提案 | 先将仍有价值的 v1 语义吸收进 v2/shared 或一次性迁移交付物，再删除所有 active compatibility、v1 协议与过时 main specs 表述。 |

### 更新规则

- `[ ]` 表示尚无已接受的完成证据；只有满足该项写明的条件，并在证据日志追加对应记录后，才可改为 `[x]`。
- Checkpoint 只有在其直接前置 checklist 项和写明的 checkpoint 条件都满足后才能勾选。可以准备后续 wave，
  但前一个 checkpoint 未关闭时，不得报告后续 wave 已完成。
- 工作无法推进时，保持 checkbox 未勾选，将当前快照状态改为 `阻塞`，并在证据日志记录 blocker、owner 和
  next decision；不得把 blocker 改写成已完成任务。
- 每个 implementation session 结束时，更新当前快照、本文 `更新` 日期和证据日志；证据应指向相关的
  OpenSpec artifact、commit、test command 或 review。

### 证据日志

| 日期 | 项目 ID | 状态变化 | 证据 / 说明 | 下一步 |
| --- | --- | --- | --- | --- |
| 2026-07-29 | Plan tracker | 已初始化 | 已将执行计划转换为 checklist；`openspec list --json` 显示没有 active change，尚未开始实现。 | 创建 `separate-framed-pure-workflows` 并开始 `A.1`。 |
| 2026-07-29 | A.1 | 已完成 | 已创建并最终归档 [`separate-framed-pure-workflows`](../../openspec/changes/archive/2026-07-29-separate-framed-pure-workflows/)。 | 历史记录；artifacts 已归档。 |
| 2026-07-29 | A.2 / G1-G6 | 已完成 | [`design.md`](../../openspec/changes/archive/2026-07-29-separate-framed-pure-workflows/design.md) 锁定 v2 identity、CURRENT boundary、artifact seams、controller/CLI route、refresh semantics 及 activation/verification budget。 | 已投射到归档 delta 与主规格。 |
| 2026-07-29 | A.4 | 已完成 | `design.md` 已固定 identity/schema、owners、import rules、migration/rollback 和 test tiers。 | 用 `tasks.md` 拆成可执行 waves。 |
| 2026-07-29 | A.3 | 进行中 | 已写入 10/14 个 proposal capability delta；尚余 `commands-reference`、`framework-charter`、`framework-directory-layout`、`framework-script-layout`。 | 完成剩余 delta 后核对 proposal/spec 目录一一对应。 |
| 2026-07-29 | A.3 | 已完成 | 已写入 14/14 个 delta；proposal capability 列表与 `openspec/changes/separate-framed-pure-workflows/specs/` 目录一一对应。 | 编写 `tasks.md`。 |
| 2026-07-29 | A.5 | 已完成 | `tasks.md` 已按八个依赖组写入 39 个可追踪 implementation task；OpenSpec status 显示 proposal/specs/design/tasks 全部完成。 | 运行 strict validation 并修复 planning defects。 |
| 2026-07-29 | A.6 | 已完成 | `openspec validate separate-framed-pure-workflows --strict` 与 `openspec validate --all --strict` 均通过；proposal/design 已补上上游 plan 链接、terminology ledger，并将 v1/v2 finalization 与 fresh-controller requirement 改为显式 `MODIFIED` delta，避免 merge 后语义冲突。 | 关闭 A.CP，进入 Wave 0 baseline。 |
| 2026-07-29 | A.CP | 已完成 | design gates 已闭合，strict validation 与 `git diff --check` 通过；`git status` 确认 framework source、tests、accepted main specs 未移动。 | 从 W0.1 冻结 CURRENT observable baseline。 |
| 2026-07-29 | W0.1-W0.4 / W0.CP | 已完成 | v1 marker/state/parser、inspection 与 architecture baseline 已由 provider-free focused tests 覆盖；新增 v2 marker/state negative fixtures不使用 production deck data。`npm test`、focused architecture/inspection tests 和 strict change validation 均通过，无 unrelated baseline failure。 | 从 W1.1 建立 typed artifact seams，fresh init 仍保持 v1。 |
| 2026-07-29 | W1.1 / OpenSpec 2.1-2.2 | 已完成 | 新增 v2 RawWorkPlan、AcceptedRawEvidence、FinalSlideManifest contract；shared raw seam 仅消费 opaque typed plan，并通过既有 state authorization owner 绑定 workflow/receipt/profile/scope。未授权 prerequisite 时 provider callback 为零；focused contract、state、architecture tests 通过。 | 完成 W1.2 的 common final-manifest helper 与 delivery-facing validation。 |
| 2026-07-29 | OpenSpec 2.3-2.5 | 已完成 | common final-manifest helper 只接受 current plan-bound accepted evidence，逐项校验 final bytes；缺失/漂移仅返回 owner rebuild action。覆盖 source/profile/byte drift、cross-protocol、partial evidence、wrong owner 和 failed prerequisite；architecture contract 禁止 shared raw/final helper 按 workflow semantic 分支。 | 建立 `03-framed-image` 与 `04-pure-image` sibling boundaries。 |
| 2026-07-29 | OpenSpec 3.1 / 3.2 进行中 | 进行中 | 已建立 `03-framed-image`、`04-pure-image` import-safe owner interfaces、source-to-test inventory 与 sibling-import 禁止；Framed adapter 已接管 target receipt 的 `standard-v1` preflight、reserved-underlay evidence、text-free raw contribution 和 common final-manifest publication入口。capture runtime/Framed local refresh 与 Pure adapter 尚待迁移。 | 完成 3.2 的 runtime/refresh owner 迁移，再实现 3.3 Pure adapter。 |
| 2026-07-29 | OpenSpec 3.3 | 已完成 | `04-pure-image` 现在独立写入 Pure typed raw plan，只从 current accepted evidence 发布 common final manifest，并将 source/display drift 归类为 raw rebuild debt；workflow/architecture focused tests 通过。 | 完成 Framed local refresh/invalidation，并验证两个 adapter 的独立 publication。 |
| 2026-07-29 | W1.2–W5.CP / OpenSpec 2.3–7.4 | 已完成 | 完成 sibling adapters、shared delivery、v2 state/controller/inspection、workflow-aware iteration、CURRENT v1 bounded compatibility 与 fresh TARGET activation。 | 运行收尾验证、清理 superseded owners 并 archive。 |
| 2026-07-29 | W6.CP / V.1–V.8 / H.1–H.8 | 已完成 | focused target tests 95/95、process checks 28/28、full E2E 18/18、`npm test`、`git diff --check`、change strict validation 与全库 strict validation 均通过。 | 同步主规格并 archive。 |
| 2026-07-29 | H.9 | 已完成 | OpenSpec archive 同步 14 个 capability specs（+16 / ~4），归档至 [`2026-07-29-separate-framed-pure-workflows`](../../openspec/changes/archive/2026-07-29-separate-framed-pure-workflows/)，提交为 `058e6ff feat: separate framed and pure workflows`。 | 如需发布，先由用户决定项目版本策略。 |
| 2026-07-29 | H.10 | 待用户授权 | 归档、主规格同步与提交已完成；尚未执行 `project-versioning` 判断或修改版本号。 | 用户决定是否评估/调整项目版本。 |
| 2026-07-29 | HC.0 | 已记录 | 对 compatibility 目录做只读盘点；临时 exact v2 run 证明 `ppt_flow status` 会在保留 `source-receipt-v2.json` 的同时错误写入 v1 `source-receipt.json`。同时发现未被生产调用的 `scripts/05-iteration` wrapper，以及只含过期 README 的 `tests/05-iteration`、`tests_e2e/04-image-production`、`tests_e2e/05-iteration`。 | 以独立 cleanup change 固化范围、迁移方案和验证。 |
| 2026-07-29 | HC.1 | 已完成 | 已建立并归档 [clean-current-v1-compatibility-boundary](../../openspec/changes/archive/2026-07-29-clean-current-v1-compatibility-boundary/)；proposal、design、五项 delta specs 与依赖排序 tasks 完整，设计锁定 read-only observation seam、`compatibility/current-v1-page-authority/` logical home、无长期 re-export 的迁移及回滚边界。 | HC.2 起实施已完成。 |
| 2026-07-29 | HC.2–HC.7 / HC.CP | 已完成 | [implementation evidence](../../openspec/changes/archive/2026-07-29-clean-current-v1-compatibility-boundary/implementation-evidence.md) 记录了零写 status/state temporary-bundle snapshots、selected Framed/Pure 与 exact v1/hybrid journeys、compatibility relocation、ownership/link/retirement audits、`npm test`、`git diff --check` 与 strict validation。无生产 bundle 被作为 fixture 或修改。 | HC.8 closeout 已完成；H.10 仍待用户单独授权。 |
| 2026-07-29 | HC.8 | 已完成 | 五份 delta specs 已同步至 main specs；change 已归档至 [`2026-07-29-clean-current-v1-compatibility-boundary`](../../openspec/changes/archive/2026-07-29-clean-current-v1-compatibility-boundary/)，提交为 `51b69bb chore: clean current v1 compatibility boundary`。`openspec validate --all --strict` 为 29/29 通过。 | H.10 仍待用户单独授权。 |

## 阅读说明 / 本文边界

本文只回答“如何把已经对齐的 TARGET 通过 OpenSpec 落地”，不重新定义目标架构。
以下两份文档是本计划的上游输入：

- [`page-authority-workflow-baseline-target-gap.md`](page-authority-workflow-baseline-target-gap.md)
  固定 CURRENT Baseline、TARGET Model 与 implementation gap；
- [`framed-image-directory-ssot.md`](framed-image-directory-ssot.md)
  固定 `03 Framed` / `04 Pure` sibling workflows、shared raw seam、`05 Delivery`、
  `06 Iteration` 与 owner/SSOT 边界。

本文负责 OpenSpec change 的数量、artifact 职责、capability delta 预算、design gates、
实施波次、验证检查点和拆分触发条件。若本文与上游两份文档发生目标语义冲突，先修正文档
之间的矛盾，再创建 change；不得让 proposal 靠聊天上下文选择其中一种解释。

截至 2026-07-29，change
[`separate-framed-pure-workflows`](../../openspec/changes/archive/2026-07-29-separate-framed-pure-workflows/)
已完成实施、同步主规格、archive 并提交。实现未读取或迁移任何 `deck_*`、`dpt_*` 或 `_generated/`
生产数据；新 authoring 的生产权威为 v2 once-per-version workflow，CURRENT
`page-authority-image2-v1` 保留为显式 bounded compatibility。

## 一页决策

| 项目 | 决策 |
| --- | --- |
| OpenSpec change 数量 | **1 个** |
| 暂定 change ID | `separate-framed-pure-workflows` |
| Change domain | framework repository maintenance |
| New capabilities | 默认 `None`；优先扩展现有稳定 capability |
| 实施方式 | 一个 change 内分波次、分 checkpoint、分 commit；最后才开放 TARGET 新入口 |
| Archive | 所有 TARGET、CURRENT compatibility/migration 与 regression 条件同时满足后只 archive 一次 |
| 术语策略 | 默认保留；只有与 TARGET 行为直接冲突或造成机械歧义时才改 |

### 为什么一个 change 合理

这次迁移的原子不变量不是目录移动，而是下面这条完整链：

```text
new production identity
  -> one version-level workflow receipt
  -> exactly one of 03 Framed / 04 Pure
  -> one final-slide manifest contract
  -> shared 05 Delivery
  -> workflow-aware 06 Iteration
  -> explicit CURRENT mixed-run boundary
```

链中的任意一段若单独 archive，都会产生不受支持的中间态。例如：

- 先改 source 但没有两条完整 workflow，新的 source identity 无合法执行者；
- 先移动 `03` / `04` 但不改 source/state，用户仍会被逐页 authority dispatch；
- 先拆 delivery 但没有统一 manifest contract，会出现两份 delivery truth；
- 先切 controller 但没有 CURRENT mixed-run 决策，会把现有合法 run 变成隐式 fallback；
- 先单独做“术语 change”，会让 main specs 在行为尚未改变时提前描述 TARGET。

因此，按 capability、目录或提交大小拆成多个 change，不能得到独立可交付的行为边界，反而会
让后续 change 重新建立迁移上下文。一个 umbrella change 更符合 OpenSpec 用 proposal 保存
WHY、用 delta specs 保存 WHAT、用 design 保存 HOW、用 tasks 保存依赖次序的职责。

这并非超出本仓库惯例。近期历史 change 的 delta capability 数量为：

| Archived change | Delta capability 数 | 与本迁移的可比性 |
| --- | ---: | --- |
| `introduce-page-authority-image2` | 21 | 新 production identity、source/state、raw、delivery、controller 与 E2E 同 change |
| `retire-legacy-production-surface` | 27 | 跨 runtime、CLI、controller、docs、main specs 的原子退役 |
| `realign-image-production-and-framework-governance` | 10 | 目录 owner、adapter、state 与治理同步迁移 |

本计划当前识别 14 个 likely-required delta capabilities，另有少量 conditional capabilities。
规模处于已验证范围内。文件多、task 多或需要多个 commit 都不是拆 change 的理由；真正的
判断标准是能否形成独立、可部署、可回滚且不会留下双重 authority 的行为边界。

### 一个 change 不等于 big-bang implementation

Change 是一份共同上下文和最终 acceptance envelope，不是一次性大提交。实施必须满足：

1. 每个 wave 有独立完成判据和 focused verification；
2. CURRENT 路径在 TARGET 尚未完整时保持 green；
3. TARGET marker 只在 source/state/workflow/delivery 全链通过后注册到 public resolver/init；
4. 不引入长期 feature flag、双写 state 或 compatibility re-export 来掩盖半迁移；
5. change 未完成时保持 active，不提前 sync/archive 部分结果。

## Scope Fence

### 本 change 内完成

- TARGET 的可机械区分 production marker、version-level workflow selection 与 source receipt；
- CURRENT `page-authority-image2-v1` mixed-run 的明确 compatibility 或 structural migration 合同；
- `RawWorkPlan`、`AcceptedRawEvidence`、final-slide manifest 三个 artifact seams；
- shared raw mechanics 与互不 import 的 `03-framed-image` / `04-pure-image` adapters；
- authority-agnostic `05-delivery`，包括 final projection、PPTX、notes 与 delivery review；
- `06-iteration`、MD Controller、state/inspection metadata、workflow/docs 与目录 contract；
- old branch/path cleanup、architecture ownership tests、integration/E2E 与 main-spec coherence。

### 明确不顺带做

- Image2 provider、model、transport、credential 或审美质量的重新设计；
- visual-language registry、stable slide identity 或 structural transaction 的无关重构；
- 第三个 TARGET mixed workflow 或 per-slide escape hatch；
- 对具体 `deck_*` 做原地批量迁移、手工改 state/receipt 或复用 `_generated/`；
- 与本迁移无关的 CLI 改版、术语清扫、capability 重命名或文档润色；
- 为了“以后可能复用”而新增 generic coordinator、state layer、validator 或 recovery mode。

若上述非目标成为完成 TARGET 的真实前置条件，按文末 Split Triggers 重新评估，而不是静默扩 scope。

## 术语最小变更策略

本迁移改变的是选择粒度和 workflow ownership，不要求全面改写 Page Authority 词汇。Proposal
与 design 必须带一份小型 terminology delta ledger，把词分成三类：

| 类别 | 默认处理 | 当前例子 |
| --- | --- | --- |
| 稳定概念 | 原样保留 | `Page Authority`、`Image2`、Pure、Framed、Text Frame、stable `slide_id`、raw evidence、final manifest、PPTX assembly、notes injection |
| Design shorthand | 先作为 interface 概念使用，不自动改公开 schema/文件名 | `RawWorkPlan`、`AcceptedRawEvidence`、`FinalSlideManifest` |
| 与 TARGET 冲突的合同 | 只修改 owning requirement；CURRENT v1 语义保留并明确标记 | “新 deck 每页选择 authority”、generic upper-level Pure/Framed dispatch、`02` 拥有 Framed preset |

具体规则：

1. `Page Authority` 继续作为 production/integrity umbrella，不因上层分成两条 workflow 而改名。
2. `pure-image2` / `framed-image2` 的 CURRENT bytes 与 CURRENT per-slide 含义不变。TARGET
   workflow value 的拼写由 design gate 决定；优先沿用现有概念词，但不得让同一 source/state
   bytes 被两套语义接受。
3. TARGET 必须有新的 versioned source marker 和 source receipt schema。State mode 只有在
   复用会造成 resolver/state ambiguity 时才换名；不能为了“看起来是 v2”机械改名。
4. Main-spec requirement 标题只在标题本身已变成错误陈述时调整。可以通过限定 CURRENT v1、
   新增 TARGET requirement 或完整 `MODIFIED` requirement 表达差异时，不做额外 `RENAMED`。
5. Capability 名称默认全部保留，尤其继续使用 `image-production`、`image-generation`、
   `pipeline-orchestration`、`pptx-assembly` 与 `notes-injection`；目录重排不是新 capability 的理由。
6. `03` / `04` / `05` / `06` 是 Method Module 编号，不触发 Pipeline Stage 1–5 的全局改名或
   重编号。只修正真正引用旧 method-module path/owner 的合同。
7. `Header Text & Style Refresh` 先做语义审计：若它仍能作为清晰的用户意图并按 selected
   workflow 路由，则保留；若名称承诺了 TARGET 不存在的单一路径，只改这一个冲突术语。

这份 ledger 的目的不是制造迁移工作，而是明确证明哪些词**不需要改**。

## OpenSpec Change Contract

### Change identity

建议使用：

```text
separate-framed-pure-workflows
```

Change ID 描述长期行为结果，不包含 `03/04` 编号、文件移动或一次性 migration 手段。
Proposal 必须直接链接本文的两份上游计划，但仍需自足保存 CURRENT、TARGET、关键约束和
为何 one change 的结论，确保后续 Agent 不读取聊天也能工作。

### Artifact 分工

| Artifact | 必须保存的内容 | 不应保存的内容 |
| --- | --- | --- |
| `proposal.md` | WHY、one-change 原子边界、已定 TARGET、非目标、capability 合同、CURRENT compatibility 影响、三项 policy | 具体函数、目录移动步骤、完整 schema |
| `specs/*/spec.md` | owning capability 可观察、可测试的 WHAT；CURRENT 与 TARGET 的无歧义行为；gate/diagnostic outcome | 相邻 capability 的 schema 副本、纯实现移动、测试文件清单 |
| `design.md` | production identity、receipt/state、compatibility、artifact interfaces、owner/import、activation/rollback、验证策略与取舍 | proposal 动机复述、main-spec 正文镜像 |
| `tasks.md` | 按依赖排序的 waves、capability 标签、完成判据、negative tests、strict validation 与 archive gate | 按目录罗列但无行为完成判据的搬家清单 |
| `verification.md`（可选） | 长 change 的 checkpoint 命令、结果、baseline exception 与剩余风险 | 第二份 task 状态或新的 runtime authority |

Artifact review 顺序遵守 repo 规则：proposal 固定 scope/capability contract，delta specs 固定
WHAT，design 固定 HOW，tasks 才授权 apply。Specs 与 design 可以迭代对齐，但在全部 design
gates 关闭前不得开始 framework relocation。

### Policy application

Proposal、specs 与 design 必须显式引用：

- `openspec/policies/human-centered-gates.md`：workflow choice 是一次 source-owned semantic
  decision，不是每页重复 gate；provider authorization 与视觉 review 仍是 confirm；identity、
  schema、authorization、evidence、bytes 与 lineage mismatch 仍是 non-waivable hard-stop。
- `openspec/policies/agent-assistance-and-control.md`：人只决定 workflow、内容和视觉判断；
  Agent/JS 完成 canonical receipt、机械路由、校验、重建与 recovery；MD 不复制 evaluator。
- `openspec/policies/simple-reliable-control.md`：marker-first resolver、一个 workflow receipt、
  一个 raw evaluator、一个 delivery truth、一个 nearest legal repair；新增 control 必须删除或
  合并旧 dispatch/validator，而不是叠一层。

## Required Design Gates

以下 gate 可以在同一个 change 的 proposal/specs/design 迭代中解决，但在 `apply` 前必须全部
关闭。未决项不得藏进 task 文案交给实现者临场猜测。

### Gate 1 - Minimal identity and terminology

必须锁定：

- TARGET `production.pipeline` marker；
- version-level workflow field 与两个合法值；
- source receipt schema/version 和 canonical hash input；
- state mode 是保留还是 version-separate，以及 marker/state pair 的 resolver 规则；
- CURRENT literals 在 compatibility route 中的唯一含义；
- terminology delta ledger 的 keep/change 决定。

Exit：给定任意 source/state bytes，resolver 只能得到 CURRENT、TARGET Framed、TARGET Pure、
recognized historical 或 repair/error 中的一个结果；不存在缺字段猜测、artifact/path 推断或
双 parser 接受。

### Gate 2 - CURRENT mixed-run boundary

必须在以下方案中明确选择并 spec 化：

- bounded CURRENT v1 production compatibility；或
- provider-free explicit structural migration 到 homogeneous TARGET vNext，之后 CURRENT 只观察。

当前优先假设是：**现有 v1 run 继续走 marker-bounded compatibility；新 init 只创建 TARGET；
需要进入新模型时走显式 homogeneous vNext，不自动迁移。** 这最少打扰既有用户，也避免让
Agent 替用户猜一个 mixed deck 应改成 Framed 还是 Pure。若 design 证明该 route 会永久复制
business owner 或无法维护，再选择 migration-only，而不是暗中兼容。

Exit：CURRENT mixed source 不会被静默解释成 TARGET；跨 protocol raw/final/review evidence
默认失效，只有 accepted exact-plan-bound materialization 例外；rollback/recovery 和最终
compatibility removal direction 已写清。

### Gate 3 - Artifact interfaces and owners

对 raw work plan、accepted raw evidence、final-slide manifest 分别锁定：

- schema identity 或现有 schema 的复用结论；
- sole writer、allowed readers、stable-ID/order semantics；
- source/profile/byte/hash binding；
- freshness、invalidation、structural materialization 与 deletion/rebuild rules；
- Framed/Pure-specific fields 在 adapter 边界内消失到什么程度。

Exit：shared raw 只处理 provider/authorization/evidence mechanics；shared delivery 只处理
ordered final PNGs/notes lineage。任一 shared function 都不需要 `if (workflow === ...)` 来
解释 Text Frame、no-text underlay、Pure display 或 refresh 业务语义。

### Gate 4 - Beginner-facing route and CLI surface

默认策略是保留现有 public command verbs，由 marker-first resolver 和 MD Controller 在 version
开始时记录一次 Framed/Pure 选择。只有现有 CLI 无法无歧义表达 mutation owner、receipt 或
diagnostic 时才增加/改变 command surface。

Exit：新手只看到一次“这一版走 Framed 还是 Pure”的内容选择，之后每一步只有当前 workflow
的事实、gate 和 next action；用户不需要理解 raw adapter、shared mechanics 或 delivery 合流。
若 command、flag、stdout/stderr JSON 或 diagnostic code 未改变，则 `cli-surface` 不制造 delta。

### Gate 5 - Refresh semantics

必须给出 version-workflow-aware matrix，至少覆盖：

- Framed text-only change；
- Framed preset/style change及其 reserved-underlay invalidation；
- Pure visible text/style/visual change；
- notes-only change；
- insert/delete/reorder 与 whole-version workflow switch。

Exit：每类 edit 只有一个 owner 和最小合法 rebuild path；明确 `Header Text & Style Refresh`
是否仍准确。Whole-version workflow switch 必须走 Structural Versioning Path，不能原地改变
当前 version identity。

### Gate 6 - Activation, rollback, and verification budget

必须锁定 public registration 次序、CURRENT rollback boundary、state/schema compatibility、
test tiers、provider-free fixtures，以及何时需要 mocked/real provider work。

Exit：TARGET public marker/init 在两个 adapters、delivery、state/controller、CURRENT boundary
和 required E2E 均通过前不可开放；普通 change verification 不依赖真实 provider 或审美判断。

## Capability Delta Budget

Proposal 的 Modified Capabilities 必须与实际 delta specs 一一对应。下面是 planning budget，
不是要求机械修改所有相关 main specs。

### Likely required delta specs

| Capability | Requirement-level change |
| --- | --- |
| `content-parsing` | TARGET 从 per-slide authority 改为 version-level exclusive workflow，同时保留 CURRENT v1 解析边界 |
| `image-production` | 从一个 generic Pure/Framed finalizer 改为 sibling workflow adapters + one final-manifest interface |
| `image-generation` | 从理解 authority semantics 改为消费 adapter-owned typed raw plan，并保持 authorization/evidence SSOT |
| `pipeline-orchestration` | 表达 `03 XOR 04 -> 05 -> 06`、late merge 与 workflow-aware refresh |
| `visual-config` | 保留 shared visual language；把 `standard-v1`/fit/frame-specific ownership 移交 `03` |
| `node-specification` | version workflow receipt/state/evidence graph、controller consumption、repair 与 CURRENT/TARGET distinction |
| `playbook-execution` | 新 deck 一次选择后进入一条 controller route，不再展示 per-slide dispatch |
| `workflow-inspection` | marker-first 投影 selected workflow 的 direct prerequisites 与一个 nearest action |
| `run-bundle-management` | init/check 创建和验证 TARGET identity/workflow，同时识别 CURRENT compatibility/migration |
| `slide-identity-and-ordering` | structural vNext 绑定 version workflow，whole-workflow switch 不继承 acceptance |
| `commands-reference` | 人类请求按 version workflow/ownership 路由，并把旧 `05-iteration` path 更新到 `06` owner |
| `framework-charter` | active guidance 描述两条 sibling workflows、shared delivery 与一次选择 |
| `framework-directory-layout` | workflow soft-bundle 的 `03/04/05/06` owner map 与无第二 production owner |
| `framework-script-layout` | sibling adapter、private boundary、shared mechanics、delivery 与 executable/import inventory |

### Conditional delta specs

| Capability | 只有何时才修改 |
| --- | --- |
| `cli-surface` | direct command/flag、producer receipt field、stdout/stderr envelope、diagnostic code 或 delegation contract 改变 |
| `run-bundle-layout` | canonical artifact path/topology 或 run-bundle owner 改变；仅 schema 内容 version bump 不自动触发 layout delta |
| `pptx-assembly` | final manifest caller contract 或 assembly receipt 行为改变；仅实现移动到 `05-delivery` 不触发 |
| `notes-injection` | notes input/receipt/lineage 行为改变；仅调用位置移动不触发 |
| `bootstrap-env-guidance` | beginner readiness 或 remediation requirement 改变；普通 workflow 文案同步不自动触发 |
| `environment-check` | Framed local/Image2 provider readiness 的可观察行为改变 |
| `visual-asset-management` / `style-master-generation` | reference/style ownership、schema 或 invalidation 真正改变 |

预期 `pptx-assembly` 与 `notes-injection` 的 requirement 行为保持不变：它们已经消费一个 ordered
Page Authority final manifest/assembly lineage，正好是 shared delivery 需要的合同。它们应获得
两种 workflow 的同构 regression coverage，而不是为了目录移动重写 main specs。

### New capability decision

默认不新增 capability。`03-framed-image`、`04-pure-image`、`05-delivery` 是 method-module /
implementation ownership，不自动成为 capability 名称。只有 proposal 能证明现有稳定 capability
都无法长期拥有某个独立行为，才允许新增；“文件夹是新的”或“tasks 太多”不是证明。

## Progressive Execution Plan / Checklist

执行依赖为 `Phase A -> Wave 0 -> Wave 1 -> Wave 2 -> Wave 3 -> Wave 4 -> Wave 5 -> Wave 6 -> archive`。
可在不破坏前置 checkpoint 的前提下准备后续工作，但只有前一个 checkpoint 关闭后，后续 wave 才能
报告完成。

### Phase A - Form and accept the OpenSpec artifacts

- [x] **A.1** 创建唯一 change `separate-framed-pure-workflows`；proposal 引用两份上游计划并自足记录
  CURRENT/TARGET、one-change 理由、scope fence、control owner 与 policies。
- [x] **A.2** 关闭下列六个 design gates，同时维护 terminology delta ledger 与 capability delta budget。
- [x] **A.3** 只为 requirement-level 行为变化编写 delta specs；将不变 capability 留作 regression
  obligations，不虚报 Modified Capabilities。
- [x] **A.4** 在 design 中固定 exact identity/schema、CURRENT boundary、artifact interfaces、import
  rules、activation/rollback 与 unit/integration/E2E 选择。
- [x] **A.5** 将 tasks 按下列 implementation waves 展开，每项带 capability、完成判据和 focused test。
- [x] **A.6** Apply 前运行 `openspec validate separate-framed-pure-workflows --strict`；artifact 之间仍有
  open question、capability 不匹配或 CURRENT/TARGET 混写时不进入实现。

#### Design Gate Checklist

- [x] **G1** 按 [Gate 1 - Minimal identity and terminology](#gate-1---minimal-identity-and-terminology)
  锁定 TARGET identity、receipt/state resolver 和 terminology ledger。
- [x] **G2** 按 [Gate 2 - CURRENT mixed-run boundary](#gate-2---current-mixed-run-boundary) 选择并 spec 化
  CURRENT compatibility 或 structural migration 边界。
- [x] **G3** 按 [Gate 3 - Artifact interfaces and owners](#gate-3---artifact-interfaces-and-owners) 锁定
  三个 artifact seam 的 schema、owner、binding、freshness 和 shared-boundary rules。
- [x] **G4** 按 [Gate 4 - Beginner-facing route and CLI surface](#gate-4---beginner-facing-route-and-cli-surface)
  锁定一次 workflow choice 的 user route，并决定是否真的需要 `cli-surface` delta。
- [x] **G5** 按 [Gate 5 - Refresh semantics](#gate-5---refresh-semantics) 固定 workflow-aware refresh matrix 和
  Structural Versioning Path。
- [x] **G6** 按 [Gate 6 - Activation, rollback, and verification budget](#gate-6---activation-rollback-and-verification-budget)
  固定 activation order、rollback boundary 与 provider-free verification budget。

- [x] **A.CP** **Checkpoint A:** change artifacts 可以由不了解聊天的 Agent 独立解释；所有 design gates
  closed，strict validation green，framework source 尚未移动。

### Wave 0 - Freeze the observable baseline

- [x] **W0.1** 固定 CURRENT marker/state、mixed source receipts、raw/final/delivery lineage、public CLI/help、
  controller/inspection、directory/import inventory 与 representative fixtures。
- [x] **W0.2** 把两份上游计划中的 CURRENT invariants 对应到现有 focused tests。
- [x] **W0.3** 建立 negative baseline：same bytes 不得被 target parser 接受，CURRENT path 不得读取未来字段。
- [x] **W0.4** 记录与本 change 无关的 pre-existing test failures，不把它们伪装成本次 regression。
- [x] **W0.CP** **Checkpoint 0:** CURRENT focused tests 与 declared core tier green；没有 production data fixture。

### Wave 1 - Establish artifact seams without changing public routing

- [x] **W1.1** 在现有 Page Authority path 下固定 raw plan、accepted evidence 与 final manifest 的 typed
  contracts、hash/invalidation tests 和 owner boundaries。
- [x] **W1.2** 让 shared raw mechanics 只消费 typed raw input，让 delivery-facing code 只消费 final manifest。
- [x] **W1.3** 保持 CURRENT v1 resolver、init、CLI 和 observable artifact bytes/receipts 不变。
- [x] **W1.4** 增加 architecture tests，禁止未来 `03 <-> 04` private imports 与 shared semantic switch。
- [x] **W1.CP** **Checkpoint 1:** CURRENT 可通过新 seams 完成原行为；TARGET 尚未注册为 public identity；删除任一
  新 seam 会由 contract test 直接发现，而不是由 broad E2E 偶然发现。

### Wave 2 - Build the two workflow owners behind internal fixtures

- [x] **W2.1** 建立 `03-framed-image`，集中 Text Frame schema/preset、fit preflight、text-free underlay
  contribution、local composition/capture 与 Framed refresh。
- [x] **W2.2** 建立 `04-pure-image`，集中 Pure display/raw contract、accepted-raw publication 与 rebuild。
- [x] **W2.3** 让两个 adapter 通过 target receipt fixtures 分别产出同 schema final manifest，且不互相 import。
- [x] **W2.4** 让 shared raw authorization/evidence/review 保留一个 owner，不让任一 adapter 复制。
- [x] **W2.5** 编写两条完整 workflow MD；change 完成前不得把未注册 TARGET 描述成 accepted CURRENT。
- [x] **W2.CP** **Checkpoint 2:** Framed 与 Pure 各自从 typed target receipt 走到 final manifest；Framed text-only
  路径零 provider，Pure visible-text change 产生 raw debt；public init 仍不创建 TARGET。

### Wave 3 - Extract shared `05-delivery`

- [x] **W3.1** 将 final manifest validation、final projection、full-page-image PPTX、speaker notes injection
  与 delivery review 收拢到 `05-delivery` public interface。
- [x] **W3.2** 以同一套 assertions 分别消费 Framed/Pure manifests，禁止 delivery behavior branch。
- [x] **W3.3** 让仍需 delivery 的 CURRENT compatibility 只调用这个 interface，不发布第二结果。
- [x] **W3.4** 保持 `pptx-assembly` 与 `notes-injection` 的既有 observable contract，除非 Gate 3 证明必须改。
- [x] **W3.CP** **Checkpoint 3:** 两条 target fixture lineage 和 CURRENT representative lineage 都只产生一套
  PPTX/notes/delivery receipts；manifest mismatch 在 assembly 前 prerequisite-first hard-stop。

### Wave 4 - Add TARGET identity, state, controller, and `06-iteration`

- [x] **W4.1** 实现 new marker、version-level workflow source receipt、state/evidence graph 与 marker-first resolver。
- [x] **W4.2** 将 workflow root、BOOTSTRAP/quick-start、playbook、inspection 和 controller metadata 建模为
  `03 XOR 04 -> 05 -> 06`。
- [x] **W4.3** 将 iteration owner 迁至 `06-iteration`，按 version workflow 和 artifact ownership 选择
  Framed local refresh、Pure rebuild、notes-only 或 Structural Versioning Path。
- [x] **W4.4** 更新 architecture contracts、whitelist、method-module edges、executable/source-test inventory。
- [x] **W4.5** 默认保持 direct CLI grammar/diagnostics 不变；确需变更时才启用已接受的 `cli-surface` delta。
- [x] **W4.CP** **Checkpoint 4:** 手工构造的 TARGET source/state 可通过 public-equivalent integration path 完成两条
  workflow，但 fresh `init` 仍未切换；CURRENT marker 不读取 TARGET workflow field，反之亦然。

### Wave 5 - Complete CURRENT boundary, then activate TARGET

- [x] **W5.1** 实施 Gate 2 已接受的 CURRENT mixed-run compatibility 或 structural migration。
- [x] **W5.2** 覆盖 existing v1 mixed resume/refresh/delivery 或 migration preview/hash/apply/recovery 的完整合同。
- [x] **W5.3** 确认 cross-protocol evidence 默认失效、structural apply 零 provider、target review 从 fresh state 开始。
- [x] **W5.4** 只有此时才让 fresh init/source templates 创建 TARGET identity 并要求一次 workflow choice。
- [x] **W5.5** 让 user-facing guidance 只展示 selected route，不展示 CURRENT compatibility 内部或 raw topology。
- [x] **W5.CP** **Checkpoint 5:** fresh Framed、fresh Pure、CURRENT mixed boundary 三条 E2E 均有确定结果；不存在
  new init 产生 mixed source、silent fallback、半注册 marker 或用户被要求逐页选 authority。

### Wave 6 - Remove superseded owners and close the change

- [x] **W6.1** 删除已被新 adapters/seams 取代的 generic authority branches、duplicate validators、旧
  method-module paths、misleading docs/fixtures 与临时 development glue。
- [x] **W6.2** 不删除 Gate 2 明确保留的 bounded compatibility owner，也不保留未登记的 shim/re-export。
- [x] **W6.3** 审计 terminology ledger，确认 stable terms 没有发生无理由 churn。
- [x] **W6.4** 运行 focused unit/architecture、integration、selected E2E、`npm test`、
  `openspec validate separate-framed-pure-workflows --strict`、
  `openspec validate --all --strict` 与 `git diff --check`。
- [x] **W6.5** Review archive 后的 merged main-spec model，确认 CURRENT compatibility 与 TARGET 没有互相覆盖。
- [x] **W6.6** 确认所有 tasks、verification 与 docs 已完成并交给下方 handoff checklist；准备 post-archive
  `project-versioning` 判断所需的证据。
- [x] **W6.CP** **Checkpoint 6:** 上游两份计划的 completion criteria 全部有 spec + implementation + focused proof；
  active source、controller、directory、imports 和 main specs 只有一个 TARGET SSOT 和一个显式
  CURRENT boundary。

## Verification Matrix

| 层级 | 必须证明 |
| --- | --- |
| Static / architecture | `03`、`04` 不互相 import；shared raw/delivery 不含 workflow semantic branch；目录/entry/test inventory 完整 |
| Unit | marker/schema resolution、version selection、frame fit、Pure raw plan、hash/invalidation、wrong-owner rejection |
| Integration | Framed receipt -> raw evidence -> local compose -> manifest；Pure receipt -> raw evidence -> manifest；manifest -> same delivery |
| Controller / CLI | 一次 workflow choice、marker-first route、一个 next action、provider authorization 不被推断、producer/consumer ownership 正确 |
| Structural | workflow switch 创建 vNext；preview + exact hash；apply 零 provider；不继承 review/final/delivery acceptance |
| CURRENT boundary | mixed v1 要么完整兼容，要么只走已接受 migration；绝不静默 reinterpret |
| E2E | fresh Framed、fresh Pure、两类 refresh、notes-only、shared PPTX/notes、CURRENT boundary |
| Negative | TARGET per-slide override、identity collision、stale evidence、wrong workflow state、partial manifest、second delivery result 全部 fail closed |

### Verification Completion Checklist

- [x] **V.1** Static / architecture proof：`03`、`04` 不互相 import；shared raw/delivery 不含 workflow
  semantic branch；目录/entry/test inventory 完整。
- [x] **V.2** Unit proof：marker/schema resolution、version selection、frame fit、Pure raw plan、
  hash/invalidation 与 wrong-owner rejection 均有 focused coverage。
- [x] **V.3** Integration proof：Framed receipt -> raw evidence -> local compose -> manifest、Pure receipt ->
  raw evidence -> manifest，以及 manifest -> same delivery 全部通过。
- [x] **V.4** Controller / CLI proof：一次 workflow choice、marker-first route、一个 next action、provider
  authorization 不被推断，且 producer/consumer ownership 正确。
- [x] **V.5** Structural proof：workflow switch 创建 vNext；preview + exact hash；apply 零 provider；不继承
  review/final/delivery acceptance。
- [x] **V.6** CURRENT-boundary proof：mixed v1 要么完整兼容，要么只走已接受 migration；绝不静默 reinterpret。
- [x] **V.7** E2E proof：fresh Framed、fresh Pure、两类 refresh、notes-only、shared PPTX/notes 与 CURRENT
  boundary 都有记录。
- [x] **V.8** Negative proof：TARGET per-slide override、identity collision、stale evidence、wrong workflow
  state、partial manifest、second delivery result 全部 fail closed。

真实 provider 和审美评分不是本次普通 implementation checkpoint。Provider contract 使用最小
fake/fixture 验证 authorization、request boundary 与 evidence；若 release health 另需 real E2E，
必须由显式后续授权触发，不能把网络不稳定性当作架构迁移的完成判据。

## Split Triggers

当前没有发现需要拆 change 的条件。只有出现以下事实之一，才重新评估：

| Trigger | 为什么可能需要独立 change |
| --- | --- |
| CURRENT compatibility 必须先发布一个可独立使用的迁移工具，并跨 release 观察后才能继续 | 出现真实、可部署的前置行为边界 |
| Public CLI 必须经历独立 deprecation period，旧新 grammar 不能在一次 release 内安全切换 | 外部合同有自己的发布时间线 |
| TARGET 被证明依赖 provider/transport/authorization architecture 的独立重写 | 前置能力不再只是本迁移的实现细节 |
| 必须批量重写用户 `deck_*` production data 或执行不可逆 state migration | 需要单独授权、rollback 与运营计划 |
| Scope 新增第三个 mixed TARGET workflow | 产品模型已改变，不再是当前双 workflow 迁移 |
| 某一子集能被完整 spec、独立部署和回滚，并且不产生半注册 identity、双 authority 或 unsupported state | 找到了真实 atomic boundary，而非按文件切片 |

以下情况**不是** split trigger：delta specs 很多、tasks 很长、目录移动多、要分多次 commit、
需要多个 coding-agent session、某个 wave 的 focused tests 较多。它们由 tasks、checkpoint 和
verification log 管理。

若真实 trigger 出现，最多先拆出一个明确 prerequisite change；它必须自足记录与本 umbrella
change 的 dependency、保留两份上游计划链接，并在 archive 后让 umbrella change 重新基于
accepted main specs 校准。不得退化成按 `03`、`04`、`05` 各建一个互不认识的 change。

## Completion And Handoff Checklist

本 progressive plan 的 implementation、spec sync、archive 与提交均已完成。下列 `H.1`–`H.9`
记录已满足的收尾条件；`H.10` 保留为一次独立的、用户授权后的项目版本决策：

- [x] **H.1** 六个 design gates 全部关闭，无实现者需要猜测的 open question。
- [x] **H.2** Proposal capability 表与 delta spec 目录完全一致，没有为纯实现/文案制造 main-spec churn。
- [x] **H.3** TARGET identity、Framed、Pure、Delivery、Iteration 与 CURRENT boundary 构成一个可执行闭环。
- [x] **H.4** 新手只作一次 workflow choice，后续不接触实现复用拓扑。
- [x] **H.5** PPTX assembly 与 notes injection 对两条 workflow 保持同一合同和实现路径。
- [x] **H.6** policies 所保护的 identity、authorization、evidence、bytes、lineage、recovery 不变量未放松。
- [x] **H.7** Old business branches/paths 已删除，或被 Gate 2 明确登记为 bounded compatibility。
- [x] **H.8** Focused、integration、selected E2E、core regression 与 OpenSpec strict validation 全部有记录。
- [x] **H.9** 在 `H.1`–`H.8`、`V.1`–`V.8` 与 `W6.CP` 全部完成后 archive 一次，并把 archive 证据记入
  evidence log。
- [ ] **H.10（待用户授权）** Archive 后确认本文与两份上游 plan 的结论已被 proposal/design/specs/tasks/main specs 吸收，并按
  `project-versioning` 判断版本；它可独立于后续 hygiene change 评估，但本文只有在 `HC.CP` 也关闭后才适合整体关闭。

## Post-Archive Progressive Extension: Compatibility Hygiene

这一节不是追溯性地否定已经完成的 `separate-framed-pure-workflows`，也不重新打开已 archive 的
change。它记录的是 archive 后通过真实目录盘点和观察路径复现发现的一个**独立可交付边界**：让
exact CURRENT v1 compatibility 留在一个清晰、受限且可验证的位置，同时将 TARGET、观察路径、文档
和测试中的残留旧拓扑清掉。这个边界可独立 spec、验证、发布和回滚，不会产生半注册 TARGET 或改变
已接受的 v1 bytes，因此应当以一个新的 OpenSpec change 落地。

### Hygiene 目标与目录处置原则

目标不是删除 `page-authority-image2-v1` / `image2-page-authority` 支持。它们仍是 existing exact mixed
run 的 bounded compatibility；要删除的是错误的 TARGET -> v1 调用、无调用的 pass-through、空占位和
将 legacy 内容伪装成 current workflow 的目录入口。

| 当前 surface | 分类 | Hygiene 后的要求 |
| --- | --- | --- |
| `scripts/04-image-production/` | exact CURRENT v1 implementation | 收敛到显式 current-v1 compatibility home；TARGET、status 和 inspection 不得经此 writer。迁移前先证明 v1 receipt/bytes/CLI 语义不变。 |
| `workflow/04-image-production/`、`workflow/05-iteration/` | CURRENT v1 guidance | 腾挪到明确标识的 compatibility 文档入口，或在原路径删除前更新所有 links；任何直达页必须首先声明 exact v1-only。 |
| `tests/04-image-production/` | CURRENT v1 proof | 与 v1 implementation 一起迁移/重命名，并把 test owner、fixture 术语和 README 改为 compatibility-only。 |
| `scripts/05-iteration/` | suspected dead compatibility wrapper | 先证明无生产 caller；若成立，删除 wrapper、internal pass-through 和相应 inventory，而不是留下空 interface。仍需保留的 v1 classifier 随 compatibility guidance 收口。 |
| `tests/05-iteration/`、`tests_e2e/04-image-production/`、`tests_e2e/05-iteration/` | stale placeholders | 删除只有过期 README 的空 owner 目录；实际 test 归属必须由 source-to-test inventory 明确登记。 |
| `workflow/05-delivery/`、`tests/05-delivery/` | active TARGET shared delivery | 保留为 `03 XOR 04 -> 05` 的唯一 delivery owner；仅更新它引用 compatibility 的说明，不迁回 legacy path。 |

`HC.1` 已锁定新 home 为清晰的 `compatibility/current-v1-page-authority/` source、workflow 与
test logical surface：分别落在 scripts、workflow 与 tests 的对应 domain root。迁移没有
内部-only redirect 或长寿命 re-export；目录移动不得成为 TARGET 语义或 public CLI grammar 的改变。

### Hygiene Cleanup Checklist

- [x] **HC.0** 记录 post-archive inventory 与最小复现：已验证 selected TARGET v2 的 `ppt_flow status`
  会错误写入 v1 `source-receipt.json`；已列出 dead wrapper、误导文档与空测试占位。
- [x] **HC.1** 新建 dedicated OpenSpec cleanup change
  [clean-current-v1-compatibility-boundary](../../openspec/changes/archive/2026-07-29-clean-current-v1-compatibility-boundary/)，写清
  CURRENT compatibility 保留合同、目标 compatibility home、迁移/rollback、directory ownership、CLI non-goals
  和不读取生产 deck data 的约束；proposal/design/specs/tasks 已完整且 strict validation 通过。
- [x] **HC.2** 以一个 read-only seam 重做 `status` / controller observation：marker-first 区分 v1/v2，
  不初始化 state、不写 v1/v2 receipt、不写 `_generated/`、history 或 metadata，也不发起 provider 调用。
- [x] **HC.3** 将保留的 v1 implementation、workflow guidance 与 focused proof 迁至或收敛到一个明确
  current-v1 compatibility owner；删除 generic/new-authoring 暗示，且不保留未登记的长期 re-export。
- [x] **HC.4** 删除已证明无 caller 的 `scripts/05-iteration` wrapper/internal pass-through，以及
  `tests/05-iteration`、`tests_e2e/04-image-production`、`tests_e2e/05-iteration` 的空占位；迁移任何
  仍有效的 classifier/document link 到正式 compatibility home。
- [x] **HC.5** 保持 `03-framed-image XOR 04-pure-image -> 05-delivery -> 06-iteration` 为所有新 authoring
  的唯一可见路径；更新直达 legacy 文档、README、playbook、test README 和 link/audit allowlist，使 v1
  只能作为 existing-run compatibility 出现。
- [x] **HC.6** 更新 architecture contracts、source-to-test ownership、governance/retirement ledger、
  executable/import inventory 和相关 main specs；明确 target method modules 不会 import 或调用 v1 writer。
- [x] **HC.7** 加入 focused 与 E2E proof：exact CURRENT v1 resume/refresh/delivery 保持合同；selected
  TARGET Framed/Pure 和 fresh workflow-selection `status` 均为零写入；旧 receipt 不会由 target observation
  创建；目录/链接/ownership audit fail closed。
- [x] **HC.8** 已完成 focused、process、selected E2E、`npm test`、`git diff --check` 和 OpenSpec strict
  validation；证据已回写本节与证据日志，并已在
  `openspec/changes/archive/2026-07-29-clean-current-v1-compatibility-boundary/` 完成 archive/commit closeout
  （`51b69bb chore: clean current v1 compatibility boundary`）。
- [x] **HC.CP** **Compatibility Hygiene Checkpoint:** 每个 retained v1 surface 都有一个明确 owner；TARGET
  public route、observer 和 delivery 只有 `03 XOR 04 -> 05 -> 06`；没有 dead wrapper、空 test owner、
  误导 legacy entry 或 observation-induced generated artifact；v1 与 v2 的 bytes、state 和 CLI contracts
  都有回归证明。

### Hygiene 非目标与关闭条件

- 不删除或静默迁移任何用户 `deck_*`、`dpt_*`、`_generated/` 生产数据。
- 不将 exact v1 mixed source 自动重写为 v2，也不改变 v1 的 receipt、raw/final bytes 或 provider
  authorization 语义。
- 不借目录 cleanup 改写 direct CLI grammar、发布新 workflow，或让 `05-delivery` 出现第二个 writer。
- `H.10` 的项目版本决策与 `HC.CP` 都完成后，才可把这份 progressive plan 作为整体关闭；在此之前，
  后续发现应继续以新的证据行和独立子项扩展，而不是回填为原 change 的未完成工作。`H.10` 与
  `HC.CP` 只关闭已完成的两轮 change；下述 legacy retirement 阶段关闭前，本文不应宣称框架已
  完成“无旧协议”收尾。

## Future Progressive Extension: Legacy Absorption and Retirement

Compatibility hygiene 的目的，是先把 CURRENT v1 隔离得不污染 TARGET；它不是永久架构。下一阶段的
目标是让 coding agent 在 active framework、active tests、main specs 与人类入口中只看见一个 v2
工作图：`03-framed-image XOR 04-pure-image -> 05-delivery -> 06-iteration`。任何仍有业务价值的 v1
语义必须先被明确吸收，不能以 `compatibility/`、marker fallback、旧 receipt writer 或“先看看旧的”
文档长期留在树中。

这里的“继承”指继承可验证的**业务语义、输入输出合同、迁移判定和测试案例**，不是把旧目录改名后
继续由 runtime 或 Agent 路由。完成后，`PPTMAKER_FRAMEWORK/workflow/compatibility/`、
`PPTMAKER_FRAMEWORK/scripts/compatibility/`、`tests/compatibility/` 及其 v1-specific owner 都不应是
active framework surface；历史说明只可位于 OpenSpec archive 或一次性、版本化的迁移交付物中。

### Retirement Policy and Safety Boundary

- 这是一项单独的 future OpenSpec change，必须在 H.10 的项目版本/发布策略由用户授权后才可提出；
  删除 existing-run v1 runtime support 不能伪装成普通目录整理。
- 迁移必须是显式、preview-first、用户确认后的 structural vNext 或离线一次性交付：它保留原始
  source/state/bytes，不在原 v1 run 上就地改写，也不在 `status`、`state` 或普通恢复路径中执行。
- 若仍有需要迁移的生产 bundle，迁移工具应作为有版本、有截止日期的外部/一次性 operator artifact
  交付；迁移窗口结束后它也不留在 framework 的 active 运行时、方法论或 main specs 中。
- 不存在“无法迁移但仍要保留 runtime fallback”的隐性第三条路。遇到无法保持合同的 v1 输入，必须在
  proposal 中选择：先补迁移能力、将该输入明确拒绝，或取消 retirement；不得让 TARGET 重新依赖 v1。

### Absorb-Then-Delete Checklist

- [ ] **LR.0（待 H.10 授权）** 记录发布/版本决策、可迁移 run 的操作边界、迁移窗口与最终支持截止日；
  明确这是 breaking removal 还是已完成迁移后的删除，且不扫描或批量改写用户 `deck_*` 数据。
- [ ] **LR.1** 对每个 v1 surface 建立吸收矩阵：将语义归为 `v2 owner`、`shared invariant`、
  `one-off migration` 或 `delete` 四类。任何没有目标 owner 或迁移判定的 legacy 行为都不能删除，
  也不能悄悄成为兼容 fallback。
- [ ] **LR.2** 建立 dedicated retirement change；proposal/design/tasks 必须写清 v1-to-v2 migration
  contract、preview/confirmation、rollback/拒绝策略、截止版本，以及删除后 active graph 的唯一性。
  此 change 的 delta specs 必须把 retirement 视为 main-spec removal/renaming，而非在现行规格上追加
  “legacy exception”。
- [ ] **LR.3** 将可保留的 v1 业务语义吸收至它的 v2 或 shared owner，并以目标协议的 source receipt、
  evidence、final-manifest、delivery 与 structural-versioning 合同重新证明；不复用 v1 writer、
  mode、state initializer 或 receipt 路径。
- [ ] **LR.4** 实现并验证一次性迁移交付物（如需要）：默认只 preview，materialize 必须绑定 exact plan
  hash 与显式确认，产生独立 v2 target，原 v1 bundle 保持字节不变；迁移工具不得被 `ppt_flow`
  的日常观察或 TARGET 执行导入。
- [ ] **LR.5** 将仍有价值的 v1 tests 转写为 v2/shared invariant 或一次性迁移 proof；随后删除 active
  `workflow/compatibility/`、`scripts/compatibility/`、`tests/compatibility/`、v1 marker/receipt writer、
  v1 classifier、legacy inventory entries 和所有 runtime dispatch/fallback。历史 fixtures 与交付记录只
  留在 archive 或明确隔离的 migration evidence，不成为 Agent 启动时的工作入口。
- [ ] **LR.6** 清理 main specs：删除或重写所有把 `CURRENT v1`、`compatibility`、`page-authority-image2-v1`、
  `image2-page-authority`、旧目录或 v1 receipt 说成现行支持路径的 Purpose、Requirement、Scenario 与
  cross-link；保留的 v2/shared requirement 必须独立可读，不借旧协议解释自己。历史合同仅由 archive
  保存，不能停留在 `openspec/specs/`。
- [ ] **LR.7** 更新 COMMANDS、BOOTSTRAP、playbook、directory map、architecture/source-to-test inventory、
  governance/retirement ledger 与 docs tests；新增 fail-closed audit，要求 active framework roots 与
  main specs 不再注册 compatibility/v1 owner、import、CLI route、classification link 或 observation branch。
- [ ] **LR.8** 运行 v2/shared full regression、migration preview/materialization proof（如适用）、所有
  ownership/link/retirement negative audits、`npm test`、`git diff --check` 与 `openspec validate --all --strict`；
  记录证明没有 production data 被隐式读取或改写。
- [ ] **LR.9** 在 main specs sync、archive 与 commit 后记录删除清单、迁移交付物截止状态和 commit；只有
  当 active tree 与 main specs 都不再出现旧协议时才可关闭本阶段。
- [ ] **LR.CP** **No-Legacy-Noise Checkpoint:** coding agent 从 BOOTSTRAP、COMMANDS、workflow、scripts、
  tests 和 main specs 只能发现 v2/shared 的一个 current graph；旧协议只作为 archive/一次性迁移证据，
  不再是可执行、可选择、可 import 或可观察的路径。
