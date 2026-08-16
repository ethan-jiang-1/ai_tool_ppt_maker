# Design: align-cli-machine-contract

## 决策概览

| 决策 | 结论 | 拥有侧 |
|---|---|---|
| 结果模型载体 | 新增 `shared/cli/command_result.mjs`（独立 public interface，不塞进 `command_support.mjs` 或 `cli_error.mjs`）——owner result 拥有业务 effect | JS |
| 结果形状 | `{ schema: "pptmaker-command-result", version: 1, operation, state, effect, partial }`；`state ∈ success\|partial-effect\|no-op\|failure`；`partial` 分列两个 effect（delivery/projection） | JS |
| 双 renderer | `renderCommandText(result)` / `renderCommandJson(result)` 消费同一 result，不拥有事实；JSON 经 `registerCliJsonReport` + 单文档 stdout | JS |
| 退出归一 | 采纳推荐项：JS-controlled failure → 1；signal 130/143 保留；`test` child 数值型 status 有界保留进 diagnostic（不当地 exit code）；Commander `err.exitCode` 归一为 1（保留现状非 0 透传改为有界） | JS |
| 单一声明源 | 每命令模块导出 `descriptor`（`name/description/arguments/options/helpText/contract`）；entry 从 descriptor 注册 Commander + `.addHelpText("after", contractBlock)`；`contract` = { exitCodes, stdout, stderr, digestFields, decisionEnums } | JS |
| 相等性审计 | 新增 exact-grammar audit（`05` §E.3）：descriptor 的 grammar/contract 与 Commander 注册、实现逐项相等；替代 contains 断言 | JS |
| inventory 治理 | `cli-surface` Purpose "fixed 12-command"→"closed, audited command inventory"；5 守卫点两类改法（硬编码改断言 / 自动跟随验证）；admission rule 进 spec | JS |
| authority map | descriptor 拥有 grammar+effect class；owner result 拥有业务 effect；`cli-surface` 拥有公开规范；help/inventory/JSON 校验/docs audit 是 projection；`cli_error.mjs` 只拥有 envelope/safe report/bounded validation | JS |
| partial effect 恢复 | `new-version`：发布 + activation 改成可识别「已创建未激活」的 resume/compensation（不手删目录）；`build`：interim 契约 = delivery 成功 + projection 失败 → exit 1 + partial-effect 报告 | JS |
| 动词撞名表 H | `COMMANDS.md` 增 H 决策表；`harness_document_command_audit` 读表防漂移 | JS |

## 1. 结构化结果模型

新增 `ppt_maker_harness/scripts/shared/cli/command_result.mjs`（注册 public interface，
manifest `shared/cli`）：

```js
export const COMMAND_RESULT_SCHEMA = "pptmaker-command-result";
export const COMMAND_RESULT_VERSION = 1;
export function commandResult({ operation, state, effect = null, partial = null, facts = {} }) {
  return Object.freeze({ schema, version: 1, operation, state, effect, partial, facts });
}
export const STATES = Object.freeze(["success", "partial-effect", "no-op", "failure"]);
export function renderCommandText(result) { /* 人类 handoff 意图不变 */ }
export function renderCommandJson(result) { /* JSON.stringify(result) 前经 registerCliJsonReport */ }
```

- 现有 `command*` 成功路径把 `console.log("✓ …")` + `return 0` 改为
  `const r = commandResult({…}); console.log(renderCommandText(r)); return 0;`；JSON mode 走
  `renderCommandJson(r)`。文本逐字保留现有 human handoff（零行为变化）。
- `new-version`/`build` 的 partial path 用 `state: "partial-effect"` + `partial: { delivery, projection }`
  分列两个 effect（门槛 3 冻结契约）。
- `style-master authorize` 成功结果纳入 `controller_handoff` typed evidence（
  `recordStyleMasterAuthorizeCliHandoff`），不回归散文。

## 2. 退出归一协议

- `commandTest`（`commands/test.mjs`）：child `status` 数值型写入 diagnostic facts（`child_status`），
  overflow/signal-killed 归一为 1，函数返回 1（非透传）。保留 `runNode.lastChildResult` 语义。
- 入口 `main()` catch：`commander.helpDisplayed/versionDisplayed` 仍 exit 0；其余 JS-controlled 一律
  exit 1；`err.exitCode` 若为数值且非 0，作为有界事实进 diagnostic（`child_status`/`exit_code`），
  不再作为进程 exit code 透传。
- `cli_bootstrap.mjs` 的 SIGINT/SIGTERM → 130/143 不动。

## 3. descriptor 单一声明源 + help 契约块

每命令模块导出 `descriptor`（示例 `validate.mjs`）：

```js
export const descriptor = {
  name: "validate",
  description: "Validate slide specs before image generation",
  arguments: [{ name: "run_dir", required: true, desc: "Path to version dir" }],
  options: [],
  contract: {
    exitCodes: { 0: "success", 1: "JS-controlled failure" },
    stdout: "text success line",
    stderr: "secret-safe envelope on last non-empty line",
    digestFields: [],
    decisionEnums: [],
  },
};
```

入口注册循环 `for (const d of descriptors) program.command(d.name)…` 改为消费 descriptor（机械转换
`.argument()/.option()/.description()/.addHelpText("after", contractBlock)`）。`contractBlock` 从
`contract` 字段生成（帮助逐字包含 exit codes/stdout/stderr/digests/enums）。`state` 的 contract 写
投影重建行为（v5 α 兜底）。

## 4. inventory 治理 + 5 守卫点

- `cli-surface/spec.md` Purpose 改 "closed, audited command inventory"（main spec 直接改，非 delta）。
- 硬编码类改断言：`harness_coherence.mjs:444`（/12-command/i）、
  `tests/contracts/test_process_docs_consistency.mjs:194`、
  `tests/contracts/test_process_command_surface_entry_seams.mjs:88`。
- 自动跟随类验证：`cli_error.mjs:19–32`（inventory 常量）、
  `tests/shared/cli/test_process_cli_error.mjs:253/354`。
- admission rule 进 spec（`cli-surface` ADDED）。

## 5. exact-grammar 相等性审计（`05` §E.3）

新增 `contracts/exact_command_grammar_audit.mjs`：读每命令 descriptor，与入口 Commander 注册、
`--help` 输出、实现 return-case（`cli_return_audit`）逐项相等；证明完整 invocation、参数位置、
operation 组合有效。挂进 `run_development_verification.mjs`（core tier）。

## 6. partial effect 恢复闭环

- `new-version`：发布 + activation 改成一个 staging/CAS owner，或严格识别「本次已创建但未激活
  target」的 resume/compensation（`state: partial-effect` + `partial: { version, activation }`）；重跑不撞
  "target version already exists"，不要求手删目录。
- `build`：delivery 成功后 projection 失败 → `partial-effect`（delivery 成功 + projection 失败分列），
  exit 1；最近合法动作 = 修投影失败根因后重跑（不重复 delivery）。

## 7. declaration authority map（不新增第二 registry）

- descriptor（各命令模块）→ accepted grammar + effect class；
- command owner result → 业务 effect；
- `cli-surface` → 公开规范；
- help/inventory/JSON 校验/docs audit → descriptor/spec 的可验证 projection；
- `cli_error.mjs` → 只 envelope + safe report + bounded validation（不膨胀成 registry）。

## 8. 验证策略

- **unit**：`command_result.mjs`（4 态 + 双 renderer 同源）、exact-grammar 审计（相等性 + planted
  drift 负例）。
- **integration**：4 组命令测试改断言结构化结果；`test` 退出归一（child status 进 diagnostic）；
  `new-version` partial-effect resume 负例；`build` partial-effect 分列。
- **e2e/mock**：`test_cli_surface`、`test_process_cli_error`（inventory 相等性）、docs 一致性。
- **回归**：`npm test`（core + 审计）、`openspec validate --strict` + `--all --strict`、`git diff --check`。
