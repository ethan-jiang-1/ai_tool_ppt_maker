---
playbook: edit-text
description: HTML header/body/callout copy 的 Local Slide Rebuild
supported_pipelines: [html-first-v1]
includes: [classify-change]
---

# Playbook: Edit Text

## Nodes

### classify-change (shared)

Probe pipeline first and resolve exact stable IDs. Family or chart-shape changes route to visual/layout ownership; structure routes to `restructure-slides`.

### rebuild-text-slides

```yaml
node: rebuild-text-slides
lifecycle_phase: 5
method_module: 05-iteration
requires: [classify-change]
produces: [updated-source, local-review-artifacts]
entry: [slide_specs_exists]
exit: [slide_specs_valid, evidence:text-slides-rebuilt]
```

**Step 1 — MD**: Edit header/body/callout source only. Preserve stable IDs and notes; never edit HTML/PNG/PPTX.

**Step 2 — CLI**: Run scoped HTML refresh/local Stage 1-3. Content approval becomes stale when its projection changes; ordinary copy keeps visual approval only when page visual dependency remains current.

### review-text-delivery

```yaml
node: review-text-delivery
lifecycle_phase: 5
method_module: 05-iteration
requires: [rebuild-text-slides]
produces: [verified-text-change]
decisions: [proceed, repair, redirect]
entry: []
exit: [user_decision_recorded, user_evidence:text-change-verified]
```

**Step 1 — MD**: Open affected preview and inspect exact text, font, wrap, overflow, family geometry, and unchanged-page isolation. Publish any stale content/visual plan-hash review, then build and repeat final delivery review.

**Step 2 — GATE**: Record user verification only after the current PPTX/notes and delivery review are current.
