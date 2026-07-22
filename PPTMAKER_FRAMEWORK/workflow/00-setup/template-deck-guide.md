---
title: Template — Per-Bundle deck-guide.md
stage: workflow/00-setup
position: template
type: template
summary: 可移植 continuation card 的静态模板；当前工作流只由 state/status 给出。
depends_on:
- charter/CONSTITUTION.md
- scripts/shared/run-bundle/bundle_layout.mjs
feeds_into: []
agent_action: copy_to_bundle
---

# Template — Per-Bundle deck-guide.md

`deck-guide.md` 的 continuation block 只有一个 producer：
`scripts/shared/run-bundle/continuation_card.mjs`。`initBundle` 使用它生成实际 card；
`AGENTS.md`、`CLAUDE.md` 与根 `README.md` 只需指向该 card。

```markdown
{{CONTINUATION_CARD_BLOCK}}
```

短指针：

```markdown
# {{DECK_NAME}}

Read [deck-guide.md](deck-guide.md) for the static continuation entry. Current workflow is state/status-owned.
```
