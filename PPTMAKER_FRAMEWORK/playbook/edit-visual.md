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
  - pilot_approved
```

**Step 1 — CLI**: `node scripts/ppt_flow.mjs pilot <dir> --only <slide_ids> --force-images --resolution <production-profile>`
**Step 2 — MD**: **必须 open** pilot 产物。full-page header 还要检查准确性、清晰度、位置、字号、左对齐、跨页一致性与 body overlap。手工 subset 覆盖不足时补跑 content full-page。通过后 `approve <dir> header`；不通过回到 classify-change。

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

**Step 1 — CLI**: 受影响页先按 Chain B pilot + review + `approve header`；不要在同一条生产链中覆盖已审 full-page 图片。
**Step 2 — CLI**: `node scripts/ppt_flow.mjs build <dir> --resolution 2k --reuse-images`

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
