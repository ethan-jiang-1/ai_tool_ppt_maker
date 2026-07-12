---
playbook: quick-preview
description: 探索——style master 就绪后 3 页 pilot 快览（contact sheet）
includes: []
---

# Playbook: 探索 — 3 页快览

> 前置：`style_master.jpg` 存在。**不要求** content/visual gates 已 approve/waive；**禁止**为了跑 pilot 去 `--waive`。
> 产物是 contact sheet，**不是** partial PPTX。预览 ≠ 批准全量生产。
> 推荐顺序：视觉 LOCK（可用 `iterate-style`）→ 本 playbook → approve content/visual + `approve header` → matching-profile `build --reuse-images`。
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
（默认跳过已有图；要重渲加 `--force-images`。`--only 3` / `--only s03` 可用。长出图转述 `i/N` 与心跳；失败 envelope 原样。）
**Step 2 — MD**: 若手工 `--only` 在有 2 张以上 content full-page 时未覆盖 2 张，补跑缺失的 content full-page；CLI 不会偷加页。

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

**Step 1 — MD**: **必须 open** pilot contact sheet。逐页检查 header 文字准确完整、清晰度、位置、字号、左对齐、跨页一致性，以及是否与 body overlap。禁止只描述。
**Step 2 — MD**:
- **PROCEED** → 跑 `ppt_flow approve <run-dir> header`；若为 partial，补足提示的 coverage，再 approve。正式 profile 与 pilot 一致时使用 `build --reuse-images`
- **RETRY** → 改相关页 L3 / IMAGE PROMPT 后按 Chain B `pilot --only <ids> --force-images`，重新 review
- **HEADER-LOCK** → 说明具体漂移页与症状；仅在用户确认后把 id 加入 `render.header-lock`，按 Chain B 强制重生并重新 review
- **ACCEPT RISK** → `approve <run-dir> header --waive --only <ids> --reason "<症状>"`，把具体风险持久化
- **BACK** → 回风格/内容打磨
