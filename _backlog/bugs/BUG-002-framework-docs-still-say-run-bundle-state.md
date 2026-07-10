# BUG-002: 框架方法论文档仍描述旧的单文件 state（`run-bundle-state.yaml`），与代码/spec 漂移

> 严重级别: P1 | 发现: 2026-07-11 | 状态: 活跃

## 症状

代码（`scripts/lib/state.mjs`）和 openspec 主 spec（node-specification / playbook-execution）都已用 `_state/` 目录（`state.yaml` + `history.jsonl`），但框架方法论文档仍写旧的单文件 `run-bundle-state.yaml`，误导读它的 coding agent（`NODE-SPEC.md` 是 Node 宪法，最要命）:

- `charter/NODE-SPEC.md` L47/50/116/149-151：`## State Schema` 段核心定义 + STATE 条件检查表都写 `run-bundle-state.yaml`、"与 project-metadata.yaml 共存"
- `playbook/create-deck.md` L30："写 `run-bundle-state.yaml` 初始状态"
- `COMMANDS.md` L45："State 写入 run-bundle-state.yaml"
- `scripts/lib/state.mjs` L2 头注释："Complete State API for run-bundle-state.yaml"

## 根因

**双真相源**：状态模型同时在两处定义——openspec `node-specification` spec 的 "State file is YAML at run bundle root" 需求 **和** `charter/NODE-SPEC.md` 的 `## State Schema` 段。main-specs-sync 只更新了前者（→ `_state/`），后者没跟上，于是漂移。契约层根因不是"某个文件写错了"，而是**同一模型被复制到两处、缺单一真相源**——只改副本，下次还会再漂。

## 复现

```bash
grep -rn "run-bundle-state" PPTMAKER_FRAMEWORK   # 4 个文件命中
# 对照: scripts/lib/state.mjs 里 STATE_DIR='_state', STATE_FILE='state.yaml', HISTORY_FILE='history.jsonl'
```

## 修复关联

两步（纯 doc/注释同步，非 requirement 变更，故走 `_backlog` 不走 OpenSpec）:

1. **数据修复**: 上述 4 处 `run-bundle-state.yaml` → `_state/state.yaml`（+ 补 `_state/history.jsonl` append-only 提及），删 NODE-SPEC.md "与 project-metadata.yaml 共存" 旧措辞。
2. **根因修复（防复发）**: 消除双真相源——让 `NODE-SPEC.md` 的 `## State Schema` 段**指向** openspec `node-specification` spec（而不是各存一份副本）。此步偏结构重构，可另立 plan。

注: 曾一度立成 OpenSpec change `sync-framework-docs-state`，但文档漂移是 correctness 缺陷、非 requirement 变更，按两层簿记规矩归入本 bug；该 change 已解散。
