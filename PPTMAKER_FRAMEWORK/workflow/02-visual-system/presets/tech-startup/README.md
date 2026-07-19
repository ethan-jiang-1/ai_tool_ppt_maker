---
title: Tech Startup — Visual Preset
stage: workflow/02-visual-system
position: preset
type: reference
summary: 深紫、cyan 与 magenta 高对比系统；适合融资 pitch 与产品发布。
depends_on:
- workflow/02-visual-system/README.md
feeds_into:
- AGENTS.md (Phase 2)
agent_action: recommend
---

# Tech Startup

深紫背景、cyan KPI、magenta emphasis。大胆但仍服从可读性、fixed geometry 与有限组件数量，不能退化为霓虹装饰墙。

| Role | Value |
|---|---|
| background | `#1a0a2e` |
| panel | `#2d1b4e` |
| primary text | `#e0e0e0` |
| secondary text | `#a0a0b8` |
| accent | `#00f5d4` |
| emphasis | `#f72585` |
| data | `#7209b7` |

HTML compositor 负责准确 header/body/KPI；abstract pattern、icons 与 chart 由 closed adapters 生成。不要创建 style master，不要使用 arbitrary CSS、gradient orb 或 provider-generated page text。

适合融资 pitch、产品发布与年轻科技受众。不适合金融、政府或严肃合规汇报。

用真实 local preview 检查 sparse hero、KPI、flow 和 comparison。高对比 accent 只用于信息层级；所有文字仍需 bundled-font 与 overflow 证据。
