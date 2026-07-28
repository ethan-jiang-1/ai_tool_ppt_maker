# Plan: Page Authority Workflow OpenSpec Progressive Delivery

> 类型: OpenSpec 落地规划 | 更新: 2026-07-28 | 状态: 单 change 方案已确定，尚未创建 change

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

截至 2026-07-28，`openspec list --json` 没有 active change。本文不创建
`openspec/changes/` 内容，不授权修改 framework source，也不读取或迁移任何 `deck_*`、
`dpt_*` 或 `_generated/` 生产数据。在 change 被完整实施并 archive 前，accepted main specs
与 CURRENT `page-authority-image2-v1` 行为继续是生产权威。

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

## Progressive Execution Plan

### Phase A - Form and accept the OpenSpec artifacts

1. 创建唯一 change `separate-framed-pure-workflows`，proposal 引用两份上游计划并自足记录
   CURRENT/TARGET、one-change 理由、scope fence、control owner 与 policies。
2. 逐项关闭六个 design gates；同时维护 terminology delta ledger 与 capability delta budget。
3. 只为 requirement-level 行为变化编写 delta specs；保留不变 capability 作为 regression
   obligations，不虚报 Modified Capabilities。
4. Design 固定 exact identity/schema、CURRENT boundary、artifact interfaces、import rules、
   activation/rollback 与 unit/integration/E2E 选择。
5. Tasks 按下列 implementation waves 展开，每项带 capability、完成判据和 focused test。
6. Apply 前运行 `openspec validate separate-framed-pure-workflows --strict`；artifact 之间仍有
   open question、capability 不匹配或 CURRENT/TARGET 混写时不进入实现。

Checkpoint A：change artifacts 可以由不了解聊天的 Agent 独立解释；所有 design gates closed，
strict validation green，framework source 尚未移动。

### Wave 0 - Freeze the observable baseline

- 固定 CURRENT marker/state、mixed source receipts、raw/final/delivery lineage、public CLI/help、
  controller/inspection、directory/import inventory 与 representative fixtures；
- 把两份上游计划中的 CURRENT invariants 对应到现有 focused tests；
- 建立 negative baseline：same bytes 不得被 target parser 接受，CURRENT path 不得读取未来字段；
- 记录与本 change 无关的 pre-existing test failures，不把它们伪装成本次 regression。

Checkpoint 0：CURRENT focused tests 与 declared core tier green；没有 production data fixture。

### Wave 1 - Establish artifact seams without changing public routing

- 在现有 Page Authority path 下先固定 raw plan、accepted evidence 与 final manifest 的 typed
  contracts、hash/invalidation tests 和 owner boundaries；
- 让 shared raw mechanics 只消费 typed raw input，让 delivery-facing code 只消费 final manifest；
- 保持 CURRENT v1 resolver、init、CLI 和 observable artifact bytes/receipts 不变；
- 增加 architecture tests，禁止未来 `03 <-> 04` private imports 与 shared semantic switch。

Checkpoint 1：CURRENT 可通过新 seams 完成原行为；TARGET 尚未注册为 public identity；删除任一
新 seam 会由 contract test 直接发现，而不是由 broad E2E 偶然发现。

### Wave 2 - Build the two workflow owners behind internal fixtures

- 建立 `03-framed-image`，集中 Text Frame schema/preset、fit preflight、text-free underlay
  contribution、local composition/capture 与 Framed refresh；
- 建立 `04-pure-image`，集中 Pure display/raw contract、accepted-raw publication 与 rebuild；
- 两者通过 target receipt fixtures 分别产出同 schema final manifest，不互相 import；
- shared raw authorization/evidence/review 保留一个 owner，不让任一 adapter 复制；
- 编写两条完整 workflow MD，但在 change 完成前不把未注册 TARGET 描述成 accepted CURRENT。

Checkpoint 2：Framed 与 Pure 各自从 typed target receipt 走到 final manifest；Framed text-only
路径零 provider，Pure visible-text change 产生 raw debt；public init 仍不创建 TARGET。

### Wave 3 - Extract shared `05-delivery`

- 将 final manifest validation、final projection、full-page-image PPTX、speaker notes injection
  与 delivery review 收拢到 `05-delivery` public interface；
- 以同一套 assertions 分别消费 Framed/Pure manifests，禁止 delivery behavior branch；
- CURRENT compatibility 若仍需 delivery，也只能调用这一个 interface，不发布第二结果；
- 保持 `pptx-assembly` 与 `notes-injection` 的既有 observable contract，除非 Gate 3 证明必须改。

Checkpoint 3：两条 target fixture lineage 和 CURRENT representative lineage 都只产生一套
PPTX/notes/delivery receipts；manifest mismatch 在 assembly 前 prerequisite-first hard-stop。

### Wave 4 - Add TARGET identity, state, controller, and `06-iteration`

- 实现 new marker、version-level workflow source receipt、state/evidence graph 与 marker-first resolver；
- 将 workflow root、BOOTSTRAP/quick-start、playbook、inspection 和 controller metadata 建模为
  `03 XOR 04 -> 05 -> 06`；
- 将 iteration owner 迁至 `06-iteration`，按 version workflow 和 artifact ownership 选择
  Framed local refresh、Pure rebuild、notes-only 或 Structural Versioning Path；
- 更新 architecture contracts、whitelist、method-module edges、executable/source-test inventory；
- direct CLI grammar/diagnostics 默认不变；确需变更时才启用已接受的 `cli-surface` delta。

Checkpoint 4：手工构造的 TARGET source/state 可通过 public-equivalent integration path 完成两条
workflow，但 fresh `init` 仍未切换；CURRENT marker 不读取 TARGET workflow field，反之亦然。

### Wave 5 - Complete CURRENT boundary, then activate TARGET

- 实施 Gate 2 已接受的 CURRENT mixed-run compatibility 或 structural migration；
- 覆盖 existing v1 mixed resume/refresh/delivery 或 migration preview/hash/apply/recovery 的完整合同；
- 确认 cross-protocol evidence 默认失效、structural apply 零 provider、target review 从 fresh state 开始；
- 只有此时才让 fresh init/source templates 创建 TARGET identity 并要求一次 workflow choice；
- user-facing guidance 只展示 selected route，不展示 CURRENT compatibility 内部或 raw topology。

Checkpoint 5：fresh Framed、fresh Pure、CURRENT mixed boundary 三条 E2E 均有确定结果；不存在
new init 产生 mixed source、silent fallback、半注册 marker 或用户被要求逐页选 authority。

### Wave 6 - Remove superseded owners and close the change

- 删除已被新 adapters/seams 取代的 generic authority branches、duplicate validators、旧
  method-module paths、misleading docs/fixtures 与临时 development glue；
- 不删除 Gate 2 明确保留的 bounded compatibility owner，也不保留未登记的 shim/re-export；
- 审计 terminology ledger，确认 stable terms 没有发生无理由 churn；
- 运行 focused unit/architecture、integration、selected E2E、`npm test`、
  `openspec validate separate-framed-pure-workflows --strict`、
  `openspec validate --all --strict` 与 `git diff --check`；
- review archive 后的 merged main-spec model，确认 CURRENT compatibility 与 TARGET 没有互相覆盖；
- 所有 tasks、verification 与 docs 同时完成后 archive 一次，再按 `project-versioning` 判断版本。

Checkpoint 6：上游两份计划的 completion criteria 全部有 spec + implementation + focused proof；
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

## Completion And Handoff

本 progressive plan 的下一步不是移动文件，而是在用户确认后创建唯一 OpenSpec change，
并先完成 Phase A。Change 只有在以下条件同时成立时才可 archive：

- 六个 design gates 全部关闭，无实现者需要猜测的 open question；
- proposal capability 表与 delta spec 目录完全一致，没有为纯实现/文案制造 main-spec churn；
- TARGET identity、Framed、Pure、Delivery、Iteration 与 CURRENT boundary 是一个可执行闭环；
- 新手只作一次 workflow choice，后续不接触实现复用拓扑；
- PPTX assembly 与 notes injection 对两条 workflow 保持同一合同和实现路径；
- policies 所保护的 identity、authorization、evidence、bytes、lineage、recovery 不变量未放松；
- old business branches/paths 已删除或被 Gate 2 明确登记为 bounded compatibility；
- focused、integration、selected E2E、core regression 与 OpenSpec strict validation 全部有记录。

完成并 archive 后，本文与两份上游 plan 的结论应已被 proposal/design/specs/tasks/main specs
吸收，三份 backlog plan 才适合一起关闭；不能只因 change 被创建就提前关闭。
