---
title: Clean Clinical — Visual Preset
stage: workflow/02-visual-system
position: preset
type: reference
summary: 白底、石板灰文字与青绿数据强调；适合医疗、咨询、研究与培训。
depends_on:
- workflow/02-visual-system/README.md
feeds_into:
- AGENTS.md (Phase 2)
agent_action: recommend
---

# Clean Clinical

白底、浅灰 panel、石板灰正文、teal/sky-blue 数据强调。目标是理性、清楚、可信，而不是“医疗图库”氛围。

| Role | Value |
|---|---|
| background | `#ffffff` |
| panel | `#f1f5f9` |
| primary text | `#1e293b` |
| secondary text | `#64748b` |
| accent | `#0d9488` |
| emphasis | `#0284c7` |
| warning | `#d97706`，仅风险 |

Typography 由 bundled Source Sans 3 / Noto Sans SC roles 驱动。Framed slides
use the local Text Frame for kicker, title, and subtitle; Pure slides keep
semantic display text in Image2. Do not make a style sample a source of truth.

适合医疗健康、研究报告、数据型 keynote 与培训。不适合需要强烈品牌戏剧性的消费 pitch。

验证方式：运行 `ppt_flow validate`，再用当前 Page Authority raw/final evidence
检查 cards、data、callout、English/Hans 字体与 overflow。
