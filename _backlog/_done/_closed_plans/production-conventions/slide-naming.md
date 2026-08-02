# Slide Naming：`mnemonic-v1` 页面身份约定

> 这是一份协作说明。正式行为以 [slide-identity-and-ordering spec](../../../../openspec/specs/slide-identity-and-ordering/spec.md) 和 [slide_ids.mjs](../../../../PPTMAKER_FRAMEWORK/scripts/01-content/internal/slide_ids.mjs) 为准。

## 核心模型

`slide_id` 是跨版本稳定身份，`position` 只是当前 source snapshot（源快照）中的顺序投影。

- 移动页面、修改标题、切换其在当前顺序中的位置，不改变 `slide_id`。
- Canonical `slide-specifications.md` 的物理顺序是 order Source of Record。
- 展示和讨论页面时使用 `position + formal slide_id + title`。
- 生成图像的 canonical artifact name 是 `${slide_id}.png`；不得把 `{NN}-` 前缀当作身份或正式文件命名规则。
- 有意替换身份是一项单独审查的 source edit，不是普通内容修改或重排的副作用。

## Production 文件命名：`NN_slideID`

Production 输出（最终 PPT 导出、交付物文件）使用 **`NN_slideID`** 双层命名：

```text
NN_slideID.ext

01_UXGap.png
02_DataMap.png
03_AITurn.png
```

| 层 | 含义 | 可变性 | 示例 |
|---|---|---|---|
| `NN` | 当前 deck 中的页序（两位数字，从 01 起） | **随增删挪动自由变化** | `01`, `02`, `03` |
| `slideID` | 跨版本稳定身份（mnemonic-v1） | **不可变** | `UXGap`, `DataMap`, `AITurn` |

核心原则：

- **`slideID` 是真相，`NN` 只是当期投影。** 加页、减页、挪页时只改数字前缀，ID 纹丝不动——不管怎么调顺序，ID 永远能找到那一页。
- **Identity artifact 不加前缀。** Canonical artifact name 始终是 `${slide_id}.png`，用于 receipt、log、跨版本引用。`NN_` 前缀只出现在 production 交付物中。
- **换页无伤。** 挪动页面只改 `NN_` 前缀；重新排序 production 文件即可，不会破坏任何 ID 引用链。

两层分工：

| 场景 | 用哪个 |
|---|---|
| 代码、receipt、log、cross-ref | `${slide_id}` 不加前缀 |
| 最终 PPT 导出、交付给客户的 PNG/PDF | `NN_slideID` |
| 口头讨论、文档引用 | `position + slide_id + title`（如 "P03 AITurn AI 带来的转向"） |

## 语义规则：`SUBJECT + MOVE`

每个新 ID 由 Agent 根据页面长期叙事角色编写两个语义块：

```text
SUBJECT + MOVE
页面在讲什么 + 页面在叙事中做什么
```

例如：

| ID | 拆解 | 语义 |
| --- | --- | --- |
| `UXGap` | `UX` + `Gap` | 暴露 UX 缺口。 |
| `DataMap` | `Data` + `Map` | 建立数据版图。 |
| `AITurn` | `AI` + `Turn` | 表达 AI 带来的转向。 |
| `PlanGo` | `Plan` + `Go` | 把计划推进到行动。 |

语法有效不等于命名好。`SUBJECT` 和 `MOVE` 应在重排、改标题或跨版本后仍能表达该页身份，不能只是当前页码、布局、临时状态或标题截断。

## 确定性语法

新 `mnemonic-v1` ID 必须同时满足：

1. 仅含 5-8 个 ASCII 字母；推荐 5-6 个，7-8 个只在明显更清楚时使用。
2. 恰好可解析为两个 BlockCase 块，依次为 `SUBJECT` 与 `MOVE`。
3. 每块 2-4 个字母。
4. 至少一块是 TitleCase，例如 `Gap`、`Data`。
5. 另一块可以是 TitleCase，也可以是全大写 acronym，例如 `UX`、`AI`、`BPM`。
6. 两块边界只能有一种合法解析，不能有歧义。

块类型：

| 类型 | 形式 | 示例 |
| --- | --- | --- |
| TitleCase | 首字母大写，后续 1-3 个小写字母 | `Go`、`Gap`、`Data` |
| Acronym | 2-4 个全大写字母 | `UX`、`AI`、`BPM` |

常见错误：

| 错误 | 原因 |
| --- | --- |
| `Slide01` | 含数字，并把位置误作身份。 |
| `AICRM` | 两块都是 acronym，没有 TitleCase，边界也可能不明确。 |
| `CustomerJourney` | 超过 8 个字母，块长度不合法。 |
| `Uxgap` | 不能解析成两个合法 BlockCase 块。 |

Agent 不得为了过 validator 而机械截断词。若短形式难以口述或语义不清，应重新抽象该页的 SUBJECT/MOVE，而不是把长标题裁成难懂缩写。

## `identity.scheme` 与历史 ID

- 新初始化 source 必须声明 `identity.scheme: mnemonic-v1`。
- 该声明表示当前文件中的每个 ID 都满足 mnemonic syntax。
- 已有 source 可以保留历史格式 ID，例如 `s07_problem`。它仍是可读且被保留的正式身份，但只是一项 identity exception。
- 含历史格式 ID 的当前 source 可以省略 `identity.scheme`；以后新增或插入的 ID 仍必须通过 `mnemonic-v1`。
- 历史 ID 不能选择 pipeline、workflow、Controller、renderer 或 migration path，结构编辑也不能因为其中的旧页码而自动改名。

## 唯一性与历史保留

新 ID 必须同时通过 current（当前）和 history（历史）保留检查：

- formal ID 在当前 deck 与版本历史中均未被使用；
- normalized `spoken_key` 在当前与历史中均未被保留；
- 删除页面只移除当前成员关系，不释放其 formal ID 或 spoken key；
- 不允许仅靠大小写、空格、连字符或前导 `@` 区分两个页面。

这保证旧链接、语音引用、receipt 和跨版本讨论不会被后来页面重新占用。

## Spoken Key（口述键）

Runtime 从 selector 中移除一个可选的前导 `@`、全部空格和连字符，再转为小写：

```text
UXGap = UX gap = ux-gap = @UXGap -> uxgap
```

Formal ID 在 Markdown、plan、manifest、receipt 和 log 中始终保持原样。`spoken_key` 只用于友好选择和碰撞检测，不替代正式身份。

当前 selector 语法保留以下 spoken keys，新 ID 不得占用：

`all`、`first`、`last`、`before`、`after`、`start`、`end`、`next`、`previous`、`prev`、`slide`、`page`、`position`、`current`。

## Near-Confusion（近似混淆）

Validator 会针对 current/history IDs 检查配置内的近似拼写和易混淆读音。Near-confusion 是 deterministic warning，不是自动改名许可：

- Runtime 返回冲突候选，不做 approximate auto-correction。
- Agent 解释风险并提出更清楚的语义替代，但不能替人接受近似混淆。
- MD Controller 展示有界的 `position + slide_id + title` 冲突候选，并停下来等待人的真实决定。
- 不得因为当前距离最近、位置相邻或标题相似而猜测目标。

语法错误、formal/spoken collision 和 reserved word 是 blocking error；near-confusion 的最终处理遵循 owner-issued diagnostic，不由本说明复制一套 pass/fail 逻辑。

## 所有权分工

| 参与者 | 负责 | 不负责 |
| --- | --- | --- |
| Agent / MD Controller | 理解页面持久叙事角色，编写 `SUBJECT + MOVE`；发现 near-confusion 时解释风险、提出替代并展示候选。 | 不凭页码、标题截断或自动算法制造 ID，也不替人接受 near-confusion。 |
| JS identity owner | 解析语法，验证 current/history 唯一性、spoken key、reserved words 和 configured near-confusion。 | 不决定一个 ID 是否准确表达页面含义。 |
| Human | 对 near-confusion、selector 歧义或 Controller 明确标记的语义选择作决定。 | 不运行 validator，不手工维护 reservation registry。 |

## 新 ID 的最短流程

1. Agent 先写出页面不随位置变化的叙事角色。
2. 压缩成可口述的 `SUBJECT + MOVE`，优先 5-6 个字母。
3. 通过正式 JS owner 对 current/history reservation 做确定性验证。
4. 有 blocking error 时重新命名并重跑同一检查。
5. 有 near-confusion warning 时展示候选和 Agent 建议，等待人决定后再继续。
6. Validator 通过后，把 formal ID 写入 canonical source；顺序标签和 artifact path 由 owner 派生。

本目录不维护某个具体 deck 的 ID 表。具体 ID 清单属于该 run 的 canonical source 和 identity history，不应复制到共用约定。
