---
title: Warm Editorial — Visual Preset
stage: 01_visual_style_master
position: preset
type: reference
summary: 暖色编辑风。奶油底+炭黑文字+铁锈红/金色强调。适合品牌故事、人文话题、设计/创意。
depends_on:
- 01_visual_style_master/README.md
feeds_into:
- AGENTS.md (Phase 2)
agent_action: recommend
---

# Warm Editorial

> 暖色编辑风。适合品牌故事、人文话题、设计/创意行业、消费者品牌。
> 温暖、人性化、有质感——像一本精心设计的杂志。

## 外观

奶油底色，炭黑文字，铁锈红和金色作为强调色。整体感觉温暖、有深度、人性化——像高端编辑内容或设计杂志的排版。

## 色彩系统

| 角色 | 色值 | 用途 |
|------|------|------|
| Background | `#fef9ef` | 所有 slide 底色（暖奶油） |
| Panel/Card | `#f5f0e8` | 卡片、面板背景 |
| Primary Text | `#2d2d2d` | 正文、标题（暖炭黑） |
| Secondary Text | `#6b5e4e` | 辅助文字、标签 |
| Accent/Warmth | `#c44d34` | 强调、关键数字、CTA（铁锈红） |
| Premium | `#b8860b` | 高级感强调、引用（深金） |
| Calm | `#7c9082` | 辅助色、图注、弱化信息（鼠尾草绿） |
| Divider | `#e0d5c7` | 分割线、细边框 |
| Kicker | `#8b7355` | Slide kicker（Header-Lock overlay） |
| Subtitle | `#6b5e4e` | Slide subtitle（Header-Lock overlay） |

## 字体层级（Header-Lock 使用）

| 层级 | 字体 | 大小 | 颜色 |
|------|------|------|------|
| Kicker | Source Sans Pro Semibold | 22px | `#8b7355` |
| Title | Source Sans Pro Bold | 46px | `#2d2d2d` |
| Subtitle | Source Sans Pro Regular | 27px | `#6b5e4e` |

## 适用场景

- ✅ 品牌故事、消费者品牌
- ✅ 人文话题、社会影响力
- ✅ 设计/创意行业
- ✅ 情感驱动的 pitch
- ❌ 数据密集型报告（不够冷）
- ❌ 制造业/深科技（不够精密感）

## Style Master 生成 Prompt

```
Design a visual style guide for a warm, editorial PowerPoint slide deck. This is a reference image, not a slide itself.

Show clearly:
- Color palette: 6 swatches with hex codes — #fef9ef (warm cream background), #2d2d2d (warm charcoal text), #c44d34 (rust red accent), #b8860b (dark gold premium accent), #7c9082 (sage green calm accent), #f5f0e8 (warm panel)
- Typography: headline sample (large, bold, warm charcoal), subtitle sample (medium, muted brown), body text sample (regular, dark), pull-quote sample (large, italic, rust red) — with clear size hierarchy
- Layout grid: simple wireframe showing 260px header zone, main content zone, thin callout bar
- Component examples: one large pull-quote with rust red quotation marks, one image+text split layout, one timeline with gold dots — small but readable
- Micro decoration: thin gold horizontal rules, subtle texture suggestion

Style: warm editorial, like a high-end magazine or design publication. Cream background, rust red and dark gold accents. Textured, human, sophisticated.
Mood keywords: warm, human, sophisticated, editorial, textured

No real company logo. No watermark. No page number. No cold blues or corporate grays. No stock photos. English only.
Canvas: 16:9, 2K resolution.
```
