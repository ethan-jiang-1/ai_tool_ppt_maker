# Proposal: split-ppt-flow-command-modules

## Why

`ppt_maker_harness/scripts/ppt_flow.mjs` 是 4035 行的统一 CLI 入口，把 12 个命令的注册/分派、
命令体、跨命令共享胶水（emit 封装、`runNode` 单例、错误码分类表、submit factories、provider
transport 机制）全部堆在同一个文件里。这让后续「机器契约可审计」改造（C1
`align-cli-machine-contract`）没有结构载体：C1 需要每个命令模块导出自己的注册 descriptor 作为
declaration authority（见 `_backlog/plans/cli-command-surface-reduction/01` §1.8），而 descriptor
只能落在按命令拆分的模块上。先做一次**零行为变化的纯拆分**，把「拆文件」和「改行为」解耦，
是风险最低的第一步。

这是 findings-I 选项 B「库 seam + 薄 CLI」的**文件级前奏**：只拆文件、不动 seam 位置、不改测试
哲学、不搬 secret 边界；完整选项 B 留作独立 plan（见
`_backlog/plans/cli-command-surface-reduction/06` 延后清单）。

## What Changes

- **入口瘦身**：`ppt_flow.mjs` 只保留入口、`cli_bootstrap.mjs` 副作用安装（`:20`，必须保持首条）、
  路径常量、`bundle_layout`/`production_marker` 顶层 import、冷启动快路径（`:78–82` 的
  `--help`/`doctor` 跳过 `01-content` 全量 import）、12 个命令的 Commander 注册、懒加载分派
  （动态 `await import()`）、`isMain` 双门与 `main()`。4035 行 → 估计 200–300 行入口。
- **新增 `shared/cli/command_support.mjs`**：跨命令共享胶水的机械搬家——`emitFailed`/`emitUsage`/
  `exitUsage`/`exitWithCode`/`emitCurrentProtocolError`/`emitExecutionRunVersionMismatch`/
  `emitUnsupportedHarnessBinding`/`createGateDiagnostic`、`resolveRunHarnessBinding`/
  `resolveRunAdapter`/`resolveTargetAuthoringDraftAdapter`/`preflightAdapterSource`/
  `hasExplicitCliOption`、`runNode` + `runNode.lastChildResult` 模块级单例、`metadataFields`/
  `updateGate`/`collectStatus`/`enrichStatusWithState`/`printStatus`/`buildControllerGateContext`、
  submit factories（`targetPageImageSubmitFactory`/`styleMasterSubmitFactory`）及其依赖的 provider
  响应解析/错误码分类/决策树机制、`refreshProgressiveControllerTaskProjection`、Image2 运行时
  解析与 transport 初始化。**不重新归属、不修 owner 渗漏**（留给 C1 之后）。
- **新增 `shared/cli/commands/` 12 个命令模块**，文件名与命令名一致（kebab）：`doctor` `init`
  `status` `validate` `build` `refresh` `slides` `new-version` `test` `state` `image2`
  `style-master`。每个模块导出其 handler（`state` 的 `.action()` 内联体先无损提升为具名函数
  `commandState` 再搬，行为不变）。
- **3 个测试 import 修正（仅测试面，生产行为不变）**：`targetPageImageSubmitFactory` 与
  `styleMasterSubmitFactory` 从 `ppt_flow.mjs` 改指向 `shared/cli/command_support.mjs`——
  `tests/03-framed-image/test_framed_workflow.mjs:89`、
  `tests/04-pure-image/test_pure_workflow.mjs:89`、
  `tests/shared/image2/test_style_master_raw_binding.mjs:16–17`。
- **`harness-script-layout` seam 登记**：把 `commands/` 目录与 `command_support.mjs` 登记为
  architecture guard 承认的公共接口，并声明命令模块对 foundation method-module `index.mjs` 的
  import 许可；否则架构审计红（见 Impact）。
- 无新命令、无删命令、无 flag/grammar/exit code/stdout/stderr/diagnostic schema 变化；
  `PPT_FLOW_COMMAND_INVENTORY` 与 `cli-surface`/`commands-reference` 的 fixed forms 逐字不变。
  无 **BREAKING**。

## Capabilities

### New Capabilities

无。命令模块与 `command_support.mjs` 是 `harness-script-layout` 管辖的脚本 seam（manifest 注册为
`shared/cli` 接口），不新增长期责任 capability。

### Modified Capabilities

- `harness-script-layout`：ADDED requirement——CLI 命令模块 seam 是注册的公共 shared interface；
  `shared/cli/commands/*.mjs` 与 `shared/cli/command_support.mjs` 由 architecture guard 承认，入口
  `ppt_flow.mjs` 与其它 shared 模块可 import；命令模块对 `00-setup`/`01-content`/
  `02-visual-system` 的 foundation method-module `index.mjs` import 是声明的许可边界；未声明的
  本地 import 或缺失目标仍被 guard 拒绝。

## Impact

- **Harness 源码**：新增 `ppt_maker_harness/scripts/shared/cli/command_support.mjs` +
  `ppt_maker_harness/scripts/shared/cli/commands/{12}.mjs`；重写 `ppt_maker_harness/scripts/
  ppt_flow.mjs`（4035 行 → 入口）；`ppt_maker_harness/scripts/contracts/harness_architecture.mjs`
  （`PUBLIC_SHARED_INTERFACES` + `SHARED_PUBLIC_FOUNDATION_METHOD_MODULE_INTERFACE_IMPORTS`
  seam admission）；`tests/contracts/source-test-ownership.json`（`shared/cli` owner 增加 13 个
  interface 登记，保持有序）。
- **OpenSpec**：`harness-script-layout/spec.md` MODIFIED（1 个 ADDED requirement + scenario）。
- **测试**：仅上述 3 个 import 修正；其余 spawn 测试零改动、零新增（零行为变化由同 fixture
  逐字节一致验收，不需要新测试资产）。
- **Control owner**：JS——CLI 解析/校验/诊断/分派仍归 JS；本 change 只改脚本布局，不改
  MD⇔JS protocol，不引入第二 playbook/controller/readiness authority。
- **Run-bundle contract impact**：`none`。不触碰 `deck_*`/`dpt_*`/`_generated/`/state/receipt
  字节，无 migration、无新命令/flag。
- **Policy 引用**：
  - `human-centered-gates.md`：本 change 不新增/修改 gate、readiness、validation、diagnostic 或
    override 的语义——所有 emit/exit 路径机械搬家、逐字保留，无新增 guide/confirm/hard-stop，
    无 force/waive。硬失败仍由 `cli_bootstrap.mjs` 安装的 envelope 纪律兜底（入口首条 import 保持）。
  - `agent-assistance-and-control.md`：direct control path 不增不减——command body 的 authority、
    evaluator、writer/reader 关系原样搬家，不建立第二 controller/authority。
  - `simple-reliable-control.md`：本 change 不新增 blocking rule/state/validator/retry/fallback/
    recovery；净效果是**纯结构简化**（单文件职责收敛为入口 + 命令模块），无新增控制面。
