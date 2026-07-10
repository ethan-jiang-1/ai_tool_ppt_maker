---
title: Content Presets Index
stage: workflow/02-content
position: preset_index
type: reference
summary: 内容设计预设文件的总索引。Agent 在 BOOTSTRAP Step 3 使用这些文件为用户快速搭建 deck 骨架。
depends_on:
- BOOTSTRAP.md
feeds_into:
- AGENTS.md (Phase 1)
agent_action: navigate
---

# Content Presets — 内容设计预设库

> Agent：这些文件让你不需要从空白开始设计内容。从目录匹配隐喻，从弧线库选择叙事结构，从模板填充 slide 规格。

## 文件清单

| 文件 | 用途 | Agent 使用时机 |
|------|------|---------------|
| `metaphor-catalog.md` | 22 个隐喻模式，按行业分类 | BOOTSTRAP Step 3.4 — 生成 2-3 个隐喻候选 |
| `formula-catalog.md` | 6 种公式模板（A+B=C 等） | 隐喻确认后 — 推导核心公式 |
| `block-arc-catalog.md` | 5 条标准叙事弧线 | BOOTSTRAP Step 3.2 — 选择叙事结构 |
| `deck-type-templates/pitch-deck-template.md` | 12 页融资 pitch 模板 | BOOTSTRAP Step 3.1 — 用户选了 Pitch Deck |
| `deck-type-templates/keynote-template.md` | 18 页战略 keynote 模板 | BOOTSTRAP Step 3.1 — 用户选了 Keynote |
| `deck-type-templates/training-template.md` | 14 页培训教学模板 | BOOTSTRAP Step 3.1 — 用户选了 Training |
| `deck-type-templates/report-template.md` | 14 页研究报告模板 | BOOTSTRAP Step 3.1 — 用户选了 Report |

## Agent 使用流程

```
1. 用户回答 BOOTSTRAP Intake（5 个问题）
   ↓
2. 选择 deck type template（Step 3.1）——它的 Block Map 已实例化了一条叙事弧线
   ↓
3. 对照 block-arc-catalog.md 理解/确认该模板的弧线形状（不是"另选一条"）
   ↓
4. 选择视觉预设（Step 3.3，参考 workflow/01-visual/presets/）
   ↓
5. 生成隐喻候选（Step 3.4，参考 metaphor-catalog.md）
   ↓
6. 从隐喻推导公式（参考 formula-catalog.md）
   ↓
7. 用户确认后 → 进入 AGENTS.md Phase 1 填充 deck brief
```

## 关键原则

- **模板的 Block Map 是权威骨架；catalog 是参考菜单，不是竞争选项。** 每个 deck-type 模板都为该类型内置了一条经过设计的 Block 序列（keynote 的 External Trigger→Diagnosis→Framework→…、pitch 的 Hook→Problem→Solution→…）——**用模板时以模板的 Block Map 为准**。`block-arc-catalog.md` 用于三种情况：(a) 理解模板背后的叙事形状；(b) **不用模板**、从零搭建 deck 时选一条弧线；(c) 刻意重构/混合结构时换弧线。**不要"选了模板又另选一条 catalog 弧线"**——那正是过去两套结构打架的根源。
- **隐喻先于填充**：不要先选模板再找隐喻——模板是骨架，隐喻是灵魂。先让用户确认隐喻，再把隐喻注入模板的每个 slide。
- **弧线可以混合**：如果 deck 有多个 narrative movement（如先建立 urgency 再展示 solution），可以采用混合弧线。block-arc-catalog.md 末尾有混合模式指导。
- **模板不是监狱**：模板提供 slide 数量、顺序、VISUAL TYPE 的建议——但每个 slide 的具体内容必须基于用户独特的 topic 和隐喻来填充。不要照搬模板的 placeholder 文字。
