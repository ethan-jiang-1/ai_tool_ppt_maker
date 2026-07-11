## Context

`ppt_flow.mjs` 是 MD Controller 与人类的默认 CLI。BUG-003/004 使入口不可用；失败路径今天是：

```js
main().catch((err) => {
  console.error(`✗ Fatal error: ${err.message}`);
  process.exit(1);
});
```

另有大量 `console.error("✗ …"); process.exit(1)`（init 校验、refresh 参数、state gates 等）——全部是散文。宪法要求失败可被编排器消费；本设计把 **wire format + 覆盖范围 + 命令面** 钉死，避免实现时各写各的。

## Goals / Non-Goals

**Goals:**

1. `ppt_flow` 任意子命令可启动（修 freeze sort + state 注册）
2. `ppt_flow.mjs` 内**每一次非零退出**都带可解析 JSON envelope
3. 命令面正式 12 个（含 `state`），文档/注册表一致
4. Spec + 测试防止回退

**Non-Goals:**

- 不改 `unified_pipeline` / stage1–5 / `env-check` 的失败格式（follow-up；`env-check --json` 已有成功先例）
- 不强制成功路径 JSON（`state --json`、人话 status 保持）
- 不改 playbook MD 正文

## Decisions

### D1 — 单 change：BUG-003 + BUG-004 + envelope

同一文件、因果链、同一 `cli-surface`。拆开会留下「修了 sort 仍 ReferenceError」的半残入口。

### D2 — Wire format（解析契约 · 最高优先级）

| 规则 | 约定 |
|------|------|
| 通道 | **stderr** |
| 形态 | **最后一行**为 **单行** `JSON.stringify(envelope)`（无 pretty 换行） |
| 解析 | MD Controller：按行 split → 从末行 `JSON.parse`；**不**要求整段 stderr 是 JSON |
| 人话 | 允许 stderr 前面有 `✗ …` 行；**禁止** JSON 之后再追加日志 |
| stdout | 失败时尽量不写；成功路径不受影响 |

字段（稳定、可扩展）：

```json
{
  "ok": false,
  "code": "USAGE",
  "message": "Unknown style: foo",
  "hint": "Allowed: clean-clinical, corporate-safe, …",
  "where": "ppt_flow.mjs#init"
}
```

可选扩展：`stack`（仅 `code=UNCAUGHT` 时附带，截断到 ~2KB）。

### D3 — 稳定 `code` 枚举（本 change 只用这些）

| code | 何时 |
|------|------|
| `UNCAUGHT` | `main().catch` / 未预期抛错 |
| `USAGE` | 参数/枚举非法（未知 style、未知 kind、resolution 非法等） |
| `GATE_BLOCKED` | `state --check-gates` 未过 |
| `STATE_CORRUPTED` | `readState` 返回 corrupted |
| `FAILED` | 业务失败（init 抛错、pilot/build 返回非零等）——有更具体码前的兜底 |

**不要**把 `FROZEN_ARRAY_MUTATION` 当运行时 code：修完后不应再出现；用测试静态禁止原地 `.sort` 代替。

### D4 — 覆盖范围 = `ppt_flow.mjs` 内所有非零 exit

本 change **不做「只改 catch」的半吊子**。凡 `ppt_flow.mjs` 里 `process.exit(code)` 且 `code !== 0`（含 action 内校验、command* 返回后 exit、state 分支），一律先 `emitCliError(...)` 再 exit。

子进程失败（doctor→env-check、build→unified_pipeline）：`ppt_flow` 用 `FAILED` + message 包装子进程非零；**不**要求子进程本身已输出 envelope（Non-Goal）。

### D5 — Helper 可测

新建 `scripts/lib/cli_error.mjs`：

- `formatCliError({ code, message, hint, where, stack? })` → envelope object
- `emitCliError(opts)` → 写 stderr 末行 JSON，**不**调用 `process.exit`（由调用方 exit，便于单测）

### D6 — 命令面 = 12

`doctor`, `init`, `status`, `approve`, `style-master`, `validate`, `pilot`, `build`, `refresh`, `new-version`, `test`, `state`。

`state` 必须在 `main()` 内、与其它命令同一 `program`、`parseAsync` 之前注册。

### D7 — 冻结数组

三处（及今后）一律 `[...STYLE_PRESETS].sort()`。测试用源码扫描：`ppt_flow.mjs` 不得出现 `STYLE_PRESETS.sort(` / `.reverse(` / `.splice(`。

### D8 — 宪法 vs 本 change

- **宪法**：所有 agent-facing CLI 最终遵守同一 envelope 原则 + wire format。
- **本 change**：只强制 `ppt_flow.mjs`；并收紧 `CONSTITUTION.md` 的 wire 表述（stderr 末行），避免「stdout 或 stderr」导致实现漂移。

### D9 — 与既有 `node-specification` 的关系

主 spec 已有「`state --check-gates` exit 0/1 + message」。本 change **修改**该需求：blocked / corrupted 时 message 升级为 JSON envelope（`GATE_BLOCKED` / `STATE_CORRUPTED`），exit 码保持 1 / 2。

## Risks / Trade-offs

| 风险 | 缓解 |
|------|------|
| stderr 前有人话，agent 整段 parse 失败 | D2：只 parse **末行**；测试锁定 |
| 漏改某个 `process.exit(1)` | 任务要求 grep 清零散文-only 退出；测试抽查 USAGE + GATE |
| 子进程仍散文 | D4 明确；follow-up 横切 |
| code 枚举膨胀 | D3 封闭本 change 集合 |
| helper 直接 exit 难测 | D5：emit 与 exit 分离 |
