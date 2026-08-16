# Proposal: Align serialization schema mirror

## Why

`current-layer-legacy-trace-audit`(`_backlog/plans/`)Change 3(串行纪律:Change 1、2 已
archive)。审计 M-6/L-1 发现 `ppt_maker_harness/schema/` 声明面与代码实现之间存在
schema↔代码 mirror 漂移,以及 schema 层自身的命名/键值不一致。CONTEXT 定义「代码有、
schema/ 没有 = defect」;production-schema-conformance spec §52-53 要求清单只声明有
live owner/consumer 的 active contract,§85-92 禁止 legacy alias/dual value。

**M-6(mirror 漂移,2 类)**:
1. `current_state_shape.required_top_level_fields` 声明 14 键,但 anchor 指向的
   `state.mjs#STATE_TOP_LEVEL_KEYS` 实有 **20** 键——漏 6 个活跃读写字段:
   `page_image_raw_provider_authorization`、`page_image_target_evidence`、
   `page_image_progressive_handoff`、`page_image_task_mandate`、
   `page_image_style_master`、`diagnostics`(state.mjs :105-124 常量 + 多个读写点)。
2. 4 个 wire-schema 值只有声明、无代码消费者(全库 grep 零命中,或仅负面测试):
   `page-image-provider-input`、`page-image-raw-contract`、
   `page-image-raw-manifest`、`pptmaker-page-image-raw-manifest`
   (最后一个是 `pptmaker-` + `page-image-` 两代命名杂交体;现行 accepted-raw-evidence
   schema 是 `page-image-progressive-accepted-raw-evidence`,
   page_image_progressive_schema.mjs:12)。

**L-1(schema 层低危,9 条)**:顶层头命名族、META stage_definition 缺 `publication` 键、
`human-authored` 死值、字段级 producer 键未文档化、`deck-derived-index` role 缺失、
三个文件头块键/值不统一、owner 路径前缀混用、代码 closed enum 无 schema 声明。

本 change 使 `schema/` 声明面与代码 mirror 对齐,消除孤儿值,统一命名,让
production-schema-conformance 的静态检查能真实约束实现。

## What Changes

- **M-6#1**:`current_state_shape.required_top_level_fields` 补 6 个活跃字段,与
  `STATE_TOP_LEVEL_KEYS`(20 键)完全对齐;若字段分 required/allowed 语义则明确拆分
  (createDefaultState 实际写 14 个 required;其余 6 个是 active-execution 期写入的
  allowed 字段)——按 `state.mjs` 实际语义标注。
- **M-6#2**:删除 4 个孤儿 wire-schema 值(无 live consumer);`pptmaker-page-image-raw-manifest`
  的负面测试改指现行 schema 名(`page-image-progressive-accepted-raw-evidence`)保持拒绝
  语义;serialization-contracts.yaml 中两处 raw-manifest 声明合并为现行值。
- **L-1#1**:`flow.yaml` 顶层头 `flow: page-image-production` 统一为
  `page-image-workflow`(CONTEXT.md:259 规范 pipeline 字面量);`schema_home:
  page-image-production-definitions` 是定义集名(README 标题支撑)而非 pipeline 字面量,
  保留;`state.mjs` 的 `PAGE_IMAGE_TASK_MANDATE_SCOPE = "normal-page-image-production"`
  是 task-mandate record 的 scope 值(有消费者,不改),在 serialization-contracts
  selectors 声明该 scope 值。
- **L-1#2**:`META.yaml stage_definition.required_keys` 补 `publication`(19 个 stage
  全部在用)。
- **L-1#3**:`META.yaml producer_status_values` 删 `human-authored` 死值(19 个 stage
  全标 `materialized`)。
- **L-1#4**:`META.yaml field_definition` 文档化字段级 `producer`/`producer_status` 键
  (page-source.yaml:46-47 实际使用)。
- **L-1#5**:`stages/page-artifact-index.yaml` 的 `publication.role` 补
  `deck-derived-index`(serialization-contracts.yaml:499-513 与
  `page_derived_data.mjs:96-102` 都有)。
- **L-1#6**:头块元数据统一——`execution` 统一 `non-executable`(flow.yaml 的
  `descriptive-only` 改值);`authority` 保留各文件语义取值(`conceptual-vocabulary` vs
  `active-serialization-contracts`,键名已统一为 `authority`);flow.yaml 保持 `flow` 键
  并改值 `page-image-workflow`(见 L-1#1),不强行改用 `schema_home`(语义不同)。
- **L-1#7**:`flow.yaml` owner 路径前缀统一为裸 `scripts/`(规范形式,conformance
  测试 `sourcePathForOwner` 自动映射到 `ppt_maker_harness/`),消除
  `ppt_maker_harness/scripts/` 前缀混用。
- **L-1#8**:在 serialization-contracts.yaml 声明 `PAGE_IMAGE_CORE_CONTENT_ROLES` 与
  `PAGE_IMAGE_CORE_COPY_POLICIES` 两个 closed enum(与 page_class/subject_restrictions
  声明对称)。

无 **BREAKING**:不改任何代码行为;`schema/` 是声明面,删除孤儿值与补键不影响运行时
(验证:production-schema-conformance 测试 + state 读写测试回归)。

## Capabilities

### New Capabilities

无。

### Modified Capabilities

- `production-schema-conformance`:serialization 清单与 state/core 代码 mirror 对齐;
  孤儿值删除;枚举/键值统一。conformance 测试同步断言新声明面。

(文档与 `schema/` 文件随 change 的 Impact 落地,不新增 capability。)

## Impact

- **Harness 声明面**:`ppt_maker_harness/schema/serialization-contracts.yaml`、
  `flow.yaml`、`META.yaml`、`stages/page-artifact-index.yaml`(或按 L-1#5 补 role 的
  stage 文件)。
- **Harness 源码(仅声明/注释,无行为)**:`scripts/shared/state/state.mjs`
  (若 scope 常量命名需统一)、`scripts/shared/image2/page_image_progressive_schema.mjs`
  (仅确认,不改)。
- **测试**:`tests/shared/image2/test_artifact_contracts.mjs`(负面测试 schema 名改指
  现行值)、production-schema-conformance 相关测试同步。
- **OpenSpec**:main spec 1 个(`production-schema-conformance` MODIFIED)。
- **验证**:`npm test`(core)、`npm run test:sweep`、production-schema-conformance
  专项、`openspec validate --strict` + `--all --strict`、`git diff --check`。
- **Run-bundle contract impact**:`none`。
- **Policy 引用**:声明面 mirror 对齐 = 净简化(消除孤儿值、命名杂交体、死值、不对称
  枚举);无新增控制层。
