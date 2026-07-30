# 渐进式生产 UX：Style Master、Pilot Run 与扩量

> 文档性质：Target Design（目标设计），不是当前可执行契约。
> 基线日期：2026-07-30。任何实现都必须先进入正常 OpenSpec change，并以届时 accepted specs 与 runtime truth 为准。
> 基线检查：`openspec list --json` 当时没有 active change；本文不代表实施已经开始。

## 一句话结论

Style Master（风格母版）先定方向，Pilot Run（试生产）再用通常 3-5 张真实代表页验证方向，慢速生成逐项持久化并报告进度，人在看到真实证据后才单独授权 Expansion（扩量）。Framed（框架合成模式）与 Pure（全图模式）共用这套产品概念，但各自拥有一条不交叉的 Controller 路径和审查语义。

这不是单纯的成本优化。核心 UX 原则是：在人还容易改变方向时展示真实产物，让反馈尽早进入生产闭环。

面向 Agent 的顺序推进、暂停点和 resume 体验见 [tasks-overview.md](tasks-overview.md)；其中 checkbox 是协作投影，不是 runtime authority。

## Current 与 Target

规划必须先承认当前能力，不能把目标态写成现有命令。

| 维度 | Current（当前 accepted/runtime） | Target（本计划） |
| --- | --- | --- |
| Raw lifecycle | `image2 plan -> authorize -> generate -> review -> accept`，面向一份完整 raw plan。 | 同一份完整 raw plan 下，先 Pilot batch，再 Expansion batch。 |
| `image2` CLI surface | 子命令只有 `plan|authorize|generate|review|accept`。 | 是否新增或调整入口，由未来 `cli-surface` delta 决定。 |
| Scoped generation | Help 中虽出现 `--slides`，但 target 路径明确拒绝该参数，不能把它当作 Pilot 能力。 | 精确 batch scope 由正式 owner 规划、授权并验证。 |
| Style Master | `style_master.jpg` 是 raw planning 的输入；没有一等 candidate/review/promotion 环路。 | 在页面级生成前展示真实 candidate，记录人的视觉决定。 |
| Pilot evidence | 没有独立 Pilot projection、decision receipt 或 expansion gate。 | 两种 workflow 分别产生 production-equivalent（生产等价）Pilot 证据。 |
| Authorization | 当前授权合同不能被静默解释成 pilot/expansion 累计授权。 | 大范围页面生产通常有两次精确授权：Pilot 与剩余范围 Expansion。 |
| Progress / recovery | 当前 `generate` 顺序提交整份 plan，但只有全部 provider 结果返回后才逐页写入；没有逐项 attempt consumption/progress owner。 | 每个 item 在下一次提交前完成 claim、submit、bytes/provenance commit；中断后只继续 owner 证明尚未提交的 item。 |

在 Target 被 accepted specs 和 executable contracts 实现前：

- 不得用 `_scratch/` 脚本、直接 provider 请求或手工复制文件模拟 Pilot Run；
- 不得直接删除、改写 `_generated/`、state、receipt、journal、plan 或 authorization；
- 不得从 Markdown checkbox、文件数量或聊天记录推断授权和完成状态；
- 若当前正式路径不能满足 Pilot UX，应停在规划/变更边界，而不是绕过 owner。

## 产品问题

当前路径要求人在看到 production-equivalent pages（生产等价页面）前，就决定是否为完整 raw plan 承担生成成本。结果是两种 workflow 都可能过晚暴露方向错误：

- Framed 用户尚未看到真实 underlay 与本地 Text Frame 的组合效果；
- Pure 用户尚未确认完整页面能否持续维持字体、层级、可读性和视觉语言；
- Style Master 即使已有文件，也缺少可证明的 candidate、审查与接受闭环；
- 长批次中间没有可恢复的逐项提交事实；中断可能丢失已返回结果，用户也无法从 owner-issued progress 判断该等待、暂停还是反馈。

过晚反馈会放大返工、provider 成本和用户的不确定感。Pilot Run 必须成为一等生产阶段，而不是调试便利功能。

## 共同节奏，独立旅程

共同的是概念、Gate 语义和底层确定性机制：

```text
内容上下文足以判断方向
  -> Style Master candidate
  -> 人类视觉方向决定
  -> 一份完整、provider-free 的 raw plan
  -> Pilot Run（通常 3-5 页）
  -> 每个 item 完成即持久化并报告 owner-issued progress
  -> 人类代表性质量决定（完整 debt 时转 Complete Raw Review）
  -> 如仍有 paid-generation debt，单独授权剩余范围
  -> Complete Raw Review（完整原始图审查）
  -> Delivery Review（交付审查）
```

用户旅程则保持独立：

```text
Framed Controller
  Style -> Framed plan -> Framed pilot underlays
  -> 生产等价本地合成 -> Framed pilot review
  -> [如需要] Framed expansion -> 完整 raw review -> Framed finalization

Pure Controller
  Style -> Pure plan -> Pure pilot full pages
  -> Pure pilot review -> [如需要] Pure expansion
  -> 完整 raw review -> Pure finalization
```

一旦版本已选择 workflow，用户只看到该路径的问题和下一步。不得要求用户比较另一模式，也不得为了代码复用建立 cross-workflow Controller。共享 JS 只处理不理解 Framed/Pure 语义的机械事实，例如精确 scope、授权、字节绑定、通用标签和失效检查。

## 四个人类问题

| Checkpoint | 人要回答的问题 | 决定的作用 | 不能替代什么 |
| --- | --- | --- | --- |
| Style Master | 这是我们希望继续发展的视觉语言吗？ | 接受、修正或重定向视觉方向。 | 不能替代 Pilot、页面生成授权或 raw acceptance。 |
| Pilot Run | 这套语言在当前 workflow 的真实代表页中仍然成立吗？ | 部分范围时允许 Controller 进入剩余范围授权检查点；完整小范围时同一次交互转交完整审查 owner。 | `proceed` 不是 Expansion 授权，也不是 waiver。 |
| Complete Raw Review | 每一张当前 raw 页面在视觉与内容上都可接受吗？ | 人类决定与 runtime 已验证的完整 provenance/coverage 一起发布 accepted raw evidence。 | 人不负责判断 hash、来源归属或 currentness；该决定也不能替代 final composition 或 delivery review。 |
| Delivery Review | 组装后的 deck、顺序、最终像素和 notes 可以交付吗？ | 发布交付决定。 | 不能追溯修复缺失的 raw evidence。 |

不要把四个问题压缩成一次过晚 approval。若同一份当前证据已经完整回答两个完全相同的问题，也不要机械重复询问。

## Style Master 反馈环路

### 时机

当主题、受众、叙事意图、已选 workflow 和视觉方向足以支持有效判断时，就进入 Style Master 环路。它不应等待所有页面细节写完，但必须早于完整页面级 raw production。

### 目标环路

```text
canonical style intent
  -> provider-free candidate plan
  -> 如需 provider，展示精确成本并取得该次操作授权
  -> candidate bytes + provenance
  -> 展示真实 candidate
  -> proceed | repair | redirect
  -> proceed 时由 owner promotion，并写 acceptance receipt
```

- 未审查 candidate 不得覆盖当前规范 Style Master。
- 现有受目录约束的 Style Master 若缺少 acceptance receipt，可以经同一人工审查被本地采用，但不得补写无法证明的历史 provenance。
- `proceed` 表示人接受当前视觉方向；`repair` 返回 style intent owner 后重跑同一 checkpoint；`redirect` 返回视觉方向选择。
- workflow 切换不是 Style Master 环路内操作，仍属于 Structural Versioning Path（结构版本化路径）。
- Style Master 若需要远端生成，每次非零提交都需要 owner 认可的精确授权。该授权与页面 raw Pilot/Expansion 授权互不替代。

### Scope 与 promotion

Current `2_backbone/visual-style/style_master.jpg` 位于 deck 共用层，可能同时影响多个版本。Target 不能把覆盖这个共享文件描述成某一个 run 的局部修改：

- candidate plan 必须绑定 intended scope、previous effective-style digest 与 current generation profile，并在 promotion 前投影会变 stale 的 current plans/evidence；
- 每个版本的 effective Style Master selection 必须由 owner 以实际 bytes digest 绑定，即使底层 bytes 在 deck 内去重复用；单独的文件名不能成为接受事实；
- promotion 使用 compare-and-swap 与原子 writer，只有 current human decision 可以更新 selection；
- style/profile 变化通过所属 owner 使受影响的 plan、Pilot decision、raw review 和 final evidence 失效，但不得仅因 profile 变化制造新的 source epoch；
- 若人不接受共享影响范围，应先由未来 capability design 提供 version-scoped selection，而不是静默复制或改写文件。

## Pilot 选择

### 交互原则

Agent 根据当前 deck 的主要风险提出最小代表集，通常 3 页，无明确理由时不超过 5 页。人在同一次 Pilot scope 授权交互里可以替换、增加或删除候选。

提交前必须展示：

- 每页当前 `position + formal slide_id + title`；
- 每页具有代表性的一条具体理由；
- 当前已选 workflow 与 generation profile；
- 精确 Pilot batch identity、IDs、最大提交次数和成本后果；
- Pilot 后仍需另行授权的剩余范围。

代表性选择是 Agent 的语义判断，不应成为 JS scoring algorithm 或持久化排名。Runtime 只负责把选择解析为当前正式 IDs，并验证 scope 无歧义、未陈旧。

`paid-generation debt` 指 full current plan 中缺少可验证 current materialization、因此仍需 provider submit 的 items。Pilot projection 必须区分两个集合：`review sample` 是人要看的代表性页面；`paid submission scope` 只是 sample 中当前确有 paid-generation debt 的 items。已有且 current 的 materialization 可以零提交参加 review，不能为了让 scope 看起来整齐而制造重复付费。

### Framed 风险覆盖

Agent 优先覆盖当前真正存在的高风险，不要求机械凑齐每一行：

| 风险维度 | 代表页提示 |
| --- | --- |
| 叙事锚点 | Opening/hero，以及必要时一张中段或结尾页。 |
| Text Frame 压力 | 最密、最长、多语言或长 token 风险最高的页面。 |
| Frame variant | 若 callout/layout variants 差异显著，在批次允许时覆盖。 |
| Safe zone | underlay 最难为本地文字预留区域的 composition。 |
| 一致性 | 注册 identity/reference 或跨页视觉一致性风险最高的页面。 |

### Pure 风险覆盖

| 风险维度 | 代表页提示 |
| --- | --- |
| 叙事锚点 | Opening/hero，以及必要时一张中段或结尾页。 |
| 文字压力 | exact-copy、多语言、最长文字或字体层级风险最高的页面。 |
| 复杂构图 | Diagram、data、timeline 或其他复杂 composition。 |
| 可读性 | 图片与文字层级、对比度或信息密度最难控制的页面。 |
| 一致性 | 注册 identity/reference 或跨页视觉一致性风险最高的页面。 |

### 小 deck 与小范围重建

- 当前 paid-generation debt 为 1-5 页时，完整 debt set 就是付费 Pilot scope。
- 此时不创建 partial Pilot decision；生成完成后由 complete raw-review owner 准备覆盖 full current plan（包括复用 bytes）的 projection，同一次人类 review 可以发布完整 accepted raw evidence，不再问一次相同问题，也没有 Expansion 授权。
- paid-generation debt 为 0 时，不制造 synthetic Pilot authorization 或 evidence；若仍缺完整 raw acceptance，直接进入 complete raw-review owner。
- Framed Text Frame-only refresh 与 notes-only refresh 沿各自 provider-free owner path 前进，不人为进入 Pilot Run。
- 若 deck-wide style/profile 变化使旧样本失去代表性，应重新选择 Pilot，而不是沿用旧 decision。

## Production-Equivalent Pilot 证据

### Framed

Framed Pilot 必须用最终生产采用的同一 renderer/compiler、字体、浏览器检查和 capture profile，把选中 underlay 与真实 Text Frame 合成为 preview-only evidence。只看 raw underlay contact sheet 不足以判断 safe zone、层级、平衡和文字可读性。

该 projection 只能发布 Pilot 预览和证据，不得写 final manifest、PPTX、notes、accepted raw evidence 或 delivery decision。Framed review 在一次人类判断中同时呈现：

1. 无文字 underlay 是否尊重视觉意图与 reserved regions；
2. 生产等价的合成页面作为整体是否成立。

### Pure

Pure provider output 已经拥有整页像素。Pilot 必须展示精确 raw bytes，并带当前 `position + formal slide_id + title` 标签和当前 plan/profile/coverage 绑定。不得经过 Framed compositor，也不得向用户引入 Framed safe-zone 语义。

人直接判断内容渲染、字体、层级、视觉方向、identity fidelity 和跨页一致性。

## 一份完整计划，分批精确授权

Provider-free raw plan 始终覆盖当前完整生成范围。Pilot 与 Expansion 是这份计划的严格 projection，不是两份互相竞争的 full plan。

```text
batch scope = full raw plan identity
            + exact ordered selected slide IDs
            + selected raw-contract identities
            + provider generation profile
            + source/execution identity
            + maximum submissions
```

对于大于 Pilot 范围的页面生产，raw provider 成本恰好分成两个用户可理解的时点：

1. Pilot authorization 只覆盖代表页；
2. Pilot `proceed` 后，Expansion authorization 只覆盖仍未有效物化的当前剩余页。

二者都必须精确、显式、在 submit 前由唯一 authorization owner 重检。禁止 count-only grant、inferred grant、可反复消费的 retry grant、full-plan preauthorization 或由后一次授权追溯覆盖早期字节。若某项确需再次付费提交，只有在旧 attempt 已被 owner 对账并终结后，才能披露新的 exact scope 并取得新的显式授权。

`proceed` 只是一项 owner judgment（人的质量判断），不是 provider grant。Controller 必须先记录当前 Pilot 决定，再单独展示剩余 scope 和成本，取得 Expansion 授权后才可提交。

## 长程执行、进度与中断恢复

授权的 `maximum submissions` 是上限，不是要求 Agent 无条件跑完整批。Target raw owner 默认逐项推进：

```text
current plan/grant recheck
  -> durable item claim / attempt identity
  -> one provider submit
  -> atomic bytes + grant-consumption + provenance commit
  -> owner-issued progress projection
  -> next item or human checkpoint
```

- 同一 item/grant 同时只能有一个 live claim；默认在上一项 commit 或明确终结后才开始下一项。未来若引入并发，也必须维持同样的逐项 ownership，不能退回“整批结束后落盘”。
- 人在下一次 submit 前暂停或取消时，授权中尚未 claim 的 items 保持未提交；授权允许提交，不强迫消费。
- Progress 是 attempt/materialization owner 的只读投影，至少能区分已物化、明确未提交、失败已终结和结果未知。Agent 在每项终结或 checkpoint 到达后向人报告该投影。
- Process interruption 后，resume 先读取 owner facts，只继续明确未提交的 items。文件存在、缺失或 task checkbox 都不能证明 provider 是否已调用。
- 若请求已发出但是否扣费/返回 bytes 不确定，该 attempt hard-stop。Owner 先使用 provider 支持的 idempotency/reconciliation 能力对账；无法证明的旧 attempt 标为不可复用且可能已计费，绝不自动 resubmit。
- 对账后若仍需要另一付费 submit，Controller 重新展示该 item、额外最大成本和后果，取得新的 exact grant。该新 grant 不修改旧 attempt，也不追溯授权旧 bytes。

这些是长程任务不可重建的付费事实，必须由 runtime owner 持久化；Markdown task list 只能引用 progress，不能成为 submission ledger。

## 字节复用与完整审查

每个已生成 item 需要由 raw materialization owner 把精确 raw bytes 绑定到产生它的 plan、raw contract、profile、source identity、grant 和已消费 attempt。仅有 `${slide_id}.png` 文件或匹配文件名不构成 provenance。

扩量时：

- 验证当前 Pilot tuples；
- 原样保留有效 Pilot bytes；
- 只提交精确授权的剩余 items；
- 完整 raw review 覆盖 Pilot 与 Expansion 的全部当前 tuples；
- accepted raw evidence 逐项绑定 Pilot、Expansion、provider-free reuse 或后续显式 retry 的实际 provenance，不能用最后一个 authorization digest 代表所有 bytes；
- 只有 runtime 已验证的 complete/current coverage 加人类质量决定才能发布 accepted raw evidence。

复制来的文件、手工状态和文件数量都不能替代 materialization evidence。Pilot bytes 一旦陈旧，只能在重新披露 scope 并取得精确授权后由 owner 重建。

## Source of Record

下表说明事实应由谁拥有，不定义未来 wire schema。具体字段和 writer 必须在所属 capability spec 中落定。

| 事实 | Direct Source of Record | 非权威投影 |
| --- | --- | --- |
| 当前 run、source epoch 与已选 workflow | Canonical source receipt + runtime state/inspection owner | 模板、聊天、文件夹名称 |
| 当前 Style Master candidate bytes/provenance | Style candidate owner | 预览截图、task 描述 |
| 人接受的 effective Style Master 与适用 scope | Style selection/acceptance receipt owner | `style_master.jpg` 单独存在 |
| 完整 raw intent | 已选 workflow adapter 写出的 canonical full raw plan | 手写 ID 列表、task checkbox |
| Provider 授权 | 唯一 runtime authorization owner | `proceed`、聊天同意、文件存在 |
| Provider attempt、grant consumption 与可恢复进度 | Submission/materialization owner | Task checkbox、进程内计数、文件数量 |
| 已付费生成的 raw bytes/provenance | Raw materialization owner | `_generated/` 文件数量 |
| Pilot projection 与人的决定 | 已选 workflow Pilot evidence/decision owner | Contact sheet 或模板结论 |
| 完整 raw acceptance | 现有 complete raw-review evidence owner | 部分页通过、Pilot `proceed` |
| 最终页与交付 | Final manifest、assembly/notes/delivery receipts | PPTX 文件单独存在 |
| 页面身份与顺序 | `slide_id` 来自 canonical source；`position` 由当前顺序投影 | `{NN}-` 文件名前缀 |

恢复工作时，Controller 先从 inspection/status 取得 owner-issued current fact 和唯一最近合法动作。Task projection 只帮助恢复人的意图与反馈，不参与 pass/fail。

## Gate 与 continuation

本计划遵循 [human-centered-gates.md](../../../openspec/policies/human-centered-gates.md)、[agent-assistance-and-control.md](../../../openspec/policies/agent-assistance-and-control.md) 和 [simple-reliable-control.md](../../../openspec/policies/simple-reliable-control.md)。

| 条件 | 分类 | 最近合法动作 |
| --- | --- | --- |
| 可确定、可逆且不涉及风险接受的格式或投影修复 | `guide` | Agent 通过 owner 修复，并重跑同一 checkpoint。 |
| 当前 candidate/Pilot/完整 review 已具备，等待人的视觉或质量判断 | `confirm` | 展示真实证据，请人 `proceed`、`repair` 或 `redirect`。 |
| 精确 batch scope 已具备，等待人承担 provider 成本 | `confirm` | 展示 IDs、最大提交次数和后果，请人 authorize、revise 或 decline。 |
| 可逆质量 warning 且 owning spec 明确允许继续 | `confirm` | 先推荐 repair；若人仍继续，单独记录有界、version-scoped reason。 |
| Identity、bytes、hash、provenance、authorization、evidence completeness 或 recoverability 不确定 | `hard-stop` | 返回所属 owner 修复，然后重跑同一 checkpoint；没有 waiver/force。 |

Pilot `proceed` 不能顺便吞掉已知 warning。若用户要带 warning 继续，必须是另一项明确的 reasoned continuation，而且只有 accepted contract 已把该风险分类为 confirm 时才成立。Continuation 不是 approval，不能改变 evidence 是否完整，也不能越过 identity、integrity、security、authorization 或 recovery 边界。

## 持久状态纪律

只持久化无法从直接权威重建、且必须跨 invocation 保存的事实：

- 人对当前 Style Master 的接受决定及 effective selection/scope binding；
- 精确 provider grants；
- 已开始 provider attempt 的 claim、终结结果与 grant consumption；
- 付费 raw bytes 与实际 grant/attempt 的 provenance binding；
- 人对精确当前 Pilot evidence 的决定。

Representative scoring、remaining scope、状态摘要、布局检查结果和 checkbox 都是可重算投影，不应成为第二状态库。每个未来持久字段都必须在 design 中写明 owner、writer、readers、失效条件和移除路径。

对 partial Pilot，Pilot decision receipt 只有一个 authority effect：让 Controller 可以展示当前 remaining-scope authorization。它不是 raw acceptance、provider authorization、final evidence 或可复用 waiver。若 Pilot 已耗尽全部 paid-generation debt，则不创建 partial receipt；同一次 review 必须由 complete raw-review owner 按 full-plan coverage 发布 accepted raw evidence。

## 失效与 same-check recovery

- Style intent、candidate bytes 或 profile 漂移：返回 Style Master review。
- Style Master 改变导致 raw generation profile 改变：使 full plan、Pilot scope/decision 和后续 raw evidence 失效。
- Source、workflow、plan、contract、profile、selected IDs 或 execution identity 漂移：在 provider submit 前使尚未消费的对应 grant/claim 失效；已发生 attempt 保留历史，不被改写。
- Pilot `repair`：返回当前 workflow 的最近 source/visual owner，修复后重跑同一 Pilot checkpoint。
- Pilot `redirect`：返回 Style Master；workflow 切换走带 preview 与 exact plan hash 的 Structural Versioning Path。
- Partial write 或 process interruption：fail closed。只承认 owner 能证明的 materializations，并从 attempt owner 投影明确未提交、已物化与 uncertain items。
- Uncertain provider outcome：先对账或终结旧 attempt；不能自动 retry。确需再次提交时重新披露额外成本并取得新的 exact grant。

不得隐藏 retry、推断意图、建立 fallback chain 或让人手工修 hash/state。

## Progressive Plan（渐进推进计划）

每一步都通过正常 OpenSpec change 完成；规划目录本身不授权实现。精确 capability deltas 应在 proposal 时依据当时 main specs 决定，不在这里预填 change 名或复制 schema。

### P0：冻结基线与验收语言

- 记录 Current 行为、目标 UX、四个人类问题和 hard-stop invariants。
- 明确现有 `--slides` 不是可用 Pilot surface，并决定未来 CLI/Controller 所有权。
- 给 Framed/Pure 各准备最小端到端验收 journey，并包含中途暂停、进程中断和 uncertain provider outcome；不建立共享用户分支。

退出条件：proposal、design、delta specs 和 tasks 自洽；每个新增控制都说明删除/避免了什么复杂度。

### P1：Style Master 早反馈闭环

- 建立 provider-free candidate plan、精确生成授权、candidate provenance、真实 review、promotion 与 acceptance receipt。
- Framed 与 Pure Controller 分别在自己的直线路径中调用同一资产 owner。
- 明确 deck-shared asset 的 effective selection scope、promotion CAS 和跨版本 invalidation projection。
- 先用受控 run 做 UX 试用，确认用户能在页面级生产前看懂、比较并重定向风格。

退出条件：未审查 candidate 不能覆盖 current Style Master；每个失败回到同一 checkpoint；零页面级 provider 调用。

### P2：分批 raw 基础能力

- 演进现有唯一 authorization owner，支持同一 full plan 下的精确不可变 grants 与逐项 grant consumption。
- 增加逐项 claim/attempt/materialization owner；每个结果在下一 submit 前原子持久化，inspection 从 owner facts 投影 progress。
- 演进 accepted raw evidence，使一份完整 evidence 能逐项绑定多个 grants/attempts 与 provider-free reuse，而不是只绑定最后一个 authorization digest。
- 用 focused negative tests 覆盖越权 scope、陈旧 plan、重复 submit、crash-after-submit、partial write、uncertain outcome 和错误 owner mutation。

退出条件：共享层不解释 Framed/Pure 语义；无精确 grant 时 provider 调用 hard-stop；任意 item commit 后重启不会重复提交，uncertain attempt 不会自动 retry。

### P3F：Framed 独立 Pilot vertical slice

- 在 Framed Controller 内完成代表页提案、精确 Pilot 授权、underlay 生成、生产等价本地合成，以及 partial Pilot decision 或 full raw-review handoff。
- 用唯一 accepted production renderer 生成 projection，不增加第二套 CSS/compiler。
- 通过少量受控试生产收集人的 safe-zone、Text Frame 和整体视觉反馈。

退出条件：Framed 用户全程不需要理解 Pure；partial Pilot `proceed` 只能打开 Expansion 授权检查点；若 Pilot 已耗尽 paid-generation debt，则不创建 partial receipt，直接交给 complete raw-review owner。

### P3P：Pure 独立 Pilot vertical slice

- 在 Pure Controller 内完成代表页提案、精确 Pilot 授权、full-page 生成、真实 raw-byte projection，以及 partial Pilot decision 或 full raw-review handoff。
- 不调用 Framed compositor，不展示 Framed 专属概念。
- 通过少量受控试生产收集人的字体、层级、exact-copy 和复杂构图反馈。

退出条件：Pure 用户全程不需要理解 Framed；partial Pilot `proceed` 只能打开 Expansion 授权检查点；若 Pilot 已耗尽 paid-generation debt，则不创建 partial receipt，直接交给 complete raw-review owner。

P3F 与 P3P 可以分开实施和试用；其中一条的内部状态或 UX 不得成为另一条的前置知识。

### P4：Expansion、完整审查与恢复

- 只对剩余当前 IDs 请求第二次 raw 授权，并验证 Pilot bytes 原样复用。
- 把 Pilot、Expansion、provider-free reuse 与显式 retry materializations 的逐项 provenance 合并进入现有 complete raw-review owner。
- 实现 1-5 页一次审查、零 paid-generation debt 跳过 Pilot authorization，以及 source/profile 漂移后的 same-check recovery。

退出条件：部分 Pilot 永远不能 finalization；完整小范围不重复询问；resume 只依赖 runtime truth。

### P5：交付与逐步推广

- 分别完成 Framed/Pure 从 Pilot 到 final manifest、PPTX、notes 和 Delivery Review 的端到端测试。
- 覆盖每个慢速阶段的暂停/取消、逐项 progress、进程重启、provider 对账与 no-duplicate-submit journey。
- 兼容读取旧的完整 accepted evidence；一旦当前 plan 进入新的 scoped-generation lifecycle，不得把旧 plan-wide grant 静默当成 Pilot grant。
- 更新 Controller 文档、CLI help、diagnostics、command inventory 和回归测试，再逐步扩大试用范围。

退出条件：两条 workflow 均通过独立 journey；用户在 Expansion 前已经看过真实代表页并给出明确反馈。

## 成功定义

- 用户在页面级大规模花费前看到并决定真实 Style Master。
- 大于 5 页的 Framed 与 Pure 生成范围，在当前 Pilot `proceed` 前都不能进入 Expansion。
- Pilot grant 不能提交未选择页面；Expansion grant 不能追溯授权 Pilot bytes。
- 每个 provider item 在下一 submit 前已有 owner-issued attempt/materialization 事实；重启不会重复提交已物化或 uncertain item。
- 当前 Pilot bytes 原样进入完整 raw review 和最终生产。
- 两条用户旅程直线、独立，不要求用户思考另一 workflow。
- 完整小范围只审查一次，provider-free refresh 不制造 Pilot。
- 每个失败只给出所属 owner 的有界根因和一项最近合法动作。
- 不存在 scratch workaround、隐藏 retry、inferred authorization、手工 state、parallel success store 或 cross-workflow Controller。
