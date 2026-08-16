# Tasks: align-cli-machine-contract

> 排序：结果模型 → renderer → descriptor/help → 退出归一 → inventory → partial effect →
> 动词表 → grammar 审计 → 合同同步 → 验证。每个任务标注 capability 与完成判据。
> 零行为变化优先：文本 handoff 逐字保留，只有退出归一与 JSON report 是新增机器契约。

## 1. 结构化结果模型（cli-surface）

- [x] 1.1 新建 `shared/cli/command_result.mjs`（`COMMAND_RESULT_SCHEMA/VERSION`、`commandResult()`、
  `STATES`、`renderCommandText`、`renderCommandJson`）；manifest `shared/cli` + interface 登记 +
  `harness_architecture.mjs` `PUBLIC_SHARED_INTERFACES` +1。
  - 完成判据：`node --check` 通过；架构审计绿；`npm test` core 通过。
- [x] 1.2 `validate`/`status` 两个命令先迁移到 owner result + 双 renderer（验证 text 逐字保留、
  JSON 单文档）。
  - 完成判据：`test_cli_surface` + 命令测试绿；`--json` stdout 恰好一个注册文档。
- [x] 1.3 其余 mutating 命令（`new-version`/`build`/`refresh`/`image2`/`style-master`/`init`）迁移到
  owner result；`style-master authorize` 成功结果纳入 `controller_handoff` typed evidence。
  - 完成判据：成功/partial/no-op/failure 四态可区分；文本 handoff 逐字不变。

## 2. 退出归一协议（cli-surface）

- [x] 2.1 `commands/test.mjs`：child 数值型 status 进 diagnostic `child_status`（overflow/signal-killed
  归一 1），函数返回 1；保留 `runNode.lastChildResult`。
  - 完成判据：`test` 命令 child 非 0 时 exit 1 且 diagnostic 含 bounded child_status。
- [x] 2.2 入口 `main()` catch：`err.exitCode` 归一（help/version 0；其余 1，数值有界进 diagnostic）。
  - 完成判据：Commander 语法错误 exit 1，不再透传任意 `err.exitCode`。

## 3. descriptor 单一声明源 + help 契约块（cli-surface）

- [x] 3.1 `command_result.mjs` 导出 `COMMAND_CONTRACTS`（12 命令契约：exitCodes/stdout/stderr/decisionEnums；
  `state` 契约含投影重建 note）。
  - 完成判据：契约 command id 与 `PPT_FLOW_COMMAND_INVENTORY` 一致。
- [x] 3.2 入口每命令追加 `.addHelpText("after", renderContractBlock(COMMAND_CONTRACTS.<name>))`。
  - 完成判据：`--help` 尾部含 Machine contract 块；`state` 块含投影重建 note。
- [x] 3.3 `contract` 字段与实现同源；相等性审计（任务 6）替代 contains 断言。
  - 完成判据：改实现不改 contract 时审计红。

## 4. inventory 治理（cli-surface）

- [x] 4.1 `cli-surface/spec.md` Purpose "fixed 12-command" → "closed, audited command inventory"
  （main spec 直接改）。
- [x] 4.2 硬编码断言改：`harness_coherence.mjs:444`、`test_process_docs_consistency.mjs:194`、
  `test_process_command_surface_entry_seams.mjs:88`。
  - 完成判据：随 inventory 更新，三处不再断言固定数字。
- [x] 4.3 自动跟随类验证：`cli_error.mjs:19–32`、`test_process_cli_error.mjs:253/354`。
  - 完成判据：inventory 相等性测试绿。

## 5. partial effect 恢复闭环（cli-surface）

- [x] 5.1 `new-version`：发布 + activation 改 staging/CAS owner 或「已创建未激活」resume/compensation；
  partial-effect 报告分列 version + activation。
  - 完成判据：activation 失败后重跑不撞 "target version already exists"，不需手删目录。
- [x] 5.2 `build`：delivery 成功后 projection 失败 → `partial-effect`（delivery 成功 + projection 失败
  分列），exit 1。
  - 完成判据：partial 报告分列两 effect；不重复 delivery。

## 6. exact-grammar 相等性审计（harness-script-layout）

- [x] 6.1 `command_result.mjs` 增 `validateCommandContracts()`（契约 id=inventory、必填字段、
  动词撞名表 ↔ decisionEnums 相等性审计）+ `VERB_COLLISION_TABLE`；挂进 `test_process_command_surface_entry_seams`。
  - 完成判据：审计绿；planted 违规会红、修复后绿。

## 7. 动词撞名表 H（commands-reference）

- [x] 7.1 `COMMANDS.md` 增共享动词 owner-scoped 说明；`VERB_COLLISION_TABLE` 是注册的撞名表，
  `validateCommandContracts` 读表防漂移（表内 verb 必须出现在对应命令 decisionEnums）。
  - 完成判据：文档撞名未登记时审计红。

## 8. 合同同步与验证

- [x] 8.1 `cli-surface` + `commands-reference` delta 已随本 change 提供；archive 时 main specs 逐字落位。
  - 完成判据：`openspec validate --all --strict` 通过。
- [x] 8.2 `npm test`（core + 审计）、`openspec validate align-cli-machine-contract --strict`、
  `git diff --check` 全绿。
- [x] 8.3 `--help`/`doctor`/`init`/`slides list`/`state --json`/`style-master inspect`/`validate`/
  `image2 plan` 8 命令 stdout/stderr 逐字节一致（文本 handoff 零变化）；JSON mode 单文档验证。
