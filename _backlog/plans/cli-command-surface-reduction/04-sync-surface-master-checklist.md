# 04 — 同步面总清单（改命令必须同步的地方）

> 回答"改了命令要同步很多地方,别忘了"。无兼容模式: 同步 = 一次性切干净,仓库自带审计兜底。
> **每个 change 的 tasks 必须覆盖本清单对应的行**;漏掉任一行,审计（§E）就会红。

## 同步域边界

- **必须同步（live 域）**: `ppt_maker_harness/`、`openspec/specs/`、`openspec/changes/<active>/`、
  `tests/`、`tests_e2e/`、`CONTEXT.md`、`AGENTS.md`、`CLAUDE.md`
- **不动的历史域**: `openspec/changes/archive/`（历史记录,不改写）、`_backlog/`（簿记）、
  `deck_*/`、`dpt_*/`（生产数据/素材,不是契约面）

## A. 机制文件 — 固定税 10（任何命令面 change 都逃不掉）

| # | 文件 | 角色 | 本次改什么 |
| --- | --- | --- | --- |
| 1 | `ppt_maker_harness/scripts/ppt_flow.mjs` | 命令注册 + 命令体 | 搬移/收缩命令,新命令实现 |
| 2 | `scripts/shared/cli/cli_error.mjs:19–32` | `PPT_FLOW_COMMAND_INVENTORY` | 命令名闭集更新 |
| 3 | `scripts/contracts/cli_return_audit.mjs` | 每命令 return-case 行 | 新命令 + 删除旧命令的 case |
| 4 | `tests/contracts/test_process_command_surface_entry_seams.mjs` | inventory 硬断言 | 闭集断言更新 |
| 5 | `tests/shared/cli/test_process_cli_error.mjs` | inventory 相等性 + 逐命令审计 | 同上 |
| 6 | `tests/contracts/test_cli_surface.mjs` | 每命令 spawn 验证 | 新命令 spawn 测试 |
| 7 | `scripts/contracts/harness_document_command_audit.mjs` | 文档 flag ↔ `--help` 防漂移 | 文档新形态登记 |
| 8 | `openspec/specs/cli-surface/spec.md` | fixed forms + inventory 框架 | delta: 新命令条款 + 旧条款 REMOVED |
| 9 | `openspec/specs/commands-reference/spec.md` | 命令参考/意图路由 | 路由表更新 |
| 10 | `scripts/contracts/harness_architecture.mjs` + `openspec/specs/harness-script-layout/spec.md` | 退役词 guard | **tombstone**: 旧形态注册为硬拒绝词 |

## B. 镜像文档 / 教学面

| 文件 | 什么时候要动 |
| --- | --- |
| `ppt_maker_harness/COMMANDS.md` | 任何命令形态变化（commands-reference owner） |
| `ppt_maker_harness/BOOTSTRAP.md` | doctor/preflight/probe 教学（C3）;机器契约说明（C1 可选） |
| `ppt_maker_harness/charter/AGENT_CONTRACT.md` | artifact-view handoff（C2）;消费规则表述 |
| `ppt_maker_harness/charter/NODE-SPEC.md` | node-specification 镜像条款 |
| `ppt_maker_harness/playbook/*.md` | create-deck 40 步（C2 改 3 处）;probe-image-channels（C3） |
| `ppt_maker_harness/workflow/00-setup/*.md`、`workflow/01-content/*.md` | 方法论教学里的命令示例 |
| `ppt_maker_harness/AGENTS.md`、`README.md` | 若提及命令形态 |
| `CONTEXT.md` | 只在 canonical 术语变化时动（本计划名字取自它,基本不动） |

## C. main specs 触点（live 域实测,2026-08-16）

| 旧形态 | main spec 文件（处数） |
| --- | --- |
| `image2 artifact-view` | `cli-surface`(4 条要求)、`image-generation`(2: :765/:1782) |
| `slides narrative-plan/apply-plan` | `cli-surface`(:660–677)、`narrative-authoring`(1)、`image-generation`(2: :1138/:1184) |
| `state --validate-state/--repair-known-execution-mismatch` | `cli-surface`(:165–206/:500)、`node-specification`(2: :368/:402)、`commands-reference`(:16) |
| `doctor --smoke/--probe-vendors/--run-dir` | `environment-check`(**31**)、`playbook-execution`(7) |

## D. 测试面（除固定税外的变量触点）

| 旧形态 | 测试文件（处数） |
| --- | --- |
| artifact-view | `tests/contracts/test_human_artifact_reference_cli.mjs`(30) |
| narrative-plan | `test_target_structural_cli.mjs`(6)、`test_narrative_page_plan_cli.mjs`(6)、`test_narrative_page_plan.mjs`(5)、`tests_e2e/.../test_mock_narrative_authoring_journey.mjs`(4) |
| state validate/repair | `tests_e2e/shared/state/test_mock_inactive_run_state_writes.mjs`(5)、`test_state_yaml.mjs`、`test_page_production_task_projection.mjs`、`test_process_workflow_inspection_cli.mjs`、`test_diagnostic_recovery_handoff.mjs`、`test_mock_target_workflow_journey.mjs` |
| doctor smoke/probe | `tests/00-setup/test_process_env_check.mjs`(13)、`test_process_runtime_guidance.mjs`(6) |

## E. 完成判据（每个 change 的最后一组 task,缺一不可）

1. **旧形态计数归零**: live 域内旧形态出现次数 → 0,仅允许 tombstone 注册行与 spec 禁止句。
   验证命令（以 artifact-view 为例）:
   `rg -n 'artifact-view' --glob '!openspec/changes/archive/**' --glob '!deck_*/**' --glob '!dpt_*/**' --glob '!_backlog/**'`
2. **tombstone 生效**: 旧形态进 `harness_architecture.mjs` 退役词清单;planted-failure 负例
   测试证明 guard 敏感（现有机制,直接复用）。
3. **审计全绿**: `cli_return_audit`（每命令 return-case）/ `harness_document_command_audit`
   （文档每个 flag 都能在 `--help` 找到）/ `harness_architecture`（退役词）/
   `md_controller_reader`（playbook 可读性）。
4. **回归全绿**: `npm test` + `openspec validate <change> --strict` + `openspec validate --all --strict`
   + `git diff --check`。
5. **无生产数据触碰**: `deck_*`/`dpt_*`/`_generated/` 字节不变（git status 确认）。
