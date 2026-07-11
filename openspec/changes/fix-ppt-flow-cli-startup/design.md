## Context

`ppt_flow.mjs` 是 MD Controller 与人类的默认 CLI。BUG-003/004 使入口不可用；失败路径今天是散文-only（`Fatal error` + 大量 `console.error`+`exit(1)`）。宪法要求失败可被编排器消费。本设计钉死 **wire format、code 枚举、覆盖范围、单次 emit、commander 陷阱、子进程包装、测试 fixture**，避免实现时各写各的。

## Goals / Non-Goals

**Goals:**

1. `ppt_flow` 可启动（freeze sort + state 注册）
2. `ppt_flow.mjs` 每一次非零退出 → **恰好一条**可解析 JSON envelope
3. 命令面正式 12（含 `state`），文档/注册表/Purpose 一致
4. Spec + 测试防止回退

**Non-Goals:**

- 不改 `unified_pipeline` / stage1–5 / `env-check` 的失败格式
- 不强制成功路径 JSON（含 `--help`、`state --json` 成功 dump）
- 不改 playbook MD；不改 `state` 的 `runDir → ../../` deckDir 启发式
- 不把 envelope 推广到非 `ppt_flow` 入口（另开 change）

## Decisions

### D1 — 单 change：BUG-003 + BUG-004 + envelope

同一文件、因果链、同一 `cli-surface`。

### D2 — Wire format（解析契约 · 最高优先级）

| 规则 | 约定 |
|------|------|
| 通道 | **stderr** |
| 形态 | **最后一个非空行** = 单行 `JSON.stringify(envelope)`（无 pretty） |
| 解析 | 按 `\n` split → 丢弃尾部空行 → **末个非空行** `JSON.parse` |
| 人话 | 允许 JSON **之前**有 `✗ …`；**禁止** JSON 之后再写任何非空内容 |
| 成功 | `--help` / 成功命令：**不**写 failure envelope |
| stdout | 失败时尽量不写；成功路径不变 |

> 用「最后一个非空行」而不是「物理最后一行」，因为 `console.error` 常带尾换行，split 后末元素为空串。

字段（全部为非空 string，除 `ok` 为 boolean；`stack` 可选）：

```json
{
  "ok": false,
  "code": "USAGE",
  "message": "Unknown style: foo",
  "hint": "Allowed: clean-clinical, corporate-safe, …",
  "where": "ppt_flow.init"
}
```

`where` 格式：`ppt_flow.<command>` 或 `ppt_flow.<command>.<flag>`（如 `ppt_flow.init.style`、`ppt_flow.state.check-gates`）；uncaught 用 `ppt_flow.main`。

`stack`：仅 `UNCAUGHT`，截断 ~2KB。

### D3 — 稳定 `code` 枚举（封闭）

| code | exit（默认） | 何时 |
|------|-------------|------|
| `UNCAUGHT` | 1 | 未预期抛错 / `main().catch` |
| `USAGE` | 1 | 参数非法、未知命令、commander 校验失败、未知 style/kind/resolution |
| `GATE_BLOCKED` | 1 | `state --check-gates` 且 gate 未过（`isGateApproved` 对 content/visual 为 false；approved/waived 算过） |
| `STATE_CORRUPTED` | 2 | `readState` corrupted |
| `FAILED` | 保留子进程码或 1 | 业务失败（init 抛错、status 结构不合格、approve 失败、pilot/build/doctor 返回非零等） |

导出为 `CLI_ERROR_CODES` 常量，禁止魔法字符串散落。新 code 必须另开 change。

### D4 — 覆盖范围 = 所有非零 exit + commander

凡 `ppt_flow.mjs` 将以非零码结束的路径，先满足 D13，再 `process.exit`。

Apply 时用 grep 清零：每个 `process.exit(` 非零路径、每个 `return 1`/`return false` 最终导致非零的路径，都必须能追溯到一次 emit。

### D5 — Helper 可测

`scripts/lib/cli_error.mjs`：

- `CLI_ERROR_CODES` — 上表五码
- `formatCliError({ code, message, hint, where, stack? })` → object；必填空串 / 缺字段 / 非法 code → throw
- `emitCliError(opts)` → `console.error(JSON.stringify(...))`；**不** `process.exit`
- 推荐 `exitCliError(opts, exitCode = 1)` = emit + `process.exit(exitCode)`（call site 一行结束）

### D6 — 命令面 = 12

`doctor`, `init`, `status`, `approve`, `style-master`, `validate`, `pilot`, `build`, `refresh`, `new-version`, `test`, `state`。

`state` 在 `main()` 内、`parseAsync` 前注册。

### D7 — 冻结数组

`[...STYLE_PRESETS].sort()` only。测试禁 `STYLE_PRESETS.(sort|reverse|splice)(`。

### D8 — 宪法 vs 本 change（OpenSpec 边界）

- **主树章程** wire format 收紧 = **apply 任务**（tasks §2.2），规划期不改主树。
- propose/explore **只**改 `openspec/changes/fix-ppt-flow-cli-startup/**`。

### D9 — 修改既有 state CLI 需求

`--check-gates`：OK→0；blocked→1+`GATE_BLOCKED`（hint 点名 pending gate）；corrupted→2+`STATE_CORRUPTED`。成功时仍可人话 / `--json` dump。

### D10 — Commander `exitOverride`

未知命令、缺必参等 CommanderError → catch → `USAGE` → exit 1。

### D11 — 子进程包装

`runNode` / 委托命令返回非零时：

1. `emitCliError({ code: FAILED, message: "<cmd> exited N", hint: "…", where: "ppt_flow.<cmd>" })`
2. `process.exit(N)`（保留子进程码）

**时机**：子进程结束后再 emit，保证 JSON 是 stderr 最后一个非空行（stdio inherit 下子进程日志在前）。

### D12 — 能力边界

- `cli-surface`：wire format、code 枚举、12 命令、freeze、USAGE/UNCAUGHT/FAILED 包装、commander
- `node-specification`：`state` 行为与 gate/corrupt；MD 如何消费 envelope  
  （gate 场景只写在 node-spec，避免双份真相）

### D13 — Exactly-once emit（防双 JSON）

**不变量：一次进程生命周期、一次非零退出 → 恰好一条 failure envelope。**

推荐模式：

| 路径类型 | 做法 |
|----------|------|
| action 内直接判失败（未知 style、缺 flag） | `exitCliError({code:USAGE,…}, 1)` 一次结束 |
| `command*` 已 `emit` 后 `return 1` | caller **只** `process.exit(code)`，**禁止**再 emit |
| `command*` / `runNode` 返回非零且**尚未** emit | caller emit `FAILED`（或已映射的 code）再 exit |
| `main().catch` / commander catch | 唯一 emit `UNCAUGHT` / `USAGE` |

禁止：`commandInit` emit 一次 + action 再包一层 `FAILED`。

### D14 — GATE_BLOCKED 测试 fixture（最小）

`state` CLI 入参是 **runDir**；实现用 `deckDir = join(runDir, '..', '..')`，再 `readState(deckDir)`（文件在 `deckDir/_state/state.yaml`）。缺文件时 `readState` 返回 `createDefaultState()`（content/visual 均为 `pending`）——**不必写 yaml 也能测 blocked**。

最小布局：

```text
<tmp>/deck_x/_runs/r1/     ← 传给 CLI 的 runDir（目录可空）
# 无 _state/ 亦可 → default pending gates
```

断言：`state <tmp>/deck_x/_runs/r1 --check-gates` → exit 1 + 末非空行 `code=GATE_BLOCKED`，`hint` 含 `content` / `visual`。

可选：写 `deck_x/_state/state.yaml` 显式 `gates`，便于测「仅一侧 pending」。`STATE_CORRUPTED` 另用非法 yaml 或空对象（触发 `missing playbook+nodes`）。

### D15 — Soft breaking（编排器）

依赖「stderr 只有散文 / 整段是 JSON」的外部解析会受影响。契约改为 **末非空行 JSON**。本仓库内尚无此类解析器；文档/章程在 apply §2.2 同步。

## Acceptance（apply 完成时必须为真）

1. `node ppt_flow.mjs doctor` 不再抛 freeze / `program is not defined`；若因 env-check 非零退出，末非空行仍为 `FAILED` envelope（D11），不是散文-only
2. `--help` 列出 `state`；`state --help` exit 0 且无 failure envelope
3. `ppt_flow.mjs nosuch` → 非零 + 末非空行 JSON `code=USAGE`
4. `init … --style not-a-preset` → 非零 + 末非空行 JSON `code=USAGE`，hint 含合法 preset
5. D14 fixture 上 `state … --check-gates` → exit 1 + `GATE_BLOCKED`
6. `rg 'STYLE_PRESETS\.(sort|reverse|splice)\(' ppt_flow.mjs` 无匹配
7. 任意抽查的非零路径：stderr 上 **恰好一条**可 parse 的 failure JSON（D13）
8. `npm test` + `npm run test:e2e` 全绿
9. BUG-003/004 已 `git mv` 归档并更新 README 索引

## Risks / Trade-offs

| 风险 | 缓解 |
|------|------|
| agent 整段 parse stderr | D2 末非空行 + 测试 |
| 双 emit | D13 + Acceptance #7 |
| 漏改 exit 点 | grep 清零；Acceptance 抽查 |
| inherit stdio 打乱末行 | D11：子进程返回后再 emit |
| commander 漏网 | D10 exitOverride |
| code 膨胀 | D3 封闭；新码另开 change |
| fixture 过重 | D14 最小 state.yaml |

## Open Questions

_无（全部已在 D1–D15 关闭）。_
