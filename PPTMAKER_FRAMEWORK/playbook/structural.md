---
playbook: structural
includes: [classify-change]
---

# Playbook: Structural — 结构变更

> 增/删/重排 slide. --new-version + 受影响页.

## Nodes

### classify-change (shared)
执行变更分类 → 确认这是 Structural change.

### new-version
→ 创建干净版本

```yaml
node: new-version
phase: 05
requires: [classify-change]
produces: [new-version-dir]
entry:
  - current_version_exists
exit:
  - new_version_created
```

**Step 1 — MD**: 确认变更范围 (加/删/重排 哪些 slide).
**Step 2 — CLI**: `node scripts/bundle_layout.mjs --new-version <current_version_dir>`

### regenerate-affected
→ 重跑受影响页

```yaml
node: regenerate-affected
phase: 04
requires: [new-version]
produces: [updated-pptx]
entry:
  - new_version_created
exit:
  - affected_slides_regenerated
```

**Step 1 — MD**: 更新 slide-specifications.md (增/删/重排 slide).
**Step 2 — CLI**: `node scripts/unified_pipeline.mjs --run-dir <new_version_dir> --stage 1,2,3,4,5 --only <affected_slide_ids>`
