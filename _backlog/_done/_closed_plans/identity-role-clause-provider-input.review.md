# Review: identity-role-clause-provider-input

> 评审对象: `identity-role-clause-provider-input.md`
> 评审日期: 2026-08-14
> 评审结论: **问题成立；建议修改设计后进入 OpenSpec proposal，不建议按方案 A 先落地。**

## 结论先行

这不是 `deck_ai_sdlc_keynote` 的偶发 prompt 调参问题，而是 PPT Maker Harness 的 provider-input contract 回归：

1. identity registry 已经给出经校验的 reference bytes、`role_clause` 正文和 digest。
2. Page Source Receipt 与 adapter raw contract 都保留了正文和 digest。
3. Pure / Framed compiled provider input 却只序列化 identity projection，正文被丢弃。
4. transport 原样提交 adapter 编译出的 bytes，因此 runtime 不会也不应补回正文。

原 plan 对这个主链判断正确。需要修正的是落地策略和因果表述：

- 应把它定义为 **provider-facing semantic contract regression**，不是新的 prompt enhancement。
- 推荐一次性落到干净的 provider-facing identity shape，digest 留在 raw/core/authorization lineage；不要先 A 后 B，避免两次 compiled-input 失效和两轮远端重建。
- 正文进入 prompt 前必须补齐 `role_clause` 与 projection 的一致性 guard；当前 raw validators 只检查类型，不检查配对和 digest。
- `role_clause` 缺失是已证实缺陷，也是当前视觉漂移的合理重要原因，但尚不能证明是唯一原因，更不能承诺补字段后模型一定跨页一致。

因此我的 verdict 是：**修改后通过**。proposal 前应把下文的 P1 项全部吸收。

## 已核实的事实链

### 1. `v8` 是有效的当前 Pure run

对精确 run dir `deck_ai_sdlc_keynote/3_versions/v8` 的只读检查通过：

- layout: structure + pipeline readiness 均通过；
- pipeline: `page-image-workflow`；
- workflow: `pure`；
- `source_epoch: 1`；
- 当前 raw plan 共 25 页；
- pilot 已 materialize `InfoRev` / `NewPart` / `DeerVal` / `FramAut` 四页，尚未记录 pilot 人类决定。

这与原 plan 的背景一致。

### 2. 两个 pilot identity 选择正确进入 source 与 receipt

`NewPart` 选择 `amber-agent/guide`：

- `deck_ai_sdlc_keynote/3_versions/v8/slide-specifications.md:153`
- `VISUAL IDENTITY` 在 `:158`

`FramAut` 选择 `amber-agent/collaborating`：

- `deck_ai_sdlc_keynote/3_versions/v8/slide-specifications.md:642`
- `VISUAL IDENTITY` 在 `:647`

registry 中两个 role 的 reference SHA 与 `role_clause` 均存在：

- `deck_ai_sdlc_keynote/2_backbone/visual-style/assets/reference/amber-agent/image2-reference-material.yaml:9`
- `guide.role_clause` 在 `:12`
- `collaborating.role_clause` 在 `:16`

本地重新计算的 reference SHA 和 role-clause SHA 与 receipt / raw contract 完全一致。

### 3. Harness resolver 明确产生两种用途不同的对象

`resolvePageImageIdentityReference` 在
`ppt_maker_harness/scripts/02-visual-system/internal/page_image_reference_material.mjs:287`
建立：

- `projection`: profile、role、reference digest、role-clause digest、subject facts；
- `provider_reference`: reference path、reference digest、`role_clause` 正文。

返回点在 `:296-298`。这个拆分本身是合理的：前者适合 lineage，后者包含 provider 所需的 reference material。

### 4. 两个 adapter 的 raw contract 都保留正文

Pure：

- 读取正文: `ppt_maker_harness/scripts/04-pure-image/index.mjs:642`
- 写入 `visual_identity_role_clause`: `:649`
- 写入 digest projection: `:651`

Framed：

- 读取正文: `ppt_maker_harness/scripts/03-framed-image/index.mjs:836`
- 写入 `visual_identity_role_clause`: `:843`
- 写入 digest projection: `:845`

`v8` 的 provider-input inspection 也证明两页 raw contract 中正文存在，并且其 SHA 等于 projection 的 `role_clause_sha256`。

### 5. 两个 compiled provider input 都丢了正文

Pure compiler 在
`ppt_maker_harness/scripts/04-pure-image/index.mjs:681-687`
把 `identity` 直接设为 `rawContract.visual_identity`。

Framed compiler 在
`ppt_maker_harness/scripts/03-framed-image/index.mjs:876-882`
做同样的事。

`v8` 的 `NewPart` / `FramAut` compiled input 均只有：

```json
{
  "profile": "amber-agent",
  "role": "guide | collaborating",
  "reference_sha256": "...",
  "role_clause_sha256": "...",
  "subject_class": "amber-light-form",
  "identity_subject_count": "one",
  "subject_restrictions": "none"
}
```

没有 `role_clause` 正文。

### 6. transport 不会改写，也确实附加 identity reference image

shared runtime 把 adapter input 当作 opaque canonical bytes：

- `ppt_maker_harness/scripts/shared/image2/page_image_target_runtime.mjs:709-734`

实际 submit factory：

- Style Master 是第一张 image: `ppt_maker_harness/scripts/ppt_flow.mjs:2253`
- identity reference 存在时追加第二张: `:2254-2255`
- prompt 使用 compiled provider input 原文: `:2258`
- images 被送入 provider body: `:2261-2263`

所以原 plan 的核心边界判断正确：**正文必须由 selected adapter 编译进去，不能在 runtime 或 submitter 补。**

### 7. 视觉问题真实存在，但因果需要收窄

当前 pilot 中：

- `NewPart` 被生成为圆头、带面板脸和耳罩的机器人吉祥物；
- `FramAut` 被生成为较写实的发光人形；
- 两者彼此不一致，也都偏离 reference 中无具体五官、内部节点网络清晰的人形光体。

同时，两页都明显偏离 accepted Style Master 的版画/素描语言，变成摄影感/3D 感画面。由此只能得出：

- identity semantic contract 当前不完整，必须修；
- 当前 provider 对 identity reference 与 Style Master 的遵循都不充分；
- 补 `role_clause` 是必要修复，但不是视觉一致性的数学保证。

原 plan 中“gpt-image-2 是 text-primary、reference 只是次要暗示”的说法没有 repo 内规范或受控实验支撑，也不是证明缺陷所必需。proposal 应删除这类 vendor 机理断言，改成可审计的本地事实。

## Findings

### P1. 现行 main spec 缺少 provider-facing identity 的明确合同

当前 `image-generation` main spec 只笼统要求 adapter 从 selected visual language 编译 immutable provider input：

- `openspec/specs/image-generation/spec.md:8-44`

当前 `visual-asset-management` main spec 只写到 registered roles 与 fingerprints：

- `openspec/specs/visual-asset-management/spec.md:43-52`

它们没有明确规定：

- selected `role_clause` 正文必须进入 compiled provider input；
- digest projection 与 provider-facing text 必须分层；
- 正文与 digest 必须一致；
- identity 缺失时正文必须为 `null`，反之亦然。

但历史 change 已经明确表达过该意图：

- `openspec/changes/archive/2026-08-02-fix-provider-clauses-and-visual-scene/specs/image-generation/spec.md:17-29`

该 archived delta 不是当前权威，但它证明这次是既有意图在后续 adapter/compiler 重构中丢失。若只改代码、不把合同重新写进 main spec，下一次收敛仍可能再次丢失。

**要求：** 新 change 至少修改：

- `image-generation`: compiled provider input 的 identity semantic contract；
- `visual-asset-management`: registered role clause、reference bytes、projection digest 的权威与配对规则。

只有在 resolver 输出形状也要修改时才需要动 `visual-config`。`image-production` 不拥有 provider-input 编译或 identity registry，本 change 不应修改它。

### P1. 不建议方案 A 先落地；直接完成干净分层

方案 A 会把正文加进 provider input，但继续把两个 SHA 暴露给 provider。它可以止血，却留下已知错误边界，并为后续 B 制造第二次 provider-input digest 漂移。

当前 compiled provider input 是 Derived Data，任何 A 或 B 都会改变 exact bytes、plan binding 与后续授权。既然 `v8` 本来就必须重新 plan / authorize / generate，分两步没有迁移收益，只有两轮失效和远端成本风险。

推荐一次性采用 provider-facing shape：

```json
{
  "profile": "amber-agent",
  "role": "guide",
  "subject_class": "amber-light-form",
  "identity_subject_count": "one",
  "subject_restrictions": "none",
  "role_clause": "one warm amber light-form gently leads, open palm, book held close, attentive head tilt"
}
```

Provider input 中不包含：

- `reference_sha256`
- `role_clause_sha256`
- physical path

这些 binding facts 继续留在：

- source receipt / Page Image Core visual selection；
- adapter raw contract；
- raw-contract digest；
- provider-input binding；
- authorization scope 与 evidence chain。

这不会损失 auditability，因为 `visual_selection_sha256`、raw-contract SHA 与 compiled-input SHA 已经绑定整条链。

### P1. 方案缺少正文与 projection 的 fail-closed 一致性校验

当前 Pure raw validator：

- `ppt_maker_harness/scripts/04-pure-image/index.mjs:198-208`

当前 Framed raw validator：

- `ppt_maker_harness/scripts/03-framed-image/index.mjs:241-251`

都只检查：

- clause 是 `string | null`；
- identity 是 `object | null`。

它们没有证明二者属于同一个 registered role。正文一旦真正驱动 provider，这个缺口就从“闲置字段校验不足”升级为 load-bearing contract 风险。

必须新增以下 invariant：

1. `visual_identity === null` 当且仅当 `visual_identity_role_clause === null`。
2. identity projection 使用 exact keys 和合法类型。
3. `sha256(visual_identity_role_clause) === visual_identity.role_clause_sha256`。
4. provider-facing identity 必须由这组已校验 raw facts确定性构造，不重新读 source/registry/path。
5. Framed compiled-input validator 必须比较新的 provider-facing identity，而不是继续比较 `rawContract.visual_identity`：
   `ppt_maker_harness/scripts/03-framed-image/internal/framed_provider_input_contract.mjs:67-73`。

不满足时应在 provider-free planning 阶段 hard-stop，不能发布 plan、授权或 provider request。

### P1. 当前测试没有覆盖“identity 存在且正文进入 compiled input”

现有 adapter 测试主要证明无 identity 时为 `null`：

- Pure: `tests/04-pure-image/test_pure_workflow.mjs:597-600`
- Framed: `tests/03-framed-image/test_framed_workflow.mjs:198-200`

Pure Page Image Core 测试会检查 compiled input 的 presentation / Framed isolation，却没有 identity-present 断言：

- `tests/04-pure-image/test_pure_page_image_core.mjs:220-233`

这正是回归可以通过测试的原因。

必须补 Pure / Framed 对称覆盖，见下文测试矩阵。

### P2. `role_clause` 修复应与 deck-specific 文案增强分开

当前 `guide` / `collaborating` clauses 主要描述姿态；稳定形态中的“无具体五官、内部节点网络、透明人形”等更强 invariant 主要存在于：

- `deck_ai_sdlc_keynote/2_backbone/visual-style/style-master-prompt.md:7`
- reference image bytes；
- 上游 `agent-portrayal.md`。

这些 prose 并不会自动进入 page provider input。恢复 `role_clause` 后，现有短句可能仍不足以让模型稳定保留全部形态。

但不要在 Harness change 中顺手修改 `v8` registry 文案：

- Harness change 修复 reusable contract；
- registry wording 属于 Run Bundle 的视觉内容权威；
- 两者同时改会使 pilot 无法区分“transport 修复”与“文案变化”的效果。

建议先用原 clause 验证 contract 修复。如果仍不一致，再做单独的 deck visual change。若多个 deck 都需要“profile invariant + role pose”双层文本，再另提 registry schema 设计；不要在本 change 中临时新增 profile clause。

### P2. 原 plan 对 `reference_transport` 的判断应收窄

对 identity-bearing 页，实际 transport 确实附加正确 reference image，因此本修复不需要让 runtime 重写 prompt。

但 `buildTargetRawGenerationProfile` 用“整份 receipt 是否任一页有 identity”设置 deck-wide：

- `ppt_maker_harness/scripts/shared/image2/page_image_target_runtime.mjs:681-686`

所以 `InfoRev` / `DeerVal` 这类无 identity 页的 compiled prompt 也带：

```json
"reference_transport": {
  "style_master": "image-reference",
  "identity_reference": "image-reference"
}
```

而 submit factory 只在该页有 `identityPath` 时附加第二张图。

这不解释 `NewPart` / `FramAut` 的身份漂移，也不应阻塞 role-clause 修复；但“reference_transport 完全没有问题”表述过强。应在 proposal 中把它记为独立 open observation：明确该字段表示 deck-level capability 还是 per-page actual presence，再决定是否单独修。不要在没有规范决定时顺手改 runtime。

### P2. 不要把全链路“哈希泄漏审计”塞进同一 change

本 change 应只关闭 identity provider boundary：正文进入 provider input、identity digests 留在 lineage。

可以在此次测试里断言 provider-facing identity 不含 `*_sha256`，但全系统的人类面/provider 面 hash audit 是另一项研究，范围包括 Style Master、inspection、diagnostics、Human Navigation 等多个 owner。把它并入会模糊完成条件。

## 推荐的目标合同

| 事实 / 行为 | 权威或 owner | 目标行为 |
|---|---|---|
| role reference bytes、role clause、subject compatibility | `image2-reference-material.yaml` + Visual Asset Management resolver | 严格解析、校验 bytes、规范化 clause、计算 digest |
| identity lineage projection | resolver / Page Image Core | 保留 profile、role、reference SHA、role-clause SHA、subject facts |
| raw contract | selected Pure / Framed adapter | 同时保留 projection 与 exact role-clause 正文，并验证配对 |
| provider-facing identity | selected Pure / Framed adapter compiler | 只含语义字段与 exact `role_clause`，不含 digest/path |
| compiled bytes | selected adapter | canonical、immutable、每页唯一 |
| submit | `ppt_flow` target submit factory | 原样提交 compiled bytes，并附加已绑定 Style Master / per-page identity image |
| acceptance | 人类 Complete Page Review / Pilot Review | 判断视觉是否实际保持 profile invariant；compiled contract 不代替视觉验收 |

关键 invariant：

```text
registered role clause
  == receipt provider_reference.role_clause
  == raw_contract.visual_identity_role_clause
  == compiled_provider_input.visual.identity.role_clause

sha256(registered role clause)
  == projection.role_clause_sha256
```

## 推荐实施切片

### 1. 先做 OpenSpec change

新增/修改场景至少包括：

1. identity-present Pure request 带 exact registered role clause。
2. identity-present Framed request 带同形 exact registered role clause。
3. provider-facing identity 不含 physical path 或 identity digest 字段。
4. no-identity 页编译为 `identity: null`。
5. clause/projection null 不对称或 digest 不匹配时，provider-free planning fail closed。
6. transport 提交 exact adapter bytes，不重读 registry 或补写正文。
7. role clause 改变时 compiled-input digest 改变，并进入 Generated Image Rebuild。

### 2. 修改 adapter，不修改 transport ownership

主要代码面：

- `ppt_maker_harness/scripts/04-pure-image/index.mjs`
  - 强化 Pure raw-contract identity 校验；
  - 在 `compilePureProviderInput` 构造干净 provider identity。
- `ppt_maker_harness/scripts/03-framed-image/index.mjs`
  - 强化 Framed raw-contract identity 校验；
  - 在 `compileFramedProviderInput` 构造同形 provider identity。
- `ppt_maker_harness/scripts/03-framed-image/internal/framed_provider_input_contract.mjs`
  - 更新 exact compiled-input 对照。

`Page Image Core` 的架构测试明确要求 provider-input compilation 留在 selected adapters：

- `tests/contracts/test_harness_architecture.mjs:207-224`

因此不要把完整 identity compiler 移到 shared runtime / Core。两个 adapter 可各有一个很小的 private deterministic builder，并用对称 contract tests 防止漂移。

`page_image_target_runtime.mjs` / submit factory 对本缺陷无需改动；它们继续只做 opaque binding 与 exact transport。

### 3. 测试矩阵

| 层 | 必须证明 |
|---|---|
| Visual Asset unit | role clause 规范化；reference SHA；role-clause SHA；不合法 clause/path/bytes fail closed |
| Pure integration | raw contract 有正文+projection；compiled identity 有正文、无 SHA/path；provider body prompt 等于 compiled bytes |
| Framed integration | 与 Pure 相同；同时保留 protected composition / restriction invariant |
| Negative raw contract | identity/clause null 不对称、clause tamper、digest mismatch、identity projection key drift 均拒绝 |
| Framed compiled validator | 缺正文、正文被改、重新塞回 digest、非 canonical bytes 均拒绝 |
| No-identity regression | `identity: null`；不产生 role clause；现有非 identity request bytes 除预期字段外不漂移 |
| Invalidation | role clause 改变会改变 compiled-input SHA，旧 plan/evidence 不可继续复用 |
| Mock transport | identity 页 body 有两张 image；无 identity 页只有 Style Master；prompt 始终是 exact compiled bytes |

不需要 live provider 测试来证明合同正确；live pilot 只用于验证模型视觉效果。

## `v8` 的落地影响

当前 `v8` 已有旧 compiler 产生的 current raw plan 和 4 个 materialized pilot item，但还没有 pilot decision、accepted raw evidence、final manifest 或 delivery receipt。

Harness 修复后：

- identity 页的 compiled provider-input SHA 必然变化；
- current raw plan / batch / grant / pilot evidence 不能被手改或迁移成新请求；
- 必须由 owner 重新发布计划并走新的授权与 generation；
- exact rebuild scope 由新 plan/owner 给出，不从旧 artifact 猜；
- `_generated/` 不手改；旧 pilot 只保留为历史失败观察。

这也是不建议 A 后 B 的现实原因：每次 provider identity shape 变化都会造成新的 request digest 与远端重建成本。

建议修复验证继续使用同一 pilot 集：

- `InfoRev`：无 identity control；
- `NewPart`：`amber-agent/guide`；
- `DeerVal`：无 identity control；
- `FramAut`：`amber-agent/collaborating`。

机器验收：

- 两个 identity 页 compiled prompt 含 registry exact clause；
- identity object 不含 SHA/path；
- reference image SHA 与 receipt 绑定一致；
- 两个 control 页 `identity: null`。

人类视觉验收：

- `NewPart` 与 `FramAut` 明显是同一个 profile 的主体；
- 稳定保留约定的形态 invariant，role 只改变姿态/动作；
- 不再出现“机器人吉祥物 vs 发光人形”的主体切换。

Style Master 的版画/素描遵循是同一 pilot review 中的独立质量维度，不能把 role-clause 修复的成功等同于整个视觉系统已恢复。

## 对原 plan 四个开放问题的回答

1. **A 还是 B？** 直接 B。保留 lineage digests，但从 provider-facing identity 移除；不要 A 后 B。
2. **同时改 registry 文案吗？** 不在 Harness change 中改。先验证 exact clause transport；必要时另做 `v8` visual source change。
3. **顺带全链路 hash audit 吗？** 不并入。本 change 只加 provider identity 无 digest 的断言；全链路另立研究/plan。
4. **需要改 runtime/core 吗？** 本缺陷不需要。需要改两个 adapter 与 Framed compiled validator；Pure/Framed raw identity guards 必须加强。`reference_transport` 的 deck-wide/per-page 语义另行决策。

## 最终建议

可以基于原 plan 进入 OpenSpec，但 proposal 应改写为：

> 恢复 registered identity role clause 到 selected adapter 的 canonical provider input；在 raw/core lineage 中保留 digest；对 clause/projection 配对 fail closed；Pure/Framed 采用同一 provider-facing identity shape；现有 provider transport、source schema、state 与 reference bytes attachment 不变。

满足以下条件后，我认为可以批准实施：

- main spec 明确 provider-facing identity contract；
- 选择一次性干净分层，不保留临时 A 状态；
- identity clause/digest/null pairing 有机械 guard；
- Pure/Framed identity-present tests 与 negative tests 完整；
- `v8` 的旧 pilot 失效与新授权/重建路径写进 change 的 migration / verification。
