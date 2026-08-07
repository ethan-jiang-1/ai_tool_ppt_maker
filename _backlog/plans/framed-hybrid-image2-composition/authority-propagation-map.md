# Authority Propagation Map: Framed/Pure 顶层语义如何进入仓库权威

> Parent plan: [`../framed-hybrid-image2-composition.md`](../framed-hybrid-image2-composition.md) | 更新: 2026-08-07 | 状态: 待 Review

## 为什么需要传播

“Pure 与 Framed 共享完整页面生成核心，Framed 只增加透明固定 header overlay”是 durable domain decision，不是某个 prompt 或 adapter 的实现细节。若只修改代码，旧的 root context、ADR、main specs 和 Agent 入口仍会把后续实现拉回 text-free underlay 模型。

传播必须遵守权威顺序：

```text
Owner-reviewed Plan
  -> Proposed/Accepted ADR + OpenSpec change design/delta specs
  -> implementation + tests + Harness guidance
  -> synced main specs + current root context/entry docs
```

Plan Review 已将 Owner 确认的领域语言写入 root `CONTEXT.md`，并创建一份
`Proposed` ADR；这些文档不修改 runtime/spec truth，也不授权操作错误 v2 runtime。

## Root Context

### `CONTEXT.md`

已新增或收紧的 durable concepts：

- **Page Image Core**：Pure/Framed 共用的 full-canvas Image2 内容与视觉生成模型。
- **Header Rendering Policy**：版本级选择 `provider`（Pure）或 `local-transparent-overlay`（Framed）。
- **Content Authority**：human/canonical source 拥有主张、数据和 exact required copy。
- **Provider-Rendered Content**：Image2 负责 body/labels/metrics/diagram text/quote/callout 的像素呈现与构图，不获得语义发明权。
- **Protected Zone**：连续画面上的构图避让区，不是 blank strip、cutout 或 no-text page contract。
- **Provider-Input-Preserving Refresh**：只有实际 compiled provider input 与相关 geometry/profile 不变时，Framed 才能复用 raw 做 local overlay refresh。

现有 **Image Production** 定义已补充：Pure 与 Framed 都属于 whole-page Image Production；Framed 的 local header overlay 不把它降级为 visual-slot production 或 HTML Production。

### `openspec/config.yaml`

当前仍使用 `full-page` / `body+header-lock` 和过宽的 Header Text & Style Refresh 描述。实施 change 应将其替换为与 current protocol 一致的 vocabulary，至少明确：

- body/visual semantics 对 Pure/Framed 相同。
- 差异是 header rendering policy，而不是 body ownership。
- local refresh 取决于 provider-input preservation，不是字段名。
- 正确 current protocol 对废弃 v2 input 的 unsupported boundary。

## Architecture Decision Record

现有 `docs/adr/0001`–`0004` 不直接决定页面像素所有权，不应回写或改写历史 Accepted ADR。Plan Review 已创建：

```text
docs/adr/0005-unify-page-image-core-and-header-rendering-policy.md
```

ADR 应记录：

- 决定：Pure/Framed 共用 `page_image_core`；Framed = common core + transparent deterministic header overlay。
- 原因：保留 Image2 图文一体构图，同时保证 kicker/title/subtitle consistency。
- closed fixed set：kicker/title/subtitle；callout 默认 provider-rendered。
- adapter boundary：03/04 保持 sibling owner，但从共同 semantic/compiler seam 取输入，不互相导入 private internals。
- prompt lineage：实际发送字节由 adapter 编译并进入 authorization/evidence。
- clean break：从 active Harness 删除 v2 route；旧 v2 bytes 一律是不支持输入。
- 取舍：header context 可能使部分 copy edit 触发 raw rebuild；透明 overlay 依赖 provider 遵守 protected zone 并接受 composite review。

ADR 保持 `Proposed`，直到 Owner 完成 Plan Review 并授权进入 OpenSpec proposal；它不是对当前 runtime 已完成替换的声明。

## Main Specs

main specs 不能在此计划中直接修改。应创建一个 OpenSpec change，用 delta specs 覆盖下列 capability；实施完成后按正常 sync/archive 流程进入 `openspec/specs/`。

| Capability | 必须改变的主语义 |
| --- | --- |
| `content-parsing` | Framed 接受 provider-rendered content；fixed set 闭合；`SLIDE BODY` 仅在定义 closed schema 后接入 |
| `visual-config` | common page visual language；transparent overlay；protected zone 是 composition constraint |
| `image-generation` | common page-image core、header policy、compiled prompt lineage、Pure/Framed baseline/difference tests |
| `image-production` | Pilot/complete raw+composite review 与废弃 v2 evidence 的拒绝边界 |
| `pipeline-orchestration` | provider-input fingerprint、local refresh/rebuild 路由、transport 不二次编译 prompt |
| `harness-script-layout` | 03/04 sibling adapters 共用明确的 page-image seam，但不得互导 sibling/private modules |
| `node-specification` | 正确 current protocol 的 source/state identity、workflow binding、Controller handoff，以及废弃 v2 input 的硬停止 |
| `slide-identity-and-ordering` | 新 protocol 下版本级 workflow 与 Structural Versioning Path 的 preview/apply 约束 |
| `commands-reference` | 面向 Agent/人的 Pure/Framed 含义和刷新路由 |
| `harness-charter` | 顶层 owner、evidence、unsupported boundary 和最小刷新原则 |

需要审计但预计不改变核心语义：

- `style-master-generation`：Style Master 继续允许是 no-readable-text 的视觉参考；不能把 Style Master 的 no-text 规则误扩散到 Framed page generation。
- `pptx-assembly`：继续消费统一 final-slide manifest；不因 header policy 分叉交付容器。
- `speaker-notes` / delivery specs：保持 notes 与最终像素 lineage，不新增 workflow-specific PPTX 行为。

## Harness Guidance 与入口

正确模型成为 current 时同步：

- `AGENTS.md`
- `ppt_maker_harness/BOOTSTRAP.md`
- `ppt_maker_harness/charter/AGENT_CONTRACT.md`
- `ppt_maker_harness/charter/CONSTITUTION.md`
- `ppt_maker_harness/charter/WORKFLOW.md`
- `ppt_maker_harness/workflow/README.md`
- `ppt_maker_harness/workflow/01-content/`
- `ppt_maker_harness/workflow/03-framed-image/README.md`
- `ppt_maker_harness/reference/glossary.md`
- `ppt_maker_harness/reference/agent-prompts.md`
- source templates/presets that currently inject `no-readable-text` / `no-labels` for Framed pages

这些文件必须在 runtime/spec 已经支持正确语义时更新。提前修改会让 Agent 按尚不存在的能力操作当前运行时。

## Tests 与 Architecture Guard

需要新增跨层 regression guard，确保未来不会只改某一层：

- root context 与 current charter 使用同一个 Pure/Framed 顶层定义。
- main specs 不再将 Framed body 定义为 text-free。
- Pure/Framed 共享 body/visual contract fixtures；差异 fixture 只覆盖 header policy、protected zone 和 composite。
- architecture test 允许 03/04 依赖共同 page-image seam，同时继续禁止 sibling/private import。
- docs consistency test 拒绝 active guidance 中的“Framed = text-free underlay”语义。
- obsolete-input rejection test 确保没有 active route 接受 v2 marker、state、receipt 或 evidence，也没有 conversion path。

## 明确不在 Plan 阶段修改

- 不直接编辑 `openspec/config.yaml`。
- 不创建状态为 Accepted 的 ADR。
- 不直接编辑 `openspec/specs/` main specs。
- 不提前更新 `AGENTS.md`/BOOTSTRAP 让 Agent 使用尚未实现的新 protocol。
- 不修改任何 `deck_*` source/state/evidence。

这些修改属于 Plan Review 后的 OpenSpec proposal/design/implementation 工作，而不是本次记录工作的副作用。
