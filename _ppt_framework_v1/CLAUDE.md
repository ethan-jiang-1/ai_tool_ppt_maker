---
title: CLAUDE.md
stage: root
position: redirect
type: redirect
summary: 触发词检测 + 重定向到 BOOTSTRAP.md。Agent 先读 BOOTSTRAP.md 做三步启动，再按 AGENTS.md 详细执行。
depends_on:
- BOOTSTRAP.md
feeds_into:
- AGENTS.md
agent_action: redirect
---

# CLAUDE.md

## Trigger: When to use this framework

If the user mentions ANY of these: **ppt, deck, presentation, pitch deck, keynote, slides, slide deck, 演示文稿, 幻灯片, PPTX** — you are in PPT-building mode.

**First action**: Read [BOOTSTRAP.md](BOOTSTRAP.md). It is the unified 3-step entry point (environment check → quick intake → start building).
**Then**: Read [AGENT_CONTRACT.md](AGENT_CONTRACT.md) — 10 non-negotiable rules (one page). Keep it in working memory.
**Then**: Follow BOOTSTRAP into the build. Open [AGENTS.md](AGENTS.md) only for the Phase you are currently executing — it is the detailed playbook, not the every-turn entry.
**This file** exists so Claude Code auto-loads something. Flow: BOOTSTRAP → AGENT_CONTRACT → (per-Phase) AGENTS.md.
