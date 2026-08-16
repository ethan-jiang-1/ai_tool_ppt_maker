# Design: Align serialization schema mirror

## 决策概览

| 决策 | 结论 | 拥有侧 |
|---|---|---|
| 修改面 | 1 个 main spec（MODIFIED）+ `schema/` 5 个文件 + 1 个测试文件 + state.mjs 注释(如需要) | 声明面 mirror 对齐(无行为变化) |
| M-6#1 | `current_state_shape` 补 6 个活跃键,required/allowed 按 state.mjs 实际语义拆分 | mirror 对齐 |
| M-6#2 | 删 4 个孤儿 wire-schema 值;负面测试 schema 名改指现行值 | 孤儿消除 |
| L-1#1 | 顶层头统一 `page-image-workflow`;task-mandate scope 值在 selectors 声明 | 命名统一 |
| L-1#2 | `META.yaml required_keys` 补 `publication` | 键值对齐 |
| L-1#3 | `META.yaml producer_status_values` 删 `human-authored` 死值 | 死值删除 |
| L-1#4 | `META.yaml field_definition` 文档化字段级 `producer`/`producer_status` | 文档补全 |
| L-1#5 | `page-artifact-index.yaml` 的 publication.role 补 `deck-derived-index` | role 对齐 |
| L-1#6 | 三个文件头块键统一(`schema_home`/`authority`/`execution` + 现行取值) | 元数据统一 |
| L-1#7 | `flow.yaml` owner 路径前缀统一为裸 `scripts/`（规范形式） | 路径统一 |
| L-1#8 | serialization-contracts 声明 `PAGE_IMAGE_CORE_CONTENT_ROLES`/`COPY_POLICIES` 枚举 | 枚举对称 |
| 红线 | 不改任何代码行为;`schema/` 是声明面;不引入新控制层 | 机器契约 |

## 1. 现状核实（2026-08-16 apply 前）

- **M-6#1**:`STATE_TOP_LEVEL_KEYS`(state.mjs:105-124)20 键;
  `current_state_shape.required_top_level_fields`(serialization-contracts.yaml:48-62)
  14 键——缺 `page_image_raw_provider_authorization`、`page_image_target_evidence`、
  `page_image_progressive_handoff`、`page_image_task_mandate`、
  `page_image_style_master`、`diagnostics` 共 6 键。
  `createDefaultState`(state.mjs:2997-3014)实际写 14 个 required 键(不含这 6 个);
  这 6 个是 active-execution 期写入的 allowed 字段(authorization/evidence/handoff/
  mandate/style-master 由 progressive raw owner 写入,diagnostics 由诊断写入)。
  → 修法:required_top_level_fields 保持 14 required + 新增
  `allowed_execution_fields` 列出 6 个补充键(注意:既有 `active_execution_fields`
  是执行期活跃字段标注(required 的子集),语义不同;新键名避免冲突),与 20 键
  常量完全对齐。
- **M-6#2**:4 个孤儿值全库 grep 零消费者(仅 schema 声明):
  - `page-image-provider-input`(:274)、`page-image-raw-contract`(:285)零命中;
  - `page-image-raw-manifest` + `pptmaker-page-image-raw-manifest`(:350-351)——
    `pptmaker-` 杂交体仅在 tests/shared/image2/test_artifact_contracts.mjs:204
    作为负面测试旧名出现;现行 accepted-raw-evidence schema =
    `page-image-progressive-accepted-raw-evidence`(page_image_progressive_schema.mjs:12);
    `page-image-raw-manifest` 无任何消费者。
  → 修法:两处 raw-manifest 声明删 `pptmaker-` 杂交体、保留 `page-image-raw-manifest`
    仅当有消费者(无则一并删);负面测试 schema 改指
    `page-image-progressive-accepted-raw-evidence` 保持拒绝语义。
- **L-1#1/#6(修正决策)**:`flow.yaml:1` `flow: page-image-production` 是 pipeline 字面量
  位置,应改 `page-image-workflow`(与 `PAGE_IMAGE_WORKFLOW_PIPELINE`/CONTEXT.md:259
  一致;无测试断言 flow 值,自由改)。`schema_home: page-image-production-definitions`
  (META.yaml/serialization-contracts.yaml)是**定义集名字**(README 标题 "Page Image
  Production Schema Definitions"),非 pipeline 字面量——audit L-1#1 将二者混淆;
  **保留该值**(有 `test_page_image_schema_definitions.mjs:166` 断言 + README 标题支撑)。
  `execution` 统一 `non-executable`(flow.yaml 的 `descriptive-only` 改值);
  `authority` 按文件语义保留(flow.yaml `conceptual-vocabulary` 描述词汇权威,
  serialization-contracts `active-serialization-contracts` 描述契约权威,二者语义不同
  但键名统一为 `authority`——已统一,仅取值语义标注)。
- **L-1#2**:`META.yaml stage_definition.required_keys`(14 键)缺 `publication`;
  19 个 stage 文件全部含 `publication`(grep 确认)。
- **L-1#3**:`META.yaml producer_status_values: [human-authored, materialized]`;
  19 个 stage 全部 `producer_status: materialized`(grep 确认零 `human-authored`)。
  → 删 `human-authored`;连带更新 `test_page_image_schema_definitions.mjs:100` 的
  producer_status 允许值断言(从 `["human-authored","materialized"]` 改为
  `["materialized"]`)。
- **L-1#4**:`META.yaml field_definition` 只文档化 `type`/`description`;
  page-source.yaml:46-47 字段级 `producer_status: materialized` + `producer:` 实际
  使用(visual-language/story-outline 等同款)。→ field_definition 补这两个键的
  可选声明与含义。
- **L-1#5**:`page-artifact-index.yaml` `publication.role: page-derived-index`;
  serialization-contracts.yaml:499-513 声明 `artifact_role: deck-derived-index`
  (producer 同一 `page_derived_data.mjs`);`page_derived_data.mjs:96-102`
  `DECK_INDEX_DETAILS.role = "deck-derived-index"`。→ stage 文件 publication 扩展为
  role 列表(`page-derived-index` + `deck-derived-index`);连带更新
  `test_page_image_schema_definitions.mjs:187-206` 的 `publication.role` 断言
  (从单值 `page-derived-index` 改为包含两者)。
- **L-1#6**:头块元数据统一——`execution` 统一 `non-executable`(flow.yaml 的
  `descriptive-only` 改值);`authority` 保留各文件语义取值(`conceptual-vocabulary`
  vs `active-serialization-contracts`,键名已统一为 `authority`);flow.yaml 保持
  `flow` 键并改值 `page-image-workflow`(见 L-1#1),不强行改用 `schema_home`
  (定义集名 vs pipeline 字面量,语义不同)。
- **L-1#7(修正决策)**:`flow.yaml` owner 路径前缀混用(裸 `scripts/` vs
  `ppt_maker_harness/scripts/`)。**规范形式是裸 `scripts/`**——conformance 测试
  `sourcePathForOwner`(:115-116)对 `scripts/` 前缀自动映射到 `ppt_maker_harness/`
  (`join(HARNESS, owner)`),且 `test_page_image_schema_definitions.mjs:152` 断言
  owner 精确等于裸 `"scripts/shared/image2/page_derived_data.mjs"`。→ 统一为裸
  `scripts/` 前缀(改 7,12,17,34,43,75,83 的 `ppt_maker_harness/scripts/` →
  `scripts/`;22,53,64,105 已是裸形式不动)。
- **L-1#8**:`PAGE_IMAGE_CORE_CONTENT_ROLES`(7 值)与
  `PAGE_IMAGE_CORE_COPY_POLICIES`(2 值)是代码 closed enum
  (page_image_core.mjs:9-18),schema/ 未声明;page_class、subject_restrictions
  已声明(不对称)。→ 在 serialization-contracts.yaml 补声明。

## 2. 各文件修改清单

### Spec（1 个 capability,MODIFIED）

| capability | requirement | 修改 |
|---|---|---|
| production-schema-conformance | Active control declarations have one current inventory | state shape 键 mirror 精确 + 孤儿 wire-schema 值删除 + 杂交名移除;新增场景「State keys mirror the state owner exactly」「A wire schema with no consumer is rejected」 |

### schema/ 声明面（apply 阶段直接改）

- `serialization-contracts.yaml`:
  - `current_state_shape` 新增 `allowed_execution_fields`(6 键);
  - wire-schema 删除孤儿值(按 M-6#2 判定);
  - task-mandate 段声明 `normal-page-image-production` scope 值(L-1#1 的代码独有
    selector 补齐声明);
  - 补 `PAGE_IMAGE_CORE_CONTENT_ROLES`/`COPY_POLICIES` 枚举声明(L-1#8);
  - 顶层头不动(定义集名保留,有测试断言)。
- `flow.yaml`:顶层头 `flow` 值统一 `page-image-workflow`(L-1#1/#6),
  `execution` 改 `non-executable`;
  owner 路径前缀统一为裸 `scripts/`(L-1#7)。
- `META.yaml`:required_keys 补 `publication`(L-1#2);producer_status_values 删
  `human-authored`(L-1#3);field_definition 补 `producer`/`producer_status`(L-1#4);
  顶层头统一(L-1#6)。
- `stages/page-artifact-index.yaml`:publication.role 补 `deck-derived-index`(L-1#5)。

### 测试

- `tests/shared/image2/test_artifact_contracts.mjs:204`:`pptmaker-page-image-raw-manifest`
  → 现行 accepted-raw-evidence schema 值(保持负面拒绝语义)。

### 源码（仅注释/确认,无行为）

- `state.mjs`:不改 `PAGE_IMAGE_TASK_MANDATE_SCOPE` 值(有消费者);如 L-1#1 需注释
  说明则加一行指向 schema 声明。

## 3. 验证策略

- **grep 断言**:
  - `pptmaker-page-image-raw-manifest`、`page-image-raw-manifest`、`page-image-provider-input`、
    `page-image-raw-contract` 在 `ppt_maker_harness/` + `tests/` 清零(或仅负面测试
    指现行值);
  - `page-image-production` 顶层头清零(统一 `page-image-workflow`);
  - `human-authored` 在 `schema/` 清零。
- **行为无变化**:`npm test`(core)、`npm run test:sweep`、production-schema-conformance
  专项、`openspec validate --strict` + `--all --strict`、`git diff --check`。
- **不做**:process/e2e 重跑(纯声明面,无行为面;core + sweep 覆盖 conformance)。

## 4. Policy 合规

- 声明面 mirror 对齐 = 净简化:消除孤儿 wire-schema 值、命名杂交体、死值、不对称
  枚举声明;无新增控制层。
- 红线:不改任何代码行为;`schema/` 是描述性声明面(conformance spec §23-24 明示
  非运行时控制器)。


