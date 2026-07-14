---
playbook: edit-notes
description: 备注修改——只重跑 Stage 5
includes: [classify-change]
---

# Playbook: 备注修改

## Nodes

### classify-change (shared)

确认只有 speaker notes 失效，选择 Notes-Only Refresh，并持久化 slide scope。

### inject-notes

```yaml
node: inject-notes
lifecycle_phase: 4
method_module: 04-production
requires: [classify-change]
produces: [updated-pptx-with-notes, notes-injection-receipt]
entry: [slide_specs_exists]
exit: [speaker_notes_injected]
```

**Step 1 — MD**: 修改源 slide specification 的 SPEAKER NOTE，禁止直接改 PPTX 或 receipt。

**Step 2 — CLI**: 运行 `node PPTMAKER_FRAMEWORK/scripts/unified_pipeline.mjs --run-dir <run-dir> --stage 5`。

### verify-notes

```yaml
node: verify-notes
lifecycle_phase: 4
method_module: 05-iteration
requires: [inject-notes]
produces: [verified-notes]
entry: []
exit: [user_evidence:notes-verified]
```

**Step 1 — MD**: Open PPTX Presenter View，逐页检查备注与 slide 对齐。

**Step 2 — GATE**: 用户确认后记录 `notes-verified`（kind `user`）。
