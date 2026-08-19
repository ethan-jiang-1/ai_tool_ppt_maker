# BUG-076: 上游/中游/下游缺"单向依赖 1→2→3"宪法条款

> 严重级别: P1 | 发现: 2026-08-19 | 状态: 活跃

## 症状

操作过程中出现跨层反向引用：上游内容引用中游、中游内容引用下游。实例：
- `deck_ai_org_transform_keynote/1_upstream_raw_material/README.md` 写"由 `2_backbone/` 和具体版本 source 决定"（上游→中游）。
- `deck_ai_org_transform_keynote/2_backbone/manuscript/continuation-handoff.md` 引用 `3_versions/v1/`（中游→下游）。

约束"1 永不引用 2、2 永不引用 3、数据只流 1→2→3"没有一处写死，因此 Agent/人操作一乱就会打破。

## 根因

charter/constitution 层只有"三层梯度"表的目录性质描述（上游=原始素材、中游=主干、下游=版本；是否版本化），没有**依赖方向规则**。`ppt_maker_harness/charter/CONSTITUTION.md` 的"三层梯度"表（第 143–149 行）与 `bundle_layout.mjs` header 注释都未声明"中游禁止引用下游、上游禁止引用中游"，也没有对应的结构校验。`2_backbone/manuscript/source-relations.md` 用"下游表达层"称呼讲稿（中游），进一步造成术语混乱。

## 复现

1. 读 `ppt_maker_harness/charter/CONSTITUTION.md` 的"三层梯度"表：只有层/目录/是否版本化，无依赖方向条款。
2. 在任意 deck 里允许上游文件写"由 `2_backbone/` 决定"、中游 handoff 引用 `3_versions/` 路径——均无检查拦住。

## 修复关联

待后续 findings 汇齐后统一进 OpenSpec change（涉及 CONSTITUTION "三层梯度"节新增"单向依赖 1→2→3，1 永不引用 2、2 永不引用 3"条款；`bundle_layout.mjs` 同步加结构校验/检查；纠正 `source-relations.md` 术语）。
