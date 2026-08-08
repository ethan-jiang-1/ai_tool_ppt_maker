# _done — 已完成/已归档记录

> 最后更新: 2026-08-08 | `_backlog/_done/` — 所有已完成内容的归档根目录。
> **`_` 前缀 = coding agent 默认忽略，除非显式点名要读。**
>
> 状态总览和查阅指南在本文件。活跃工作的 PENDING 表、依赖链、执行顺序 → 见 [`../todos/README.md`](../todos/README.md)。

## 目录

```
_done/
├── README.md              # 本文件（状态总览 + 查阅指南）
├── _fixed_bugs/           # 已修复 Bug（编号权威源）
├── _suspened_bugs/        # 悬挂 Bug（暂未确认修复）
├── _done_todos/           # 已完成 TODO（DONE-NNN）
└── _closed_plans/         # 已完成 Plan（CLS-NNN）
```

---

## 状态总览

### ✅ DONE（已完成/已归档）

| 归档目录 | 数量 | Next ID |
|---------|------|---------|
| `_fixed_bugs/` | 52 | BUG-055 |
| `_suspened_bugs/` | 2 | — |
| `_done_todos/` | 1 | DONE-002 |
| `_closed_plans/` | 22 | CLS-023 |

_（已修复 bug：BUG-001…037、040…054；BUG-038、039 悬挂。已关闭 plan：CLS-001…022。每次搬迁按 `../README.md` 的 ritual 更新对应计数与 Next ID。）_

---

## 快速查阅指南

### 想看"现在该做什么"
→ [`../todos/README.md`](../todos/README.md) 的"推荐执行顺序"。

### 想看 _backlog 的规矩
→ [`../README.md`](../README.md) — 三套搬迁 ritual（todo / bug / plan）+ 铁律 + 外部文件地图。

### 想看历史决策
→ `_closed_plans/` 下的 plan（分析/复盘）与 `_done_todos/` 下的 DONE 文件（按文件名主题查阅）。

### 想看复盘经验
→ [`../learning/`](../learning/) — 框架级 apply / 研究 retro（≠ `deck_*/_lessons/` 自留操作教训）。

### 想看具体 TODO 的设计思路
→ `../todos/todo-*.md`，每个都含：Why、现状对齐、Current Direction、Design Questions、Non-Goals、Next Step。
