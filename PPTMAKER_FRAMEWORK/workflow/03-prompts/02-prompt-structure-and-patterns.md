---
title: 02 — Prompt Structure and Patterns
stage: workflow/03-prompts
position: 03 of 06
type: methodology
summary: 方法论文件。Agent 理解其中原理并应用于对话引导。
depends_on:
- workflow/03-prompts/README.md
- workflow/03-prompts/01-understanding-the-model.md
feeds_into:
- workflow/03-prompts/03-style-anchoring-in-practice.md
agent_action: ask_questions
---

# 02 — Prompt Structure and Patterns

← [01](01-understanding-the-model.md) | [Next →](03-style-anchoring-in-practice.md)

## 五段式 Prompt 结构

一个生产级的 image prompt 包含五个段落，从宏观到微观：

```
1. CANVAS + LAYOUT      ← 整页画布尺寸、宏观分区、y 坐标范围
2. ZONE DESCRIPTIONS    ← 每个分区的精确内容：面板、图标、文字、数据
3. COLOR SEMANTICS      ← 每个颜色的叙事含义（贯穿全 deck 一致）
4. TEXT CONTENT         ← 画面中出现的所有文字，精确 wording，用引号
5. ANTI-PATTERNS        ← 明确不要渲染什么
```

### 段落 1: Canvas + Layout

```
LAYOUT: 16:9 canvas (1672 x 941 px). Dark navy background (#0a1628).
Content zone: y=290 to y=780.
Two-panel horizontal split: left panel 45%, right panel 45%, center divider 10%.
Bottom callout bar: y=805 to y=900, full width.
```

**为什么重要**：这是你和 model 的 layout contract。如果你不定义 y 坐标范围，model 会把内容散在整个画布上——包括 header zone（= Stage 3 会出问题）。

### 段落 2: Zone Descriptions

从左到右、从上到下描述每个区域。

```
LEFT PANEL (45%, y=290 to y=780):
- Semi-transparent steel blue panel (#1a2d3d at 60% opacity)
- Top-center: small handshake icon, cyan outline, ~40px
- Below icon: label "HOLD TODAY" (white, semibold, 24px visual)
- Body: 3-4 compact text lines, 18-20px visual, steel blue:
  "Your existing customers" / "AVL & relationship trust" / "They already know you"
- Bottom tag: "Mechanism: RELATIONSHIP" (cyan, subtle)

RIGHT PANEL (45%, y=290 to y=780):
- Same layout structure as left, mirrored
- Icon: magnifying glass over data lattice (electric blue)
- label: "FIND TOMORROW"
- Body text about AI-powered discovery
- Bottom tag: "Mechanism: DATA" (brighter cyan)

CENTER DIVIDER (10%):
- Thin vertical cyan line (#00b4d8, 1.5px)
- Center text: "VS" (subtle, steel blue, 18px)
```

**为什么重要**：这是 prompt 的主体——model 在这里花最多 "注意力"。用精确文字：不说 "some icons"，说 "handshake icon, cyan outline, ~40px"。

### 段落 3: Color Semantics

每个颜色的叙事含义——全 deck 一致：

```
COLOR MEANINGS (consistent across all slides):
- Deep navy (#0a1628): Always-on background. Every slide. No exceptions.
- Cyan (#00b4d8): Customer outcomes, wins, positive signals, "the good news"
- Electric blue (#0077b6): Manufacturing strengths, attention markers, "look here"
- Steel blue (#6b8ca3): Structural panels, neutral information, labels
- White (#f4f8fc): Primary text — titles and key claims
- NEVER use: warm tones (amber, orange, red, coral, gold, yellow)
```

**为什么重要**：颜色语义让观众在潜意识层面形成条件反射——"看到 cyan = 好消息"。这比任何文字都更快被大脑处理。

### 段落 4: Text Content

画面中所有文字，精确 wording：

```
TEXT ON THIS SLIDE:
- "HOLD TODAY" (left panel label)
- "FIND TOMORROW" (right panel label)
- "Your existing customers" / "AVL & relationship trust" / "They already know you" (left body)
- "New customer discovery" / "AI-powered search" / "Data-driven match" / "They find you — or don't" (right body)
- "Mechanism: RELATIONSHIP" (left tag) / "Mechanism: DATA" (right tag)
- Callout: "Most factories are optimized for HOLD — not for FIND."
```

**为什么重要**：Model 不会替你想文字——它渲染你给它的文字。把所有文字集中列在一个段落，review 时一目了然。

### 段落 5: Anti-Patterns

```
DO NOT RENDER:
- No logos, watermarks, or page numbers
- No stock photography people or clip art
- No gradient orb decorations or "tech" abstract blobs
- No Chinese/CJK characters — English only on all slides
- No red/green to suggest "bad/good" — both panels are valid mechanisms
- No text in the header zone (y=0 to y=260)
```

## 提示密度与长度

| Prompt 长度 | 何时用 | 风险 |
|------------|-------|------|
| 100-200 words | 简单布局（居中标题+一个视觉元素） | Under-specification——model 自由发挥太多 |
| 200-350 words | 标准 slide（两栏/三栏 + callout） | Sweet spot——足够精确，不过度约束 |
| 350-500 words | 复杂 slide（多区、多元素、精确位置要求） | Model 可能忽略后面的内容——把最重要信息放前面 |

**把最重要的指令放前面**。Model 对 prompt 前面部分的 attention 更高。

---

> **Next**: `03-style-anchoring-in-practice.md`
