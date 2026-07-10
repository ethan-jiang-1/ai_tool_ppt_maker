---
title: Tech Startup — Visual Preset
stage: workflow/01-visual
position: preset
type: reference
summary: 深紫科技风。深紫底+霓虹青/品红强调。适合融资 pitch、产品发布、年轻受众。
depends_on:
- workflow/01-visual/README.md
feeds_into:
- AGENTS.md (Phase 2)
agent_action: recommend
---

# Tech Startup

> 深紫科技风。适合融资 pitch、产品发布、年轻受众、消费科技。
> 大胆、活力、与众不同——让你在 VC 办公室里被记住。

## 外观

深紫色底色，霓虹青和品红作为强调色。像 synthwave 美学遇到现代 SaaS——高对比度、年轻、记忆点强。

## 色彩系统

| 角色 | 色值 | 用途 |
|------|------|------|
| Background | `#1a0a2e` | 所有 slide 底色（深紫） |
| Panel/Card | `#2d1b4e` | 卡片、面板背景 |
| Primary Text | `#e0e0e0` | 正文、标题（浅灰白） |
| Secondary Text | `#a0a0b8` | 辅助文字、标签 |
| Accent/Cyber | `#00f5d4` | 关键数字、CTA、增长数据（霓虹青） |
| Emphasis | `#f72585` | 强调文字、重要标记（品红） |
| Data | `#7209b7` | 次要数据、辅助元素（深品红） |
| Muted | `#4a3a6e` | 弱化信息 |
| Kicker | `#a0a0b8` | Slide kicker（Header-Lock overlay） |
| Subtitle | `#8888a0` | Slide subtitle（Header-Lock overlay） |

## 字体层级（Header-Lock 使用）

| 层级 | 字体 | 大小 | 颜色 |
|------|------|------|------|
| Kicker | Source Sans Pro Semibold | 22px | `#a0a0b8` |
| Title | Source Sans Pro Bold | 46px | `#e0e0e0` |
| Subtitle | Source Sans Pro Regular | 27px | `#8888a0` |

## 适用场景

- ✅ 融资 pitch deck（尤其消费科技、SaaS、Web3）
- ✅ 产品发布/launch event
- ✅ 年轻受众（<40 岁）
- ✅ 需要"与众不同"的场合
- ❌ 保守行业（金融、政府、制造业）
- ❌ 高管/董事会汇报（太激进）
- ❌ 培训/教学（太 distracting）

## Style Master 生成 Prompt

```
Design a visual style guide for a tech startup PowerPoint slide deck. This is a reference image, not a slide itself.

Show clearly:
- Color palette: 6 swatches with hex codes — #1a0a2e (deep purple background), #00f5d4 (neon cyan accent), #f72585 (magenta emphasis), #7209b7 (deep purple data), #2d1b4e (purple panels), #e0e0e0 (light gray text)
- Typography: headline sample (large, bold, light gray), subtitle sample (medium, muted), body text sample (regular), KPI number sample (very large, neon cyan, bold) — with clear size hierarchy
- Layout grid: simple wireframe showing 260px header zone, main content zone, thin callout bar
- Component examples: one KPI card (dark purple panel, large neon cyan number), one comparison layout (two columns with magenta headers), one 3-step flow (connected neon cyan arrows) — small but readable
- Micro decoration: thin neon cyan accent lines, subtle glow effects on key numbers

Style: tech startup, synthwave-meets-SaaS. Deep purple background, neon cyan and magenta accents. Bold, energetic, memorable.
Mood keywords: bold, futuristic, energetic, distinctive, tech-forward

No real company logo. No watermark. No page number. No corporate blues or grays. No warm earth tones. English only.
Canvas: 16:9, 2K resolution.
```
