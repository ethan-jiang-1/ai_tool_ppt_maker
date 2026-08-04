## Why

BUG-015（P2，已重定界）指出：Page Authority visual-language registry 只有 recipe/composition/motif 的
provider clauses、兼容性与 digest，缺少有限且可验证的「关系模型」来表达层级、因果、循环、权衡、边界或
概念对照。单一 provider clause 可以暗示这些关系，却无法让 source、review 和 raw-contract test 证明所声明的
关系类型、阅读顺序或受限 fallback 已被选择。这不是 renderer 故障，也不能通过自由 SVG/CSS、ECharts 或
绕开 provider raw contract 的临时通道解决。

## What Changes

- 在 closed registry（`page-authority-visual-language.yaml`）新增**可选** `relationships:` 顶层段，先支持两类
  真实叙事关系：`layer-stack`（层级堆叠）与 `causal-flow`（因果流向）。每个 relationship record 声明：
  text-guard 保护的 `provider_clause`、`authorities` 资格、与 recipe/composition 的兼容性、以及受限的
  `reading_order` 投影（例如 layer-stack 自底向上、causal-flow 自左向右）。可选段意味着**未声明关系类型的
  既有 deck registry 继续可解析**，不构成迁移。
- 扩展 VISUAL BRIEF source schema：在严格位置序的现有 4 个 key（recipe/composition/motifs/negative_constraints）
  之后增加**可选** `relationship` key（plain 字符串类型 id，如 `layer-stack`）。source 只选关系类型；
  reading order、primitive 与 bounds 由 registry record（版本化、受审阅）决定，不由 provider output 猜测。
- `resolvePageAuthorityVisualLanguageSelection` 校验关系选择：registered、authority-eligible、与所选
  recipe/composition 兼容；未声明则关系投影为 null（向后兼容）。关系进入 `semantic`、`projection` 与
  `provider_clauses`，使 `registry_semantic_digest` → raw contract digest **确定性变化**，同时保留 stable
  `slide_id` lineage。
- raw contract 无需改 schema：`visual_language`（projection，现含关系投影）与 `provider_clauses`（现含关系
  文本）本就通用携带，关系自动流入 raw contract digest、授权范围与 provider prompt。
- 新增 pure Node contract tests（不依赖浏览器、Canvas、PPTX 或外部 provider）：registry 关系 schema 解析、
  选择与兼容性、reading-order projection、digest 指纹、fallback/error diagnostics。

## Capabilities

### New Capabilities

无。

### Modified Capabilities

- `visual-config`: Page Authority visual language 的 closed registry selection 扩展为含可选关系模型——
  注册表可声明关系类型（含 text-guard 保护的 provider clause、authority 资格、recipe/composition 兼容性、
  受限 reading-order），source 可选声明关系选择，selection 必须校验其注册、资格与兼容性，并把关系投影进
  语义/投影 digest 与 provider clause。

## Impact

- 框架源码范围：
  - `PPTMAKER_FRAMEWORK/scripts/02-visual-system/internal/page_authority_visual_language.mjs`（registry
    schema 解析、`relationships` 段、selection 校验与投影）
  - `PPTMAKER_FRAMEWORK/scripts/01-content/internal/page_authority_source.mjs`（VISUAL BRIEF 可选
    `relationship` key）
  - `PPTMAKER_FRAMEWORK/scripts/shared/run-bundle/bundle_layout.mjs`（seed registry 加入 relationships 段）
  - `tests/02-visual-system/` 或新增 pure Node visual-language relationship contract tests
- Control owner：JS/CLI 拥有确定性 registry 解析、关系选择校验与投影、digest 计算；MD 继续消费 source
  authoring 与 producer 发布的 next action。纯 JS 侧变更。
- Run-bundle contract impact：`compatible`。关系段可选、seed 增补、既有 deck registry 可解析、无
  `deck_*` 生产数据作为 fixture 或迁移对象。
- 质量路径引用：
  - `openspec/policies/simple-reliable-control.md`——closed source schema + 前置校验短路：未注册/不兼容的
    关系在内容解析期失败，owner 只发一个确定 next action；不新增 retry/fallback/recovery 路径。
  - `openspec/policies/human-centered-gates.md`——关系类型与 reading order 由 registry（版本化、受审阅）
    决定，provider output 仍是受审阅的生产 artifact，不作为结构 correctness 的唯一 authority；不新增
    confirm/hard-stop gate 语义。
  - `openspec/policies/agent-assistance-and-control.md`——确定性的关系校验与 digest 是 JS 可直接执行的
    机械工作，不需要新的人类决定；不引入新控制权转移。
- 明确排除：不恢复 HTML-first/HTML compositor/ECharts；不承诺通用 diagram editor、自由 SVG/CSS/JS 或动画；
  不新增 icon/SVG 通道（关系用 provider clause + registry reading-order 表达）；不把真实 provider、浏览器或
  审美断言加入 `npm test` core tier。
