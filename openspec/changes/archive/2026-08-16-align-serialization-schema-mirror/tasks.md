# Tasks: align-serialization-schema-mirror

> 排序：spec（行为权威）→ schema 声明面 → 测试 → 验证 → archive。
> 红线：不改任何代码行为；`schema/` 是描述性声明面；不引入新控制层。

## T1 Spec 措辞（1 个 capability 的 MODIFIED 落位）

- [x] **T1.1** `production-schema-conformance`：`Active control declarations have one
  current inventory` MODIFIED——state shape 键 mirror 精确（20 键全覆盖，
  required/allowed 区分）；孤儿 wire-schema 值删除；杂交名 `pptmaker-page-image-raw-manifest`
  移除；新增场景「State keys mirror the state owner exactly」「A wire schema with no
  consumer is rejected」。
  - 完成判据：`openspec validate align-serialization-schema-mirror --strict` 通过；
    场景标题与 main 一一对应（archive 不拒）。

## T2 schema/ 声明面（apply 阶段）

- [x] **T2.1** `serialization-contracts.yaml` M-6#1：`current_state_shape` 新增
  `allowed_execution_fields` 6 键（page_image_raw_provider_authorization /
  page_image_target_evidence / page_image_progressive_handoff /
  page_image_task_mandate / page_image_style_master / diagnostics），与
  `STATE_TOP_LEVEL_KEYS` 20 键完全对齐。
  - 完成判据：20 键 = 14 required + 6 allowed_execution，逐一比对 state.mjs 常量。
- [x] **T2.2** `serialization-contracts.yaml` M-6#2：删除孤儿 wire-schema 值
  （`page-image-provider-input`、`page-image-raw-contract`、
  `page-image-raw-manifest`/`pptmaker-page-image-raw-manifest` 按消费者判定保留/删除）；
  杂交名不保留。
- [x] **T2.3** `serialization-contracts.yaml` L-1#1(scope 声明)/#8：task-mandate 段声明
  `normal-page-image-production` scope 值；补 `PAGE_IMAGE_CORE_CONTENT_ROLES`/
  `COPY_POLICIES` 枚举声明（顶层头 `schema_home` 保留，见 design 修正决策）。
- [x] **T2.4** `flow.yaml` L-1#1/#6/#7：顶层头 `flow` 值统一 `page-image-workflow`、
  `execution` 改 `non-executable`（`schema_home`/定义集名不动）；owner 路径前缀统一为
  裸 `scripts/`（改 7,12,17,34,43,75,83 的 `ppt_maker_harness/scripts/` → `scripts/`；
  22,53,64,105 已是裸形式，字符串拼接只改路径前缀，不动连接语义）。
- [x] **T2.5** `META.yaml` L-1#2/#3/#4/#6：required_keys 补 `publication`；
  producer_status_values 删 `human-authored`；field_definition 补
  `producer`/`producer_status`；顶层头统一。
- [x] **T2.6** `stages/page-artifact-index.yaml` L-1#5：publication 扩展为 role 列表
  （`page-derived-index` + `deck-derived-index`）。

## T3 测试与源码注释（apply 阶段）

- [x] **T3.1** `tests/shared/image2/test_artifact_contracts.mjs:204`：负面测试 schema 名
  改指现行值（`page-image-progressive-accepted-raw-evidence`），保持拒绝语义。
- [x] **T3.2** `state.mjs`：确认 `PAGE_IMAGE_TASK_MANDATE_SCOPE` 值不变（有消费者）；
  如需注释说明则补一行指向 schema 声明。
- [x] **T3.3** production-schema-conformance 测试同步新声明面断言（若 conformance 测试
  有对 state shape 键数的硬断言则更新）。
- [x] **T3.4** 连带测试更新：`test_page_image_schema_definitions.mjs:100`
  producer_status 允许值改为 `["materialized"]`（L-1#3）；`:187-206`
  publication.role 断言改为包含 `page-derived-index` + `deck-derived-index`（L-1#5）。
  - 完成判据：上述两处断言与 schema 声明一致，测试全绿。

## T4 验证与收尾

- [x] **T4.1** grep 清零矩阵：`pptmaker-page-image-raw-manifest`、
  `page-image-raw-manifest`、`page-image-provider-input`、`page-image-raw-contract`
  在 `ppt_maker_harness/` + `tests/` 清零（或仅负面测试指现行值）；
  `page-image-production` 顶层头清零；`human-authored` 在 `schema/` 清零。
- [x] **T4.2** `npm test`、`npm run test:sweep`、`openspec validate --strict` +
  `openspec validate --all --strict`、`git diff --check` 全绿。
- [x] **T4.3** archive；更新 `_backlog/plans/current-layer-legacy-trace-audit.md` 的
  Progress Tracker（Change 3 → done，全部 3 个 change 完成 → 本计划移入
  `_done/_closed_plans/` 分配 CLS-039）+ 顶部状态行。
- [x] **T4.4** 计划归档仪式：本文件移入 `_done/_closed_plans/`、更新
  `plans/README.md` + `_done/README.md`（计数 +1、Next CLS-040）。
