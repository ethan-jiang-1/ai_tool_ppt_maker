# 渐进式生产 UX：Style Master 与 Pilot Run

> [README.md](README.md) 配套文档 | 状态：可进入决策（decision-ready） | 更新：2026-07-30

## 产品问题

当前 Page Authority v2 路径要求人在看到 production-equivalent pages（生产等价页面）之前，就授权完整 raw plan（原始图计划）。因此，两种已选 workflow 都会过晚发现视觉方向错误：

- Framed（框架合成模式）可能在用户看到真实 underlay 加本地 Text Frame 合成结果前，就为全部 underlay 付出 provider 成本；
- Pure（全图模式）可能在用户确认 Image2 能否持续维持预期层级、字体与视觉语言前，就为全部完整页面付出成本；
- `style_master.jpg` 是 raw planning 的必需输入，但当前 create-deck Controller 没有为它暴露一等的 candidate/review/lock 环路。

这首先是反馈时机缺陷，不只是成本优化问题。产品必须让人在修改成本仍低时纠正方向。

## 目标结果

每条新的 Framed 或 Pure 生产路径都遵循以下交互节奏：

```text
足以判断方向的内容上下文
  -> 真实 Style Master（风格母版）candidate
  -> 人类视觉方向决定
  -> 一份完整且 provider-free 的 raw plan
  -> 代表性 Pilot Run（试生产，通常 3-5 页）
  -> 人类生产质量决定
  -> 对剩余页面单独授权
  -> 完整 raw review（原始图审查）
  -> 最终交付审查
```

这些人类问题刻意保持不同：

| 检查点 | 人需要回答的问题 |
| --- | --- |
| Style Master | 这是我们希望继续发展的视觉语言吗？ |
| Pilot Run | 这套语言在已选 workflow 的真实代表页中仍然成立吗？ |
| 完整 raw review | 每一张生成页面都可接受且来源可归属吗？ |
| Delivery review | 组装后的 deck、顺序和 notes 输出可以交付了吗？ |

不要把这些问题压缩成一次过晚的 approval。当一个当前产物已经回答某个问题时，也不要重复询问。

## 已确定的 UX 决定

| 关注点 | 决定 |
| --- | --- |
| 产品地位 | Pilot Run 是一等生产阶段，不是可选的调试便利功能。 |
| Workflow 覆盖 | 只要生成范围大于代表性批次，Framed 和 Pure 都需要 Pilot Run。 |
| 路径形态 | 概念与 policy 共用，但每种已选 workflow 都拥有自己的直线式 Controller 路径和 review 语义。Framed 用户不需要经过或思考 Pure 分支，反之亦然。 |
| Style 时机 | 在 intake/workflow 选择完成且内容上下文足够后建立并审查 Style Master，但必须早于完整 raw production。方向锁定后可以继续详细 authoring。 |
| Pilot 大小 | Agent 通常提出 3-5 页。这是 UX 默认值，不是 protocol 硬上限。 |
| 选择 owner | Agent 提出覆盖风险的代表页；人可在同一次限定范围授权交互中调整。Runtime 验证精确当前 IDs 与 scope，但不假装代替创意选择。 |
| 规划 | 编译一份规范、完整的 raw plan。Pilot 与 expansion（扩量）是同一不变计划下的精确提交批次，不是互相竞争的完整计划。 |
| 成本边界 | Pilot 授权只覆盖已披露的代表页 IDs 和最大提交次数，不能授权剩余页面。 |
| Expansion | 人对当前 pilot 证据作出 `proceed` 后，Controller 才能展示仅覆盖剩余当前 IDs 的第二次精确授权；`proceed` 本身不授权这些页面。 |
| 字节复用 | 当前 pilot 字节在完整审查和生产中保留并复用，扩量不得静默重新生成。 |
| 最终接受 | 部分 pilot 证据只能允许流程继续；除非其 scope 已等于完整计划，否则不能满足完整 raw acceptance 或 finalization。 |
| 小范围 | 若完整生成范围不超过 5 页，则全部作为 Pilot Run。其完整且当前的 review 可以同时作为完整 raw review，避免让人回答两次相同问题。 |
| CLI 历史 | 有意更新 `cli-surface`、help、command-count/retirement tests 和 non-v2 fences 后，把清晰的顶层名称 `pilot`、`style-master` 恢复为 Page Authority-owned surfaces；不恢复旧实现或旧 state 语义。 |

## 为什么这套控制仍然更简单

Pilot Run 用一个小而真实的生产等价样本，控制规模大、成本高且难以回退的生成批次。最短正确闭环是：

```text
一份完整计划
  -> 一份精确代表页 authorization grant（授权许可）
  -> 一份已选 workflow projection（投影）
  -> 一个人类决定
  -> 回到同一检查点修复，或取得一份剩余范围 grant
```

它替代首次就授权完整计划，以及在过晚反馈后很可能发生的全 deck 重生成。代表页选择和成本授权合并为一次交互；完整小范围只审查一次；Framed 复用唯一生产 renderer；Pure 复用精确页面字节。系统不引入 scoring service、第二 Controller、retry chain 或 pilot-specific finalization。

## 独立 Workflow 路径

Controller 只暴露整版本已经选择的分支：

```text
workflow = framed
  -> 建立 Framed 路径的 Style Master
  -> 编译并证明完整 Framed raw plan
  -> 提议并授权 Framed pilot IDs
  -> 生成无文字 underlays
  -> 合成生产等价 Framed 样本
  -> 审查 Framed pilot
  -> 授权并生成剩余 Framed underlays
  -> 完成 Framed raw review 与最终合成

workflow = pure
  -> 建立 Pure 路径的 Style Master
  -> 编译完整 Pure raw plan
  -> 提议并授权 Pure pilot IDs
  -> 生成生产等价 Pure 页面
  -> 审查 Pure pilot
  -> 授权并生成剩余 Pure 页面
  -> 完成 Pure raw review 与发布
```

共享 JS 可以负责精确授权、字节持久化、标签和 projection primitives。这种复用位于交互边界之下，必须对 workflow 语义不透明；不得因此建立共享 Controller 分支，让人比较或切换 Framed 与 Pure。

当精确字节和 acceptance receipt 当前有效时，同一个 deck-level 已接受 Style Master 可以由任一已选路径消费。复用资产不代表用户旅程跨越 workflow。

## Style Master 反馈环路

### 在用户旅程中的位置

Style Master 环路需要主题、受众、叙事意图、已选 workflow 和视觉方向；它不需要每一个最终页面或 provider request。因此，一旦这些事实足以支持有效视觉判断，就应尽早进入这个环路。

当前 `style_master.jpg` 继续作为 reference input，而不是 source receipt、workflow selector 或 alternate adapter。

### Candidate、review 与 promotion

使用一条由 owner 控制的环路：

```text
规范 style intent
  -> provider-free 的精确 candidate plan
  -> 需要生成时取得精确的一次提交授权
  -> 在 style-master iteration history 中记录 candidate bytes + provenance
  -> 展示真实 candidate
  -> proceed | repair | redirect
  -> 仅在 proceed 时：把精确字节提升为当前 style_master.jpg，
     并写入 owner-owned acceptance receipt
```

因为该环路发生在完整 raw plan 之前，其单次提交授权是同一 state authority 下独立、带类型的 `style-master` operation。它绑定当前 deck/workflow 选择、精确 candidate-plan identity、provider profile、execution identity，以及最多一次提交。它不能授权 raw page，后续 raw pilot/expansion grant 也不能授权 Style Master。若 workflow 选择不是当前且来源可归属的，candidate planning 必须 `hard-stop`，不得从内容或生成产物中推断。

不得用未审查 candidate 覆盖当前规范 Style Master。被拒绝的 candidate 及其 source snapshot 继续留在既有 `1_upstream_raw_material/style-master-iterations/` owner 下。当前已接受字节继续位于 `2_backbone/visual-style/style_master.jpg`。

Acceptance receipt 是合理的持久证据：人的视觉决定无法从图片字节重建。它把已接受字节绑定到精确 style intent 与 generation profile，且只能由自身 owner 使其失效。它不是第二个视觉 Gate，也不能替代 Pilot Run。

如果已有受目录约束的 Style Master 缺少当前 acceptance receipt，可以在不调用 provider 的情况下，通过同一人工审查进行展示和采用。系统不得声称自己无法证明的历史生成 provenance。

### 决定

- `proceed`：提升或保留精确当前 candidate，并在已经选择的 workflow 内继续；
- `repair`：保留视觉方向，由 Agent 更新所属 style intent；若还需要 provider 调用，则取得新的精确授权后，重新运行同一个 candidate checkpoint；
- `redirect`：返回 visual-direction owner。切换 Framed/Pure 的请求仍走 Structural Versioning，不在 Style Master 环路内执行。

这些是归人所有的内容/视觉决定，不是 waiver。candidate bytes 缺失、identity 陈旧、provenance 非法或 provider authorization 缺失时，都不能通过 `proceed` 继续。

## 代表性 Pilot 选择

### 选择交互

Agent 提出能够覆盖 deck 主要视觉风险的最小集合，通常 3 页；没有明确理由时最多 5 页。任何 submit 前都要展示：

- 每个候选页的当前位置、正式 `slide_id` 和 title；
- 每页为什么具有代表性的一条简短理由；
- 已选 workflow 和当前 generation profile；
- 精确 pilot plan/batch identity 和最大提交次数；
- 之后仍需另行授权的剩余页数。

人在授予同一份精确 provider authorization 前，可以接受、替换、增加或删除代表页。选择本身不是另一项 approval，也不形成持久化 creative-scoring record。

Runtime 针对同一份当前 source snapshot 解析每个候选并绑定正式 IDs。selector 有歧义或已陈旧时，在授权前 `hard-stop`；绝不静默回退到 first-N positions。

### 风险覆盖

两条路径采用不同的语义启发，但对人呈现相同的简单交互。

| Framed 代表页 | Pure 代表页 |
| --- | --- |
| 存在时选择 opening/hero page，以及一张中间页或结束页。 | 存在时选择 opening/hero page，以及一张中间页或结束页。 |
| 最密或最长的 Text Frame，包括多语言或长 token 风险。 | 文字最密的 display contract，包括多语言或 exact-copy 风险。 |
| 若两种 callout variant 差异显著且批次容得下，则同时覆盖。 | 存在时选择 diagram、data、timeline 或其他高复杂度 composition。 |
| reserved-safe-zone composition 最困难的 underlay。 | 图片/文字层级或可读性最困难的页面。 |
| 注册 identity/reference 的使用，以及最强的跨页一致性风险。 | 注册 identity/reference 的使用，以及最强的跨页一致性风险。 |

这些是给 Agent 的判断提示，不是 JS pass/fail algorithm。精确 IDs、contract digests 和 authorization scope 仍是确定性 runtime facts。

### 小 deck 与小范围重建

- 若当前 provider debt 为 1-5 页，完整 debt set 就是 Pilot Run。
- 若当前 provider debt 为 0，不创建 pilot authorization 或合成的 pilot evidence。
- 若较大重建改变 deck-wide style/profile 事实，扩量前应重新选择代表性批次。
- 本地 Framed Text Frame-only refresh 和 notes-only refresh 继续走 provider-free 路径，不人为制造 Pilot Run。

## 生产等价 Pilot 证据

### Framed

Framed Pilot Run 必须通过最终合成所使用的同一个私有 compiler、字体、浏览器检查和 capture profile，展示真实选中 underlay。仅展示 raw underlay contact sheet 不够，因为用户需要把层级、平衡、safe zones 和本地 Text Frame 放在一起判断。

Pilot compositor 只发布 preview-only bytes 与证据，不能写 final manifest、PPTX、notes、raw acceptance 或 delivery decision。它使用 [render-contract-plan.md](render-contract-plan.md) 的 render contract，不引入第二套 CSS/compiler，也不增加公共 test bypass。

Framed review 应让以下两个问题都可检查，但不增加两个独立人类 Gate：

1. 无文字 underlay 是否尊重 reserved regions 与视觉意图？
2. 生产等价的合成页面作为整体是否成立？

### Pure

Pure provider output 已经拥有最终整页像素。它的 Pilot Run 展示那些精确 raw bytes，并带当前 `position + formal slide_id + title` 标签以及 profile/coverage binding。它不得经过 Framed compositor，也不得展示 Framed safe-zone 语义。

人直接依据真实页面字节判断内容渲染、字体、层级、视觉方向、identity fidelity 和跨页一致性。

### Pilot 决定

Projection 完整、当前但尚无决定时，结果是 `confirm`（确认）：

- `proceed`：保留精确当前 pilot materialization（物化结果），进入剩余范围授权检查点；
- `repair`：返回已选 workflow 中最近的 source 或 visual owner，再重跑同一个 pilot checkpoint；
- `redirect`：返回 Style Master/visual direction。切换 workflow 仍需创建经过 preview 且带 exact hash 的 vNext。

Pilot 反馈可以作为常规 iteration context 记录，但它不是 policy waiver reason。Runtime decision receipt 仍严格限定于精确 pilot evidence。

## 精确计划、授权与复用模型

### 一份完整计划，多个精确批次

Provider-free raw plan 覆盖当前完整生成范围。Batch scope 是该计划的严格 projection：

```text
batch scope = 完整 raw plan hash
            + 精确且有序的 selected slide IDs
            + 所选 raw-contract digests
            + provider generation profile
            + source/execution identity
            + maximum submissions
```

Pilot batch 与 remaining batch 不是不同 raw plan。remaining batch 等于当前完整 scope 减去精确当前 materializations。任何 plan、profile、source、workflow 或 selected-item 漂移，都要在 submit 前使 pending batch 失效。

### Authorization owner

演进现有唯一 Page Authority provider-authorization owner，使其保留一份当前计划所需的精确、不可变 grants。不得为 Pilot Run 增加第二套 authorization ledger。

- pilot grant 只列出代表页 IDs；
- expansion grant 只列出剩余 IDs；
- 后续 grant 绝不追溯扩大先前 grant；
- runtime 在每次 submit 前立即重检精确 grant；
- 人的 `proceed` review decision 绝不等同于 provider grant；
- 不允许 retry grant、inferred grant、count-only grant 或 full-plan preauthorization。

只有数量而没有精确 IDs 不足以授权：相同数量可能被花在计划的另一部分。

Authorization owner 的 canonical record 表示当前计划累计的不可变 grant set，而不只是最新 grant。每个已物化 item 都绑定实际生成它的单独 grant。完整已接受 raw evidence 绑定规范 cumulative authorization-record digest，因此后来的 expansion grant 不能被误述为追溯授权早期 pilot bytes。必须显式 version 这个 owner contract；不得静默重新解释当前 single-grant schema。

### Raw materialization owner

为当前已生成 items 引入一份由 owner 写入的 raw-materialization record，以此替代“文件名存在”作为 provenance。该记录是合理的，因为 provider bytes 及实际生成它们的精确 grant，若不再次付费 submit 就无法重建。它把每份保留 raw byte 绑定到 slide ID、raw contract、provider profile、plan、source identity 和精确 authorization grant。

这不是 parallel success store，而是 Pilot Run 与完整 raw review 消费的直接 pre-review provenance source。只有经过完整人工审查的 accepted raw evidence，才继续作为 finalization 的唯一输入。

扩量时，runtime 验证当前 pilot tuples，只 submit 剩余已授权 items。既不能重新生成当前 pilot items，也不能把复制来的文件当作 materialization evidence。

### 完整审查与最终化

扩量后，既有完整 raw-review owner 覆盖每个当前 tuple，包括保留的 pilot bytes。只有 complete/current coverage 加上人类决定，才能发布 accepted raw evidence。

若 pilot scope 已经等于完整计划，则 pilot projection 必须按可满足 complete review contract 的方式构建。其 `proceed` 决定可直接发布 accepted raw evidence；禁止再做一次相同审查。

## Policy 分类

| 条件 | 结果 | 受保护事实 | 唯一最近合法动作 |
| --- | --- | --- | --- |
| Style Master 或 batch scope 完整、当前，正在等待人授权 | `confirm` | provider 花费归人所有。 | 展示精确 scope，请人 authorize、revise 或 decline。 |
| 没有精确当前 grant 就尝试 submit | `hard-stop` | 显式 provider authorization。 | 返回精确 scope 授权检查点。 |
| 当前 Style Master candidate 等待视觉判断 | `confirm` | 视觉方向归人所有。 | 展示真实 candidate，请人 proceed、repair 或 redirect。 |
| Style candidate bytes/provenance 缺失或陈旧 | `hard-stop` | Identity、provenance 与 recoverability。 | 通过 style owner 重建 candidate，并重跑 review。 |
| 完整且当前的 Pilot Run 等待判断 | `confirm` | 代表性生产质量归人所有。 | 展示所选生产等价证据，请人 proceed、repair 或 redirect。 |
| Pilot coverage 缺失、不完整、陈旧或属于另一 workflow | `hard-stop` | Evidence completeness 与 workflow identity。 | 通过已选 owner 重建精确 pilot projection。 |
| 请求 expansion 时，完整且当前的 Pilot Run 尚无决定 | `confirm` | 代表性生产质量归人所有；此时尚无 expansion authority。 | 展示同一份当前 Pilot Run，请人 proceed、repair 或 redirect。 |
| Expansion scope 不等于“当前计划减去有效 materializations” | `hard-stop` | Authorization 与 raw-byte attribution。 | 重新规划精确 remaining scope，并请求新的授权。 |
| 完整 raw evidence 不完整或陈旧 | `hard-stop` | Finalization integrity。 | 通过所属 owner 重建完整 raw review。 |

任何 continuation 都不能豁免 identity、evidence completeness 或 provider authorization。尚未决定的当前 Pilot Run 返回既有 `confirm`；不得产生 skip 或 expansion submit。这套设计增加的是有明确目的的人类决定，不是通用 waiver mechanism。

## 职责与控制边界

| Actor/owner | 职责 |
| --- | --- |
| Human | 决定视觉方向、代表性样本质量、provider 授权，以及真实视觉/内容接受。 |
| Agent | 提出代表页及理由，展示真实产物与精确成本范围，把反馈转译给已选 owner，执行已授权机械工作，并在决定后恢复流程。 |
| 已选 workflow adapter | 编译 workflow-specific raw contracts 与 Pilot Run evidence；Framed 拥有本地合成语义，Pure 拥有 full-page 语义。 |
| Shared raw runtime | 验证精确 batch scopes，消费唯一 authorization owner，持久化 raw bytes/provenance，渲染通用 labels/contributions，并拒绝陈旧或外来事实。 |
| State/evidence owner | 只持久化不可重建的授权与人类决定事实，并在精确漂移时使其失效。 |

Agent 绝不要求人运行命令或修复 hash/state。人只需看到产物、后果，以及最小且真实的决定。

## 持久状态纪律

只持久化以下不可重建事实。其他一切，包括 representative scoring、remaining-scope projection 和 Framed browser layout proof，都从直接权威重算。

| 持久事实 | Owner 与 writer | Readers | 新鲜度与移除规则 | 必须持久化的原因 |
| --- | --- | --- | --- | --- |
| Style Master acceptance receipt | Style Master owner，仅在当前人类 `proceed` 或明确 local adoption 后写入 | Generation-profile builder 与已选 workflow Controller | 精确 style intent/profile/candidate-byte 漂移会使其陈旧；只能通过同一 candidate/review/promotion 环路替换 | 人的决定无法从图片字节重建。 |
| Style Master provider grant | 既有 state authority 下独立且带类型的 `style-master` operation，仅在精确人工授权后写入 | Style Master submit preflight 与 candidate provenance writer | Candidate plan/workflow/profile/execution 漂移会关闭它；成功使用或 owner reset 会移除当前适用性 | Style generation 发生在 raw plan 之前，因此 raw authorization 不能诚实代表这笔花费。 |
| 精确 raw provider batch grants | 既有 Page Authority raw authorization/state owner，演进为对当前计划追加不可变 grants | Raw submit preflight、materialization writer、status/Controller projection | Plan/source/workflow/profile/execution 漂移会关闭 grant；source reset 或 owner repair 会移除当前适用性 | 人对 raw 花费的授权之后无法推断或重建。 |
| Raw materialization record | Shared raw runtime，在已授权 submit 成功后立即写入 | Pilot projection、remaining-scope projection、完整 raw review | 精确 byte/contract/profile/plan/grant 漂移会使 item 失效；由 owner regeneration 替换 | 付费 provider bytes 及其生成 grant，若不再次 submit 就无法重建。 |
| Pilot decision receipt | 已选 workflow 的 Pilot Run evidence owner，在 projection 完整且当前后写入 | Expansion gate 与 Controller resume | 任何 covered byte、plan、workflow contribution、projection profile、order 或 identity 漂移都会使其陈旧；由 owner review 替换 | 人的代表性质量判断无法重建，且必须跨 resume 保存。 |

Pilot decision receipt 只有一个 authority effect：允许 Controller 展示 remaining-scope authorization。它不是 raw acceptance、provider authorization、final evidence 或可复用 waiver。

## 失效与恢复

- Style intent/profile/candidate-byte 漂移会返回 Style Master review。
- 任何 Style Master 变化都会改变 provider profile，并使 raw plan、pilot scope、pilot decision 和后续 raw evidence 失效。
- Full-plan 或 selected tuple 漂移会在 provider 调用前使对应 batch authorization 和 projection 失效。
- Pilot `repair` 使用已选 workflow 的 source/visual owner，再重跑相同 plan/pilot checkpoint；不得静默 retry。
- Pilot `redirect` 返回 Style Master；Framed/Pure 切换继续属于 Structural Versioning。
- 当前 pilot tuple 在扩量时精确复用。陈旧 tuple 只有在重新披露范围并取得精确授权后才能再生成。
- Partial write 或 process interruption 必须 fail closed。可保留 owner 产出的当前 materialization evidence；不得把不确定字节推断为成功，而是给出一个精确 regeneration action。

## Change 边界

只有已接受的 Framed render contract 和共享 raw-review evidence 就绪后，才能实现这套 UX。再使用两个串行 OpenSpec change：

1. `establish-target-style-master-feedback`：负责 Page Authority Style Master candidate、精确授权、真实图片审查、promotion、acceptance receipt、对现有 confined bytes 的惰性采用、Controller placement 和 focused tests。
2. `introduce-target-pilot-runs`：负责一份带精确 scoped batches 的完整 raw plan、最小 raw-materialization provenance owner、独立 Framed/Pure Controller 路径、生产等价 projections、expansion authorization、当前字节复用和 complete-review handoff。

Style Master change 至少必须审计 `style-master-generation`、`image-generation`、`visual-config`、`visual-asset-management`、`playbook-execution`、`pipeline-orchestration`、`cli-surface`、`node-specification`、`workflow-inspection`、`run-bundle-layout`、`run-bundle-management`、`environment-check`、`framework-charter` 和 `commands-reference`。

Pilot Run change 至少必须审计 `image-generation`、`pipeline-orchestration`、`playbook-execution`、`cli-surface`、`node-specification`、`workflow-inspection`、`framework-charter`、`commands-reference`、`run-bundle-layout`、`run-bundle-management`、`image-production`，以及两种已选 workflow adapters。只有真实 requirement-level changes 才属于 capability deltas。

兼容策略必须区分 completed evidence 与 new generation epochs。已经接受的精确 single-grant v2 result，可以按其 accepted contract 继续读取。一旦某个 run 进入新的 pilot/expansion generation，owner 就使用已 version 的 cumulative-grant 和 per-item materialization contract；旧的、未接受的 plan-wide authorization 不能被扩大、复制或静默当作 pilot grant。

恢复的 `style-master` 与 `pilot` CLI 名称必须被定义为当前 Page Authority operations：通过 marker 解析唯一已选 workflow，使用 producer-owned diagnostic envelope，并保留 non-v2 `hard-stop`。Change 必须有意修改既有 fixed-command 和 retired-surface tests；不能只删除这些断言而不替换。

每个恢复的 surface 都必须在任何非零生成动作前，暴露 provider-free exact plan/projection。其生成动作消费既有 state owner 的精确授权；调用易识别的命令名绝不构成隐式 submit 权限。精确 subcommand/flag grammar 属于未来 `cli-surface` delta，不在这里创造第二套 Controller protocol。

## 成功定义

- 新用户能在页面级花费前看到真实 Style Master，并可重定向视觉方向。
- 超过 5 页的 Framed 或 Pure 批次，在当前代表性证据取得 `proceed` 前不能进入 expansion。
- Pilot authorization 不能 submit 未选择页面或完整计划。
- Expansion 需要新的精确人工授权，并且只 submit 剩余当前 items。
- 当前 pilot bytes 原样进入完整 raw review 与最终生产。
- Framed pilot pixels 使用唯一已接受 production renderer；Pure 绝不导入 Framed 语义。
- 部分 pilot acceptance 不能发布 final manifest、PPTX、notes 或 delivery evidence。
- 完整小范围只审查一次，不经历重复 pilot/full confirmations。
- 每个失败都有一个 owner、一个有界 root cause，以及返回同一检查点的唯一最近合法动作。
- 不存在隐藏 retry、fallback、inferred authorization、cross-workflow Controller、手工编辑 state 或 parallel success store。
