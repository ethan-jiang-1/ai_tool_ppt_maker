# Plan: 让 identity subject 的 role_clause 正文进入 provider input

> 类型: 设计 / 分析 | 更新: 2026-08-15 | 状态: 已 review，待 OpenSpec proposal
>
> Review 记录: [`identity-role-clause-provider-input.review.md`](identity-role-clause-provider-input.review.md)

---

## 决策摘要

这是一个 **Harness provider-facing semantic contract regression**，不是
`deck_ai_sdlc_bpm_keynote` 的局部 prompt 调参问题。

Visual Asset Management resolver、Page Source Receipt 和 Pure / Framed raw contract
都已经保留 registered identity role 的 reference bytes、`role_clause` 正文和 digest；
但两个 adapter 在编译 provider input 时只序列化 lineage projection，导致
`role_clause` 正文被丢弃，provider 只看到语义标签和 SHA。

本 plan 采用以下最终方案：

1. **直接采用干净分层方案 B，不先落方案 A。**
2. Provider-facing identity 只包含语义字段和 exact `role_clause`，不包含 SHA 或物理路径。
3. Reference SHA、role-clause SHA 和其他 binding facts 继续保留在 receipt、Core、raw contract、authorization 与 evidence lineage。
4. Pure / Framed adapter 必须在 provider-free planning 阶段验证 clause、projection 和 digest 的配对；不一致时 fail closed。
5. Provider input compilation 继续由 selected adapter 拥有；Page Image Core、shared runtime 和 submitter 不补写正文。

`role_clause` 缺失是已确认且必须修复的合同缺陷，也是当前跨页身份漂移的重要原因；
但它不是视觉一致性的充分条件，最终效果仍需 pilot 人类验收。

---

## 背景与已确认事实

`deck_ai_sdlc_bpm_keynote/3_versions/v8` 是当前有效的 Pure run：

- workflow: `page-image-workflow` / `pure`
- `source_epoch: 1`
- raw plan: 25 页
- 已 materialize pilot: `InfoRev`、`NewPart`、`DeerVal`、`FramAut`
- 尚无 pilot decision、accepted raw evidence、final manifest 或 delivery receipt

其中：

- `NewPart` 使用 `amber-agent/guide`
- `FramAut` 使用 `amber-agent/collaborating`
- `InfoRev`、`DeerVal` 是无 identity 的 control 页

两张 identity pilot 图出现了明显的 profile 漂移：一张接近机器人吉祥物，另一张接近写实发光人形。
这证明视觉结果不一致，但不能单凭当前样本断言缺少 `role_clause` 是唯一原因。

### Harness 中的缺陷链

1. `page_image_reference_material.mjs` 的 resolver 同时产生：
   - lineage `projection`：profile、role、reference digest、role-clause digest 和 subject facts；
   - `provider_reference`：reference path、reference digest 和 exact `role_clause` 正文。
2. Pure raw contract 把正文写入 `visual_identity_role_clause`，把 projection 写入
   `visual_identity`。
3. Framed raw contract 做同样处理。
4. `compilePureProviderInput` 和 `compileFramedProviderInput` 都直接把
   `rawContract.visual_identity` 作为 `visual.identity`，没有使用正文。
5. Runtime 原样提交 adapter 编译出的 canonical bytes，并按页附加 identity reference image；
   它不会也不应重新读取 registry 或改写 prompt。

因此，缺陷 owner 是 **Pure / Framed adapter 的 provider-input semantic contract**。

---

## 目标合同

### Provider-facing identity

identity 存在时，两个 adapter 必须编译出同形、canonical 的对象：

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

Provider-facing identity 不得包含：

- `reference_sha256`
- `role_clause_sha256`
- reference physical path
- 其他只用于 lineage、binding 或授权的字段

identity 不存在时：

```json
{
  "identity": null
}
```

不得生成空字符串、空对象或孤立的 `role_clause`。

### 权威与 ownership

| 事实 / 行为 | 权威或 owner | 目标行为 |
|---|---|---|
| role reference bytes、role clause、subject compatibility | registered reference material + Visual Asset Management resolver | 严格解析、规范化、校验 bytes，并计算 digest |
| identity lineage projection | resolver / Page Image Core | 保留 profile、role、reference SHA、role-clause SHA 和 subject facts |
| adapter raw contract | selected Pure / Framed adapter | 同时保留 exact clause 与 projection，并验证二者配对 |
| provider-facing identity | selected adapter compiler | 只包含语义字段和 exact clause，不包含 SHA/path |
| compiled provider bytes | selected adapter | canonical、immutable、按页唯一并进入 plan binding |
| provider submit | target submit factory | 原样提交 compiled bytes，并附加已绑定的 Style Master / per-page identity image |
| 视觉验收 | 人类 Complete Page Review / Pilot Review | 判断主体 profile 和 role 表现是否实际一致 |

### Load-bearing invariants

Raw identity projection 的 exact shape 为：

| 字段 | 合法值 |
|---|---|
| `profile` | non-empty lower-kebab ID |
| `role` | non-empty lower-kebab ID |
| `reference_sha256` | 64 位 lowercase hex SHA-256 |
| `role_clause_sha256` | 64 位 lowercase hex SHA-256 |
| `subject_class` | non-empty lower-kebab ID |
| `identity_subject_count` | exact literal `one` |
| `subject_restrictions` | source contract 支持且 resolver 已确认 compatible 的 restriction literal |

不得接受额外字段、缺失字段或宽松类型转换。

Raw contract validation 必须证明：

1. `visual_identity === null` 当且仅当
   `visual_identity_role_clause === null`。
2. identity projection 使用当前合同规定的 exact keys 与合法类型；额外、缺失或类型错误字段均拒绝。
3. `sha256(visual_identity_role_clause) === visual_identity.role_clause_sha256`。
4. Provider-facing identity 只能由已验证的 raw facts 确定性构造，不重新读取 source、registry 或 path。
5. 编译结果中的语义字段必须与 projection 相同，`role_clause` 必须与 raw contract 正文逐字相同。
6. 编译结果不得重新暴露 identity digest 或 path。
7. 任一 invariant 失败时，必须在发布 plan、授权或 provider request 之前 hard-stop。

完整一致性链为：

```text
registered role clause
  == receipt provider_reference.role_clause
  == raw_contract.visual_identity_role_clause
  == compiled_provider_input.visual.identity.role_clause

sha256(registered role clause)
  == projection.role_clause_sha256
```

---

## OpenSpec 范围

新 change 必须修改：

- `openspec/specs/image-generation/spec.md`
  - 明确 identity-present / no-identity 的 compiled provider-input contract；
  - 明确 provider input 不含 digest/path；
  - 明确 adapter compilation 与 exact transport ownership；
  - 明确 role clause 变化会改变 compiled-input digest 并触发 Generated Image Rebuild。
- `openspec/specs/visual-asset-management/spec.md`
  - 明确 registered role clause、reference bytes、projection digest 的权威与配对规则；
  - 明确 clause / reference / projection 校验失败时 fail closed。

仅当 proposal 决定改变 resolver 输出形状时，才修改：

- `openspec/specs/visual-config/spec.md`

本 change 不修改：

- `openspec/specs/image-production/spec.md`
- source schema 或 state contract
- reference-material 文件格式
- Page Image Core ownership
- runtime / submitter 的 prompt rewrite 行为

---

## 实施范围

### Pure adapter

`ppt_maker_harness/scripts/04-pure-image/index.mjs`

- 强化 raw-contract identity validator，加入 null pairing、exact projection 和 digest match。
- 在 `compilePureProviderInput` 内由已验证 raw facts 构造干净的 provider-facing identity。
- 不从 resolver、registry 或文件系统重新取值。

### Framed adapter

`ppt_maker_harness/scripts/03-framed-image/index.mjs`

- 加入与 Pure 对称的 raw-contract identity validator。
- 在 `compileFramedProviderInput` 内构造与 Pure 同形的 provider-facing identity。
- 保持现有 protected composition / restriction invariants。

`ppt_maker_harness/scripts/03-framed-image/internal/framed_provider_input_contract.mjs`

- 更新 exact compiled-input 对照，使其验证新的 provider-facing identity。
- 拒绝正文缺失、正文篡改、digest/path 回流和非 canonical bytes。

两个 adapter 可以各自使用小型 private deterministic builder，但不得把完整 compiler
逻辑移动到 Page Image Core 或 shared runtime。Pure / Framed 的一致性由对称 contract tests
守住。

### 明确不改

- `page_image_target_runtime.mjs`
- `ppt_flow.mjs` submit factory
- `page_image_core.mjs`
- `deck_ai_sdlc_bpm_keynote` 的 registry role-clause 文案
- `v8/_generated/` 下的任何文件

---

## 必须覆盖的测试

| 层 | 必须证明 |
|---|---|
| Visual Asset unit | clause 规范化、reference SHA、role-clause SHA 正确；非法 clause/path/bytes fail closed |
| Pure identity-present | raw contract 有正文 + projection；compiled identity 有 exact 正文且无 SHA/path |
| Framed identity-present | 与 Pure 同形；同时保留 Framed composition / restriction invariants |
| Negative raw contract | identity/clause null 不对称、clause tamper、digest mismatch、projection key drift 均拒绝 |
| Framed compiled validator | 缺正文、正文被改、digest/path 回流、非 canonical bytes 均拒绝 |
| No-identity regression | `identity: null`，不产生 role clause；非 identity request 不发生无关漂移 |
| Invalidation | role clause 变化会改变 compiled-input SHA，旧 plan/grant/evidence 不可复用 |
| Mock transport | identity 页附加两张 image；无 identity 页只有 Style Master；prompt 等于 exact compiled bytes |
| Architecture guard | provider-input compilation 继续位于 selected adapters，不进入 Core/shared runtime |

合同正确性不依赖 live provider test；live pilot 只用于验证视觉结果。

---

## `v8` 迁移与验证

Harness 修复会改变 identity 页的 compiled provider-input bytes，因此旧 compiler 产生的
plan、batch、grant 与 pilot evidence 不能被手改、嫁接或视为新请求的授权依据。

落地规则：

1. 保留当前四张 pilot 作为历史失败观察，不修改 `_generated/`。
2. 不复用旧 plan hash、batch hash、grant 或 evidence。
3. 由 owner 基于修复后的 compiler 发布 fresh exact plan，并重新授权 generation。
4. Exact rebuild scope 以新 plan / owner decision 为准，不从旧 artifact 推断。
5. Harness 修复本身不修改 `v8` source/state；如果 source 未变，不能擅自改写
   `source_epoch: 1`。
6. 首轮验证保留 registry 现有 role-clause 文案，以隔离“合同修复”和“deck 文案调整”的效果。

建议继续使用原 pilot 集：

- `InfoRev`：无 identity control
- `NewPart`：`amber-agent/guide`
- `DeerVal`：无 identity control
- `FramAut`：`amber-agent/collaborating`

机器验收：

- 两个 identity 页的 compiled prompt 含 registry exact clause。
- identity object 不含 SHA/path。
- reference image SHA 仍与 receipt / lineage 绑定一致。
- 两个 control 页为 `identity: null`。
- provider body prompt 与 adapter compiled bytes 完全相同。

人类视觉验收：

- `NewPart` 与 `FramAut` 可辨认为同一个 identity profile。
- profile 的稳定形态不因页面切换而变成不同主体。
- role 只改变姿态、动作和交互语义。

Style Master 的版画/素描遵循是独立质量维度，不能把 role-clause 合同修复通过等同于
整个视觉系统已经通过。

---

## 非目标与后续事项

以下事项与本缺陷分开处理，不能扩大本 change：

- **Deck-specific role-clause 文案增强**：先验证 exact clause transport；若仍不稳定，再作为
  `v8` visual source change 单独处理。
- **全链路 hash 泄漏审计**：本 change 只断言 provider-facing identity 不含 digest；其他人类面或
  provider 面另立研究。
- **`reference_transport.identity_reference` 的 deck-wide / per-page 语义**：这是独立规范决策，
  不阻塞本修复，也不在 runtime 中顺手改。
- **更强的 profile invariant schema**：若多个 deck 证明单个 role clause 不足，再单独设计；
  本 change 不临时新增 profile clause。

---

## Proposal 完成条件

OpenSpec proposal 只有同时满足以下条件才可进入实施：

- main specs 写明 provider-facing identity 合同与权威分层；
- 直接采用方案 B，不保留 A 的临时 SHA 泄漏状态；
- clause / projection / digest / null pairing 有机械 fail-closed guard；
- Pure / Framed identity-present、no-identity 与 negative tests 对称完整；
- transport 继续提交 exact adapter bytes，不补写正文；
- `v8` 的旧 pilot 失效、新 plan、重新授权和重建路径被明确记录。

---

## 实施状态与 v8 交接（2026-08-15）

这份清单把 **Harness 修复** 与 **v8 deck 生产** 明确分开。Harness change
已经完成并归档；v8 的后续由新的 deck Agent 依据当前 State 接手，不是本
Harness change 的未完成项。

### Harness / OpenSpec：已完成

- [x] 完成并 review 方案 B：provider-facing identity 只保留六个语义字段，包含 exact `role_clause`，不暴露 SHA 或物理路径。
- [x] Visual Asset resolver contract tests 覆盖正常解析和非法 profile/role/path/bytes/clause/compatibility 的 fail-closed 行为；无需改变 registry schema 或 resolver output shape。
- [x] Pure adapter 在 raw-plan 发布前校验 identity/clause null pairing、七字段 lineage projection、合法值和 UTF-8 clause digest，并编译六字段 provider identity。
- [x] Framed adapter 实现同等 raw validation；其 exact compiled-input validator 复用语义 identity 构造并拒绝 clause 缺失、SHA/path 回流、额外字段和非 canonical bytes。
- [x] 覆盖 Pure / Framed 的 identity-present、no-identity、tamper、stored projection-only plan、transport、invalidation 和架构边界测试。
- [x] 通过 `npm test`、串行 `test:sweep`（69 files / 571 tests）、严格 OpenSpec validation 和 `git diff --check`。
- [x] 同步 `image-generation` 与 `visual-asset-management` main specs，并归档为 `2026-08-15-restore-identity-role-clause-provider-input`。

### v8 deck：不属于 Harness change，交给新的 Deck Agent

- [x] 依据修复后的 compiler 发布 fresh Pure plan；旧 plan/grant/evidence 未被复用。
- [x] 重新生成并人类 `proceed` 了 4 页 Pilot：`InfoRev`、`NewPart`、`DeerVal`、`FramAut`。
- [x] 当前 Expansion scope 和其 exact grant 已由 owner 记录。
- [ ] 当前 State 有 25 页中的 12 页 materialized、13 页 unsubmitted；新的 Deck Agent 必须从 `ppt_flow state <run-dir> --json` 的 owner action 继续，不能根据本清单或旧 artifact 猜下一步。
- [ ] 完成 Expansion 的剩余逐页 generation，并在每次生成后刷新 owner inspection。
- [ ] 准备并完成全部 25 页的 Complete Page Review；人类决定 `proceed` 或 `repair`，不能由合同测试或本 Pilot 代替。
- [ ] 在 accepted raw evidence 后，由各自 owner 发布 final manifest、delivery media、PPTX、notes 和 delivery review。
- [ ] 若 identity 的实际视觉稳定性仍不够，作为独立的 v8 visual-source change 处理；不得回头扩大本 Harness change 或手改 `_generated/`。

### 交接边界

- [x] Harness source、OpenSpec main specs 和测试的变更已经完成；没有待实现的 Harness code item。
- [ ] 新 Deck Agent 只对 `deck_ai_sdlc_bpm_keynote/3_versions/v8` 的当前 State 与后续 visual review 负责，不应修改 Harness 来追逐单个 deck 的视觉结果。
