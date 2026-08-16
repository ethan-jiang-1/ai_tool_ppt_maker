# Change 2: split-non-lifecycle-commands（framing + S1 + S2 + S4）

> 对应 `cli-command-split-design.md` 的 S1/S2/S4 与 `cli-optimization-blast-radius.md` 的固定税。
> 建议 openspec change 名: `split-non-lifecycle-commands`。
> **无兼容模式**: 旧形态直接删除,注册 tombstone（硬拒绝）,不做 alias、不做过渡期。

## 任务 0 — 制度前置（本 change 的第一个 task,一切拆分的前提）

- `openspec/specs/cli-surface/spec.md:5` 的 "fixed 12-command unified entry point" →
  "closed, audited command inventory"（数量可变、集合封闭、逐命令审计、退役需 tombstone）;
- `tests/contracts/test_process_command_surface_entry_seams.mjs` 的 12-name 硬断言改为
  当前 inventory 闭集断言。

## 三个拆分

### S1: `image2 artifact-view` → `artifacts`

- 现状: provider-free 导航重建住在付费生命周期家族,spec 反复强调 "not a selector / 不授权";
- 新形态: `artifacts <run-dir>`;`image2` 操作集减一;
- 触点（live 域实测）: playbook 0 处;`charter/AGENT_CONTRACT.md` human-inspection handoff 1 处;
  `cli-surface/spec.md` 4 条要求;`image-generation/spec.md` 2 处（:765/:1782）;
  `tests/contracts/test_human_artifact_reference_cli.mjs` 30 处。

### S2: `slides narrative-plan/apply-plan` → `paginate` / `paginate apply`

- 现状: `slides` 混装选择器/结构编辑/叙事分页三种业务,`--plan-sha256`/`--apply` 两义;
- 新形态: `paginate <run-dir> --candidate <path>`（preview）;
  `paginate apply <run-dir> --plan <path> --apply --plan-sha256 <hash>`（exact-plan apply）;
- 触点: `playbook/create-deck.md` 3 步、`workflow/01-content/03-specify-structured-slides.md` 3 处、
  `cli-surface/spec.md` :660–677、`narrative-authoring/spec.md`、
  结构/叙事测试（test_target_structural_cli 6 / test_narrative_page_plan_cli 6 / test_narrative_page_plan 5）。

### S4: `state` 子命令化 + `task-projection`

- 现状: 4 个互斥 flag 拼图 + 隐藏写（特定 route 下 `state` 重建投影文件,读命令带写副作用）;
- 新形态:
  - `state <run-dir> [--json]` — 零写观察（回退隐藏写）;
  - `state validate <run-dir>` — 现 `--validate-state`,exit 2 契约保留;
  - `state repair-known-execution-mismatch <run-dir>` — 现 `--repair-known-execution-mismatch`（BUG-066 精确修复）;
  - `task-projection <run-dir>` — 重建协作投影卡（写动作从命令名可见）;
- 触点: playbook 0 处;`node-specification/spec.md` :368/:402;`commands-reference/spec.md` :16;
  state/task-projection 测试若干。

## 同步面（~35–40 文件）

**固定税 10**（任何命令面 change 都逃不掉,清单见 `04-sync-surface-master-checklist.md` §A）:
`ppt_flow.mjs` / `cli_error.mjs`(inventory) / `cli_return_audit.mjs` / 入口 seam 断言测试 /
`test_process_cli_error.mjs` / `test_cli_surface.mjs` / `harness_document_command_audit.mjs` /
`cli-surface/spec.md` / `commands-reference/spec.md` / `harness_architecture.mjs` +
`harness-script-layout/spec.md`(tombstone)

**变量面**（live 域实测触点）:

- specs: `image-generation`(4) / `narrative-authoring`(1) / `node-specification`(2)
- docs: `AGENT_CONTRACT.md`(1) / `create-deck.md`(3) / `03-specify-structured-slides.md`(3)
- scripts: `inspect_workflow.mjs`(1) / `state.mjs`(1) /
  `page_production_task_projection.mjs`(投影写点) / `bundle_layout.mjs`(1) /
  `style_master_plan.mjs`(1) / `narrative_page_plan.mjs`(2)
- tests: `test_human_artifact_reference_cli.mjs`(30) / `test_target_structural_cli.mjs`(6) /
  `test_narrative_page_plan_cli.mjs`(6) / `test_narrative_page_plan.mjs`(5) /
  `tests_e2e/shared/state/test_mock_inactive_run_state_writes.mjs`(5) /
  `test_mock_narrative_authoring_journey.mjs`(4) / `test_state_yaml.mjs` /
  `test_page_production_task_projection.mjs` / `test_process_workflow_inspection_cli.mjs` /
  `test_diagnostic_recovery_handoff.mjs` / `test_mock_target_workflow_journey.mjs`

## 无兼容模式的落地规则（替代 alias 机制）

1. 旧形态**直接消失**: `image2 artifact-view`、`slides narrative-plan/apply-plan`、
   `state --validate-state/--repair-known-execution-mismatch` 不再被解析;
2. 旧形态注册 **tombstone**: 进 `harness_architecture.mjs` 退役词清单 → live 域出现即 guard 失败
   （防止半迁移/复现）;
3. 完成判据: live 域（4 个 Harness 源码域 + `CONTEXT.md`/`AGENTS.md`/`CLAUDE.md`,
   排除 archive/deck_*/dpt_*/_backlog）旧形态计数 → 0,除 tombstone 注册行与 spec 的
   SHALL NOT 禁止句。

## 风险 / 取舍

- [~35–40 文件 > 历史惯例 ~30] → 主题单一（全部是非生命周期业务搬移）;若提案评审嫌大,
  把 S4 拆为独立 change（本计划保留的旋钮,成本 +1 change）;
- [state 行为变化（S4）] → 与 spec zero-write 精神一致;`task-projection` 写动作显式化;
  独立测试证明 `state` 零写;
- [半迁移态] → tombstone + 计数归零判据 + 文档命令审计（文档提到不存在的 flag 会失败）;
- [create-deck 3 处 narrative-plan] → 本 change 直接改（无兼容无需等待,一步到位）。
