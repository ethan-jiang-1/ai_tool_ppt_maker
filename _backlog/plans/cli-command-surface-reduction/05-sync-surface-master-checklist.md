# 05 — 同步面总清单（改命令必须同步的地方）

> 回答「改了命令要同步很多地方,别忘了」。无兼容模式: 同步 = 一次性切干净,仓库自带审计兜底。
> **C1/C2/C4 每个 change 的 tasks 必须覆盖本清单对应行;C0 纯拆分不触发命令面固定税,
> 其同步面见 `00`;C3 延后（α）,其触点保留在本清单 §C/§D 供重启时用。**
> 修订（吸收 07）: 修正 overclaim——现有审计各自覆盖一部分,完整 grammar 覆盖需要新增
> exact command-grammar audit（§E.3,**由 C1 落地**,基于 C0 的 descriptor）,不是「漏任一行审计就会红」。

## 同步域边界

- **必须同步（live 域）**: `ppt_maker_harness/`、`openspec/specs/`、`openspec/changes/<active>/`、
  `tests/`、`tests_e2e/`、`CONTEXT.md`、`AGENTS.md`、`CLAUDE.md`
- **不动的历史域**: `openspec/changes/archive/`（历史记录,不改写）、`_backlog/`（簿记）、
  `deck_*/`、`dpt_*/`（生产数据/素材,不是契约面）

## A. 机制文件 — 固定税 12（C1/C2/C4 任何命令面 change 都逃不掉;C0 豁免）

| # | 文件 | 角色 | 本次改什么 |
| --- | --- | --- | --- |
| 1 | `ppt_maker_harness/scripts/ppt_flow.mjs` | 入口注册 + `commands/*.mjs` 命令体（C0 之后） | 搬移/收缩命令,新命令实现 |
| 2 | `scripts/shared/cli/cli_error.mjs:19–32` | `PPT_FLOW_COMMAND_INVENTORY` | 命令名闭集更新 |
| 3 | `scripts/contracts/cli_return_audit.mjs` | 每命令 return-case 行 | 新命令 + 删旧命令 case |
| 4 | `tests/contracts/test_process_command_surface_entry_seams.mjs` | inventory 硬断言 | 闭集断言更新 |
| 5 | `tests/shared/cli/test_process_cli_error.mjs` | inventory 相等性 + 逐命令审计 | 同上 |
| 6 | `tests/contracts/test_cli_surface.mjs` | 每命令 spawn 验证 | 新命令 spawn 测试 |
| 7 | `scripts/contracts/harness_document_command_audit.mjs` | 文档 flag ↔ `--help` 防漂移 | 文档新形态登记 |
| 8 | `openspec/specs/cli-surface/spec.md` | fixed forms + inventory 框架 | delta: 新命令条款 + 旧条款 REMOVED |
| 9 | `openspec/specs/commands-reference/spec.md` | 命令参考/意图路由 | 路由表更新 |
| 10 | `scripts/contracts/harness_architecture.mjs` + `openspec/specs/harness-script-layout/spec.md` | 退役词 guard | tombstone 注册 |
| 11 | `scripts/contracts/harness_coherence.mjs:444` | 断言 cli-surface Purpose 含 12-command | **评审补漏**: C1 一并改 |
| 12 | `tests/contracts/test_process_docs_consistency.mjs:194` | 断言 "fixed 12-command unified entry point" | **评审补漏**: C1 一并改 |

## B. 镜像文档 / 教学面

| 文件 | 什么时候要动 |
| --- | --- |
| `ppt_maker_harness/COMMANDS.md` | 任何命令形态变化（commands-reference owner） |
| `ppt_maker_harness/BOOTSTRAP.md` | doctor/preflight/probe 教学（C4）;机器契约说明（C1 可选） |
| `ppt_maker_harness/charter/AGENT_CONTRACT.md` | artifact-view handoff（C2）;消费规则表述 |
| `ppt_maker_harness/charter/NODE-SPEC.md` | node-specification 镜像条款 |
| `ppt_maker_harness/playbook/*.md` | create-deck（C2 改 3 处;C3 若重启才改 :92 触发句）;probe-image-channels（C4） |
| `ppt_maker_harness/workflow/00-setup/*.md`、`workflow/01-content/*.md` | 方法论教学里的命令示例 |
| `ppt_maker_harness/AGENTS.md`、`README.md` | 若提及命令形态 |
| `CONTEXT.md` | 只在 canonical 术语变化时动（本计划名字取自它,基本不动） |

## C. main specs 触点（处数为历史实测,proposal 时重跑 grep 为准）

| 旧形态 | main spec 文件（处数） |
| --- | --- |
| `image2 artifact-view` | `cli-surface`(4 条要求)、`image-generation`(2: :765/:1782) |
| `slides narrative-plan/apply-plan` | `cli-surface`(:660–677)、`narrative-authoring`(1)、`image-generation`(2: :1138/:1184) |
| `state --validate-state/--repair-known-execution-mismatch`（**C3 延后 α,重启时用**） | `cli-surface`(:165–206/:498)、`node-specification`(2: :368/:402)、`commands-reference`(:16) |
| 投影重建触发（**C3 延后 α,重启时用**） | `workflow-inspection`(:8)、`playbook-execution`(:441) |
| `doctor --smoke/--probe-vendors/--run-dir` | `environment-check`(**31**)、`playbook-execution`(7) |

## D. 测试面（除固定税外的变量触点;处数为历史实测,proposal 时重跑 grep 为准）

| 旧形态 | 测试文件（处数） |
| --- | --- |
| artifact-view | `tests/contracts/test_human_artifact_reference_cli.mjs`(30) |
| narrative-plan | `test_target_structural_cli.mjs`(6,保留回放)、`test_narrative_page_plan_cli.mjs`(6)、`test_narrative_page_plan.mjs`(5)、`tests_e2e/.../test_mock_narrative_authoring_journey.mjs`(4) |
| state validate/repair（**C3 延后 α,重启时用**） | `tests_e2e/shared/state/test_mock_inactive_run_state_writes.mjs`(5)、`test_state_yaml.mjs`、`test_page_production_task_projection.mjs`、`test_process_workflow_inspection_cli.mjs`、`test_diagnostic_recovery_handoff.mjs`、`test_mock_target_workflow_journey.mjs` |
| doctor smoke/probe | `tests/00-setup/test_process_env_check.mjs`(13)、`test_process_runtime_guidance.mjs`(6)、`tests_e2e/shared/workflow/test_mock_doctor_readiness_alignment.mjs` |
| 新增/迁移测试归属 | `tests/contracts/source-test-ownership.json` |

## E. 完成判据（每个 change 的最后一组 task,缺一不可）

1. **active consumer 计数归零**（口径见第 2 条 a 项: command-aware scanner,不是裸 `rg`）。
   裸 rg 只作粗查参考,以 artifact-view 为例:
   `rg -n 'artifact-view' --glob '!openspec/changes/archive/**' --glob '!deck_*/**' --glob '!dpt_*/**' --glob '!_backlog/**'`
2. **tombstone 三分验收**（二次评审 #8 修正: 简单 `rg` 计数归零与负例测试互斥,拆开验收）:
   - **active consumer count = 0**: command-aware scanner 只统计可执行调用、current guidance、
     canonical examples（豁免 tombstone 注册行、spec 禁止句、**负例测试与 replacement
     diagnostic 里的旧 invocation 提及**）;
   - **runtime negative controls > 0**: 旧 invocation 的 focused no-write/no-provider 测试保留;
     旧 invocation 在 binding/文件写/State 写/provider 初始化之前失败,
     输出 secret-safe envelope + 精确的新 `program + args`;
   - **residue guard sensitivity**: 注入内存 snapshot/fixture 的 planted violation 证明 guard
     会红,恢复后原 snapshot 会绿;普通 token（如 `apply-plan`,仍有结构用途）**不**全局 tombstone,
     按完整 obsolete **grammar** 定义（如 `doctor --run-dir ... --smoke`）。
3. **新增 exact command-grammar audit**（由 C1 落地,基于 C0 的 descriptor）: 证明完整
   invocation、参数位置、operation 组合有效。现有 `harness_document_command_audit` 只验证
   文档 flag 能在 `--help` 找到,不够。
4. **审计全绿**: `cli_return_audit` / `harness_document_command_audit` / `harness_architecture` /
   `harness_coherence` / `test_process_docs_consistency` / `md_controller_reader`。
5. **exit matrix 与实现一致**: 0/1/2/130/143 真值表（见 `01` §1.2）覆盖 signal/Commander/
   delegated child 三类来源与优先级（`ppt_flow test` 透传数值型 child status,`return code`
   在 `:1544`;`:4002` 透传 `err.exitCode`）;delegated child 的归一协议见 `01` §1.7,
   help 契约块同源。
6. **回归全绿**: `npm test` + `openspec validate <change> --strict` + `openspec validate --all --strict`
   + `git diff --check`。
7. **无生产数据触碰**: `deck_*`/`dpt_*`/`_generated/` 字节不变（git status 确认）。

## F. clean-break 边界（评审第 7 条,所有拆分 change 通用）

- cutover 不触碰现有 run bundle 字节（`bundle_layout.mjs:1518` 把旧命令写进 deck-guide,
  `:1354 _writeIfAbsent` 不刷新已有 bundle）;
- 旧 invocation 必须返回 owner-issued 精确替代动作（新 command + args）,不是 unknown-command prose;
- 新建 bundle 使用新命令;已有 guide 的 stale 文本不构成 authority、不静默手改;
- 未来 guide repair 需要 owner-controlled、byte-preserving 路径,不在本计划假装已迁移。
