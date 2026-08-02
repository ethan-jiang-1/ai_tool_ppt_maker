# 原阶段计划并入说明

> 状态：执行顺序已由 [根 progressive plan](../progressive-plan.md) 完成并归档 | 更新：2026-08-02

本文件原先把渲染收敛、raw-review 恢复、Style Master 与 Pilot Run 拆为 4 个 change、14 个 phase。该拆法已经完成依赖审计并收敛为 3 个串行 change；旧 phase 不再是执行 checklist，也不得用于判断 active OpenSpec 状态。

## 合并结果

| 原阶段 | 现在的唯一归属 | 原因 |
| --- | --- | --- |
| Phase 0-5: render contract | Change 1 `converge-framed-render-and-review` | Preset/profile、一个 evaluator、proof-before-materialization、refresh 与 diagnostics 共同形成 renderer contract。 |
| Phase 6-7: raw-review evidence | 同一个 Change 1 | Review contribution 必须绑定同一 change 接受的 render profile；单独归档会留下无法完整验收的中间态。 |
| Phase 8-9: Style Master | Change 2 `establish-style-master-feedback` | 独立的视觉问题、candidate operation、promotion 与 effective selection owner。 |
| Phase 10-13: Pilot/Expansion | Change 3 `introduce-progressive-page-production` | Exact batches、attempt/materialization、两条 Pilot journey、Expansion、complete review 与 resume 是一个不可分割 lifecycle。 |

## 继续阅读

- 渲染现状证据：[research.md](research.md)
- Framed 技术设计：[render-contract-plan.md](render-contract-plan.md)
- 生产 UX 设计：[../production-conventions/pilot-run-plan.md](../production-conventions/pilot-run-plan.md)
- 当前总控 checklist：[../progressive-plan.md](../progressive-plan.md)
- 已归档 Change 1：[converge-framed-render-and-review](../../../../openspec/changes/archive/2026-07-31-converge-framed-render-and-review/proposal.md)

实施已完成；根计划与三个 archived change 保留最终记录。这里不再复制任何 Gate、phase 或 change checklist。
