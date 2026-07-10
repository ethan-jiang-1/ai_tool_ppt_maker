---
title: Corporate Safe — Visual Preset
stage: workflow/01-visual
position: preset
type: reference
summary: 企业安全风。白底+企业蓝+灰色系。专业、可信、永不过时。适合金融、政府、法律、跨国企业。
depends_on:
- workflow/01-visual/README.md
feeds_into:
- AGENTS.md (Phase 2)
agent_action: recommend
---

# Corporate Safe

> 企业安全风。适合保守行业、正式场合、跨国企业、金融/政府/法律。
> 专业、无风险、在任何屏幕上都不出错——白底蓝灰，永不过时。

## 外观

纯白底色，企业蓝作为主色，灰色系辅助。像麦肯锡或高盛的 presentation——不过度设计，让内容说话。

## 色彩系统

| 角色 | 色值 | 用途 |
|------|------|------|
| Background | `#ffffff` | 所有 slide 底色 |
| Panel/Card | `#f8fafc` | 卡片、面板背景（极浅灰蓝） |
| Primary Text | `#0f172a` | 正文、标题（深蓝黑） |
| Secondary Text | `#475569` | 辅助文字、标签 |
| Primary Brand | `#1e40af` | 主色、标题强调、图标 |
| Accent/Positive | `#059669` | 增长数据、正面结果（翠绿） |
| Warning | `#dc2626` | 仅用于风险/下降信号 |
| Divider | `#e2e8f0` | 分割线、表格边框 |
| Light BG | `#f1f5f9` | 交替行背景、弱化区块 |
| Kicker | `#475569` | Slide kicker（Header-Lock overlay） |
| Subtitle | `#64748b` | Slide subtitle（Header-Lock overlay） |

## 字体层级（Header-Lock 使用）

| 层级 | 字体 | 大小 | 颜色 |
|------|------|------|------|
| Kicker | Source Sans Pro Semibold | 22px | `#475569` |
| Title | Source Sans Pro Bold | 46px | `#0f172a` |
| Subtitle | Source Sans Pro Regular | 27px | `#64748b` |

## 适用场景

- ✅ 金融/银行/保险
- ✅ 政府/公共部门
- ✅ 法律/合规
- ✅ 跨国企业正式汇报
- ✅ 任何"不能出错"的场合
- ❌ 创意/品牌故事（太保守）
- ❌ 消费科技 pitch（不够记忆点）

## Style Master 生成 Prompt

```
Design a visual style guide for a corporate-safe PowerPoint slide deck. This is a reference image, not a slide itself.

Show clearly:
- Color palette: 6 swatches with hex codes — #ffffff (white background), #1e40af (corporate blue), #0f172a (dark blue-black text), #475569 (slate gray secondary), #059669 (emerald green positive), #f1f5f9 (light gray panels)
- Typography: headline sample (large, bold, dark blue-black), subtitle sample (medium, slate gray), body text sample (regular, dark), KPI number sample (very large, corporate blue, bold) — with clear size hierarchy
- Layout grid: simple wireframe showing 260px header zone, main content zone, thin callout bar
- Component examples: one KPI card (light gray panel, large blue number, small label), one structured table (clean borders, alternating row colors), one bar chart mockup (blue bars, emerald green highlight bar) — small but readable
- Micro decoration: thin horizontal rules, subtle card borders

Style: corporate-safe, professional. White background, corporate blue accents. Like McKinsey or Goldman Sachs presentations — clean, professional, timeless.
Mood keywords: professional, trustworthy, clean, formal, timeless

No real company logo. No watermark. No page number. No neon colors. No dark backgrounds. No decorative elements. English only.
Canvas: 16:9, 2K resolution.
```
