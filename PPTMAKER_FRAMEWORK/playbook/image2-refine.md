---
playbook: image2-refine
description: HTML-first 交付后的可选、逐页授权 Image2 visual-slot refinement
supported_pipelines: [html-first-v1]
includes: []
---

# Playbook: Image2 Visual-Slot Refinement

这是可选的 Phase 4 专业升级。它只处理已经完成当前 HTML 交付审阅的标记版；用户不进入此 controller 时，HTML 交付本身就是完整结果。

## Nodes

### recommend-image2-refinement

```yaml
node: recommend-image2-refinement
lifecycle_phase: 4
method_module: 04-image2-refinement
requires: []
produces: [image2-refinement-plan]
entry: [html_first_marked, html_delivery_review_current]
exit: [evidence:image2-refinement-plan-current]
```

**Step 1 — CLI**: Inspect the current HTML delivery and recommend 2–4 stable slide IDs, one no-text visual slot per page, and the separately counted setup/page attempts. If delivery evidence is incomplete but final-slide identity is safe, present an offline reasoned planning continuation; it never authorizes a provider call.

**Step 2 — MD**: Show the exact deterministic plan hash and total expected remote attempts. No provider call occurs at recommendation time.

### authorize-image2-refinement

```yaml
node: authorize-image2-refinement
lifecycle_phase: 4
method_module: 04-image2-refinement
requires: [recommend-image2-refinement]
decisions: [authorize, decline]
produces: [image2-refinement-authorization]
entry: [html_first_marked, html_delivery_review_current]
exit: [user_decision_recorded]
```

**Step 1 — GATE**: `authorize` binds exactly the shown plan hash and count; `decline` exits with no plan, authorization, pending node, or lazy refinement directories.

### execute-image2-refinement

```yaml
node: execute-image2-refinement
lifecycle_phase: 4
method_module: 04-image2-refinement
requires: [authorize-image2-refinement]
produces: [image2-refinement-candidates]
entry: [html_first_marked, html_delivery_review_current, node_decision:authorize-image2-refinement:authorize]
exit: [evidence:image2-refinement-candidates-current]
```

**Step 1 — CLI**: Submit only persisted planned attempts through the injected modern adapter; reconcile `unknown-submit` by attempt ID and never blindly retry. Missing authorization, request identity drift, or an uncertain remote submit is a protected hard boundary, not a force path.

**Step 2 — MD**: Inspect each immutable candidate and same-geometry review comparison.

### review-image2-refinement

```yaml
node: review-image2-refinement
lifecycle_phase: 4
method_module: 04-image2-refinement
requires: [execute-image2-refinement]
decisions: [accept, use-html, decline]
produces: [image2-refinement-review]
entry: [html_first_marked, html_delivery_review_current]
exit: [user_decision_recorded]
```

**Step 1 — GATE**: Decide independently for every selected page. `accept` promotes source bytes and locally recomposes; `use-html` keeps the current HTML fallback; `decline` leaves candidates as derived evidence for explicit cleanup.

**Step 2 — CLI**: After any accept, renew the ordinary HTML final-review evidence before reporting delivery complete.
