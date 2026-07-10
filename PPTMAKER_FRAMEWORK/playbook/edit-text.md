---
playbook: edit-text
description: 文本修改——改标题/kicker/subtitle, ~5 min
includes: [classify-change]
---

# Playbook: Chain A — 文本修改

> title/kicker/subtitle 修改. 不改图, ~5 min.

## Nodes

### classify-change (shared)
执行变更分类 → 确认这是 Chain A.

### stage-text
→ 跑文本链

```yaml
node: stage-text
phase: 05
requires: [classify-change]
produces: [updated-slide]
entry:
  - slide_specs_exists
  - target_slide_identified
exit:
  - stage_complete
```

**Step 1 — CLI**: `node scripts/unified_pipeline.mjs --run-dir <dir> --stage 1,3,4,5 --only <slide_id>`

### verify-output
→ 验证文本修改

```yaml
node: verify-output
phase: 05
requires: [stage-text]
produces: [verified-slide]
entry:
  - stage_complete
exit:
  - title_updated_correctly
```

**Step 1 — MD**: 打开生成的 .pptx, 确认标题/kicker/subtitle 正确. 更新 state
