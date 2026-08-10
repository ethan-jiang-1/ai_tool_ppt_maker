# Active Plans — 活跃 plan/分析文档列表

> 最后更新: 2026-08-11 | `_backlog/plans/` — 活跃 plan 在此，完成移入 [`../_done/_closed_plans/`](../_done/_closed_plans/)。
>
> **plan 没有编号，文件名即标识。完成后文件名不变，位置即状态。**

## 完成一个 plan 的步骤

1. `git mv plans/<name>.md _done/_closed_plans/<name>.md`
2. 更新 `_done/_closed_plans/README.md`（加一行 + 更新 Next available plan ID）
3. 更新本文件（删掉该 plan）
4. 更新 `../_done/README.md`（计数 +1 closed）

**plan 是"分析/设计/复盘"文档，不是活跃 change 本身。** 真正的实施走 `openspec/changes/`；plan 记录的是思考、取舍、复盘（postmortem），一旦其结论已落地或被 change 吸收即可关闭。

---

## 活跃列表

| Plan | 说明 |
|---|---|
| [schema-first-page-image-recovery.md](schema-first-page-image-recovery.md) | **总控路线**。19 个 schema、定义家、C1–C7 七个 change 的拆分与依赖。所有已作废计划中仍成立的结论都已吸收进来，下游 change 不需要读已关闭文档。 |
| [framed-provider-protected-composition.md](framed-provider-protected-composition.md) | Framed provider 保护区、约束传播与修复前能力验证的调查/设计计划。归 C6。 |
| [framed-provider-capability-discovery-research.md](framed-provider-capability-discovery-research.md) | Provider transport 面记录与合成探针准备。归 C6。 |

2026-08-11 关闭三份被取代的计划（CLS-025/026/027），其有效证据已吸收进总控路线的
"Already Landed" 与 "Absorbed Design Decisions" 两节。

**Next available plan ID: CLS-028**（移入 `_closed_plans/` 时分配；CLS-001…027 已用）

---

## 卡片模板

新建 plan 文件 `<name>.md`（kebab-case slug 即标识）：

```markdown
# Plan: <标题>

> 类型: 设计 / 分析 / 复盘（postmortem） | 更新: 2026-MM-DD

## 背景 / 现状
触发这份 plan 的问题、当前状态、约束。

## 决策 / 方案
关键技术选择与理由（为什么 X 不是 Y），含考虑过的备选。

## 风险 / 取舍
已知限制、可能出问题的点。格式：[风险] → 缓解。

## 落地关联
计划如何变成 `openspec/changes/` 里的 change（或已被哪个 change 吸收）。
```
