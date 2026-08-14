# Plan: 让 identity subject 的 role_clause 正文进入 provider prompt

> 类型: 设计 / 分析 | 更新: 2026-08-14 | 状态: 待 review（尚未提案，本文为上下文交接 + 推荐，不是最终 change）

---

## 一句话

amber-agent 这类「重复视觉主体」（identity subject）在跨页渲染时不一致，根因是 harness 在**编译 provider input 时，把该给 provider 的 role_clause 正文（内容）替换成了它的哈希（lineage digest），正文根本没送到 provider**。本文讲清现状、根因、思考与精确改动位置，供另一个 Agent review 后决定怎么落地。

---

## 背景 / 现状

### 触发问题

`deck_ai_sdlc_keynote` 从旧 harness 迁移到新 harness 的 v8（`page-image-workflow` + **pure**）。deck 里有一个贯穿全场的「AI 伙伴」形象（amber-agent），由 `2_backbone/visual-style/assets/reference/amber-agent/` 定义：

- `model-sheet.png`（教义多姿态图，SHA 与 harness 硬编码校验值一致）
- `guide.png` / `collaborating.png`（角色衍生图）
- `image2-reference-material.yaml`（8 个 role + 各自 role_clause 正文）

pilot 跑了 4 页（`InfoRev`/`NewPart`/`DeerVal`/`FramAut`），其中 2 页带 agent（`NewPart`=`amber-agent/guide`，`FramAut`=`amber-agent/collaborating`）。**用户 review 发现：agent 形象跨页不一致。**

### 为什么这是个通用问题

「重复视觉主体必须跨页一致」是 deck 制作的通用难题：品牌吉祥物、产品 mockup、贯穿全程的引导角色、客户画像……任何 deck 都可能有。新 harness 已经为它设计了 `identity-subject / reference-material` 能力（定义一次、逐页 `VISUAL IDENTITY` 引用），但**这个能力只接了一半线**——参考图到了 provider，文字描述没到。所以任何用这个能力的 deck 都会踩同一坑，本 deck 只是第一个撞上。

---

## 根因分析（核心）

identity subject 这个 asset 本质是**两半**：

| 半 | 内容 | 现在到 provider 了吗 |
|---|---|---|
| 视觉半 | `guide.png` 参考图 | ✅ 到了（`images = [style_master, guide.png]`，`reference_transport.identity_reference = "image-reference"`） |
| 文字半 | role_clause 正文，如 `"one warm amber light-form gently leads, open palm, book held close, attentive head tilt"` | ❌ **没到** —— 只发了 `role_clause_sha256` 哈希 |

gpt-image-2 是 **text-primary** 模型：主要靠 prompt 文字决定画什么，参考图是次要风格暗示。文字半缺失 → 只剩「一张参考图 + 一个模糊的 `amber-light-form` 标签」→ 模型自由发挥 → 跨页不一致。

### 病根不是「用了哈希」，是「在 provider 边界把内容错换成了哈希」

harness 其实**正文和哈希两样都算了**。身份解析返回两个对象（见下），编译时**拿错了对象**：把 lineage 对象（projection，含哈希）序列化进了 provider input，把 provider 对象里的正文丢了。

类比：哈希像收据上的校验码/追踪号，用来事后核对「东西是否原样」。它不该被写进给供应商的工单——工单要写物品描述（正文），校验码留给自己核对。这次 = 把追踪号写进工单、把物品描述扔了。

---

## 现状代码行为（精确到文件:行）

### 身份解析：两个对象，一个 lineage、一个 provider

`ppt_maker_harness/scripts/02-visual-system/internal/page_image_reference_material.mjs`

- `resolvePageImageIdentityReference`（约 L260–300）返回两个对象：
  - `projection` = `{ profile, role, reference_sha256, role_clause_sha256, subject_class, identity_subject_count, subject_restrictions }` —— **lineage 对象（全是哈希）**
  - `provider_reference` = `{ path, sha256, role_clause }` —— **provider 对象（正文 + 路径）**
- `createPageImageSourceResolver`（约 L303–328）把两者一起挂到 visual selection：`identity_reference: { projection, provider_reference }`。

### pure 适配器：正文算了、但没编进 prompt

`ppt_maker_harness/scripts/04-pure-image/index.mjs`

- `pureRawContract`（约 L626–668）：
  - L642 读出正文：`identityRoleClause = …provider_reference.role_clause`
  - L649 存进 raw contract：`visual_identity_role_clause: identityRoleClause`
  - L651 存进 raw contract：`visual_identity: …identity_reference.projection`（lineage 对象）
- `compilePureProviderInput`（约 L671–696）：`visual.identity: rawContract.visual_identity`（**用的是 projection=哈希**），**没有引用** `visual_identity_role_clause`（正文）。

→ 结论：正文在 raw contract 里算出来、校验过了，但 `compilePureProviderInput` 没把它序列化进 `visual.identity`，provider 只拿到哈希。

### framed 适配器：完全对称，同样的病

`ppt_maker_harness/scripts/03-framed-image/index.mjs`

- raw contract（约 L836–845）：`visual_identity_role_clause`（正文）+ `visual_identity`（projection）并存。
- `compileFramedProviderInput`（约 L865–890）：`visual.identity: rawContract.visual_identity`，同样丢正文。

### 实测证据（dump 自 NewPart 的 compiled provider input）

provider prompt 的 `visual.identity` 实际内容是：

```json
"identity": {
  "profile": "amber-agent",
  "role": "guide",
  "reference_sha256": "cb81bcc0…",
  "role_clause_sha256": "54ee33a7…",
  "subject_class": "amber-light-form",
  "subject_restrictions": "none"
}
```

—— 有哈希、有 `amber-light-form` 标签，**没有 role_clause 正文**。

参考图传输本身没问题：`page_image_target_runtime.mjs` L681–686 已把 `identity_reference` 标为 `image-reference` 并随图发送，无需改动。

---

## 思考 / 判断（供 review，非定论）

1. **哈希对机器是必要的、对人是要隐藏的**。三处 load-bearing 用途不能拆：溯源/防漂移（`source_sha256`→receipt→final 的收据链）、授权绑定（`plan_sha256`/`batch_sha256`/`grant_hash`）、参考物校验（`model-sheet.png` SHA 硬编码校验）。但哈希**只该待在机器层**，人类面 + provider 面都该是「正文 + 语义名」。这次 role_clause 哈希漏进 provider prompt，正是「哈希逃出机器层」的一个实例。

2. **编译 provider input 必须自洽完整**：provider 需要什么正文就带什么正文；digest 只属于 lineage/binding，不该混进 provider input。按这个原则扫整条 `compileProviderInput` 路径，可能还有别的「内容被 digest 顶掉」的点。

3. **改动应是 additive 且窄**：只在 provider 边界「发正文、留哈希」。不动 source schema、state contract、reference material 格式、参考图传输。

---

## 方案（推荐 + 备选，待 review 定夺）

### 推荐：窄修，provider 边界发正文

在 `compilePureProviderInput` / `compileFramedProviderInput` 里，把 `visual.identity` 补上 role_clause 正文，让 provider 拿到「正文 + 语义名」。两个变体：

- **A. 保守（additive）**：在 `visual.identity` 里**追加** `role_clause` 正文，`role_clause_sha256`/`reference_sha256` 照留。改动最小、零风险。
- **B. 干净（refactor）**：把 provider input 的 `visual.identity` 重构成纯 provider-facing（`role_clause` 正文 + `profile`/`role`/`subject_class`），把两个 sha256 从 provider input 移除、留在 raw contract 的 binding 层。语义更对，但改动面稍大。

**倾向 A 先落地**（风险最低、立刻能验证 agent 一致性），「哈希是否该从 provider prompt 移除」记为独立小 refactor。

### 备选（不推荐，记录理由）

- **source 层把 agent 描述塞进 recipe provider_clause**：会泄漏到无 agent 页（`OneTool` 也用 `collaborative-work` 但无 agent），且混淆「场景意象」与「identity subject」两个概念。**不推荐**。
- **重生成参考图**：治标不治本，模型仍缺文字锚。**不推荐**。

---

## 改哪里 / 输入输出（精确）

### 改动文件与位置

| 文件 | 位置 | 改动 |
|---|---|---|
| `ppt_maker_harness/scripts/04-pure-image/index.mjs` | `compilePureProviderInput`（~L671–696） | `visual.identity` 补上 role_clause 正文（方案 A：追加字段；方案 B：重构对象） |
| `ppt_maker_harness/scripts/03-framed-image/index.mjs` | `compileFramedProviderInput`（~L865–890） | 同上，对称改动，避免两处漂移 |

可能连带：`02-visual-system/internal/page_image_reference_material.mjs` 的 `projection`/`provider_reference` 拆分（如果走方案 B，决定 provider input 到底序列化哪个对象）。

### 输入 / 输出

- **输入**：`visual_identity_role_clause`（role_clause 正文）—— 已在 `pureRawContract`/framed raw contract 里算好，无需新增计算。
- **输出**：`compiled provider input`（`page-image-pure-provider-input` / `page-image-framed-provider-input`）的 `visual.identity` 应携带 role_clause 正文，而非只有 `role_clause_sha256`。
- **不动的**：`reference_transport`（参考图照发）、source schema、state contract、reference material 格式、`image2-reference-material.yaml` 内容。

---

## 风险 / 取舍

- [role_clause 正文变 provider-visible] → 无新增负担：它本来就 provider-facing（已过 `normalizePageImageVisualClause` 校验：ASCII、无禁用词），作者无需学新东西，只是现在**真的会生效**。
- [仍可能有模型方差] → 这是缓解而非保证：给 gpt-image-2 一个强文字锚，一致性显著变好，但不消除所有方差。
- [两 adapter 漂移] → 必须 pure/framed 同步改，并加针对性测试覆盖。
- [只惠及用 identity-subject 的 deck] → 无重复角色的 deck 不受影响，符合预期。

---

## 落地关联

- 结论落地走 `openspec/changes/`，不直接改代码。
- 相关 capability spec（review 时先读）：
  - `openspec/specs/image-generation/spec.md`（provider input 编译）
  - `openspec/specs/visual-config/spec.md`（visual-language / reference material）
  - `openspec/specs/image-production/spec.md`（pure/framed adapter 的 raw contract / finalization）
- 测试：`npm test`（core）；针对性单测覆盖「compiled provider input 的 `visual.identity` 含 role_clause 正文」的序列化断言。

---

## 给 review Agent 的开放问题

1. 方案 A（保守追加正文）还是 B（重构 provider input 把哈希移出）？或先 A 后 B 分两步？
2. `role_clause` 正文进入 provider prompt 后，是否需要同时调整 `image2-reference-material.yaml` 里 role_clause 的措辞（现在是简洁的英文短句，够不够强？）？
3. 是否顺带做一次「哈希漏进 provider 面 / 人类面」的全链路审计（本计划第「思考 2」提到的可能还有别的泄漏点）？
4. 改动是否还需要碰 `page_image_target_runtime.mjs` 或 `page_image_core.mjs`（目前看不需要，但 review 时确认 provider input 的 schema 校验是否有「未知字段拒绝」需要同步放行新字段）？
