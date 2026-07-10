---
title: Clean Clinical — Visual Preset
stage: workflow/01-visual
position: preset
type: reference
summary: 白底清爽风。纯白底+石板灰文字+青绿数据强调。适合医疗、咨询、研究、培训。
depends_on:
- workflow/01-visual/README.md
feeds_into:
- AGENTS.md (Phase 2)
agent_action: recommend
---

# Clean Clinical

> 白底清爽风。适合医疗健康、咨询报告、数据驱动型汇报、教育培训。
> 干净、理性、信息密度适中。让数据自己说话。

## 外观

纯白底色，石板灰文字，青绿作为数据强调色。整体感觉干净、专业、可信——像一份精心排版的研究报告或医学期刊。

## 色彩系统

| 角色 | 色值 | 用途 |
|------|------|------|
| Background | `#ffffff` | 所有 slide 底色 |
| Panel/Card | `#f1f5f9` | 卡片、面板背景（浅灰） |
| Primary Text | `#1e293b` | 正文、标题（深石板灰） |
| Secondary Text | `#64748b` | 辅助文字、标签 |
| Accent/Positive | `#0d9488` | 增长数据、正面结果、关键数字 |
| Emphasis | `#0284c7` | 强调文字、图标、连接线 |
| Warning | `#d97706` | 谨慎使用——仅用于风险/警告信号 |
| Divider | `#e2e8f0` | 分割线、弱边框 |
| Kicker | `#475569` | Slide kicker（Header-Lock overlay） |
| Subtitle | `#64748b` | Slide subtitle（Header-Lock overlay） |

## 字体层级（Header-Lock 使用）

| 层级 | 字体 | 大小 | 颜色 |
|------|------|------|------|
| Kicker | Source Sans Pro Semibold | 22px | `#475569` |
| Title | Source Sans Pro Bold | 46px | `#1e293b` |
| Subtitle | Source Sans Pro Regular | 27px | `#64748b` |

## 适用场景

- ✅ 医疗健康、生命科学
- ✅ 咨询报告、研究汇报
- ✅ 数据驱动型 keynote
- ✅ 培训/教学
- ❌ 创意/品牌故事（太冷）
- ❌ 融资 pitch（不够戏剧性）

## Style Master 生成 Prompt

```
Design a visual style guide for a clean, clinical PowerPoint slide deck. This is a reference image, not a slide itself.

Show clearly:
- Color palette: 6 swatches with hex codes — #ffffff (white background), #1e293b (dark slate text), #0d9488 (teal accent), #0284c7 (sky blue emphasis), #d97706 (amber warning - use sparingly), #f1f5f9 (light gray panels)
- Typography: headline sample (large, bold, dark slate), subtitle sample (medium, gray), body text sample (regular, dark), KPI number sample (very large, teal, bold) — with clear size hierarchy
- Layout grid: simple wireframe showing 260px header zone at top, main content zone, thin callout bar at bottom
- Component examples: one KPI card (light gray background, large teal number, small label), one comparison layout (two columns), one bar chart mockup — small but readable
- Micro decoration: thin horizontal rule dividers, subtle card shadows

Style: clean clinical, data-forward. White background, teal data accents. Like a well-designed medical journal or consulting report.
Mood keywords: clean, rational, trustworthy, precise, data-driven

No real company logo. No watermark. No page number. No dark backgrounds. No neon colors. No stock photos. English only.
Canvas: 16:9, 2K resolution.
```
