---
playbook: quick-preview
description: 探索——内容就绪后 3 页 pilot 快览（contact sheet）
includes: []
---

# Playbook: 探索 — 3 页快览

> 前置：`content` + `visual` gates 已 `approved` / `waived`（与 `ppt_flow pilot` 一致）。
> 产物是 contact sheet，**不是** partial PPTX。
> 推荐顺序：视觉 LOCK（可用 `iterate-style`）→ 本 playbook → `build`。

## Nodes

### validate-ready
→ 确认可 pilot

```yaml
node: validate-ready
phase: 03
requires: []
produces: [validated]
entry: []
exit: [ready_for_pilot]
```

**Step 1 — MD**: 若 content/visual gate 仍为 pending → **停**，导向 `iterate-style` / `create-deck` setup，禁止硬闯 pilot。
**Step 2 — CLI**: `node PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs validate <run-dir>`

### pilot-generate
→ 3 页 pilot + contact sheet

```yaml
node: pilot-generate
phase: 03
requires: [validate-ready]
produces: [pilot_contact_sheet]
entry: [ready_for_pilot]
exit: [pilot_done]
```

**Step 1 — CLI**: `node PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs pilot <run-dir>`
（默认 resolution 1k；不改 CLI。）

### review-preview
→ 看 contact sheet

```yaml
node: review-preview
phase: 03
requires: [pilot-generate]
produces: [preview_decision]
entry: [pilot_done]
exit: [proceed | retry | back]
```

**Step 1 — MD**: **必须 open** pilot contact sheet（常见于 `_generated/` 下，如 `pilot_final_contact_sheet.jpg`；以 `status` / 产物名为准）。禁止只描述。
**Step 2 — Gate**:
- **PROCEED** → 建议 `node PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs build <run-dir>`
- **RETRY** → 改相关页 L3 / IMAGE PROMPT 后回 `pilot-generate`（留在本 playbook）
- **BACK** → Phase 1/2 或 `iterate-style`
