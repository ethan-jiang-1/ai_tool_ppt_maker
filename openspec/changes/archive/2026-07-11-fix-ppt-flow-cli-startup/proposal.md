## Why

`ppt_flow.mjs` 是 MD Controller / agent 的默认统一入口，但当前不可用：

1. **BUG-003 (P0)**：对冻结的 `STYLE_PRESETS` 原地 `.sort()` → 任意子命令启动即崩；失败只有散文 `Fatal error`。
2. **BUG-004 (P1→修完 003 即阻断)**：`state` 在 `main()` 外注册，引用越界 `program`，从未挂到真正的 `parseAsync`。

同时，仓库虽已有「CLI 失败回执」宪法原则，但 **wire format 未钉死**（仍写「stdout 或 stderr」），且 `ppt_flow` **未实现** envelope——编排器仍无法稳定解析错因。本 change 修复入口崩溃，并把失败回执契约落到可测的 `cli-surface` / `node-specification` 需求与实现。

## What Changes

- 修复 BUG-003：`STYLE_PRESETS` 三处原地 `.sort()` → `[...STYLE_PRESETS].sort()`
- 修复 BUG-004：`state` 移入 `main()`，在 `parseAsync` 之前注册
- **命令面 11 → 12**（含 `state`）：更新 `cli-surface` Purpose/需求、`config.yaml` 注册表文案、`scripts/README`、`ppt_flow` 文件头
- **`ppt_flow` 硬失败 JSON envelope**：非零 exit 时 stderr **最后一个非空行**为单行 JSON；`code ∈ {UNCAUGHT,USAGE,GATE_BLOCKED,STATE_CORRUPTED,FAILED}`；必填字段非空；**一次退出恰好一条** envelope
- commander `exitOverride`：未知命令 / 缺参 → `USAGE`
- 子进程非零：由 `ppt_flow` 包装 `FAILED`（不改子进程自身格式；子进程结束后再 emit）
- **Apply 时收紧章程 wire format**：`CONSTITUTION` / `NODE-SPEC` / `AGENT_CONTRACT` / `config.yaml` 与 design D2 对齐
- 测试：启动、envelope、静态禁原地 sort、`formatCliError` 单测、GATE_BLOCKED 最小 fixture
- 归档 `_backlog` BUG-003 / BUG-004

**Soft breaking（编排器）**：失败 stderr 契约从「散文 / 通道未定」变为「末非空行 JSON」。人读 `✗` 仍可保留在 JSON 之前。

## Capabilities

### New Capabilities

_无。_

### Modified Capabilities

- `cli-surface`: 12 命令；冻结数组不可原地变异；硬失败 envelope（wire format + code 枚举 + commander 映射 + 子进程 FAILED 包装）
- `node-specification`: `state` 须在 `main` 内注册；`--check-gates` / corrupted 失败改为 JSON envelope；CLI⇔MD 失败消费协议

## Impact

| 影响面 | 说明 |
|--------|------|
| `scripts/ppt_flow.mjs` | sort / state 注册 / 非零 exit / exitOverride / 恰好一次 emit |
| `scripts/lib/cli_error.mjs`（新建） | `CLI_ERROR_CODES` + `formatCliError` + `emitCliError` (+ 可选 `exitCliError`) |
| `openspec/specs/cli-surface` / `node-specification` | archive 时 sync（含 Purpose 11→12） |
| `openspec/config.yaml` | `cli-surface` 文案 11→12；铁律 wire 表述与 D2 对齐 |
| `charter/CONSTITUTION.md` / `NODE-SPEC.md` / `AGENT_CONTRACT.md` | apply 时收紧 stderr 末非空行（规划期不改主树） |
| `scripts/README.md` | 命令数 |
| `tests/test_ppt_flow.mjs`、`tests/test_cli_error.mjs` | 回归 + 单测 |
| `_backlog/bugs/BUG-003`/`004` | 归档 |

**Out of scope**：`unified_pipeline` / stages / `env-check` 自身失败格式；成功路径强制 JSON；改变 `state` 的 `runDir→deckDir` 启发式；envelope 推广到其他 CLI 入口。
