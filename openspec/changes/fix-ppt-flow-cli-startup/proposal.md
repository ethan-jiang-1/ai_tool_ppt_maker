## Why

`ppt_flow.mjs` 是框架唯一统一入口（MD Controller / agent 默认 CLI），但当前两条入口缺陷把它打成死门：

1. **BUG-003 (P0)**：对 `Object.freeze(STYLE_PRESETS)` 原地 `.sort()` → 任意子命令（含裸跑）启动即崩；`main().catch` 只打印 `err.message`，无结构化回执。
2. **BUG-004 (P1→修完 003 即阻断)**：`state` 在 `main()` 外注册，引用越界的局部 `program`；从未挂到真正 `parseAsync` 的 `Command` 上。

更深一层：这暴露了**宪法级空洞**——硬失败只有 exit code + 散文，编排器无法按稳定 `code` 分支修复。宪法条文已写入 `charter/CONSTITUTION.md` / `openspec/config.yaml` / `NODE-SPEC` / `AGENT_CONTRACT`；本 change **把契约落到 `ppt_flow` 实现**，并钉死可解析的 wire format。

## What Changes

- 修复 BUG-003：三处 `STYLE_PRESETS.sort()` → `[...STYLE_PRESETS].sort()`
- 修复 BUG-004：`state` 移入 `main()`，`parseAsync` 之前注册
- **命令面 11 → 12**：正式包含 `state`；同步 `cli-surface` spec、`config.yaml` 注册表文案、`scripts/README`、文件头注释
- **`ppt_flow` 硬失败 JSON envelope**：凡 `ppt_flow.mjs` 内非零退出，stderr **最后一行**为单行 JSON（`ok`/`code`/`message`/`hint`/`where`）；禁止仅散文 `Fatal error`
- 收紧宪法 wire format 表述（stderr 末行单行 JSON），与实现一致
- 回归：启动不再 freeze；`state --help`；未知 `--style` / `--check-gates` blocked / uncaught 均可 `JSON.parse` 末行
- 修完后 `git mv` BUG-003/004 → `_done/_fixed_bugs/` 并更新 README 索引

## Capabilities

### New Capabilities

_无。_

### Modified Capabilities

- `cli-surface`: 12 命令；冻结数组不可原地变异；硬失败 JSON envelope（wire format）
- `node-specification`: `state --check-gates` / 损坏 state 的失败路径改为 JSON envelope（修改既有 state CLI 需求）

## Impact

| 影响面 | 说明 |
|--------|------|
| `scripts/ppt_flow.mjs` | sort / state 注册 / 全部非零 exit 走 envelope |
| `scripts/lib/cli_error.mjs`（新建） | `formatCliError` + `emitCliError`（可测） |
| `openspec/specs/cli-surface` / `node-specification` | archive 时 sync |
| `openspec/config.yaml` | `cli-surface` 文案 11→12 |
| `charter/CONSTITUTION.md` | wire format 收紧（stderr 末行） |
| `scripts/README.md`、`ppt_flow` 文件头 | 命令数 |
| `tests/test_ppt_flow.mjs` | 启动 + envelope + 静态禁 `STYLE_PRESETS.sort(` |
| `_backlog/bugs/BUG-003`/`004` | 归档 |

**Out of scope（显式）**：`unified_pipeline.mjs` / 各 stage 脚本的失败 envelope（宪法原则已立，横切 follow-up）；成功路径强制 JSON。
