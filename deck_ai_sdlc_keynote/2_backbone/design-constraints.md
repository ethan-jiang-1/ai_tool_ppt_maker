# 设计约束（Design Constraints）

> 跑在每张 slide 上的检查清单，也是 `2_backbone/visual-style/deck_system.txt` 的来源。全版本共享。迁移自 `deck_ai_sdlc_keynote`。

## 语言

- **所有 slide 中文**：KICKER 和标题都用中文。
- 英文**只**用于专有名词（SDLC、BPM、Fable 5、TDD 等）和英文讲者的直接引语。
- 演讲可用中文解释术语——那在 SPEAKER NOTE 里，不在 slide 上。
- 中文标题**内嵌于 IMAGE PROMPT**、由 image-2 直接画进整页（full-page 渲染），不使用 Latin 字体的 header-lock 叠字。

## 禁用内容类型 / 禁用视觉

- **禁用画面**：摄影、3D 渲染、矢量剪贴画、光滑数字图标、stock 图、企业 logo、水印、页码、来源注释、草稿标记、发光球、渐变背景、电路板、机器人形象、大脑图标。
- **禁用颜色**：蓝、绿、霓虹、紫、纯黑、纯白、冷灰。只用大地色系（cream、sepia brown、warm gray-brown、amber）。

## 文字密度

- 文字区占整页 **50–60%**，sketch/插画 **40–50%**——sketch 是支撑视觉，不是整页。
- 每页层级：标题（大 serif，1 行）+ 核心 claim / 关键概念（中，1–2 行）+ 支撑文字或数据（小，2–4 行）+ 需要处配 pull quote。
- **绝不整段**——只用短块、卡片或标签。每页要有足够中文，脱离讲者也能一眼看懂。

## 命名策略

- AI 概念用**一致的助记符**贯穿全 deck（如 Information Chain / Trust Gap / Communication Bottleneck，见各页 IMAGE PROMPT 右侧 margin mnemonic）。
- 数据用量级、引语标明出处人物（Fowler / Beck / Mollick / Krieger 等）。

## Agent 形象

- 所有 slide 中的 AI Agent 统一使用 `agent-portrayal.md` 定义的通用形象：琥珀色半透明光体人形、内部拓扑网络、左手持书、右手掌心朝上。
- 需要区分多个 Agent 时使用具名人格（Yan/Zhu/Duo/He/Cha/Suan），保持视觉特征一致。
- Agent 永远与人并肩，不面对面；人永远在画面中——委托、监督、验收的人。

## Tone

- 温暖、智识、有人味——像 19 世纪博物学家的笔记本。自信但好奇。
- sketch 风格本身传达「思考进行中」。可见手绘线条、轻微不规则、交叉排线阴影、cream 纸上的 sepia 墨。刻意，但不凌乱。
- 每页都要像同一本速写本里的一页（consistency）。

## 诚实注脚（Honest Footnote）

- 每个案例 slide 必须标注已知局限：数据范围（如 Allianz -80% 仅适用 narrow category）、因果关系（如 Block 40% 裁员主因是成本削减，AI 真实但次要）、失败教训（如 Maersk TradeLens $100M+ 关停）。
- 诚实不是削弱说服力——是建立可信度。听众能分辨 propaganda 和 honest analysis。
