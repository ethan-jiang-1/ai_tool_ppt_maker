# Change 1: align-cli-machine-contract（结果模型 + 机器契约 + inventory 治理）

> 阶段见 `progress.md`。吸收评审 `07` 第 3/4/5 条: C1 不是「补 --json flag」,是三类基础改造。

## 范围

### 1.1 结构化结果模型（评审第 4 条）

实测现状: `commandValidate`（`ppt_flow.mjs:880`）成功仅 `console.log("✓ ... receipt validated: N slide(s)")`
+ return 0;`commandNewVersion`（`:1071`）是 compound mutation（`createVersion` →
`activateCleanPageImageTargetDraft`）,后半段失败时已创建的版本无法声明（部分效果被报成普通失败）。

目标:

1. command 实现返回结构化 owner result;text/JSON 是两个 renderer,**renderer 不拥有业务事实**;
2. JSON success report 有 schema/version、必填字段、effect / partial-effect 表达;
3. JSON mode 的 stdout 恰好一个注册文档;non-zero 时 stdout report 与 stderr final envelope
   的关系写进 spec;
4. mutating 命令（尤其 `new-version`/`build`）的成功、partial effect、no-op、失败四态可区分。

### 1.2 help / exit / JSON 单一声明源（评审第 3 条）

exit matrix 事实表（已代码复核）:

| code | 含义 | 证据 |
| --- | --- | --- |
| 0 | 成功 | — |
| 1 | JS-controlled failure（含 `state --validate-state` invalid） | `ppt_flow.mjs:3824` |
| 2 | 普通 `state` 的 replacement/current-repair hard-stop 特例 | `ppt_flow.mjs:3861` |
| 130 / 143 | SIGINT / SIGTERM | `cli_bootstrap.mjs:178` |

- 每命令 `--help` 尾部机器契约块（exit codes、stdout/stderr 契约、digest 字段名、decision 枚举）;
- **相等性审计**替代 contains 断言: 契约块与实现同源（单一声明）,不能只证明「文案存在」。

### 1.3 variable closed inventory 治理（评审第 5 条,从原 C2 前移）

- `cli-surface/spec.md:5` "fixed 12-command" → "closed, audited command inventory";
- 同步改四个守护点: `harness_coherence.mjs:444`（/12-command/i）、
  `tests/contracts/test_process_docs_consistency.mjs:194`、
  `tests/contracts/test_process_command_surface_entry_seams.mjs`、
  `cli_error.mjs` 的 `PPT_FLOW_COMMAND_INVENTORY`;
- **admission rule**（新增命令必须声明）: owner、单一职责、完整 grammar、输出模式、
  effect class、测试归属、与既有命令不重叠的理由;删除命令必须关闭 runtime entry、consumer、
  residue guard。仅删掉固定数字不足以控制表面净增长。

### 1.4 保留 findings 的 G / H

- G = 1.2 的机器契约块;H = 动词撞名决策表,挂进 `harness_document_command_audit` 防漂移。

## 同步面

- 代码: `ppt_flow.mjs`（结果模型 + help）、`cli_error.mjs`（report schema 注册 + inventory）、
  `cli_return_audit.mjs`、`harness_coherence.mjs`、`harness_document_command_audit.mjs`
- 测试: `test_process_command_surface_entry_seams.mjs`、`test_process_docs_consistency.mjs`、
  `test_cli_surface.mjs`、`test_process_cli_error.mjs` + 4 组命令测试 + 1 个契约防漂移测试
- spec: `cli-surface/spec.md`、`commands-reference/spec.md`
- 文档: `COMMANDS.md`（H 决策表）
- 完整清单照 `05-sync-surface-master-checklist.md`

## 完成判据

1. 结构化结果模型落地,text/JSON 双 renderer 由测试证明同源（同一 owner result）;
2. exit matrix 事实表进 spec,且与实现相等性审计绿;
3. inventory 治理落地,admission rule 可判定;
4. `npm test` + `openspec validate align-cli-machine-contract --strict` 全绿。
