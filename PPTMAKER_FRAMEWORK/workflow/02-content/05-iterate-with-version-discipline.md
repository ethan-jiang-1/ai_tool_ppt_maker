---
title: 05 — Iterate with Version Discipline
stage: workflow/02-content
position: 06 of 06
type: methodology
summary: 方法论文件。Agent 理解其中原理并应用于对话引导。
depends_on:
- workflow/02-content/README.md
- workflow/02-content/04-create-content-assets.md
feeds_into: []
agent_action: internalize
---

# 05 — Iterate with Version Discipline

> **真实案例**：看 [example-version-evolution.md](example-version-evolution.md) —— T10 项目从 v1 到 v4 的四次迭代，每次改了什么、为什么改、学到了什么。



← [04](04-create-content-assets.md) | [README](README.md)

## 第一版从来不对——这不是问题

T10 项目经历了 v1（26 slides）、v2（20 slides）、v3（19 slides）三个版本。每一个版本都在前一个版本的基础上做了实质性的结构改变。

第一版不应该是最后版。问题是：**你如何迭代——有序地、有纪律地、可追溯地？**

## 什么是"一个版本"——这是整个迭代模型的核心

做 PPT 反复打磨时,V2 相对 V1 大概率只是"多两页、砍一页、某页换个说法"——一个**下游增量**,压在一个**稳定的上游底座**上。所以:

> **一个版本 = 下游 delta(这一版的 slide 规格 + 局部覆盖),跑在共享的上游/中游底座上。**

这决定了版本切在哪:切在**下游** `3_versions/v{n}/`,不切上游中游。上游(原始素材)和中游 backbone(隐喻/公式/约束/大纲/讲稿/视觉)**全版本共享一份**。如果这些也随版本复制,共性就会分叉——那正是框架 bug 0007(拷贝即分叉)的病。

### 目录约定（run bundle 的版本快照）

```
deck_{NAME}/
├── 1_upstream_raw_material/   ← 共享,不进版本
├── 2_backbone/               ← 共享,不进版本(主干:隐喻/公式/约束/大纲/讲稿/视觉)
└── 3_versions/
    ├── v1/                   ← 一次设计迭代 = 下游 delta
    │   ├── slide-specifications.md   ← 这版每页规格
    │   ├── overrides/               ← 这版偏离 backbone 的东西(空=全继承)
    │   └── _generated/             ← 派生品
    └── v2/                   ← bundle_layout.mjs --new-version 创建
```

**版本快照由 `bundle_layout.mjs --new-version` 创建。** 它只复制下游 delta（slide-specifications.md + overrides/），并创建干净 `_generated/`；backbone 和上游共享不复制。好处:
- `diff -r 3_versions/v1 3_versions/v2` 只显示设计真正变了什么,不被 research/视觉噪音淹没
- v2 崩溃时 v1 完整可用
- 共性只有 backbone 一份,永不分叉
- 某一版要单独微调视觉/讲稿 → 放进这版的 `overrides/`,管线自动优先用它、否则回退 backbone

> **改 backbone vs 开新版本**:改 slide(加/砍/重排/改措辞)= 开新版本(下游)。改隐喻/公式/视觉主干 = 改 `2_backbone/`(影响所有版本),不是开新版本。判据:"这个改动只属于这一版,还是属于整个 deck?"

> **历史对照**:早期纯内容打磨(只有 markdown、没进生产)时,T10 用过 `session_design/T10-v{n}/` 那种把版本嵌在内容目录里、文件名带 `T10v{n}-` 前缀的写法。那是**纯设计稿快照**模式,不是 run bundle 结构。进入完整生产后一律用上面的三层 run bundle 结构。唯一权威定义:`scripts/bundle_layout.mjs`(机器源)+ [`charter/CONSTITUTION.md`](../charter/CONSTITUTION.md)(人读镜像)。

关键原则：**版本是完整快照,不是增量 patch。** 但"完整"指的是完整的**下游** delta——不是把整个 deck(含共享底座)复制一遍。

### Changlog 约定

每个版本的 `slide-specifications.md` 有自己的 change log(记这一版相对上一版的 slide 改动)。改 backbone 则在 `2_backbone/` 对应文件里记。**"为什么"比"做了什么"更重要**。

案例：T10 项目 v2→v3 的 changelog：

| 操作 | 详情 | 原因 |
|------|------|------|
| **砍 (Cut)** | Slide 05 (Pipelines) | 术语太密——EU Data Act/DPP/CBAM 对 audience 信息过载 |
| **砍 (Cut)** | Slide 16 (Digital Counterpart) | 跳太远——组织未到个人数字分身的讨论层面 |
| **加 (Add)** | Slide 18 (Risk) | 客户反馈（meeting5.5）——需要诚实讨论风险来建立可信度 |
| **改 (Reframe)** | Slide 06：负面 gap → 正面 evidence | 把 "you're behind" 改成 "shift is underway"——更有建设性 |
| **改 (Reframe)** | Slide 10：三个数据层重新命名 | OPEN/SELECTIVE/INTERNAL → CAPTURE/CONNECT/COMPOUND——更有 narrative force |
| **改 (Reframe)** | Slide 12：数据飞轮 → 三触点 speed | 飞轮太抽象 → speed-as-experience（config/quote/delivery）更具体 |
| **改 (Reframe)** | Slide 16：三阶段 skill curve → 两阶段 | 三阶段太复杂 → Human in→on the loop 更简洁 |
| **改 (Reframe)** | Slide 17：Invest/Partner/Govern → Change Mgmt/Reskilling | 从资金话题改为组织变革话题——更 relevant |
| **Breakout** | PPT-based → 纯物理/纸质任务卡 | 客户现场条件更适合物理引导，不需要 slide |
| **不动 (Keep)** | Slides 01, 02, 03, 05(was 06), 07(was 08), 14(was 15), 15(was 17), 19(was 20) | 这些 slides 的核心论证仍然成立 |

**每个 changelog entry 必须有 "原因" 列。** "为什么" 比 "做了什么" 更重要——它为未来的自己和其他人提供了决策上下文。

## 三种迭代操作：砍、加、重构

### 何时砍（Cut）一张 slide

砍 slide 是内容设计中最难但最重要的事。每砍掉一张 slide，你就少稀释一次论证。

**砍的判断框架**：
- [ ] 这张 slide 如果被砍掉，观众还能理解整个论证吗？（如果能，砍掉）
- [ ] 这张 slide 的信息能否合并到前一张或后一张 slide 中？（如果能，合并后砍掉）
- [ ] 这张 slide 是否使用了 audience 不熟悉的术语/概念？（如果是，砍掉或替换——不要让 slide 成为 glossary 阅读测试）
- [ ] 这张 slide 是否 "跳太快"——假设了 audience 还没接受的前提？（如果是，砍掉或后移）
- [ ] 两张相邻的 slide 是否在做同一件事？（如果是，合并）

**T10 砍 slide 的教训**：
- Slide 05 (Pipelines) 被砍因为 EU Data Act/DPP/CBAM 三个法规术语在同一张 slide 上——观众需要一个完整的法规入门才能理解这张 slide，但 deck 的时间不允许。**教训**：如果一张 slide 需要你花 2 分钟解释术语，它不应该存在——至少不应该在这个位置存在。
- Slide 16 (Digital Counterpart) 被砍因为它讲 "每个人都有一个 AI 数字分身"——这确实是长期方向，但在观众的当前阶段，"组织还没到那个层面" 的判断比 "这个方向很酷" 更重要。**教训**：不是所有正确的方向都适合放进 deck。适合性 > 正确性。

### 何时加（Add）一张 slide

**加的判断框架**：
- [ ] 客户/audience 反馈指出一个 gap——一个没有被 address 的重要问题？（如果是，加）
- [ ] 一个 claim 缺少证据支撑？（如果是，加 evidence slide）
- [ ] 两个 Block 之间缺少过渡，叙事有 "跳跃感"？（如果是，加 divider/bridge）
- [ ] 论证到达结论时缺少 "但风险呢？" 的诚实讨论？（如果是，加 risk slide）

**T10 加 slide 的教训**：
- Slide 18 (Risk) 是 meeting5.5 后加的。客户反馈："你讲了 AI 能做什么，但你没讲风险——这让整个 presentation 听起来像推销而不是分析。" 加了 risk slide 后，整个 deck 的可信度反而提高了——因为承认风险 = 展示你认真思考过。**教训**：加一张 "但" slide 往往比加一张 "是的" slide 更有论证价值。

### 何时重构（Reframe）一张 slide

重构不是砍掉重新写——是保留 slide 在叙事中的位置，但改变它的角度或框架。

**重构的判断框架**：
- [ ] 同样的内容，换一个角度会不会更有力？（负面 → 正面，抽象 → 具体，一般 → 对你 audience 的特殊）
- [ ] slide 的 claim 是否太 vague 而无法被记住？（如果是，重写 TITLE）
- [ ] 案例/证据是否不够强？（如果是，换一个更强的案例）
- [ ] 术语/框架命名是否缺乏 narrative force？（如果是，重命名）

**T10 重构的教训**：
- Slide 06：从 "you're behind on AI readiness" → "the shift is underway"。同样的数据，正面框架（"已经有证据表明变化在发生"）比负面框架（"你落后了"）更有建设性。**教训**：audience 是来学习优先级的——不是来被批评的。
- Slide 10：三大数据层从 "OPEN/SELECTIVE/INTERNAL" → "CAPTURE/CONNECT/COMPOUND"。三组旧名称描述数据状态（静态），三组新名称描述数据动作（动态）。**教训**：动词比名词更有 narrative force。

## 版本迭代的工作流

### 1. 收集反馈 → 分类

从 review、client meeting、dry run 中收集到的反馈通常混在一起。先分类：

| 反馈类型 | 意味着 | 行动 |
|---------|--------|------|
| "这张 slide 我不理解" | 认知载荷太重或太模糊 | 重构 CONCEPT 层 |
| "这张 slide 和上一张重复" | 两张 slide 的 claim 重叠 | 合并或砍掉一张 |
| "你还没有讲 X" | 论证有 gap | 加 slide |
| "这个案例不够有说服力" | 证据弱 | 换案例或加强 evidence card |
| "这几个术语我听不懂" | 术语密度过高 | 砍掉或替换术语 |
| "到了这里我已经忘了前面讲什么" | Block 边界不清晰 | 加 divider/recap |

### 2. 评估改动成本 → 决定版本策略

不是所有反馈都需要立刻改。评估每项改动的下游影响：

| 改动类型 | 影响范围 | 成本 |
|---------|---------|------|
| TITLE/KICKER 改文字 | 单张 slide | 低——改 md 即可 |
| CONCEPT 重写 | 单张 slide + IMAGE PROMPT 可能需要调 | 中 |
| IMAGE PROMPT 重写 | 单张 slide → 重新生成图片 | 中-高（per slide） |
| Block 重构 | 多张 slide 重新排列 | 高 |
| 核心隐喻/公式改变 | 整份 deck | 极高——相当于新版本 |

### 3. 应用约束检查

每轮迭代结束后，把所有 slide 过一遍设计约束（在 `2_backbone/design-constraints.md` 中定义）：

- [ ] 所有 slide 的 language 符合策略？（例如：English only on slides）
- [ ] 没有禁止的内容类型？（例如：no internal numbers, no system names）
- [ ] 每张 slide 的文字密度是否在限制内？（例如：25-35 words for most slides, max 50）
- [ ] KPI 数字使用了 magnitude 而非精确值？
- [ ] 案例使用了第三方名称？（案例公司可以点名——它们是公开信息）

### 4. Audience 测试

最后也是最重要的测试：**假装你什么都不懂，从 Slide 01 读到 Slide N。**

- 每张 slide 的 TITLE 本身是连贯的叙事吗？
- 到了 Slide N，你还记得 Slide 01 的隐喻吗？（如果不能，隐喻没有贯穿全场）
- 有没有哪张 slide 让你 "断路"——不知道它为什么在这里？

**心理陷阱：知识诅咒（Curse of Knowledge）。** 你花了 50 小时在这份 deck 上，你知道每一张 slide 的上下文和隐含论证。但你的 audience 只有 2 分钟/slide。他们会错过你没有明确说出来的连接。**解决方案**：找一个人——不是项目 team member——读一遍你的 slide map，让他指出任何 "我不明白为什么从这里跳到那里" 的地方。

---

> **Next**: 拿 `template-slide-specifications.md`（每页规格）+ `template-core-metaphor.md` / `template-core-formula.md` / `template-design-constraints.md`（backbone 身份），复制到你的项目对应位置，开始填空。本方法论文件（00-05）是你的指南。
