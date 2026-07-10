---
playbook: chain-c
includes: [classify-change]
---

# Playbook: Chain C — 备注修改

> Speaker notes only. ~30 sec.

## Nodes

### classify-change (shared)
执行变更分类 → 确认这是 Chain C.

### inject-notes
→ 注入备注

```yaml
node: inject-notes
phase: 05
requires: [classify-change]
produces: [updated-pptx-with-notes]
entry:
  - pptx_exists
  - slide_specs_exists
exit:
  - notes_injected
```

**Step 1 — CLI**: `node scripts/unified_pipeline.mjs --run-dir <dir> --stage 5`

### verify-notes
→ 验证备注

```yaml
node: verify-notes
phase: 05
requires: [inject-notes]
produces: [verified-notes]
entry:
  - notes_injected
exit:
  - notes_correct
```

**Step 1 — MD**: 打开 .pptx, 检查 Presenter View 中的备注正确. 更新 state
