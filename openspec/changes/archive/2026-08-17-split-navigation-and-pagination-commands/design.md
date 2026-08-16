# Design: split-navigation-and-pagination-commands

## 决策概览

| 决策 | 结论 | 拥有侧 |
|---|---|---|
| S1 命名 | `artifacts <run-dir>`（裸名，不叫 rebuild；help 契约块说明「只重建 Human Navigation Path」） | JS |
| S1 实现 | 新 `commands/artifacts.mjs` 薄路由 `rebuildTargetPageImageArtifactView`；`image2` 移除 artifact-view operation | JS |
| S2 命名 | `paginate plan <run-dir> --candidate <path>` / `paginate apply <run-dir> --plan <path> --plan-sha256 <hash>`（plan/apply 两 operation，去双重 `--apply`） | JS |
| S2 实现 | 新 `commands/paginate.mjs` 薄路由 `previewNarrativePagePlan`/`applyNarrativePagePlan`；`slides` 移除 narrative-plan，apply-plan 收窄为 structural | JS |
| 分类时序 | narrative schema 投 `slides apply-plan`：在 run binding + confined read-only plan classification **之后**、mutation/provider **之前**失败（现状 `slides.mjs` L305–316 已如此） | JS |
| fail closed | malformed/unknown schema 不默认为 structural transaction，ownership 进 spec | JS |
| tombstone | 仅 `slides narrative-plan`；`apply-plan` token 不全局 tombstone | JS |
| inventory | `PPT_FLOW_COMMAND_INVENTORY` +2（artifacts, paginate），`COMMAND_CONTRACTS` +2 | JS |

## 1. `artifacts`（S1）

新 `commands/artifacts.mjs`：

```js
export const descriptor = { name: "artifacts", ... };
export async function commandArtifacts(runDir) {
  const route = await resolveRunAdapter(runDir, "ppt_flow.artifacts.identity");
  if (!route) return 1;
  const output = await rebuildTargetPageImageArtifactView(route);
  const report = commandReport({ operation: "artifacts", effect: { artifact_view: output.path }, fields: {...} });
  console.log(JSON.stringify(report, null, 2));
  return 0;
}
```

- `image2.mjs` 移除 `artifact-view` operation 分支；`PAGE_IMAGE_OPERATIONS` 移除 `artifact-view`
  （`command_support.mjs` 的 `PAGE_IMAGE_OPERATIONS` Set）。
- `COMMAND_CONTRACTS.image2` 的 decisionEnums 移除 `artifact-view`；新增 `COMMAND_CONTRACTS.artifacts`。
- 不变量逐字保留：provider-free、非 selector、非授权、非 lifecycle transition、零 State 写。

## 2. `paginate`（S2）

新 `commands/paginate.mjs`：

```js
export async function commandPaginate(subcommand, runDir, opts = {}) {
  // plan: previewNarrativePagePlan({ runDir, candidatePath, visualSystem: await narrativeVisualSystem() })
  // apply: applyNarrativePagePlan({ runDir, planPath, planSha256, visualSystem: await narrativeVisualSystem() })
}
```

- `slides.mjs` 移除 `narrative-plan` subcommand + `apply-plan` 的 narrative 分支（L316–326）；
  `apply-plan` 保留 structural（L347–368）。
- `slides.mjs` 的 `apply-plan` 在 L316 处加 narrative-schema 拒绝：
  `emitCliError({ code: USAGE, ..., next: { invocation: ["node", PPT_FLOW_ENTRY, "paginate", "apply", run_dir, "--plan", planPath, "--plan-sha256", hash] } })`。
- narrative 的 `narrativeVisualSystem()` helper 迁到 `paginate.mjs`（或共享）。
- `COMMAND_CONTRACTS.slides` decisionEnums 移除 `narrative-plan`；新增 `COMMAND_CONTRACTS.paginate`。

## 3. inventory + 入口

- `PPT_FLOW_COMMAND_INVENTORY`（cli_error.mjs）按序插入 `artifacts`/`paginate`（12→14）。
- 入口 `ppt_flow.mjs` 注册 `artifacts`（`.argument("<run_dir>")`）+ `paginate`
  （`.argument("<subcommand>")` + `.argument("<run_dir>")` + `--candidate/--plan/--plan-sha256`），
  各追加 `renderContractBlock(COMMAND_CONTRACTS.<name>)`。
- `validateCommandContracts` 自动跟随 inventory（C1 已落地）。

## 4. clean-break 边界（`05` §F）

- cutover 不触碰现有 run bundle 字节（`bundle_layout.mjs:1518` 旧命令写进 deck-guide，`_writeIfAbsent`
  不刷新已有 bundle）。
- 旧 `slides narrative-plan` / `image2 artifact-view` 返回 owner-issued 精确替代动作（新 command+args），
  不是 unknown-command prose。
- tombstone 三分验收：active consumer 归零 / runtime 负例 / planted guard sensitivity。

## 5. 验证策略

- **unit/integration**：`test_target_structural_cli`（保留 structural 回放 + 确认 narrative 路由到
  `paginate`）、`test_narrative_page_plan_cli`/`test_narrative_page_plan`（重命名到 paginate）、
  `test_human_artifact_reference_cli`（`artifacts` 30 处重命名）、
  `test_process_command_surface_entry_seams`/`test_process_cli_error`（inventory +2）。
- **e2e/mock**：`test_mock_narrative_authoring_journey`（paginate 路由）。
- **负例**：`slides apply-plan` 收 narrative schema → 精确 `paginate apply` 诊断；`slides narrative-plan`
  → tombstone 拒绝；`image2 artifact-view` → 精确 `artifacts` 替代。
- **回归**：`npm test`（core + 审计）、`openspec validate --strict` + `--all --strict`、`git diff --check`。
