## Why

BUG-035（P0）断言 target provider request 只发送 recipe/composition/motif 的 ID 与 SHA，而不是 resolver
产生的 `provider_clauses` 文本。实证复核发现核心交付**已修复**：`framedRawContract` / `pureRawContract`
在 raw contract 顶层携带 `provider_clauses` 文本，`createTargetProviderRequest` 原样包装，
`targetPageAuthoritySubmitFactory` 把整个 request 序列化进 provider `prompt`，文本确实到达 provider body。
但交付链未被硬契约与回归测试锁定：pure 路径 raw contract **没有任何规范校验**（直接哈希，不验证形状）；
framed 对 `provider_clauses` 只校验 `object-or-null`，不校验 `{recipe, composition, motifs}` 的具体形状；
且没有任何测试断言文本进入**序列化后的 provider body**。这个 P0 语义缺口需要以受支持的
raw-contract/provider-request 边界收口，并关闭 BUG-035。

## What Changes

- 为 Pure 工作流增加 canonical raw contract 校验（与 Framed 已公开的 `validateFramedRawContract`
  对齐）：校验 exact top-level keys、schema/slide_id/workflow/visual_language/provider_clauses/
  visual_scene/visual_identity/display/body 的规范形状，plan 阶段在 request construction、授权与 provider
  工作之前拒绝畸形 contract，绝不静默放行。
- 强化 Framed raw contract 对 `provider_clauses` 的校验：从 `object-or-null` 收紧为文本保护的
  `{ recipe: string, composition: string, motifs: string[] }` 形状，并拒绝解析到 resolved visual language
  却携带 null/畸形 clauses 的 contract。
- 保持 raw contract 与 provider request 的既有传输边界：仍由 raw contract 携带 text-guard 保护的
  provider clauses 文本，request 原样包装，submit 序列化——**不做提交前从 source/registry 反查拼接**，
  不新增临时通道。
- 新增回归测试：断言 Pure 与 Framed 的**序列化 provider body**（`prompt` 中的完整 request JSON）确实包含
  exact provider clause 文本，而不只是 raw contract 对象级断言；body-level fixture 必须使用默认 registry
  中受支持的非空 `connected-nodes` motif，避免 `motifs: []` 掩盖 motif 交付；plan 创建后故意改变临时
  registry 的 `connected-nodes` clause 为不同且 text-guard-safe 的文本，证明 submit 仍只使用
  plan-bound raw contract，绝不反查重组。
- 关闭 BUG-035（移入 `_backlog/_done/_fixed_bugs/`），并把 raw contract 校验作为
  `image-generation` 的既有 requirement 收紧。

## Capabilities

### New Capabilities

无。

### Modified Capabilities

- `image-generation`: Page Authority raw contract 的 canonical 校验成为 requirement——两个受支持工作流
  （pure/framed）都必须在 plan 阶段验证 raw contract 形状（含 provider_clauses 文本形状），畸形 contract
  在授权/provider 工作前 hard-stop；序列化 provider request 必须包含文本保护的 provider clause 文本，
  而非仅 digest。

## Impact

- 框架源码范围：
  - `PPTMAKER_FRAMEWORK/scripts/04-pure-image/index.mjs`（新增 pure raw contract 校验）
  - `PPTMAKER_FRAMEWORK/scripts/03-framed-image/index.mjs`（强化 provider_clauses 形状校验）
  - `PPTMAKER_FRAMEWORK/scripts/shared/image2/page_authority_target_runtime.mjs`（共享 clause-shape predicate）
  - `tests/04-pure-image/test_pure_workflow.mjs`、`tests/03-framed-image/test_framed_plan_lifecycle.mjs`、
    `tests/03-framed-image/test_framed_workflow.mjs`、`tests/shared/image2/test_style_master_raw_binding.mjs`
    （validator 与 serialized submit-body 回归断言）
- Control owner：selected-workflow JS adapters own deterministic raw-contract compilation and validation;
  the existing shared submitter owns serialization. MD continues to consume the existing producer-issued next
  action and receives no state or recovery route. This is a JS-only behavior change; the CLI surface is unchanged.
- Run-bundle contract impact：`compatible`。已有 accepted selection 与历史 attempt 仍可读；无
  `deck_*` 生产数据作为 fixture 或迁移对象，不手工编辑任何生成产物。
- 质量路径引用：
  - `openspec/policies/human-centered-gates.md`——畸形 raw contract 在 provider 工作前 hard-stop，
    保护"provider 提交前已验证契约"的不变量；无新的 confirm/hard-stop gate 语义变化。
  - `openspec/policies/simple-reliable-control.md`——plan 阶段前置失败短路（畸形 contract 不产生
    授权/提交），owner 只发一个确定 next action；不新增 retry/fallback/recovery 路径。
  - `openspec/policies/agent-assistance-and-control.md`——确定性校验是 JS 可直接执行的机械工作，
    不需要新的人类决定；提交前不反查 registry 拼接即不引入新的控制权转移。
- 明确排除：不改 provider request 的传输/授权/idempotency 契约；不做 provider clause 重写或拼接；
  不新增诊断输出字段；不触碰 Style Master 或 page raw 的 deadline 行为。
