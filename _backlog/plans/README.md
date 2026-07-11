# Active Plans — 活跃 plan/分析文档列表

> 最后更新: 2026-07-10 | `_backlog/plans/` — 活跃 plan 在此，完成移入 [`../_done/_closed_plans/`](../_done/_closed_plans/)。
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

| Plan | 简述 |
|------|------|
| [agent-interaction-protocol](agent-interaction-protocol.md) | 交互节律协议（show / 心跳 / 步长）；与 preview 合成 Change 1，migrate 为 Change 2 |
| [style-iterate-and-quick-preview](style-iterate-and-quick-preview.md) | 探索入口实例（`iterate-style` + `quick-preview`）；**并入 Change 1**，不单独开 change |

### 已定名 OpenSpec changes（2026-07-11）

| # | Change 名 | 吸收哪些 plan | 何时 |
|---|-----------|--------------|------|
| 1 | **`add-interaction-rhythm-and-explore-playbooks`** | 协议 P0 + 本目录两个 plan 的探索实例 | 先做（待 propose） |
| 2 | **`guard-offpath-migrate-import-ux`** | 旁路迁移/导入：补方法论+playbook，套同一套 gate+show，禁止裸奔 | Change 1 之后 |

**Next available plan ID: CLS-001**（移入 `_closed_plans/` 时分配）

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
