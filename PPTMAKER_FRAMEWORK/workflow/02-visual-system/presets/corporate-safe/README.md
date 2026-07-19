---
title: Corporate Safe — Visual Preset
stage: workflow/02-visual-system
position: preset
type: reference
summary: 白底、企业蓝与灰阶；适合金融、政府、法律与正式企业汇报。
depends_on:
- workflow/02-visual-system/README.md
feeds_into:
- AGENTS.md (Phase 2)
agent_action: recommend
---

# Corporate Safe

白底、浅灰蓝 panel、深蓝黑正文、corporate blue 强调。它优先可扫描性、可辩护性和稳定层级，不靠装饰制造权威。

| Role | Value |
|---|---|
| background | `#ffffff` |
| panel | `#f8fafc` |
| primary text | `#0f172a` |
| secondary text | `#475569` |
| primary | `#1e40af` |
| positive | `#059669` |
| warning | `#dc2626`，仅风险 |

HTML compositor 拥有准确 header/body/table/chart text；bundled fonts 与 fixed geometry 负责一致性。不要创建 style master 或 header-lock overlay 作为新 deck 前置条件。

适合董事会、金融、政府、法律与合规场景。不适合需要强烈实验感的消费科技发布。

用真实 HTML representative pages 审查 KPI、comparison、table、chart 和 callout。`color_palette.json` 是唯一结构化 visual source；视觉批准绑定当前 preview evidence，而不是抽象色板描述。
