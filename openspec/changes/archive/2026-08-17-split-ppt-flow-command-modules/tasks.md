# Tasks: split-ppt-flow-command-modules

> 排序：seam 授权 → 共享胶水 → 命令模块 → 入口 → 测试 → 验证。每个任务标注 capability 与完成判据。
> 零行为变化：只搬不改、不重新归属；逐字节证据是核心判据。全部使用隔离 fixture，不触碰
> production `deck_*`/`dpt_*`/`_generated/`，不手改 `_generated/`。

## 1. Seam 授权（harness-script-layout）

- [x] 1.1 `harness_architecture.mjs` 的 `PUBLIC_SHARED_INTERFACES` 追加 13 项（`shared/cli/command_support.mjs` + 12 个 `shared/cli/commands/<name>.mjs`，按路径排序）。
  - 完成判据：`harness_architecture` 审计不再因入口 import 命令模块报 `root-private-shared-import`。
- [x] 1.2 `SHARED_PUBLIC_FOUNDATION_METHOD_MODULE_INTERFACE_IMPORTS` 登记 `shared/cli/command_support.mjs`→`{"01-content/index.mjs"}`、`shared/cli/commands/slides.mjs`→`{"01-content/index.mjs","02-visual-system/index.mjs"}`。
  - 完成判据：命令模块 import foundation index 不报 `shared-foundation-method-module-import`；未登记 private foundation 路径仍被拒。
- [x] 1.3 `tests/contracts/source-test-ownership.json` 的 `shared/cli` owner `interfaces` 追加 13 项（有序）。
  - 完成判据：`npm test` 的 ownership/architecture guard 通过（无 `missing-interface-owner`/`ownership-order`）。

## 2. `command_support.mjs` 共享胶水（harness-script-layout）

- [x] 2.1 新建 `shared/cli/command_support.mjs`：机械搬入 §2 列出的共享 emit/exit、binding/resolve、
  `runNode`+`runNode.lastChildResult`、status 面（含 `buildControllerGateContext`，保持 export）、
  provider 面（`resolveImage2Run`/`targetImage2Operations`/`refreshProgressiveControllerTaskProjection`/
  submit factories/transport/错误分类机制/artifact view）、`loadContentApi()`（memoized）。
  - 完成判据：`node --check` 通过；无顶层 01-content 静态 import；`loadContentApi()` 幂等。
- [x] 2.2 路径重派生：`command_support.mjs` 自算 `__dirname`，导出 `HARNESS_DIR` 与 `PPT_FLOW_ENTRY`；
  `emitSourceStateStaleEnvelope` 的 `next.invocation.args` 用 `PPT_FLOW_ENTRY`（字节等价）。
  - 完成判据：`PPT_FLOW_ENTRY` 绝对路径等于 `ppt_maker_harness/scripts/ppt_flow.mjs`；emit 输出与拆分前一致。

## 3. 12 命令模块（harness-script-layout）

- [x] 3.1 `commands/doctor.mjs`（`commandDoctor` + `buildEnvSearchDirs` + `ENV_CHECK` 派生）；`commands/init.mjs`（`commandInit`）。
- [x] 3.2 `commands/status.mjs`（`commandStatus`）；`commands/validate.mjs`（`commandValidate` + `emitSourceValidationFailure` + `emitSourceStateStaleEnvelope`）。
- [x] 3.3 `commands/build.mjs`（`commandBuild` + `commandPageImageBuild`）；`commands/refresh.mjs`（`commandRefresh` + `commandPageImageRefresh`）。
- [x] 3.4 `commands/new-version.mjs`（`commandNewVersion`）；`commands/test.mjs`（`commandTest`）。
- [x] 3.5 `commands/slides.mjs`（`commandSlides` + §2 列出的 slides 私有 helper；import 01-content/02-visual-system）。
- [x] 3.6 `commands/state.mjs`：L3742–3943 内联体提升为 `commandState(runDir, opts)`，保留 mutual-exclusion 校验、`setCliOutputMode` 时序、`process.exitCode=1` 提前 return、exit 2 特例与 JSON/文本投影。
- [x] 3.7 `commands/image2.mjs`（`commandImage2` + `commandTargetPageImageImage2` + 入口参数校验 helper）；`commands/style-master.mjs`（`commandStyleMaster` + 其私有 helper）。
  - 完成判据（3.1–3.7 统一）：每模块 `node --check` 通过；每模块只 `await import()` 其真实依赖，无顶层重模块静态 import；`doctor`/`test` 从 `command_support` import `runNode`，单例不复制。

## 4. 入口重写（cli-surface 行为不变 / pipeline-orchestration owner）

- [x] 4.1 `ppt_flow.mjs` 保留：首条 `cli_bootstrap.mjs?entry=` 副作用 import、路径常量、`bundle_layout`/`production_marker` 静态 import、12 命令 Commander 注册（`.command()`/`.option()`/`.description()` 逐字不变）、`STYLE_PRESETS_SORTED`/`DECK_TYPES_SORTED`、`isMain` 双门 + `main()`、`program.parseAsync` 的 catch（`commander.helpDisplayed` 与 `err.exitCode` 透传不变）。
- [x] 4.2 每个 `.action()` 改为动态 `await import("./shared/cli/commands/<name>.mjs")` 后调用其 handler；`state` action 仅 `await commandState(runDir, opts);`（不加 `process.exit`，保持自然退出）；保留 flag 校验（doctor/slides/state 的 mutual-exclusion 与 usage 分支留在 action 或原样迁入模块，逐字等价）。
  - 完成判据（4.1–4.2）：`node ppt_maker_harness/scripts/ppt_flow.mjs --help` 输出与拆分前逐字节一致；入口 `node --check` 通过；不再有顶层 `await import("./01-content/index.mjs")`。

## 5. 测试 import 修正

- [x] 5.1 `tests/03-framed-image/test_framed_workflow.mjs`、`tests/04-pure-image/test_pure_workflow.mjs` 的 `targetPageImageSubmitFactory` import 源改为 `../../ppt_maker_harness/scripts/shared/cli/command_support.mjs`。
- [x] 5.2 `tests/shared/image2/test_style_master_raw_binding.mjs` 的 `targetPageImageSubmitFactory` 与 `styleMasterSubmitFactory` import 源改为 `../../ppt_maker_harness/scripts/shared/cli/command_support.mjs`。
  - 完成判据：三文件 `node --check` 通过；对应测试跑绿；生产行为零变化。

## 6. 合同同步与验证

- [x] 6.1 `harness-script-layout` delta 已随本 change 提供（`specs/harness-script-layout/spec.md` ADDED requirement + 3 scenarios）；archive 时 main specs 逐字落位。
  - 完成判据：archive 后 main spec 与 delta 一致；`openspec validate --all --strict` 通过。
- [x] 6.2 行为零变化证据：拆分前后对同一 fixture run bundle 跑全部 12 命令（`init` 用新建 deck 根、`slides` 用 list/resolve、`image2` 用 plan/artifact-view 等无提交形态、`style-master` 用 inspect、其余按最小合法参数），stdout/stderr 逐字节一致。
- [x] 6.3 冷启动 smoke：拆分前后 `--help` 耗时同数量级（不回退）。
- [x] 6.4 `npm test` 全绿；审计全绿（`harness_architecture` / `harness_coherence` / `harness_document_command_audit` / `cli_return_audit` / `test_process_docs_consistency`）；`git diff --check` 通过。
- [x] 6.5 `openspec validate split-ppt-flow-command-modules --strict` 通过；无 production 数据触碰（`deck_*`/`dpt_*`/`_generated/` 字节不变，git status 确认）。
