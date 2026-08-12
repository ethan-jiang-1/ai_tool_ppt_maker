# Active Plans — 活跃 plan/分析文档列表

> 最后更新: 2026-08-13 | `_backlog/plans/` — 活跃 plan 在此，完成移入 [`../_done/_closed_plans/`](../_done/_closed_plans/)。
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
| [schema-first-page-image-recovery.md](schema-first-page-image-recovery.md) | **总控路线（重新开放）。** C1-C6 与 Pre-C7 收敛已完成；C7 的当前三页 delivery 链在事后视觉复核中发现 `DarkGo` 的 provider 文本进入专属 `reserved_header`，因此不能作为预期交付。旧 evidence 保留，C7 继续以一次实质 source/configuration repair、fresh plan/grant/review/delivery 收尾。 |

### 当前阅读边界

先读 `schema-first-page-image-recovery.md` 的 C7 节。历史
`deck_dark_factory_current` 仍是只保留、不可恢复的历史 Bundle；当前且唯一的
生产目标是 `deck_dark_factory_reconstructed/3_versions/v1`。C7 是 production
operation，不新增 C8，也不打开新的 Harness change，除非后续证明确有 Harness
能力缺口。

**Next available plan ID: CLS-032**（移入 `_closed_plans/` 时分配；CLS-001…031 已用）

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
