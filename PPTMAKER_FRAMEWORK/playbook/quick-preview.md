---
playbook: quick-preview
description: 探索——style master 就绪后 3 页 pilot 快览（contact sheet）
includes: []
---

# Playbook: 探索 — 3 页快览

> 前置：`style_master.jpg` 存在。**不要求** content/visual gates 已 approve/waive；**禁止**为了跑 pilot 去 `--waive`。
> 产物是 contact sheet，**不是** partial PPTX。预览 ≠ 批准全量生产。
> 推荐顺序：视觉 LOCK（可用 `iterate-style`）→ 本 playbook → approve gates → `build`。
> 也可在 gates 仍 pending 时先快览手感，再回去改 prompt / 锁门。

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

**Step 1 — MD**: 确认 `style_master.jpg` 存在。gates 可为 pending。若缺 style master → 导向 `iterate-style` / `style-master`，不要 waive 门。
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
（默认跳过已有图；要重渲加 `--force-images`。`--only 3` / `--only s03` 可用。）

### review-preview
→ 人审 contact sheet

```yaml
node: review-preview
phase: 03
requires: [pilot-generate]
produces: []
entry: [pilot_done]
exit: []
```

**Step 1 — MD**: **必须 open** pilot contact sheet（常见于 `_generated/` 下，如 `pilot_final_contact_sheet.jpg`；以 `status` / 产物名为准）。禁止只描述。
**Step 2 — MD**:
- **PROCEED** → 若要全量：先确保 content/visual approve（或显式 waive），再 `build`
- **RETRY** → 改相关页 L3 / IMAGE PROMPT 后回 `pilot-generate`（留在本 playbook）
- **BACK** → 回风格/内容打磨
