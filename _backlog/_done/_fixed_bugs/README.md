# Fixed Bugs Index — 已修复 bug 归档

> 最后更新: 2026-07-11 | `_backlog/_done/_fixed_bugs/` — 已修复 bug 的归档目录。
> 接收来自 [`../../bugs/`](../../bugs/) 的 bug。`_` 前缀 = coding agent 默认忽略。
>
> **本目录是 bug 编号的唯一权威来源——新 bug 的编号 = 本目录最大编号 + 1。**

## 接收一个修完的 bug

bug 修完后从 `_backlog/bugs/` 通过 `git mv` 移入本目录：
1. 在本文件表格加一行（ID + Date + Title）
2. 更新下面的 "Next available bug ID"
3. 更新 `../../bugs/README.md`（删掉该 bug）
4. 更新 `../README.md`（计数 +1）

---

| ID | Date | Title |
|----|------|-------|
| [BUG-001](BUG-001-main-specs-stored-in-delta-format.md) | 2026-07-11 | 15/16 主 spec 存成 delta 格式，`openspec validate --specs` 系统性失败 |
| [BUG-002](BUG-002-framework-docs-still-say-run-bundle-state.md) | 2026-07-11 | 框架方法论文档仍写 `run-bundle-state.yaml`，与 `_state/` 代码/spec 漂移 |
| [BUG-003](BUG-003-ppt-flow-frozen-style-presets-sort.md) | 2026-07-11 | `ppt_flow.mjs` 对冻结 `STYLE_PRESETS` 原地 `.sort()`，启动即崩 |
| [BUG-004](BUG-004-ppt-flow-state-command-registered-outside-main.md) | 2026-07-11 | `state` 在 `main()` 外注册，`program is not defined` |
| [BUG-005](BUG-005-state-dir-invisible-no-hints.md) | 2026-07-11 | `_state/` 在 run bundle 中隐形——无 README/注释/面包屑 |
| [BUG-006](BUG-006-env-check-deps-no-parent-walkup.md) | 2026-07-11 | env-check 依赖检测只查 cwd 不向上找（`.env` 却向上找） |
| [BUG-007](BUG-007-state-yaml-no-array-playbook-stack-roundtrip.md) | 2026-07-11 | state.mjs YAML 无数组往返 → playbook_stack 崩 |

**Next available bug ID: BUG-008**

---

## Suspended (未修复，仍在排查)

悬挂 bug 放在 [`../_suspened_bugs/`](../_suspened_bugs/)，尚未确认修复。此处不列。
