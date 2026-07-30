# 调研：Framed Image2 当前状态

> 证据快照 | 日期：2026-07-30

## 范围与方法

本次调查覆盖 framework source、当前 OpenSpec capabilities、tests 与本地确定性 probes；不检查生产 `deck_*` 或 `dpt_*` 数据。除用户指定的本 plan 目录外，不使用其他 `_backlog` 材料作为权威。

报告严格区分 observed behavior（已观察行为）与 proposed design（建议设计）。决定与实施顺序分别记录在 [render-contract-plan.md](render-contract-plan.md)、[pilot-run-plan.md](pilot-run-plan.md) 和 [progressive-plan.md](progressive-plan.md)。

## 术语发现

`image2only` 不是当前 protocol name。新 authoring 使用 `page-authority-image2-v2`；一个完整 `vN` 只能选择一个 `production.workflow: framed|pure`。`framed-image2` 是 parser 对 Framed version 派生出的 authority，不是逐页 source choice。Source 中出现 `PAGE AUTHORITY` field 会被拒绝。

来源：

- `PPTMAKER_FRAMEWORK/BOOTSTRAP.md:26-37`
- `PPTMAKER_FRAMEWORK/scripts/01-content/internal/page_authority_source.mjs:535-566`
- `openspec/specs/pipeline-orchestration/spec.md:83-106`

## 结论

Framed 当前是**流程完整，但渲染契约不完整**。

已实现行为包括 source parsing、Text Frame validation、无文字 raw planning、exact-hash authorization、provider generation、人类 raw review、accepted raw evidence、本地 Chromium composition、共享 final-manifest publication、PPTX/notes delivery、provider-free Text Frame refresh 和 notes-only refresh。

阻塞性的 integrity gap 是：authoring/preflight 与 final composition 实现了不同 frame。已声明的 `standard-v1` 数据是浅色、按 preset 定尺寸，并指定 bundled fonts；Chromium 收到的却是另一套 hard-code 的深色 Arial CSS。因此，当前 heuristic 无法证明最终文字适配 raw contract 所描述的 frame。

还存在一个跨 workflow UX 缺口：当前 v2 要求 Style Master（风格母版）bytes，却不暴露一等 Style Master feedback loop；Framed 与 Pure 都会在人看到代表性 production-equivalent sample 前，就授权并生成完整 raw plan。

## 当前 Framed/Pure 边界

| 关注点 | `framed` | `pure` |
| --- | --- | --- |
| Pixel ownership | Image2 提供无文字 2000x1125 underlay；本地 Chromium 添加 Text Frame。 | Image2 提供全部最终像素，包括 display text。 |
| Source restrictions | 要求 title、`no-readable-text` 和 `no-labels`；禁止 semantic `BODY`。 | Display text 是 provider-owned raw contract 的一部分。 |
| Raw contract | 携带 frame preset/safe zones 和 `text_free: true`。 | 携带 visual language、identity reference 和 display fields。 |
| Finalization | 把 accepted raw PNG 与 local fields 合成，再发布共享 v2 manifest。 | 把 accepted raw PNG bytes 原样发布进同一 manifest schema。 |
| 可见文字编辑 | 若精确 accepted underlay evidence 当前有效且 raw facts 未变，可在本地重新合成。 | Display/visual 变化会产生 raw-generation debt。 |
| Version rule | 在同一 `vN` 内不能逐页与 Pure 共存。 | 相同。 |

来源：

- `PPTMAKER_FRAMEWORK/BOOTSTRAP.md:28-33,58-65`
- `PPTMAKER_FRAMEWORK/scripts/01-content/internal/page_authority_source.mjs:414-460`
- `PPTMAKER_FRAMEWORK/scripts/03-framed-image/index.mjs:134-264,289-409,434-548`
- `PPTMAKER_FRAMEWORK/scripts/04-pure-image/index.mjs:78-227`

## 当前 Style Master 与 Pilot 状态

Page Authority raw planning 要求 `2_backbone/visual-style/style_master.jpg` 中存在非空有效 bytes。两种已选 workflow adapters 都把这个精确路径放入 provider submission references，且 style byte digest 会参与 `provider_profile_sha256`。

来源：

- `PPTMAKER_FRAMEWORK/scripts/shared/image2/page_authority_target_runtime.mjs:44,190-212`
- `PPTMAKER_FRAMEWORK/scripts/03-framed-image/index.mjs:314-349`
- `PPTMAKER_FRAMEWORK/scripts/04-pure-image/index.mjs:134-167`

当前 create-deck Controller 只有 `configure visual system -> authorize raw -> generate all -> review all`。它没有用于生成、展示、决定并提升 Style Master candidate 的 node。Status 可以看到文件存在，但文件存在不等于 human feedback loop，也不等于绑定字节的视觉决定。

来源：

- `PPTMAKER_FRAMEWORK/playbook/create-deck.md:62-202`
- `PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs:484-498,609-622`
- `openspec/specs/style-master-generation/spec.md:1-30`

当前 v2 也没有一等 Pilot Run（试生产）：

- plan projection 为完整 plan 中每个 item 报告 `maximum_submissions`；
- authorization 总是记录 `rawWorkPlan.items.length`；
- generation 要求 provider requests 精确覆盖完整 plan，并 submit 每个 item；
- raw review 要求每个 plan item 都有 bytes；
- target `--slides` input 被明确拒绝，而不是当作支持的 scoped batch；
- public help 有 contract test 保证不暴露 `pilot` 或 `style-master`。

来源：

- `PPTMAKER_FRAMEWORK/scripts/shared/image2/page_authority_target_runtime.mjs:378-443,469-525`
- `PPTMAKER_FRAMEWORK/scripts/shared/image2/page_authority_raw_mechanics.mjs:24-55`
- `PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs:1373-1387,1507-1539,1974-1985`
- `tests/contracts/test_retired_cli_surface.mjs:119-123`

Authorization record 只有一个 plan-wide scope 和 count，没有 exact selected-ID grant。因此，只降低 `max_submissions` 并不安全：它可能授权 N 次提交，却无法证明人看到的是哪 N 个 plan items。真实 pilot 需要 exact item scope 与 generation provenance，而不是 count-only shortcut。

Accepted raw evidence 也只有一个顶层 provider-authorization digest，没有 per-item grant binding。第二次 expansion authorization 会覆盖当前 authorization state，因此若只把其 digest 当作权威，就会丢失实际生成 pilot bytes 的精确 grant。Progressive generation 需要一个已 version 的 cumulative authorization owner，加 item-to-grant materialization provenance；后来的宽范围 grant 不能追溯覆盖早期 bytes。

来源：

- `PPTMAKER_FRAMEWORK/scripts/shared/state/state.mjs:474-488,1148-1248`
- `PPTMAKER_FRAMEWORK/scripts/shared/image2/page_authority_artifacts.mjs:56-99,101-153`

## 历史 Pilot 背景

在 legacy whole-page production surface 退役前，repository 曾经具备目标交互理念：

- 旧 create-deck Controller 明确串联 Style Master authorization/generation、代表性 pilot generation、pilot review，以及单独 full-build authorization；
- `selectPilotSlideIds()` 默认选择 3 页，优先按 render/visual risk 选择，再回退到 first/middle/last positions；
- `pilot` 只生成 selected IDs，并在 full build 前发布 contact sheet。

Commit `2a42fe4` 父提交中的历史来源：

- `PPTMAKER_FRAMEWORK/playbook/create-deck.md:118-235`
- `PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs:881-955,1596-1778`
- `PPTMAKER_FRAMEWORK/charter/AGENT_CONTRACT.md:187-197`

Commit `2a42fe4` 把这些 commands 和 implementations 连同 legacy HTML/whole-page/Header-Lock production authority 一起移除。当前保留的 Style Master spec 只保存共享 Page Authority input/client primitives。因此，旧流程是有价值的 product evidence，却不是当前 v2 route；其旧 state、adapter、command grammar 或 render-mode semantics 不得被隐式复制回来。

## 主要矛盾：`standard-v1` 的两种定义

Preset 声明：

- Source Sans 3 与 Noto Sans SC；
- 位于 `x=40, y=28, w=920, h=238` 的浅色 `#f5f0eb` panel；
- absolute field rectangles，包括 46px 两行 title；
- 顶部与可选底部 reserved underlay rectangles；
- 1000x562.5 CSS canvas，以 2000x1125 capture。

来源：
`PPTMAKER_FRAMEWORK/scripts/03-framed-image/internal/text_frame.mjs:5-74`.

Final compositor 却输出：

- `Arial,sans-serif`；
- 从 `top:0` 开始的深色 full-width top panel；
- 34px title 和独立 flow/margin geometry；
- 不带 `fontRoles` 的 capture，因此没有 custom-font evidence。

来源：

- `PPTMAKER_FRAMEWORK/scripts/03-framed-image/internal/framed_composition.mjs:6-36`
- `PPTMAKER_FRAMEWORK/scripts/03-framed-image/internal/capture_runtime.mjs:90-140`

Compositor 只检查 caller 是否提供 `ok` preflight object；并不证明该 object 是针对精确当前 receipt、preset、fonts、runtime 或 CSS 产生的。

## False Acceptance 实测探针

一个确定性本地 probe 使用 pinned Chromium runtime 和 checked-in Source Sans 3，并让 title 包含 28 个大写 `W`。

| 观察项 | 结果 |
| --- | --- |
| 当前 heuristic width | 811.44px |
| 声明 field width | 872px |
| Heuristic decision | accepted |
| Browser rendered width | 1047.72px |
| Browser decision | overflow |
| Browser launch 加 measurement | 约 727ms |

这是反对把当前 glyph-width estimator 当作 authorization evidence 的直接反例。它也支持执行一个有界 browser batch，而不是每个 field 启动一次，或每个 lifecycle command 都启动一次。

## Preset 数据质量发现

已声明 preset 比 compositor 更接近预期权威，但仍不是干净的 canonical model：

- panel opacity 同时存在于 theme，并复制到每个 panel；
- 声明了 `border`，但从未渲染；
- panel `padding` 不是 field layout 的事实源，因为 fields 使用 absolute coordinates；
- header padding 恰好接近对应 field inset，但 callout padding 与 callout field 的 absolute x coordinate 矛盾。

Hash 这些事实不会使它们获得语义权威。任何忠实收敛都需要规范化 preset，并有意改变 digest。

来源：
`PPTMAKER_FRAMEWORK/scripts/03-framed-image/internal/text_frame.mjs:8-74`.

## 当前 Planning 与 Write 拓扑

`compileFramedTargetRawPlan()` 是 synchronous。它执行 heuristic preflight，构建 raw contracts/provider requests，创建 plan，并立即调用 `writeTargetRawWorkPlan()`。

后续每个 Framed raw lifecycle command 都再次调用 `buildFramedTargetRawPlan()`：

```text
plan / authorize / generate / prepare-review / decide-review / delivery
                              |
                              v
                 重建并重写 current plan
```

来源：

- `PPTMAKER_FRAMEWORK/scripts/03-framed-image/index.mjs:198-228,314-409`
- `PPTMAKER_FRAMEWORK/scripts/shared/image2/page_authority_target_runtime.mjs:371-408`

该拓扑有两个推论：

1. 若不拆分 command topology，在当前 helper 内增加 asynchronous browser proof，会导致 authorize/generate/review/delivery 全部重复运行证明。
2. “proof 失败时不写任何 state”的笼统保证不成立。`resolveTargetSourceContext()` 在 raw-plan compilation 开始前，就会 initialize 或 advance target source state，并写 source receipt。

来源：
`PPTMAKER_FRAMEWORK/scripts/shared/image2/page_authority_target_runtime.mjs:245-283`.

当前实现只能提供更窄的保证：proof 失败不写 raw plan 或下游 raw/final evidence，但 source state 可能已经改变。目标设计应拆分 read-only candidate source resolution，与 proof 后的 source-state/receipt 和 raw-plan materialization，从而修正该问题。

## Raw Review 未展示必需的 Framed 事实

当前 target raw review 渲染包含 raw images 与 `slide_id` labels 的 contact sheet。它没有展示必需的 `position + slide_id + title`，没有 overlay Framed safe-zone rectangles；review record 也不携带显式 capture/projection profile 或 typed coverage record。

来源：
`PPTMAKER_FRAMEWORK/scripts/shared/image2/page_authority_target_runtime.mjs:455-525`.

这不只是未来 enhancement：保留的 specs 已经描述围绕 safe-zone guides 和 canonical renderer-profile evidence 的 raw review/rebuild behavior。

来源：

- `openspec/specs/image-generation/spec.md:35-67`
- `openspec/specs/run-bundle-layout/spec.md:29-40`

既有 review 刻意保持 human-owned。它没有 OCR，也不自动判断 generated underlay 是否 text-free；这是已知边界，不是 renderer-contract bug。

证据还暴露了未来表述不能混淆的三种 identity：provider generation profile、Framed final-pixel render profile 和 raw-review projection/capture profile。若已选 workflow adapter 提供 typed generic overlay/profile contributions，且 review 绑定其 digest，则 semantics-blind shared owner 可以保持自己的边界。

## 面向生产的 Test Bypass

`composeFramedFinalSlideManifest()` 暴露 `compose` callback。Tests 使用它返回任意 bytes，从而绕过 raw PNG validation、pinned browser、frame CSS、layout checks、fonts、network denial、capture dimensions 和唯一 compositor。

来源：

- `PPTMAKER_FRAMEWORK/scripts/03-framed-image/index.mjs:231-264`
- `tests/03-framed-image/test_framed_workflow.mjs:48-58`

这让 final-manifest mechanics 可测试，却削弱 production module boundary。替代设计需要私有 runtime test seam，防止公共 workflow tests 意外只证明 bypass。

## Font Inventory 与可行性

Repository 已经有一份具有明确 owner、经过 integrity check 且带 unicode-range metadata 的 font inventory：

- 共 102 个 font files：1 个 Source Sans 3 face 加 101 个 Noto Sans SC shards；
- 完整 inventory 约 4.69 MB font bytes；
- 典型英文 frame 嵌入约 170 KB；
- 抽样中文 frame 选择 4 个 Noto shards，共嵌入约 402 KB。

来源：

- `PPTMAKER_FRAMEWORK/scripts/00-setup/internal/html_fonts.mjs:35-179`
- `PPTMAKER_FRAMEWORK/scripts/00-setup/internal/html_runtime.mjs:150-222`
- `openspec/specs/html-render-runtime/spec.md:16-87`

Inventory parser 已经验证 face metadata、unicode ranges、local files 与 digests。当前缺少的是窄接口 production helper：把 frame 实际 code points 映射到所需 checked-in faces，并输出进 self-contained page。

这些数字排除了每页嵌入全部 Noto shards，支持确定性 per-page selection。但不能据此声称支持任意中文或其他语言；code-point coverage 与 language support 是不同主张。

## Layout Evidence 要求

提供 `fontRoles` 时，既有 capture runtime 可以收集 CDP font evidence、拒绝 network routes、验证 expected leaf markers，并 capture 固定 PNG。Framed compositor 当前没有使用 font path，也没有针对 preset panels/fields 执行 exact DOM agreement check。

稳健 browser observation 可以使用：

- 精确 panel 与 field container rectangles；
- field `scrollWidth`/`scrollHeight`；
- 按 y 分组的 `Range` fragments，用于 line count；
- 针对真实 selected glyphs 的条件式 custom-font evidence。

不应要求每个 raw glyph rectangle 都留在 CSS field rectangle 内：glyph ink 与 browser rounding 不定义 layout box。

## Specification 一致性发现

Orchestration spec 中有一个名为 `Mixed deck` 的 scenario，声称一次 build 会同时选择 accepted Pure 与 Framed evidence。同一 spec 当前权威 requirement 却规定一个 target version 恰好选择一个 workflow，并禁止 per-slide dispatch。

来源：
`openspec/specs/pipeline-orchestration/spec.md:50-59,83-106`.

应移除或重写这个陈旧 scenario；不得用它发明 mixed-mode support。

Render correction 跨越的 capabilities 多于原草稿列出的四项。除 `image-production`、`html-render-runtime`、`image-generation` 和 `pipeline-orchestration` 外，proposal 工作还必须审计：

- `visual-config`：canonical visual/profile identity；
- `environment-check`：runtime/font readiness 与 recovery；
- `cli-surface`：owner-issued error category、JSON/stderr 和 exit behavior。

通用 raw-review restoration 也可能涉及 accepted bundle-layout 与 evidence requirements。CLI producer fields 继续保持权威；consumer specs 不得复制其 schema。

## 测试覆盖与 Baseline

Focused Framed suite 当前证明 6 项 lifecycle behaviors，包括真实 local composition/shared delivery path、provider-free text refresh 和公共 title-refresh command。它没有直接证明：

- browser 与 preset geometry 等价；
- 在真实 deck pages 上选择 CJK/mixed fonts；
- long-token、extra-line 或 DOM scroll overflow；
- 两种 callout variants；
- profile-bound invalidation；
- browser proof 失败后不写 raw plan；
- 按 lifecycle command 统计 browser launch counts；
- raw review 中的 safe-zone/profile evidence；
- Style Master candidate/review/promotion evidence；
- 任一 workflow 的精确 representative-scope authorization；
- pilot-to-expansion byte reuse，以及防止过早 full authorization；
- 生产等价 Framed/Pure pilot projections；
- small-scope review deduplication。

来源：`tests/03-framed-image/test_framed_workflow.mjs:41-305`。

调查期间执行的验证：

- `npm exec -- vitest run tests/03-framed-image/test_framed_workflow.mjs`：6/6 tests passed；
- 完整 `npm test`：passed；
- `tests_e2e/shared/workflow/test_mock_target_workflow_journey.mjs`：2 tests passed。

这些是尚未覆盖的 contract gaps，不是现有 red regression。

## 基于证据的推论

观察结果支持对任何实现施加以下约束：

1. Heuristic 不能继续作为 authorization authority。
2. Preset normalization 必须先于 profile identity 与 browser convergence。
3. Candidate source/contract compilation、browser verification，以及 source state/receipt/raw-plan materialization 必须成为独立操作。
4. 后续 raw lifecycle commands 应验证 stored plan，而不是重建它或重跑 Chromium。
5. Browser compiler 与 compositor 必须归同一个私有 owner。
6. Profile drift 需要保守地使 raw evidence 失效。
7. Raw visual judgment 继续归人所有，但其 review projection 必须展示 contract 已要求的 safe-zone/profile facts。
8. Style Master 文件存在不能与前置人类视觉决定混淆；candidate review 与 accepted-byte identity 需要明确 owner。
9. Pilot Run 同时属于两种 workflow，但每种已选 workflow 都需要直线、独立的 Controller 路径和自己的 production-equivalent evidence。
10. 一份完整 plan 加 exact selected-ID authorization batches，比 count-only scope 或 preauthorized full batch 更安全。
11. 复用已付费 pilot bytes 需要 owner-written tuple provenance；复制的 filenames 或后来更宽的 authorization 都不能证明其来源。
12. Pilot `proceed` 可以开放 expansion 环节，但不能让部分证据变完整，也不能授权剩余 provider calls。

## Policy 解读

这些证据可直接映射到 repository policy，无需创建新的 runtime authority：

- heuristic 与 hard-coded compositor 是针对同一事实的竞争性 evaluators，违反 one-truth-path rule；
- 每个 lifecycle command 都重建并重写 plan，会拉长 control path，并带来 wrong-owner mutation 风险；
- 公共 `compose` callback 绕过所属 integrity evaluator；
- raw-review guides/profile coverage 缺失会削弱既有人类 `confirm`，但不足以证明需要 OCR 或另一 approval；
- 真实 browser fit 可重建，因此持久化第二份 proof/Gate 会违反 durable-state discipline；
- Style Master 与 Pilot Run 质量确实是 human-owned `confirm` decisions；missing identity/evidence 与 unauthorized submit attempts 则继续是不可 waiver 的 `hard-stop` outcomes；
- 只有在先前 human authorization、human judgment 或付费 provider-byte provenance 无法重建时，最小新增 durable pilot facts 才合理；
- exact scoped batches 缩短反馈，并防止 full-plan preauthorization；彼此分开的 Framed/Pure Controller 路径则避免跨 workflow decision layer。

因此，render convergence 继续保持 subtractive（做减法）：一个 direct evaluator、最早 prerequisite short-circuit、唯一最近合法动作，以及 same-check rerun。Progressive production 只向既有 owners 增加不可重建的 decision/provenance facts；不增加 hidden retry/fallback、inferred authorization、cross-workflow Controller 或 parallel success path。
