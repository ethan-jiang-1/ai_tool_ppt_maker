# Proposal: split-navigation-and-pagination-commands

## Why

`image2 artifact-view` 把 provider-free 的导航重建住进了付费生命周期家族；`slides` 把「叙事分页」
（narrative-page-plan 的 preview/apply）和「结构编辑回放」（structural `apply-plan`）混在同一个
subcommand 里。这两个混装点让一个命令承担两个不同 owner 的职责。本 change 把它们拆成两个薄路由
命令：`artifacts`（导航重建）与 `paginate`（叙事分页），同时**保留** structural `slides apply-plan`
的结构回放能力——绝不删除仍在使用的能力（吸收评审 07 第 1/6 条）。

## What Changes

### S1: `image2 artifact-view` → `artifacts`

- `image2 artifact-view <run-dir>` 迁为 `artifacts <run-dir>`（窄决策 #1：裸名，不叫 rebuild——
  provider-free 导航重建是唯一职责，`rebuild` 语义由 help 契约块说明）。
- 薄路由到现有 owner `rebuildTargetPageImageArtifactView`；行为逐字不变：provider-free、非
  selector、非授权、非 lifecycle transition、零 State/task-projection 写。
- `image2` 的 `artifact-view` operation 移除，help 契约块（C1 的 `COMMAND_CONTRACTS`）同步更新。

### S2（修正）: 只迁叙事分页，保留结构回放

代码事实（已复核）：`slides apply-plan` 按 plan 的 schema 分流——`narrative-page-plan` 走
`applyNarrativePagePlan`（`slides.mjs` L316–326）；非 narrative 走 `verifySlideEditPlanHash` +
`applyConfirmedSlideTransaction`（`slides.mjs` L347–368）的结构事务回放。narrative owners 已是独立
函数（`narrative_page_plan.mjs` 的 `previewNarrativePagePlan`/`applyNarrativePagePlan`），新命令只是
薄路由。

- `slides narrative-plan <run-dir> --candidate <path>` → `paginate plan <run-dir> --candidate <path>`
- narrative schema 的 apply → `paginate apply <run-dir> --plan <path> --plan-sha256 <hash>`
  （窄决策 #1：plan/apply 两 operation，去双重 `--apply`）
- `slides apply-plan` **保留**，只服务 structural transaction replay。
- **分类时序（门槛 7 已钉死）**：narrative schema 投到 `slides apply-plan` 时，在 run binding +
  confined read-only plan classification（`_scratch/` lexical+realpath 校验、读取并解析 plan JSON）
  **之后**、canonical source/State/artifact 变更与 provider initialization **之前**失败，并给
  `paginate apply` 的精确替代诊断。schema 在用户提供的 plan JSON 内，不可能在 binding 之前识别。
- malformed / unknown schema **fail closed**：不得默认为 structural transaction 后再报派生错误，
  ownership 写进 spec。
- tombstone 仅 `slides narrative-plan`；`apply-plan` token **不**全局 tombstone（仍有结构用途）。

## 不变量（评审 07 第四节 C2）

- navigation rebuild 仍 provider-free、非 selector、非授权、非 lifecycle transition；
- narrative candidate/plan 仍受 `_scratch/` lexical+realpath confinement、canonical bytes、exact
  hash 约束；
- structural replay 的 persisted plan、drift fencing、零 provider、target 不重复变更保持原契约；
- 旧 narrative 入口的拒绝时序与 §S2 一致，返回 `paginate` 的精确 invocation。

## Capabilities

### New Capabilities

无。`artifacts` / `paginate` 是命令面拆分，行为由 `cli-surface`（命令 inventory/grammar）与
`image-generation`（artifact-view 命名触点）既有 capability 的 delta 规定。

### Modified Capabilities

- `cli-surface`：MODIFIED——命令 inventory 增 `artifacts`/`paginate`（closed audited，C1 的
  admission rule）；`slides` 的 narrative-plan subcommand REMOVED（tombstone）；`apply-plan` 保留但
  语义收窄为 structural replay；旧 narrative 入口的拒绝时序与精确替代诊断。
- `image-generation`：MODIFIED——`image2 artifact-view` 迁为 `artifacts`（2 处命令名触点：
  `:765` 成功投影、`:1782` provider-free 操作列表），navigation rebuild 语义不变
  （provider-free/非 selector/非授权）。

## Impact

- **Harness 源码**（C0/C1 后布局）：新 `commands/artifacts.mjs` + `commands/paginate.mjs`（薄路由到
  `rebuildTargetPageImageArtifactView` / `narrative_page_plan.mjs`）；`commands/image2.mjs`（移除
  artifact-view operation）；`commands/slides.mjs`（移除 narrative-plan；apply-plan 收窄为 structural，
  加 narrative-schema 拒绝 + 精确替代诊断）；入口 `ppt_flow.mjs`（注册 2 新命令）；`command_result.mjs`
  `COMMAND_CONTRACTS`（+artifacts/+paginate，改 image2/slides）。
- **OpenSpec**：`cli-surface`、`narrative-authoring`、`image-generation` MODIFIED。
- **测试**：`test_target_structural_cli`（保留回放 + 新 narrative 路由）、`test_narrative_page_plan_cli`/
  `test_narrative_page_plan`、`test_mock_narrative_authoring_journey`、`test_human_artifact_reference_cli`
  （`artifacts` 重命名 30 处）、`test_process_command_surface_entry_seams`/`test_process_cli_error`
  （inventory +2）。
- **文档**：`COMMANDS.md`（动词表/路由）、`create-deck.md` 3 处、`03-specify-structured-slides.md` 3 处、
  `AGENT_CONTRACT.md` 1 处。
- **Control owner**：JS——导航重建与叙事分页的确定性 owner 不变；MD Controller 消费 `paginate` 的
  精确 invocation。
- **Run-bundle contract impact**：`compatible`（命令重命名 + tombstone；旧 invocation 返回精确替代
  动作，不静默迁移 `deck_*` 字节）。
- **Policy 引用**：
  - `human-centered-gates.md`：narrative-schema 投错入口是 fail-closed 拒绝（非 gate 变更）；不改
    authorize/generate 的授权边界。
  - `agent-assistance-and-control.md`：`artifacts`/`paginate` 是薄路由，不新增 owner/authority；
    拒绝诊断给精确 `paginate` invocation。
  - `simple-reliable-control.md`：净简化——`slides`/`image2` 各少一个混装 operation；两新命令各
    一个职责。
