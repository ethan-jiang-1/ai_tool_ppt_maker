## Why

Pure workflow 的 raw 图就是最终 slide（PPTX 按原字节嵌入，无文字叠加层），slide 文字（kicker/title/
subtitle/body）必须由 provider 渲染进图。但当前 provider prompt 是 `JSON.stringify(request)` —— 整份
provider request 的大 JSON，文字埋在 `raw_contract.display`/`raw_contract.body` 深层。真实生产（deck_dark_factory
pure，MICU provider）中图像模型没有把这些字段当作「必须渲染的 slide 文字」突出处理，产出「图很炫、字太少」
的页面。用户要求每一页都渲染更多、更清晰的文字。

## What Changes

- 仅对 **pure workflow** 的 page raw provider prompt：把 slide 文字（`display.kicker/title/subtitle/callout`
  与 `body`）从 request JSON 深层提出，组装为**显式的顶层文字渲染契约**，紧邻视觉方向一起发给 provider，
  并带明确「把全部文字清晰渲染进图」的 bounded instruction。
- **framed workflow 保持不变**：framed 的 raw 图是 text-free underlay，文字由框架本地 composition 叠加，
  不得让 provider 渲染文字。
- prompt 仍以结构化 JSON 呈现（不是自由 prose），保留 secret-safe 与确定性；raw contract、
  `raw_contract_sha256`、授权范围、idempotency 契约**不变**（transport-only 改动）。
- provider-request inspection 的 `prompt` 字段随新结构更新；回归测试断言 pure 的 prompt 含显式文字契约、
  framed 的 prompt 不含。

## Capabilities

### New Capabilities

无。

### Modified Capabilities

- `image-generation`: Page Authority raw provider prompt 对 pure 工作流改为「显式渲染 slide 文字」的顶层
  契约（kicker/title/subtitle/body 作为必渲染文字呈现），framed 工作流保持 text-free underlay；raw contract
  与授权/idempotency 契约不变。

## Impact

- 框架源码范围：
  - `PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs`（`targetPageAuthoritySubmitFactory` 的 prompt 组装，
    pure 分支）
  - `tests/shared/image2/test_style_master_raw_binding.mjs`、`tests/04-pure-image/test_pure_workflow.mjs`、
    `tests/03-framed-image/test_framed_workflow.mjs`（prompt 断言）
- Control owner：JS 拥有确定性 prompt 组装与状态转换；MD 继续消费 producer 发布的 next action。纯 JS 变更。
- Run-bundle contract impact：`compatible`。raw contract、历史 attempt、accepted selection 均不变；已
  materialized 的图可重生成（transport prompt 变化不改变授权/idempotency 契约）。
- 质量路径引用：
  - `openspec/policies/simple-reliable-control.md`——改动是确定性 transport 组装，前置短路与唯一最近动作
    不变；不新增 retry/fallback。
  - `openspec/policies/human-centered-gates.md`——raw 图仍是受审阅的生产 artifact，文字渲染质量由
    provider output 体现，不新增 gate 语义。
  - `openspec/policies/agent-assistance-and-control.md`——确定性 prompt 组装是 JS 机械工作，不需新人类决定。
- 明确排除：不改 raw contract schema、不改授权/idempotency、不改 framed 行为、不引入自由 prose prompt、
  不新增诊断字段。
