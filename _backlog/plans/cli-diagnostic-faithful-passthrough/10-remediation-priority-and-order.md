# Remediation priority and order

## 为什么必须用两个轴

“最急着消除的现象”和“第一处应该永久修改的边界”不是同一个问题。

- **处置优先级**按错误继续存在时对 Agent 控制面的伤害排序：错误 next、错误 owner 和不可前进循环比
  少一个辅助字段更严重。
- **实施依赖顺序**按事实流排序：上游已经丢失或改错的事实，不能由 operation owner、CLI 或 MD
  consumer 在下游恢复。

如果只按可见症状排序，最容易先改 `ppt_flow.mjs` fallback；这样可能把一个已经被
`resolveVisualBrief()` 错标的 `VISUAL BRIEF` issue 更完整地公开出去。结果不是保真，而是让错误事实
获得更强的 public authority。

## 轴一：处置优先级

以下优先级描述用户和控制面伤害，不是 commit 顺序，也不是 bug severity 编号。

### Priority 1：停止错误的 authoritative next

最高优先的是会让 Controller 合法服从、但无法前进或指向错误 owner 的结果：

- `style-master inspect` 失败后再次要求 `style-master inspect`；
- 可修 source/config defect 被称为 `internal/report_internal`；
- shared registry defect 被指向 `slide-specifications.md / VISUAL BRIEF`；
- `VISUAL IDENTITY` 或 `SUBTITLE` defect 被指向 `VISUAL BRIEF`。

原因不是文案难看，而是 final valid CLI envelope 是 MD consumer 的控制权威。错误的结构化 next 比
缺少解释字段更危险，因为 consumer 不被允许绕过它自行诊断。

当前 33 次复现均无写入、无 stdout 污染，说明最急的风险是**错误控制方向**，不是数据损坏或 provider
重复调用。

### Priority 2：阻止不可逆的 owner/locator 损失

第二优先是 producer 到 aggregator 之间的事实损失：

- reference registry physical path 未始终绑定到 owner issue；
- `resolveVisualBrief()` 丢弃下层 `path/actual/expected`；
- identity、visual language 和 presentation failures 被统一写成 `VISUAL BRIEF`；
- shared source failure 被复制成 slide-local issues。

这些事实一旦丢失，任何后续 CLI work 都只能猜。Priority 1 的正确长期解决依赖 Priority 2；但从现场
伤害看，错误 next 仍然是最先需要停止的现象。

### Priority 3：建立 bounded、public-safe 的 fact projection

第三优先是决定 internal facts 如何成为 public facts：

- internal `code` 与 public `reason.kind` 的关系；
- physical source、logical YAML path 和 Page Source field 的不同表达；
- `actual/expected`、forbidden token、parser/fs message 和 absolute path 的公开规则；
- multi-issue root reason、issue bounds 和 truncation 语义。

这不是低价值 schema polish。没有该层，Priority 1 只能靠另一组 code/prefix 猜测，Priority 2 保住的
facts 也没有稳定出口。

### Priority 4：绑定 operation-specific exact next

source/config producer 多数没有 machine next。待 problem fact 稳定后，必须明确 Style Master 和 Image2
各自在当前 checkpoint 的 nearest legal action：

- 哪些 source facts 共享同一个 repair owner；
- 哪些 invocation/inspect paths 因 operation 不同而不同；
- 哪些 next 需要 human；
- 哪些 unknown/unsafe facts必须 fail closed。

这个优先级晚于 fact/locator，不代表它不重要；它是 public diagnostic 能真正驱动恢复的最后一个业务
前提。

### Priority 5：scope、fan-out 和 precedence 完整化

单页 local field、shared selected registry 和 full presentation package 的 blast radius 不同。多错误时
还存在 whole-source parse precedence 与 earliest independent failure 的关系。

这些问题应在广泛推广共同 contract 前解决，但不必阻止一个同时覆盖 local-source 和 shared-source 的
窄 vertical slice。不能只用一个最简单的 Page Source fixture证明整个模型。

### Priority 6：测试层级和 taxonomy cleanup

真实 process coverage、architecture guard 和默认验证层级非常重要，但它们主要防止回归，并不自行
修正 owner semantics。应尽早定义 acceptance tests，清理旧 classifier/taxonomy 和调整 package-level
test routing则应在新 contract 工作后进行。

## 轴二：永久修复的因果顺序

下面是当前证据支持的建设顺序。它描述依赖，不预选具体 module/API 名称。

### Step 0：先固定契约和失败矩阵

在实现前先固定：

- local Page Source、shared Visual Language、presentation package、identity reference 四个 family；
- Pure/Framed 与 `style-master inspect/plan`、`image2 plan` 的最小公开矩阵；
- category/reason/locator/issues/next、空 stdout、单信封、完整 owner roots 无写入、无 provider call；
- unsafe/oversized fact 的 fail-closed case。

这一步应产生可失败的 acceptance assertions，但不能先把相邻计划中的 bridge shape 写进测试当成答案。

### Step 1：修正最早的事实权威和 origin preservation

第一处永久实现应在 facts 尚未丢失的位置完成，而不是 CLI catch：

- producer 明确自己拥有的 reason、physical source、logical path、subject和 safe structured details；
- reference loader 在知道 exact registry path 时保留 bounded owner locator；
- aggregation 不再把不同 origin 无条件重写成 `VISUAL BRIEF`；
- Page Source-owned selection failure仍能定位到真正 field。

这里不要求低层 producer生成 CLI envelope或 Style Master/Image2 next。

### Step 2：建立共同 problem-fact contract 和 public-safe projection policy

在 facts 正确后，定义跨 adapter 传递的最小稳定 shape，以及进入 public schema前的允许/省略规则。
Step 1 和 Step 2 在设计上需要一起确定，代码上可以先建立 contract，再迁移各 producer。

必须用至少两个不同 scope 的 sentinel 验证，建议同时包含：

- 一个 Page Source-owned local field defect；
- 一个 shared registry/config defect。

只做前者会过拟合现有 `subject/source` shape；只做后者又无法证明 field-level repair。

### Step 3：由 operation owner 绑定 exact next

Style Master 与 Image2 在这里消费同一 problem fact，并绑定当前 checkpoint 的 action。它们可以共享
source reason/locator，但 operation、invocation、human gate 或 rerun target 不必相同。

这一层需要明确 source prerequisite failure是否绕过 lifecycle classifier，或者 classifier 如何消费一个
已登记的 owner result；不能再次从 Error class name、code prefix 或 message 猜语义。

### Step 4：CLI 做 bounded public envelope projection

只有 facts 和 action 都已绑定后，direct CLI 才负责：

- public schema/version compatibility；
- category/action vocabulary；
- redaction、bounds、lineage和 invocation confinement；
- exit 1、空 stdout、恰好一个 final envelope；
- unsupported/unsafe fact fail closed。

这里可以消除本问题对应的第二归因，但不应删除 CLI 对 public transport/schema 的合法 ownership。

### Step 5：覆盖最难的 fan-out 与 ambiguity cases

基础 vertical slice工作后，再完成：

- shared reference registry 对多页的 root/affected-subject表达；
- multi-issue truncation 不改变 root owner；
- presentation full-package blast radius；
- same reason code from different owners；
- unselected Visual Language invalid record 的规范决议和相应行为。

Reference Material 应被视为最强的模型验证，而不是最容易的首个实现：它同时包含缺 physical locator、
parser rewrite、shared-source fan-out 和同码不同 owner。

### Step 6：consumer verification 和旧路径清理

最后验证 MD consumer只消费 producer公开字段与 exact next，不解析 prose、不复制 schema。待所有受支持
families 都进入新路径后，再删除或收窄重复 classifier sets/prefixes，并增加 architecture/coverage guard
阻止旧模式回流。

Consumer 不应成为最先修改的一层；否则会把 producer contract 缺口固化成另一份 MD 侧推断。

## 紧急止损与永久修复不是一条线

如果在完整设计前出现必须立即恢复生产的情况，处置顺序应是：

1. 先消除 self-referential actionable next；
2. 继续保持无写入、无 provider call、单信封和 secret-safe fail-closed；
3. 明确把临时结果标成 containment，而不是声称已实现 faithful source repair；
4. 不把 raw `issues[]`、Error message 或猜测的 source/action 暴露为新的 public authority。

这种止损仍可能不满足最终 source-repair outcome，只是避免 Controller 被错误动作锁死。它不能替代上述
Step 0-6，也不应顺手确立最终 schema。

## Failure family 的建议落地次序

不要按“最容易加 code 的 class”逐个完成。更稳妥的是先用两个互补 sentinel建立 vertical contract，再
用复杂 family证明它没有过拟合：

| 次序 | Sentinel / family | 为什么在这里 |
|---|---|---|
| 1 | Page Source-owned local field + Visual Language shared registry | 同时证明 field locator 与 shared source owner；直接覆盖当前最核心的两种 shape |
| 2 | Presentation direct package failure + per-slide header conflict | 证明“有顶层 code”不等于正确分类，并验证同一 family 的 direct/aggregated 两条路径 |
| 3 | Identity Reference Material | 用最复杂的 physical path、logical path、selection field、fan-out和 same-code ambiguity 验证模型 |
| 4 | oversized/multi-source/precedence cases | 在基本 owner model 稳定后验证 bounds、root selection 和稳定性 |

这不是说 Reference 风险低，而是它依赖最多。若把它作为第一处实现，很容易一次性混入 locator schema、
aggregation、fan-out和 action mapping，无法判断哪一层设计正确。

## 与相邻问题的依赖关系

本排序只约束本研究里的 diagnostic/source-repair问题，不重新接受原计划 Change A/B/C 的设计。

- “source valid / state stale”的 observation 需要先能可靠区分 source-invalid，因此其语义设计依赖本研究
  对 source problem fact和 precedence 的结论。
- runtime dotenv/startup 来源是独立机制；若它是当前生产 blocker，可以由独立 change并行处理，不需要
  等待 diagnostic fact contract。
- live writer/reconcile 和 durable state cursor 仍是独立时间/状态 authority，不应借本排序并入 CLI
  source diagnostic工作。

## 当前推荐

从控制面伤害看，先停止错误 authoritative next；从永久实现依赖看，先修 facts 的 origin/locator，再
建立 public-safe projection，随后由 operation owner绑定 next，最后让 CLI封装和清理旧归因器。

一句话概括：**先保护事实，再绑定动作，最后公开；紧急情况下先停止错误动作，但不要把止损伪装成
最终保真。**
