# Findings: CLI 强依赖是否成立，CLI 设计是否合理

> 挖掘日期: 2026-08-16（working-tree HEAD = d2df02b）
> 范围: `ppt_maker_harness/`、`openspec/`、`tests/`、git history、openspec changes archive
> 未读: `_backlog/` 内除本输出目录外的任何文件（AGENTS.md 约束，见文末“方法边界”）
> 方法: 一手代码/spec 阅读 + 三个并行子代理（git 考古 / 调用点审计 / deep-module 设计批判）+ 实测计时
> 姊妹篇: 同目录 `cli-agent-ergonomics-and-optimization-space.md`（Agent 使用体验）、
> `cli-optimization-blast-radius.md`（优化影响面测算）、
> `cli-command-split-design.md`（过重命令的拆分设计）

---

## 0. TL;DR

1. **“运行时强烈依赖 CLI”本身是设计意图，不是事故。** Agent 是 Harness 外部的编排器
   （CONTEXT.md: “It does not contain an Agent instance”），openspec 配置明确分工
   “MD Controller / Agent 拥有流程，JS / CLI 拥有解析、校验、状态、证据与结构化诊断”。
   一个 process seam 是必须的——LLM 编排器无法 `import` Node 模块。所以问题从来不是
   “要不要 CLI”，而是**这个 seam 的接口面被反复重构、堆积、并且靠禁止条款而非形状来维持纪律**。

2. **历史上真正反复出现的问题是控制面漂移 + 接口堆积 + owner 逻辑渗漏进 CLI adapter。**
   37 天项目史（2026-07-10 → 08-16，161 commits）里 59 个 commit（37%）碰过
   `ppt_flow.mjs`；openspec archive 的 122 个 change 中有一长串专门修 CLI 面
   （fix-ppt-flow-cli-startup → add-cli-diagnostic-lineage → formalize-diagnostic-recovery-handoff →
   reconcile-command-surface-and-entry-seams → simplify-workflow-control-and-interfaces →
   converge-agent-control-surfaces → retire-historical-protocol-surfaces →
   remove-retired-plumbing-and-harden-detectors）。每次“简化/收敛”后文件继续长大：
   1260 行（出生）→ 3473 行（HTML 时代峰值）→ 4027 行（现在）。

3. **CLI 是一个“宽而浅”的 adapter，深度集中在错误出口那一层。**
   接口面：12 命令 / 26 子操作 / ~35 flags / 6 错误码 / 10 诊断类别 / 12 种 `next` 动作 /
   ~17 字段 envelope / 12 组硬边界 / 4 种跨调用 hash 线程化。而真正的行为住在
   `shared/*` 的 owner 模块里（每个 workflow owner 约 20 个函数）。接口面与 owner 合起来
   几乎一样大——这是 shallow module 的定义特征。真正的深度在 `cli_error.mjs`(852 行)+
   `cli_bootstrap.mjs`(189 行)：secret 脱敏、字节边界、崩溃围堵、单 envelope 保证。

4. **代价是每次调用都付全款。** 实测冷启动 `--help` ≈ 1.0s、`doctor` ≈ 1.9s；一个 12 页
   Framed deck ≈ 32–35 次全新 node 进程，其中约 1/3 是纯观察/重校验（`status`/`state`/
   `inspect`/`review`），且**每条 run-scoped 命令都重新验证 harness binding + source marker +
   `production_identity`**。跨调用的 `--plan-hash`/`--batch-hash`/`--attempt-sha256` 把
   调用方（LLM 的 context window）变成了交易账本。

5. **判定：设计“局部合理、整体过度工程”。** process seam + 脱敏/边界/exit-code 纪律是真深度，
   值得保留；但表面宽度、hash 线程化、每调用重校验、以及 ppt_flow.mjs 内 28 张错误码分类表
   是泄漏的 owner 复杂度。治理方式（1063 行 cli-surface spec 里 41 条 SHALL NOT + 11 处
   retired 提及；全部 27 个 main spec 共 11112 行、412 条 SHALL NOT；architecture guard 防
   retired 回归）说明项目在用“立法”弥补接口形状的缺陷。

---

## 1. 直接回答用户的问题

**问：历史问题是不是“强烈依赖 CLI”？**

**答：依赖 CLI 本身不是问题（是架构必然），历史问题是围绕这个 seam 的接口失控，表现
为三层症状，每一层都有 commit 级证据：**

### 症状 1：CLI 反复试图“第二评估器化”（duplicate evaluation）

`2026-07-23-simplify-workflow-control-and-interfaces/proposal.md` 原文：

> “workflow controller、generic node state 与 CLI routing 仍会**重复拼装 mode、gate、recovery
> 和 next-action 协议**。Agent 因而需要理解并重组多个 direct owner 的细节……`ppt_flow`
> 对 mutation 保持 parse/closed-grammar dispatch/envelope，**且不成为第二 workflow evaluator**。”

即：历史上 CLI routing 一度在 owner 之外重建 workflow 评估逻辑，Agent 被夹在多个
authority 之间。修复方式是把“不得成为第二 evaluator”写进 spec——**禁止，而不是让
重复评估在结构上不可能**。今天 cli-surface spec 仍保留同款禁令（“CLI routing does not
duplicate workflow evaluation”）。

### 症状 2：诊断归属逻辑渗漏进 CLI（second business attributor）

`harness-script-layout/spec.md` 要求 architecture guard 拒绝 “a migrated source/config
producer family whose owner/category/reason/next is re-derived by `ppt_flow.mjs`
code/prefix sets”。而今天的 `ppt_flow.mjs` 里仍然有 **28 张**错误码 `Set` 分类表
（`FRAMED_SOURCE_VALIDATION_CODES`、`FRAMED_INTERNAL_CODES`、`PAGE_IMAGE_PROVIDER_INPUT_SIZE_CODES`…，
lines 1577–1649 附近）与 **68 处**错误发射点。`styleMasterFailure`（:3215–3400+）是一棵
硬编码的 reason-code → category/next 决策树——与 spec 明令禁止的“第二 attributor”
结构同型，只是服务于还没被迁移的 owner。禁令追着渗漏跑，渗漏换个 owner 继续存在。

### 症状 3：控制面增殖→退役循环（accrete-then-prohibit）

- `2026-08-02` 新建 Intent Route Catalog（ADR-0001）解决“novice 无法安全表达意图”；
- `2026-08-14` 的 `converge-agent-control-surfaces` 把它连同 prompt cookbook、重复的
  inspection 散文一起删除，理由是 “an unconsumed prompt cookbook … and an Intent Route
  Catalog whose reader is only exercised by its own contract test”。**存活 12 天。**
  ADR-0001 已标记 Superseded。
- 同一个 change 把 persisted `production_mode.by_version` 替换为 `production_identity.by_version`
  ——又一个“先加字段、后废字段”的循环。
- 退役物从不删除，只封存 + 立禁止牌：`--resolution/--model/--base-url/--reuse-images/
  --dry-run/--force/--reason/--check-gates/--image2`、JPEG projection、`page-authority-visual-language.yaml`、
  “durable mode/source/mode pair/infer mode” 词汇……guard 甚至要区分“完全退役词”与
  “仍在 live-reject 的 flag”，免得 guard 自己误报。

**结论：历史问题更准确的表述是——**
> “Agent↔Harness 的控制面在极短周期内反复重构；CLI 作为唯一幸存的控制面吸收了所有历史层，
> 接口不断变宽，而纪律靠‘SHALL NOT’与 guard 立法维持。强烈的 CLI 依赖是这个过程的结果与
> 放大器（每次调用都付全款），不是根因。”

---

## 2. 接口面量化（caller 必须学会的一切）

来源: `ppt_flow.mjs` 命令注册（:3504–3974）、`cli_error.mjs`、`cli_bootstrap.mjs`、
`cli-surface/spec.md`（1063 行）。

| 维度 | 数量 | 证据 |
| --- | --- | --- |
| 顶层命令 | 12 | `PPT_FLOW_COMMAND_INVENTORY`（cli_error.mjs:19–32） |
| 子操作 | 26 | slides×8 + style-master×7 + image2×11 |
| 叶子调用形态 | ≈35 | 9 个 leaf 命令（state 另有 3 种互斥模式）+ 26 子操作；另一种口径 41 个分派目标 = 12 命令 + 26 子操作 + 3 种 state 模式 |
| flags | ≈30–35 | slides 9 个、image2 6 个、doctor 4 个…… |
| 顶层错误码 | 6 | UNCAUGHT/USAGE/GATE_BLOCKED/TITLE_REVIEW_REQUIRED/STATE_CORRUPTED/FAILED |
| 诊断类别 | 10 | usage/source_validation/structure/artifact/gate/environment/provider/delegated/interrupted/internal |
| `next.action` 动词 | 12 | fix_arguments/inspect/edit_source/repair_environment/repair_prerequisite/reconcile/rerun/review/approve/plan_style_master_successor/export/report_internal |
| reason kinds | 开放式 token 语法 | `current_protocol_invalid`、`target_source_state_identity_mismatch`、… |
| envelope 字段 | ~17 | code/message/hint/where/ok + diagnostic{schema,category,operation,subject,source,reason,issues,lineage,source_valid,omitted_count,truncated,delegated} + next{action,requires_human,default,inspect,invocation} |
| 硬边界（调用方隐式依赖） | 12 组 | text 1024/where 256/path 2048/20 issues/12 lineage/16 inspect/16KB diagnostic/20KB envelope/1MB stream… |
| **跨调用 hash** | 4 | `--plan-hash`、`--batch-hash`、`--attempt-sha256`、`--plan-sha256`，返回值中的 digest 必须原样保留并回传 |

此外调用方还要知道：**顺序约束**（plan → pilot → authorize → generate one item → 重新
inspect → repeat，fixed forms 见 cli-surface spec:224–238）、**stdout/stderr 契约**
（成功写 stdout；失败 envelope 是 stderr 最后一行非空 JSON）、**exit-code 配对规则**
（0 成功 / 1 失败 / `state --validate-state` 损坏态特例 2）、**`requires_human` 门语义**、
以及 **retired 词汇表**（哪些旧 flag 不能用）。

消费者侧（MD Controller / Agent）的规范性契约另占 `node-specification/spec.md`
**1260 行**（45 条禁止规则），包括 ~250 行消费协议：四段式 handoff、`requires_human`
语义、无 shell 的 invocation 参数边界、lineage 顺序、`omitted_count/truncated` 语义、
parent/child 权威、外部中断边界、`source_valid` 非权威观察。

**对比**：真正的行为住在 owner 模块里——每个 workflow owner 约 20 个类型化函数
（`targetImage2Operations`，ppt_flow.mjs:2635–2690）、`state.mjs` 的查询/操作 API、
以及 `inspectWorkflow({runDir})` 返回的**一条**有序 owner-issued next action。直接 import
会把 35 个叶子调用坍缩成少数函数调用 + 类型化返回/异常。**CLI 的接口面与 owners 的接口面
几乎一样大——这是 shallow module 的定义特征：interface as complex as implementation。**

---

## 3. 调用频率与每次调用的成本

### 3.1 一个 deck 要打多少发

`controller-manifest.json` + `create-deck.md`：create-deck Controller 有 **40 个节点、
40 个 `Step — CLI`**（另 11 MD + 13 GATE）。一个 12 页 Framed deck 从 `init` 到交付，
子代理审计估算 **≈32–35 次全新 `node` 进程**：

- ≈20–23 次固定脚手架调用：doctor、init、validate、slides 系列、style-master
  inspect/plan/authorize/generate/review/accept、image2 plan/pilot/authorize、state/status…
- + N 次 `image2 generate`（每 slide 一次）
- 其中 **约 1/3 是纯观察/重校验**（status、doctor、state、inspect、review）

### 3.2 每次调用付什么钱

| 项 | 实测/证据 |
| --- | --- |
| 冷启动 | `--help` ≈ **0.98s**；`doctor`（含 env-check 子进程）≈ **1.94s**（本机实测） |
| 冷启动工作 | 20+ 处 `await import(...)` 懒加载——ppt_flow.mjs 甚至为 `--help`/`doctor` 特判跳过 01-content 的全量 import（:80–82）。这个优化本身就是“调用太频繁”的化石 |
| 每调用重校验 | 每条 run-scoped 命令重新跑 `resolveRunAdapter` → `verifyDeckHarnessBinding`（重读 RUN_BUNDLE.md）→ 重读 source marker → 重验 `production_identity`。26 步生命周期里同一组 binding/marker/identity 被证明 ~26 次 |
| hash 线程化 | `--plan-hash`/`--batch-hash`/`--attempt-sha256`/`--plan-sha256` 必须穿过 LLM 的 context window 在两次 spawn 之间原样往返；**调用方就是交易账本** |
| 诊断三层套娃 | `doctor` 失败一次要穿过三层进程的 envelope 处理：child env-check 产出 → `createChildOutputCollector` 收流 → `buildDelegatedDiagnostic` 原样保留或 overflow 时 fail-closed 成 `report_internal`（cli-surface spec 的 “Delegated diagnostics” 整节） |

### 3.3 进程内的真相（纠正直觉）

生产 CLI 的**内部**子进程委托只有 2 处：`doctor → env-check.mjs`（runNode, :392）与
`test → npm test`（spawnSync, :1508）。其余命令全是进程内 `import()` owner 模块。
所以“CLI 疯狂 spawn”的直觉**不成立**；真正频繁的是 **Agent↔CLI 的进程 seam**
（每次 1–2s + 全量重校验 + hash 往返），以及测试侧 31 个 spawn-based 测试文件。

这 2 处委托的**理由本身站得住**：env-check 是 pre-install 零依赖门（只 import node builtins，
`node_modules` 可能不可用，必须出进程）；npm test 是自托管逃逸（CLI 不能 import 自己的测试套件，
否则循环）。但要看到副作用：envelope 机制因此承担了**双重身份**——Agent 面诊断 +
harness 内部进程间消息协议（parent/child diagnostic passthrough 整节 spec 都是为此存在）。

---

## 4. 历史考古（git + openspec archive）

### 4.1 时间线

| 日期 | 事件 | 意义 |
| --- | --- | --- |
| 07-10 | `2a7703c` python-to-nodejs-migration；`ppt_flow.mjs` 出生，1260 行（PPTMAKER_FRAMEWORK/06_reference_scripts/） | 项目从 Python + Markdown 方法论框架起步；CLI 从第一天就是 agent 入口 |
| 07-11 | `9789c65` CLI failure-receipt + BUG-003/004/005/006；`d8f56cb` 起 cli-diagnostic-lineage | 失败回执与 lineage 机制从最初就在打补丁 |
| 07-11 | `4c8e1d5` recoverable-session-resume | 会话恢复也要经 CLI 面 |
| 07-13 | 2002 行 | |
| 07-21 | `6d439f6` complete markerless HTML migration；3473 行（全程峰值） | 底下的产物管线（PNG Header-Lock → HTML-first → markerless HTML → image2）在换，CLI 表面跟着重做并膨胀 |
| 07-23 | simplify-workflow-control-and-interfaces；`3cee5bf` wire inspection into CLI status/state | 明确记载“CLI routing 重复拼装 mode/gate/recovery”并立法禁止；status/state 直到此时才改走 inspectWorkflow 单观察 seam（之前各有自己的观察逻辑）；该批三项变更归档为 CLS-011 “agent-workflow-simplification” |
| 07-28~29 | retire-legacy-production-surface / retire-current-v1-compatibility | 大删减，2801 行 |
| 08-02 | reconcile-command-surface-and-entry-seams；Intent Route Catalog（ADR-0001） | “fixed 12-command”框架正式确立；又加了一层发现面 |
| 08-06 | `437e696` feat!: adopt PPT Maker Harness（3263 行） | 路径改名 → “retired source-root command path”诞生 |
| 08-13 | `63b0e65` converge active authority（3828 行） | 删表面，文件反涨 |
| 08-14 | `11d3901` converge-agent-control-surfaces + `5bfcd26` retire-historical-protocol-surfaces | **删除 12 天前刚加的 Route Catalog**；v2 tombstone、dead CLI branch 清理 |
| 08-16 | `6547b59` remove retired build/doctor plumbing and harden detectors；`d2df02b` 收尾 | **4027 行**——历史峰值 |

### 4.2 数字

- 161 commits / 37 天（`master` 是 squash 后的重写，body 为空；颗粒历史 424 commits 在
  `backup/pre-squash`，root 883ec3b）；**59 个（37%）碰过 ppt_flow.mjs**。
- 行数曲线：1260 → 1519 → 1636 → 2002 → **3473**（07-21）→ 2801（删 legacy）→ 3263（改名）→
  3828 → **4027**（现在）。**每次“converge/retire”后文件都继续长大。**
- **命令面演化：11 → 12 → 14 → 15 → 11 → 12**（今天的 12 命令不是一直如此——表面在
  加与删之间摆过至少两个来回）。
- **路径链**：`_ppt_framework_v1/06_reference_scripts/ppt_flow.py`（Python v1）→
  `PPTMAKER_FRAMEWORK/06_reference_scripts/{py,mjs}` → `PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs` →
  `ppt_maker_harness/scripts/ppt_flow.mjs`。“retired source-root command path” 即
  `PPTMAKER_FRAMEWORK/...`，由 437e696（adopt PPT Maker Harness，BREAKING）退役。
- **BUG 计数（编号来自 commit message，原始记录在 `_backlog/bugs/` 未读）**：~14 个
  CLI/诊断/state-receipt 类（003、004、005、006、007、055、056、066、067、068、069、070、
  071、072）；加上同族相关 001/002/009/016–033/053/054 共 ~16–18 个——历史 bug 有相当比例
  直接打在 CLI 与诊断面。
- openspec archive 122 个 change，CLI 面专项至少 9 个（见 TL;DR 列表），另有
  page-image-owner-issued-diagnostics、align-doctor-operation-readiness、
  project-validate-source-state 等间接项。
- cli-surface spec 1063 行：28 requirements，**41 条 SHALL NOT，11 处 retired 提及**。
- 全部 27 个 main spec 共 11112 行，**412 条 SHALL NOT/SHALL not**（其中 node-specification
  45 条、cli-surface 41 条、image-generation 62 条）。
- 存在专门防止“retired 模式回归”的 architecture guard（harness_architecture.mjs，1488 行），
  负例 planted-failure 测试证明其敏感度。

### 4.3 历史模式小结

接口的演化方式是 **accretion（堆积）→ prohibition（禁止）→ guard（防回归）**，唯独没有
**redesign（缩小接口）**。“fixed 12-command”是稳定性承诺，但已经硬化成负债：缩小表面
要重新教 Agent、重写 ~1600 行 spawn-based 测试、动每个 Controller 的几十个 CLI 步骤，
成本超过继续叠加 SHALL NOT。结果是一个带“博物馆+保安”的接口——禁止牌越来越多，调用方
的学习负担一点没减，只是不许用旧名字了。

补充考古事实（来自 `backup/pre-squash` 分支的颗粒 commit body）：

- CLI 从来就是 “default human/agent entry point”（Python `ppt_flow.py` → Node `ppt_flow.mjs`）；
  **它没有替代 HTML/MD runtime**——一直在变的是底下的产物管线（PNG Header-Lock → HTML-first
  → markerless HTML → image2 page-authority），CLI 命令面反复重做去追它。
- 短命产物反复出现：`migrate-html`/`html_migration.mjs`（`822c854` 加，~`1c53d57` 删，**−1051 行**，
  存活 ~10 天）；`style-master` 命令 `ae14fa1` 删、`3c691c8` 又加回；Intent Route Catalog
  12 天即死；直到 HEAD（`6547b59`）还在删 dead CLI branch 与 8 个 unreachable retired build
  参数 + dead doctor `--image2` 分支。
- **重要方法学提示**：`master` 是 squash 过的重写分支，commit body 为空；颗粒 body（真正的
  bug/problem 陈述）只在 `backup/pre-squash` 上。后续做历史考古请 `git log backup/pre-squash`。

---

## 5. Deep-module 评判（codebase-design 词汇）

### 5.1 Depth：CLI 是 shallow module

接口面（第 2 节全部）≈ owners 合起来的接口面。调用方每学一条命令只买到 owner 一个函数
的行为——**接口本身就是 lifecycle 状态机**。对比 `inspectWorkflow` 一条
`primary_action` 就能表达“下一步干什么”，CLI 用 35 个叶子形态表达同一件事。

### 5.2 ppt_flow.mjs 三层混装（adapter 不纯）

1. **薄路由/envelope 包装**（init/status/build/refresh/new-version/state/validate）——
   这是 adapter 该有的样子；
2. **内联业务逻辑**（不是 pass-through）：`styleMasterFailure` 决策树、两个 submit factory
   里的 credential/startup-env/grant 交接、`commandSlides` 的 realpathSync 圈禁 + plan-hash
   校验、`commandDoctor` 的 profile 解析——**泄漏的 owner 复杂度**；
3. **真深度**：`cli_error.mjs`+`cli_bootstrap.mjs` 的 envelope/脱敏/边界/exit-code 纪律。

**Deletion test**：删掉 ppt_flow.mjs —— envelope/脱敏/退出码纪律会在每个消费者处重现
（这部分在挣口粮，是真深度）；但归属决策树也会消失，而这部分本来就不该是 adapter 的深度，
是 owner 知识泄漏。harness-script-layout spec 自己也这么说（CLI “SHALL NOT re-derive
owner/category/reason/next from code/prefix sets”）——文件却在 style-master 身上继续这么干。

**代码级脆弱点（审计实录，file:line 可复核）**：

- `runNode.lastChildResult` 是模块级可变单例（:427）：若父命令先后 spawn 两个 child，
  第一个 child 的保留证据会在父级发出诊断前被第二个 clobber 掉。
- `commandTest` 用 `spawnSync` 阻塞事件循环且**无 timeout**（:1508）：测试挂住 → `ppt_flow test` 无限挂。
- `hasExplicitCliOption` 对原始 `process.argv` 做前缀子串匹配（:190–192），是 Commander
  之外的**第二个平行参数解析器**，用来实现 per-operation 选项白名单。
- 1 MiB 流上限会把“超长的成功 child 输出”变成强制 exit 1（collector.finish 丢弃 stdout），
  一个合法但很大的 doctor 报告可能被误读为失败；20 KiB JSON report 上限（`registerCliJsonReport`）
  是 `artifact-view`/`status --json` 这类大 payload 最容易擦到的边。

### 5.3 Seam 位置：process 边界是真实的，但宽度只为一个 adapter 校准

**买到的（全部真实）**：LLM 编排器无法 import Node（seam 必然）；egress 点 secret 脱敏
（`SECRETISH_RE` + sanitize 全家）；崩溃围堵（uncaught/rejection/SIGINT/SIGTERM → 单
envelope）；1MB/20KB/16KB 输出边界。

**付出的（每次调用全付）**：序列化契约 ~1000 行机制；每调用重校验；hash 线程化；
parent/child 诊断接力；测试面 = spawn 进程（10–45s timeout + maxBuffer）。

**Two-adapter 测试**：生产消费者只有 LLM Agent 一个；“human/agent entry point”里的人
只用手薄片（doctor/status/init/build/test），人不会手搓 26 步 hash 接力；测试是同接口
的验证者，不是独立 adapter。而 `runNode`（doctor→env-check、test→npm）暴露了 envelope
**已经悄悄变成 harness 内部进程间消息协议**，不只是 Agent 面诊断。

### 5.4 Locality：SHALL NOT 是封装还是打补丁？

producer-owned 封装本该是“消费 `diagnostic.next` 然后停”。实际是消费者侧要背 ~250 行
规范性消费规则 + “`code/message/hint` SHALL remain a compatibility summary only and
SHALL NOT become recovery authority”这类条款。**好的封装不需要一支常备的 SHALL NOT 军队
把消费者按在正确的层上；它让错误的层不可达。** 规则存在正是因为接口太宽、消费者（LLM）
容易漂移到 prose/file-presence/code/hint，维护者只能立法禁止。

### 5.5 对照项目自己的策略

`openspec/policies/simple-reliable-control.md` 的核心原则：“**Quality control SHALL be
simpler than the work it validates**”；“An added layer must remove or consolidate
complexity; additive control without net simplification is not the default”。以这个
yardstick 衡量：

- **符合的**：one next action、earliest root cause、fail-closed、same-check rerun、secret-safe；
- **违背的**：35 个叶子形态 vs “simpler than the work”；每调用全量重校验 vs “reuse one
  evaluator where practical”；hash 线程化让 Agent 当账本 vs “few authority translations”；
  12 天的 Route Catalog vs “additive control without net simplification is not the default”。

---

## 6. 判定

**CLI 设计只在“一个窄前提”下合理，超出前提即过度工程。**

- 前提成立：消费者是 LLM 编排器（必须 process seam）、绝不能收到 secret/stack/provider
  body、需要崩溃围堵与有界输出 → **process seam + cli_error/cli_bootstrap 纪律是真深度，
  设计优秀，应保留**。
- 超出前提：12 命令/26 子操作/~35 flags/三套词汇/4 种 hash/每调用重校验，绝大部分只是把
  owner 的 ~20 个函数换了个进程入口并内联重归类。**owners 深、egress 层深、
  ppt_flow.mjs 本身宽而浅。**

一句话总结：
> **“依赖 CLI”不是病；“把 CLI 当成了整个系统”才是病——业务判断（归属、路由、校验、状态机）
> 该住 owner 模块，却持续渗漏进 4000 行入口文件；接口靠立法止血而不是靠形状收窄。**

---

## 7. 选项（供后续 backlog/change 讨论，本次未实现任何改动）

| 选项 | 内容 | 破坏面 |
| --- | --- | --- |
| **A. 保留 seam，收窄表面** | 把 style-master/image2/slides 的细粒度子操作收敛为 inspection `next.action` 驱动的更小状态机（如 `inspect` + 泛型 `step <action-id>`） | create-deck 的 40 个 CLI 步骤、命令 inventory 审计、spec 的 12-command 框架、全部命名命令的 spawn 测试 |
| **B. 库 seam + 薄 CLI** | 把 command* 主体与归属树搬进可 import 的 runtime 模块（返回 typed `{ok, report}` 或抛 problem-fact）；ppt_flow.mjs 只剩 argv→库→envelope；测试与内部委托走 import，不再 fork | “interface = test surface”原则重谈（库测单测、CLI 只留薄 e2e）；secret-safe 边界要移到库的 egress；architecture guard 需登记新公共 seam |
| **C. 会话上下文** | binding/marker/identity 只解一次，run-scoped session 持有 grant/hash；hash 不再穿 Agent context window | 无状态纯度与崩溃围堵简化性；spec 依赖的“每次调用重验 exact current bytes”保证（byte-preservation 条款）；grant/abandon 模型需重设计 |
| **D. 单动词 execute** | `inspect` 已返回唯一 owner-issued next action；暴露 inspect/execute/decide 三个动词，其余全部入 seam | 细粒度动词本身就是 human-gate 机制（pilot/authorize/generate 故意分开以在付费步骤之间插入人类决定）；anti-drift 的 plan/batch hash 保证要在 execute 内部重建；Controller 节点结构编码了细粒度序列 |
| **E. 治理转向** | 减少禁止条款：让错误形状不可表达（closed schema inventory 驱动命令生成），而不是靠 guard 抓回归 | 现有 guard 与 negative-fixture 测试体系要重构 |

**推荐方向：B + C 组合**——同机消费者走库 seam（测试与内部委托停止付 fork/序列化税），
Agent 保留一个**薄**的进程 CLI，加会话级上下文让唯一真正需要进程边界的 adapter 不再每次
重证身份、重穿 hash。`cli_error.mjs` 的脱敏/envelope 纪律保留，但收窄到它唯一挣口粮的地方：
Agent-facing 进程 egress，而不是内部 module 间调用。

---

## 8. 方法边界与遗留

- **未读 `_backlog/` 内容**（AGENTS.md: “如果不指定, 就不许读”）。BUG-003~072 的原始
  记录只在 commit message 与 spec 的修复条款里间接见到（如 BUG-066 execution-mismatch
  triplet 修复、BUG-007 state.yaml roundtrip）。若要交叉验证“历史 bug 与 CLI 面返工”的
  关联，需要用户授权读 `_backlog/bugs/`。
- `dpt_*`、`deck_*` 生产数据未读（与本题无关）。
- 计时为本机一次性测量（node v22.23.1），仅作数量级参考。
- 未修改任何源码/测试/规格；本文件是唯一产出。

### 附：一手证据索引（供复核）

- 入口: `ppt_maker_harness/scripts/ppt_flow.mjs`（4027 行；:80–82 懒加载特判、:384–427 runNode、
  :1508 npm test spawn、:1577–1649 错误码表、:3504–3974 命令注册、:3937/3955 style-master/image2）
- envelope: `ppt_maker_harness/scripts/shared/cli/cli_error.mjs`（852）、`cli_bootstrap.mjs`（189）
- 契约: `openspec/specs/cli-surface/spec.md`（1063）、`node-specification/spec.md`（1260）、
  `harness-script-layout/spec.md`、`pipeline-orchestration/spec.md`
- 策略: `openspec/policies/simple-reliable-control.md`
- 历史: `openspec/changes/archive/2026-07-23-simplify-workflow-control-and-interfaces/proposal.md`、
  `2026-08-02-reconcile-command-surface-and-entry-seams/proposal.md`、
  `2026-08-14-converge-agent-control-surfaces/proposal.md`、
  `2026-08-14-retire-historical-protocol-surfaces/proposal.md`、
  `docs/adr/0001-intent-route-catalog.md`（Superseded）
- 调用频度: `ppt_maker_harness/playbook/controller-manifest.json`（create-deck 40 节点）、
  `playbook/create-deck.md`（40 CLI 步骤）、`BOOTSTRAP.md`、`charter/AGENT_CONTRACT.md`
- 审计: `scripts/contracts/harness_architecture.mjs`（1488）、`cli_return_audit.mjs`、
  `executable_inventory.mjs`
