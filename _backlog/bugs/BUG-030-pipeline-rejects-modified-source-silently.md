# BUG-030: 修改 slide-specifications.md 后所有已批准的 gate/plan 静默失效

> 严重级别: P1 | 发现: 2026-07-21 | 状态: 活跃

## 症状
完成 pilot → 修复 plan → 手工写入 gate records → content/visual ready = true 后，
对 slide-specifications.md 做任何修改（如修正 SPEAKER NOTE 空行），即使不影响 slide
结构，也会导致：
- `source_sha256` 变化
- 所有已批准的 gate record 变为 stale
- `ppt_flow build` / `ppt_flow image2 plan` 再次被阻塞
- 无任何提示告知"你的 source 改了，之前审批失效了"

用户需要从 pilot 重新跑整个流程。

## 根因
gate approval 将 `source_sha256` 纳入 `currentPlan` → `ordered_plan_digest` →
`html_delivery_digest` 的哈希链。任何 source 字节变化都会导致整个哈希链断裂。
但从用户体验角度，修改 SPEAKER NOTE 不应使 visual gate 失效。

## 复现
1. pilot → approve → delivery review
2. 修改某页的 SPEAKER NOTE 文本
3. 所有 gate 静默变 stale
4. 没有任何 CLI 输出告知此变化

## 修复关联
- 区分 "structural change"（影响 layout）和 "cosmetic change"（只影响 notes）
- 或至少在 state/status 输出中标注 "source modified since last approval"
