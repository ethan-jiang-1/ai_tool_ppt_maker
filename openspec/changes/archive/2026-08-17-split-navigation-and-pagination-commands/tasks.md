# Tasks: split-navigation-and-pagination-commands

> 排序：inventory/契约 → `artifacts` → `paginate` → `slides` 收窄 → 入口 → 测试 → 同步 → 验证。
> 每个任务标注 capability 与完成判据。clean-break 边界与 tombstone 三分验收见 `05` §E/§F。

## 1. inventory 与契约（cli-surface）

- [x] 1.1 `cli_error.mjs` `PPT_FLOW_COMMAND_INVENTORY` +2（`artifacts`, `paginate`，有序）。
- [x] 1.2 `command_result.mjs` `COMMAND_CONTRACTS` +2（artifacts/paginate）；`image2` decisionEnums 移除
  `artifact-view`；`slides` decisionEnums 移除 `narrative-plan`。
  - 完成判据：`validateCommandContracts` 绿（inventory 相等性自动跟随）。

## 2. `artifacts`（image-generation）

- [x] 2.1 新 `commands/artifacts.mjs`：`commandArtifacts(runDir)` 薄路由 `rebuildTargetPageImageArtifactView`
  + `commandReport`。
- [x] 2.2 `commands/image2.mjs` 移除 `artifact-view` 分支；`command_support.mjs` `PAGE_IMAGE_OPERATIONS`
  移除 `artifact-view`。
  - 完成判据：`image2 artifact-view` → 精确 `artifacts` 替代诊断；`artifacts <run-dir>` 输出与旧
    artifact-view 一致（除 operation 字段）。

## 3. `paginate`（narrative-authoring）

- [x] 3.1 新 `commands/paginate.mjs`：`commandPaginate(subcommand, runDir, opts)`——`plan` 路由
  `previewNarrativePagePlan`，`apply` 路由 `applyNarrativePagePlan`；`narrativeVisualSystem()` 迁入。
- [x] 3.2 `commands/slides.mjs` 移除 `narrative-plan` subcommand；`apply-plan` 的 narrative 分支（L316–326）
  移除。
  - 完成判据：`paginate plan/apply` 与原 `slides narrative-plan`/narrative `apply-plan` 输出一致。

## 4. `slides apply-plan` 收窄 + 拒绝（cli-surface）

- [x] 4.1 `apply-plan` 保留 structural replay；L316 处收 narrative schema → `emitCliError` 精确
  `paginate apply` invocation（在 binding + confined classification 之后、mutation 之前）。
- [x] 4.2 malformed/unknown schema fail closed（不默认为 structural）。
- [x] 4.3 tombstone `slides narrative-plan`（`harness_architecture` 退役词 guard 注册）；`apply-plan`
  不 tombstone。
  - 完成判据：runtime 负例 + planted guard sensitivity（`05` §E 三分验收）。

## 5. 入口注册（cli-surface）

- [x] 5.1 `ppt_flow.mjs` 注册 `artifacts` + `paginate`（argument/option/契约块）。
  - 完成判据：`--help` 列出 14 命令；`artifacts --help`/`paginate --help` 含 Machine contract 块。

## 6. 测试与文档同步

- [x] 6.1 `test_target_structural_cli`（保留 structural 回放 + narrative 路由到 paginate）、
  `test_narrative_page_plan_cli`/`test_narrative_page_plan`、`test_mock_narrative_authoring_journey`、
  `test_human_artifact_reference_cli`（`artifacts` 30 处）、`test_process_command_surface_entry_seams`/
  `test_process_cli_error`（inventory +2）。
- [x] 6.2 文档：`COMMANDS.md`、`create-deck.md` 3 处、`03-specify-structured-slides.md` 3 处、
  `AGENT_CONTRACT.md` 1 处。

## 7. 合同同步与验证

- [x] 7.1 `cli-surface`/`narrative-authoring`/`image-generation` delta 随本 change 提供；archive 同步。
- [x] 7.2 `npm test`、`openspec validate split-navigation-and-pagination-commands --strict`、
  `--all --strict`、`git diff --check` 全绿。
- [x] 7.3 clean-break 证据：旧形态 active consumer 计数归零；runtime 负例保留；无生产数据触碰。
