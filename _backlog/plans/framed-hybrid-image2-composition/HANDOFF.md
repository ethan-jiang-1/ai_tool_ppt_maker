# Handoff: Framed/Pure Page Image Core Plan Review

> 更新: 2026-08-07 | 接棒目标: 完成 Owner Review，随后按授权进入 OpenSpec proposal/design；当前不实施

## Start Here

先读仓库根部 `AGENTS.md`，再读本目录 [`README.md`](README.md) 和 parent plan [`../framed-hybrid-image2-composition.md`](../framed-hybrid-image2-composition.md)。不要重新扫描未指定的 `_backlog`、`deck_*` 或 `dpt_*`。

## Current Status

- Plan 状态是 `待 Review`。
- 修改了 `_backlog/plans/`、root `CONTEXT.md` 和一份 Proposed ADR；尚未创建 OpenSpec change。
- 未修改 Harness、main specs、tests 或 deck artifacts。
- 当前运行时仍是 v2 text-free Framed 语义；proposed model 尚不可用于生产操作。
- `CONTEXT.md` 记录的是 Owner 已确认的目标领域语言，不是操作错误 v2 runtime 的授权。

## Canonical Owner Clarification

Owner 已明确：Pure 与 Framed 的 Image2 页面生成本质相同。两者都生成完整 PPT 页面，包括 body、labels、metrics、diagram text、quote、callout 和 visuals。Framed 只在 full-canvas Image2 页面上透明叠加本地确定性的 kicker/title/subtitle，以保证字体、位置、字号和风格一致。

精确定义只引用 [`canonical-page-model.md`](canonical-page-model.md)，不要在 handoff 中另造版本。

## Decisions Already Reflected In The Plan

- `Framed != no-text underlay`。
- common `page_image_core` 服务 Pure/Framed；版本级 workflow 只选择 header rendering policy。
- 工作流名称仍只有 `framed` 和 `pure`；`hybrid` 只描述正确 Framed 的页面构成，不是第三个模式。
- Framed local fixed set 闭合为 kicker/title/subtitle；callout 默认 provider-rendered。
- Framed overlay 默认透明；不允许通用大面积不透明 header card。
- source/human 拥有含义、数据和 exact copy；Image2 只拥有 provider-rendered 内容的像素呈现与构图。
- provider 必须获得 header/primary claim 的 context-not-to-render 语义。
- refresh 按 actual compiled provider-input fingerprint 判定，不按“header 字段”粗分。
- actual prompt bytes/digest 必须由 selected adapter 编译并进入 plan/authorization/attempt/evidence lineage。
- complete review 应并列检查 raw 与 production-equivalent composite；Pilot 只负责样本与成本控制。
- 错误的 v2 模型从 active Harness 完全丢弃；没有兼容、迁移、fallback 或旧 evidence 重解释。

相关依据和限制只引用 [`research-findings.md`](research-findings.md)。

## Owner Decisions Still Needed

在进入 OpenSpec proposal 前，从 parent plan 的“待确认决策”取得明确结论，尤其是：

1. `SLIDE BODY` 是否承载 canonical structured content，以及其 closed schema。
2. Framed provider context 包含 exact header literals，还是稳定 primary claim + header roles。
3. provider-rendered explanatory copy 是否允许显式 `paraphrase_allowed`；当前建议默认 exact。
4. complete raw review 是否升级为 raw/composite side-by-side 的单一 complete decision。

不得替 Owner 默许这些选择。

## Next Authorized Path

若 Owner 仍在讨论：继续更新 parent plan/辅助材料，不修改 current truth。

若 Owner 明确批准方案并要求落地：

1. 用 OpenSpec workflow 创建一个独立 change。
2. 先完成正确 protocol identity、common page-image contract、header policy 和 prompt lineage 设计；删除 v2 route，不设计 compatibility layer。
3. 用 delta specs 覆盖 [`authority-propagation-map.md`](authority-propagation-map.md) 列出的 main-spec capabilities。
4. 再实施 parser、03/04 adapter/shared seam、prompt transport、classifier、review、docs 和 tests。
5. 通过正常 sync/archive 流程更新 main specs、root context 和 current Agent guidance。

不要跳过 proposal/design 直接改代码。

## Hard Boundaries

- 不手改 `_generated/`、state、receipts、journals 或 provider evidence。
- 不修改 `deck_dark_factory/3_versions/v3`；它目前只作为反例/未来 visual fixture 候选。
- 不把 OpenAI `presentations` plugin、Codex Grid 或 `@oai/artifact-tool` 变成 Harness 依赖。
- 不把 Style Master 的 no-readable-text 规则扩散到 Framed page generation。
- 不让 03/04 sibling adapter 互相导入 private internals；共同语义应进入明确 shared seam。
- 不提前修改 `CONTEXT.md`、ADR、main specs 或 `AGENTS.md` 造成 proposed/current 冲突。
- 不复用旧 v2 raw acceptance、provider authorization 或 delivery decision 证明新语义。

## Suggested Skills

- `openspec-explore`：Owner 还要继续推敲 protocol、schema 或 review 模型时。
- `mattpocock-skills:domain-modeling`：收敛 `Page Image Core`、`Header Rendering Policy`、内容权威与像素权威的正式词汇时。
- `mattpocock-skills:codebase-design`：设计 03/04 sibling adapters 共用的 deep shared seam、prompt compiler ownership 和 import boundary 时。
- `openspec-propose`：Owner 明确批准并要求生成完整 OpenSpec proposal/design/spec/tasks 时。
- `presentations:Presentations`：只用于复核页面叙事、单一构图和 final composite QA 原则，不作为项目依赖。
- `mattpocock-skills:research`：只有出现新的、尚无一手证据的问题时再使用；不要重复已有研究。

## Verification Before Handoff

```bash
rg -n '[[:blank:]]+$' \
  _backlog/plans/framed-hybrid-image2-composition.md \
  _backlog/plans/framed-hybrid-image2-composition/*.md
git diff --check -- _backlog/plans
git status --short -- _backlog/plans ppt_maker_harness openspec tests tests_e2e
```

预期：只有 `_backlog/plans/` 中本计划相关文件有变更；Harness、OpenSpec、tests 和 deck 不应由本次计划整理产生新修改。
