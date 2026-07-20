# BUG-019: visual review plan 在缺少 composition data 时 approvable=false，阻塞 gate approval

> 严重级别: P1 | 发现: 2026-07-21 | 状态: 活跃

## 症状
`buildHtmlReviewPlan` 对 visual kind 会检查 `shown_artifacts`（来自 `composition.final_slides`）。
若 composition 为 null（如 `readCurrentPlan` 内部的调用），`shownEffective` 为空集，
全部 slide 被列为 `missingArtifacts` → `approvable: false` → gate 永远无法 approved。

## 根因
`readCurrentPlan`（html_review_evidence_core.mjs:140）调用 `buildHtmlReviewPlan` 时
不传 `composition` 参数，而 `buildHtmlReviewPlan` 对 visual kind 依赖 composition 数据
才能判定 `approvable`。pilot 阶段生成 plan 时有 composition 数据所以 plan 本身
`approvable: true`，但后续 `readCurrentPlan` 重建的 expected plan 始终 `approvable: false`。

## 复现
1. pilot html-first deck → visual review plan（approvable: true）
2. `readCurrentPlan` 内部调用 `buildHtmlReviewPlan`（无 composition）
3. expected plan approvable: false
4. plan.approvable !== true → `plan_reason: incomplete`

## 修复关联
`readCurrentPlan` 应从 preview/final_slides manifest 读取 composition 数据并传入
`buildHtmlReviewPlan`。
