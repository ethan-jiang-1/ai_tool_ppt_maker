---
playbook: edit-visual
description: 视觉修改——换图/换配色/改布局, 先pilot再全量
includes: [classify-change]
---

# Playbook: Chain B — 视觉修改

> 换图/换颜色/改布局. 先 pilot 再全量, ~5 min/page.

## Nodes

### classify-change (shared)
执行变更分类 → 确认这是 Chain B. 判断是否 pilot 先行.

### pilot
→ 3 页试跑

```yaml
node: pilot
phase: 05
requires: [classify-change]
produces: [pilot-images]
entry:
  - target_slides_identified (opener/body/closer)
exit:
  - pilot_approved_by_user
```

**Step 1 — CLI**: `node scripts/unified_pipeline.mjs --run-dir <dir> --stage 1,2 --only <slide_ids> --resolution 1k`
**Step 2 — MD**: 人审 pilot 结果. 通过 → confirm; 不通过 → 回到 classify-change 调整 prompt 方向

### confirm
→ 确认 pilot, 准备全量

```yaml
node: confirm
phase: 05
requires: [pilot]
produces: [regeneration-plan]
entry:
  - pilot_approved
exit:
  - scope_confirmed
```

**Step 1 — MD**: 确认全量范围: 所有页? 还是受影响页? 告知用户预估时间

### regenerate
→ 全量生图 + 管线

```yaml
node: regenerate
phase: 04
requires: [confirm]
produces: [updated-images, updated-pptx]
entry:
  - scope_confirmed
exit:
  - all_images_regenerated
  - pptx_updated
```

**Step 1 — CLI**: `node scripts/unified_pipeline.mjs --run-dir <dir> --stage 2 --resolution 2k --force-images [--only <ids>]`
**Step 2 — CLI**: `node scripts/unified_pipeline.mjs --run-dir <dir> --stage 3,4,5`

### verify-output
→ 验证视觉修改

```yaml
node: verify-output
phase: 05
requires: [regenerate]
produces: [verified-pptx]
entry:
  - pptx_updated
exit:
  - visual_change_verified
```

**Step 1 — MD**: 抽查修改页, 确认颜色/布局/图片正确. 更新 state
