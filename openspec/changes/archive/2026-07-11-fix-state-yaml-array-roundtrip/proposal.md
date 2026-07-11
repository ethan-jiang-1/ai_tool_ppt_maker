## Why

两件事叠在一起：

1. **BUG-007**：手写 YAML 不支持数组往返 → `playbook_stack` 空栈读成 `{}` → `switchPlaybook` / `resumePlaybook` 崩。
2. **Agentic 双轨缺口**：MD（聪明、糊糊实实）会写出差一点的 YAML；JS（精准）今天多半抱怨或 `{corrupted:true}`。小白不会修格式——**原则进宪法**；JS **读容错、写洗净**；MD 先 heal 再继续。

## What Changes

**宪法 / 项目级**

- `CONSTITUTION.md`：新增「MD↔JS 互补健壮性」（紧接 CLI 失败回执）
- `AGENT_CONTRACT` §7：一句 heal-first（**不**扩成第 12 条铁律）
- `NODE-SPEC` SAFETY：默认 heal；与 `corrupted` 诊断模式对齐

**实现（BUG-007 + 读写闭环）**

- 依赖 `yaml`：`parseDocument` 容错读 + `stringify` 规范写
- `healState`；脏则回写洗净压模；不可解 → `.broken.<ts>` + seed
- `ppt_flow state` 走默认 heal → 小白路径几乎不再 `STATE_CORRUPTED`
- 单测 + 归档 BUG-007

**非 BREAKING**：修好 false failure；`heal:false` 仍可暴露 corruption 供诊断。

## Capabilities

### New Capabilities

_无。_

### Modified Capabilities

- `framework-charter`：CONSTITUTION 互补健壮性；CONTRACT heal-first 句
- `node-specification`：stack round-trip；默认 heal；`yaml` 库；`STATE_CORRUPTED` 仅严格/不可用态

## Impact

| 影响面 | 说明 |
|--------|------|
| `charter/CONSTITUTION.md` | 新条款 |
| `charter/AGENT_CONTRACT.md` §7 / `NODE-SPEC.md` | MD 句 + SAFETY |
| `package.json` | `yaml` |
| `scripts/lib/state.mjs` | 库 + heal + 回写 |
| `ppt_flow` `state` | 默认 heal |
| `tests/` | round-trip / heal |
| BUG-007 | → `_done/_fixed_bugs/` |

**Out of scope**：全仓每个 YAML/JSON 上 repair；`history.jsonl` 自动恢复真相源；冷门 `yamlrepair` 包。本 change 以 `_state/state.yaml` 为样板。
