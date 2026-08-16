# Plan: provider prompt 超长（4000 字符墙）——harness 把内部元数据也发给了 provider

> 类型: 设计 / 复盘（postmortem） | 更新: 2026-08-15 | 状态: 待 OpenSpec change 实施

## 一句话

`page-image-workflow`（Pure/Framed）把**整段编译后的 JSON**（含大量 provider 根本不需要的内部元数据：`generation_profile` 的 sha256/provenance、`page_presentation` 的 provenance 文件路径与 `binding_sha256`）原样当 `prompt` 发给 Image2 provider。而实际 provider（`micuapi.ai` 的 `gpt-image-2`）有 **4000 字符硬上限**。结果：`design_system`（deck 级共享设计系统文本）+ `identity role_clause`（amber-agent 描述）这两个「让 V8 逼近 V1」的新增 provider 输入，一注入就把 prompt 撑爆，绝大多数页面（含 5 个带 agent 的页面）直接 400。

**目标**：把发给 provider 的 prompt 精简为「仅 provider 相关字段」，内部元数据留在本地、不进 prompt；从而在 4000 字符预算内装下 V1 的完整设计系统文本（~3200 字符）+ identity role_clause，且不破坏现有 exact-byte lineage / authorization / invalidation。

---

## 背景 / 现状（触发问题）

`deck_ai_sdlc_keynote` v8（新 harness `page-image-workflow` + `pure`）出图质量离 V1 有明显距离。根因已定位：V1 每页 prompt 带一段 ~3200 字符的 deck 专属共享设计系统文本（字体硬规则、CJK 可读性、文图比、色系/禁用清单、调性等），新 harness 丢掉这层。于是做了两个 harness change 把它补回来：

1. `restore-identity-role-clause-provider-input`（已合入，`9004e98`）——把 agent 页的 `identity role_clause` 完整正文注入 provider input。
2. `add-page-design-system-provider-input`（已合入，`a8ecfab`）——新增 deck 级 `page-design-system.md` 源，解析成 `design_system` 字段逐字注入每页 provider input。

这两步方向正确，但**撞上了 provider 的 prompt 长度墙**——因为 prompt 里还塞着大量 provider 用不到的内部元数据。

### 实测证据（已用真实 provider 验证）

- provider：`https://www.micuapi.ai/v1`，model `gpt-image-2`。
- **硬上限 = 4000 字符**（逐字测试：`prompt` 4000 字符 → 200；4001 字符 → 400 `"Prompt too long (4001 chars, max ~4000)"`）。
- 以 `InfoRev`（最简单封面页，无 agent）为例，当前完整 prompt（含 `design_system` 4215 字符）**7483 字符**；去掉 `design_system` 后 **3223 字符**。
- `InfoRev` 的 3223 字符构成：

| 字段 | 字符数 | provider 是否需要用 |
|---|---|---|
| `generation_profile`（style master 的 sha256/provenance/candidate 元数据） | ~1057 | ❌ 纯内部；style master 已作为 reference **图片**（`images` 字段）单独发送 |
| `page_presentation`（含 `provenance` 文件路径、`binding_sha256`、`profile`） | ~1227 | ⚠️ 只有 `profile`（typography/colour/layout）有意义，`provenance`/`binding_sha256` 是内部 |
| `instruction` | 228 | ✅ |
| `provider_rendered_content`（header + body 文字） | ~260 | ✅ |
| `visual`（recipe/composition/motifs/relationship/identity 子句） | ~290 | ✅ |
| `design_system` | 4215 | ✅（但超预算） |
| `schema`/`slide_id`/JSON 结构 | ~41 | ❌/无害 |

- **5 个带 agent 的页面，即使完全不注入 `design_system` 也已经超 4000**（因为 `identity role_clause` 每个约 530–600 字符）：

```
OnLoop  4064  (+64 超)
TwoRiv  4064  (+64)
AllNem  4053  (+53)
InfoProc 4024  (+24)
FramAut 4014  (+14)
```

- 结论：provider 相关内容（instruction + content + visual clauses）只有 ~780 字符；内部元数据吃掉了 ~2400 字符；导致 `design_system` + `identity` 合计只剩 ~820 字符预算，而 V1 的设计系统块就 ~3200 字符。**deck 级 source 怎么压缩都补不回来**（`design_system` 压到 0，agent 页仍超 4000）。

---

## 根因（精确到代码）

1. `ppt_maker_harness/scripts/04-pure-image/index.mjs` 的 `compilePureProviderInput()`（~L739）把整份 `canonicalJson({ schema, slide_id, instruction, design_system, provider_rendered_content, visual, page_presentation: rawContract.page_presentation, generation_profile: generationProfile })` 当作「provider input」，其中 `page_presentation` 和 `generation_profile` 是内部事实。
2. `ppt_maker_harness/scripts/03-framed-image/index.mjs` 的 `compileFramedProviderInput()` 结构对称（同样带 `page_presentation` + `generation_profile`）。
3. `ppt_maker_harness/scripts/ppt_flow.mjs` 的 `targetPageImageSubmitFactory()`（~L2307）构造请求体：`prompt: boundRequest.compiled_provider_input.utf8`——**把整段 compiled input 原样当 prompt** 发出去。

所以「provider input」这个 canonical 字节同时承担了两个职责：(a) 本地 lineage/authorization/invalidation 的 exact-byte 依据；(b) 实际发给 provider 的 prompt 文本。第二个职责里混进了第一个职责才需要的内部元数据。

---

## 决策 / 方案（推荐）

**把「发给 provider 的 prompt」从「本地 canonical compiled input」里拆出来，做成一个 provider 相关的紧凑投影。**

- 保留现有 `compiled_provider_input`（canonical JSON + sha256）作为**本地 lineage 事实**，authorization scope / invalidation / raw-plan 的 exact binding 继续基于它，**不破坏任何既有溯源语义**。
- 新增一个 provider-facing prompt（或「紧凑 provider input」），只包含 provider 真正需要的字段：
  - `instruction`
  - `design_system`
  - `provider_rendered_content`
  - `visual`（recipe/composition/motifs/relationship/identity 子句）
  - `page_presentation.profile`（typography voices/hierarchy、colour roles、layout zones——这些确实影响排版，值得给 provider）
  - 可保留无害的 `slide_id`
- **从 prompt 中剔除**：`generation_profile`（style master 元数据——style master 已作为 `images` 参考图单独发）、`page_presentation.provenance`（文件路径）、`page_presentation.binding_sha256`、以及任何 sha256/digest/path/origin。
- submit 时 `body.prompt` 改为发送这个紧凑投影；`model` 仍从 `generation_profile.provider.model` 读（本地读取，不进 prompt）。

### 为什么这么设计

- **不动 lineage**：`compiled_provider_input` 保持字节不变，authorization/invalidation 的既有语义零破坏；紧凑 prompt 只是「同一个已授权 compiled input 的 provider 视图」。
- **仍可失效**：紧凑 prompt 的字节（或其 sha256）应纳入 request inspection / submit 前的校验，确保「提交的 prompt = 已授权 compiled input 的确定投影」，不是第二套可漂移的 source。建议：紧凑投影由 compiled input **确定性派生**，派生函数是纯函数；必要时把紧凑 prompt 的 sha256 也写进 `image2-request` 的 inspection 供审计。
- **两侧对称**：Pure 与 Framed 各出一个紧凑投影；Framed 的 `instruction` 仍须逐字等于 `FRAMED_EXCLUSIVE_HEADER_RESERVATION_INSTRUCTION`，`design_system` 仍与 raw contract 逐字相等（沿用现有 exact validator）。

### 备选（已否决）

- **换 provider / 更高上限**：不是修根因；且 deck 依赖的 provider 稳定性（见 `_lessons/vendor-reliability.md`）不应被 prompt 长度绑架。
- **压缩 `design_system` + 缩短 `identity role_clause`**（deck 级止血）：只能救非 agent 页，agent 页仍超；且把 V1 设计系统压到 ~250 字符，直接违背「逼近 V1」的目标。只作为「等 harness 修好前的临时手段」，不作为方案。
- **把 `design_system` 拼进 `instruction`**：早前 design change 已否决（会弱化 Framed 的严格 instruction 不变量）。

---

## 风险 / 取舍

- [改动 canonical provider input 的消费者边界] → 明确「compact prompt」是新增派生产物，不改 `compiled_provider_input` 本身；用测试锁死「两者 sha256 的确定关系」。
- [Framed 的 exact instruction 不变量] → 紧凑投影必须继续逐字保留 `FRAMED_EXCLUSIVE_HEADER_RESERVATION_INSTRUCTION`，加负向测试。
- [page_presentation.profile 是否该进 prompt] → 若嫌 profile 也冗长，可只保留 typography voices/hierarchy + colour roles（去掉 layout zones 数值），由实施 agent 权衡；但需保证 Pure/Framed 一致。
- [本地 32768 字节上限 vs provider 4000 字符] → 新增「provider 4000 字符」这个**运行时边界**校验（compact prompt 编译时或 submit 前 fail-closed），把它作为 provider-facing 硬约束写进 spec；不能静默截断。
- [是否顺带减小 `generation_profile` 本身] → 不在本 change；`generation_profile` 只从 prompt 移除、本地仍保留。

---

## 落地关联

实施走 OpenSpec change（capability：`image-generation`，涉及 `03-framed-image` / `04-pure-image` / `shared/image2` / `cli-surface` 的 provider prompt 边界）。

预计改动面：

| 区域 | 文件 / 入口 |
|---|---|
| Pure adapter | `scripts/04-pure-image/index.mjs`（`compilePureProviderInput` + 新增 compact 投影） |
| Framed adapter | `scripts/03-framed-image/index.mjs`（`compileFramedProviderInput` + 对称投影） |
| submit / transport | `scripts/ppt_flow.mjs` `targetPageImageSubmitFactory`（`body.prompt` 改发 compact prompt） |
| inspection / binding | `scripts/shared/image2/page_derived_data.mjs`、`page_image_artifacts.mjs`、`page_image_provider_request_binding.mjs`（compact prompt 的 hash 进 inspection） |
| 规格 | `openspec/specs/image-generation/spec.md`（provider prompt 字段集、4000 字符运行时边界、Pure/Framed 对称、lineage 不变） |
| 测试 | `tests/03-framed-image/`、`tests/04-pure-image/`、`tests/shared/image2/`（compact 投影正确性、4000 边界、Framed instruction 不变量、lineage 回归） |

**验收标准（可执行）**：

1. 同一份已授权 compiled input，派生出的 compact provider prompt **不含** `generation_profile`、`page_presentation.provenance`、`page_presentation.binding_sha256`、任何 sha256/digest/path/origin。
2. 以 `deck_ai_sdlc_keynote` v8 为验证样本：**全部 25 页**的 compact prompt ≤ 4000 字符（含完整 `design_system` + `identity role_clause`），且 `generate` 真实返回 200 出图。
3. `compiled_provider_input` 的字节与 sha256 不变；authorization scope / raw-plan / invalidation 的既有测试全部通过。
4. Framed 的 `instruction` 逐字等于 `FRAMED_EXCLUSIVE_HEADER_RESERVATION_INSTRUCTION`；`design_system` 与 raw contract 逐字相等。
5. 超过 4000 字符的 compact prompt 在 provider call 前 fail-closed（不截断、不回退），走现有 `image2` 诊断 envelope。
6. 不修改任何 `deck_*` 生产数据；`deck_ai_sdlc_keynote/v8` 仅作为验证样本，不作为测试 fixture。

---

## 实施后交接（给 Deck Agent）

Harness 修好后，Deck Agent（本 deck）需要做的后续是：

1. `2_backbone/visual-style/page-design-system.md` 已经是**完整 V1 设计系统文本**（~4215 字节，见 git 未提交改动）——这正是 harness 修好后要用的内容，**无需再改**。当前它导致 prompt 超 4000 字符，属预期阻塞，等 harness 的 compact-prompt 改动落地后自然解除。
2. 重跑 `image2 plan`（provider-free）重建 progressive raw plan。
3. 走 pilot（4 页：`InfoRev`/`NewPart`/`DeerVal`/`FramAut`）→ authorize → generate → review → expansion → accept → build。
4. 用 pilot 出图验证「逼近 V1」的效果（字体一致性、文图比、色系、CJK 可读性是否达标）。

---

## OpenSpec 落地 TODO / Tracking（2026-08-15 review 后修订）

> 本节是后续落地的追踪权威，覆盖前文中已经被 review 推翻的实施建议。
> 特别是：不再把 `4000` 视为全局 Image2 上限；不再保留旧
> `compiled_provider_input` 授权后发送另一份派生 prompt；不再要求当前完整
> `page-design-system.md` 在 4K profile 下必然可提交。
>
> **Tracking 到核心 change 完成即结束。** 下列阶段 1-5 全部是同一个 OpenSpec
> change 内部的设计、实施和验收，不是 change 落地后的追加工程。change 完成后不再要求
> 另一个 Harness change；Deck Agent 直接按正常 provider workflow 使用。

### 状态总览

| 阶段 | 状态 | 完成条件 |
|---|---|---|
| 0. 调查与设计收敛 | `done` | 4K/16K 现象、现有 prompt authority 和不可实现验收项已复核 |
| 1. 创建核心 OpenSpec change | `pending` | change 已由 OpenSpec CLI scaffold，proposal/design/specs/tasks 齐全 |
| 2. Capability Profile 权威 | `pending` | 非秘密 profile source、schema、选择和 runtime 匹配规则闭合 |
| 3. Exact compact prompt cutover | `pending` | compact prompt 成为唯一授权和实际提交字节 |
| 4. Budget admission 与生命周期绑定 | `pending` | profile digest/limit/unit 进入 plan、authorization、attempt preflight |
| 5. 实施、验证与完成 | `pending` | 回归和 strict validation 通过，change 已同步/归档，可直接交给 Deck Agent |

### 0. 已完成：调查与决策基线

- [x] 调查 micuapi 的 alias、route、group、operation 与 validator 分层；记录在
  `provider-prompt-limit-investigation.md`。
- [x] 确认 `gpt-image-2` 是可重定向 alias，模型名本身不能唯一标识 provider capability。
- [x] 确认现有 32,768 UTF-8 bytes 是本地 compiler safety bound，不是远端 prompt 能力。
- [x] 复算 v8 25 页：去除内部 metadata 后仍约 5.8K-6.7K 字符；完整
  `design_system` 自身约 4,215 字符，因此当前 deck 无法仅靠 metadata 清理适配 4K。
- [x] 确认所有 Harness 行为调整只通过 OpenSpec change 落地，不直接按 backlog plan 改代码。
- [x] 决定核心修复使用一个原子 OpenSpec change，避免两个不完整中间 contract 和两次
  compiler cutover。

### 1. 创建一个核心 OpenSpec change

- [ ] 使用 OpenSpec CLI 创建 change；建议名称：
  `bind-capability-aware-image2-provider-input`。
- [ ] proposal 明确唯一终态：每次 Image2 provider work 都使用一个显式 capability
  profile 下、预算已验证、被完整授权的 exact prompt。
- [ ] proposal 明确至少涉及以下现有 capabilities：
  `run-bundle-layout`、`run-bundle-management`、`style-master-generation`、
  `image-generation`、`production-schema-conformance`、`environment-check`；仅在新增或修改
  direct CLI diagnostic producer contract 时加入 `cli-surface`。
- [ ] proposal 明确不创建第二套 provider prompt authority、不增加自动探测、自动 fallback、
  静默截断或未授权 live probe。
- [ ] design、delta specs 和 tasks 必须在实施前完成并通过 strict validation。

### 2. 关闭 Provider Capability Profile 的权威问题

- [ ] 在 design 中确定一个 Run Bundle 内的非秘密 canonical source of record；不得使用
  State、inspection、API key、一次远端失败或 Harness 内的 provider/model 常量作为事实源。
- [ ] 评估并确定 source 位置；当前建议为独立的非秘密
  `image2-provider-profile.yaml`，而不是把 capability 塞进 `.env`。
- [ ] profile schema 至少表达：`profile_id`、非秘密 `endpoint_profile`、`route_id`、
  `model`、`operation`、`prompt_budget.limit`、`prompt_budget.unit` 和 provenance/owner
  declaration。
- [ ] `limit` 必须是普通正整数数据；实现不得出现 `if 4000 ... else if 16000 ...`。
- [ ] `unit` 必须是 closed vocabulary，并定义精确计数算法；至少评估
  `unicode-code-points`、`utf16-code-units`、`utf8-bytes`，不得只写含糊的 `chars`。
- [ ] 同一 provider profile 可以按 operation 声明不同预算，至少区分 Style Master text
  generation 与 Page Image reference-generation request shape。
- [ ] `.env` 继续只拥有 credential/base URL 和必要的 runtime profile identity；provider-free
  planning 不得依赖 API key。
- [ ] provider initialization 前验证 runtime profile identity 与 plan-bound profile 相符；不符时
  在 grant/attempt/provider call 前 fail-closed。
- [ ] 缺失、未知、格式错误或 owner 未声明的 profile 不得推断为 4K、16K 或 legacy default。

### 3. 将 compact prompt 设为唯一 exact provider bytes

- [ ] Pure adapter 从 provider prompt 中移除 `generation_profile`、presentation provenance、
  binding digest、路径和其他 lineage-only facts。
- [ ] Framed adapter 做独立的 workflow-specific compact compilation；必须保留 exact
  `FRAMED_EXCLUSIVE_HEADER_RESERVATION_INSTRUCTION`、`subject_restrictions` 和
  `protected_composition`，不得为了“对称”复制 Pure 的 `page_presentation` shape。
- [ ] `design_system`、provider-rendered content、visual clauses 和 identity role clause 继续按
  owning source/raw contract 精确绑定；不得自动摘要或截断。
- [ ] 新 compact bytes 直接成为 `compiled_provider_input.utf8`；其 SHA-256 继续作为 plan、
  authorization、attempt 和 invalidation 的 exact provider-input digest。
- [ ] raw contract、generation profile、presentation/profile lineage 继续留在本地 canonical
  owners 中，不通过第二份“完整 prompt”重复授权。
- [ ] shared runtime 和 submitter 保持 opaque exact-byte transport：不重编译、不删字段、不从
  inspection 取请求、不在 submit 时派生另一份 prompt。
- [ ] compiler cutover 将旧 prompt shape 的 current plan 判为 stale，保留历史记录并走现有
  fresh-plan / Generated Image Rebuild 路径，不迁移或补写旧记录。

### 4. Budget admission、binding 与负向路径

- [ ] 保留 32,768 UTF-8 bytes 本地 compiler safety bound，并与远端 capability budget 分层校验。
- [ ] adapter 对最终 `compiled_provider_input.utf8` 按所选 profile 的 exact unit 计数；不得测
  source 长度、中间对象或 JSON 之外的估算值。
- [ ] provider budget 校验发生在 plan publication、authorization、provider initialization、grant
  和 attempt 之前；本地确定性超限不得写成远端 `known_failure`。
- [ ] 超限 diagnostic 指向 provider profile 或 source/configuration repair；不得建议静默切换
  route、自动压缩内容或直接重试。
- [ ] capability profile digest 进入 Style Master 和 Page Image generation profile、plan identity、
  authorization scope 及 provider request/attempt binding。
- [ ] profile、model、operation、limit 或 unit 任一变化都使旧 plan stale，并只通过 fresh plan
  进入新的授权路径。
- [ ] tests 使用通用 4,000 与 16,000 profile fixtures 证明数据驱动行为，同时覆盖第三个非特殊
  数字，防止实现退化为两个硬编码分支。
- [ ] 用 ASCII、CJK、emoji fixture 锁死各计数单位的边界行为。

### 5. 实施顺序与验证 Tracking

- [ ] 先写 profile source/schema/resolver 和负向 contract tests。
- [ ] 再让 Style Master 与 Page Image generation profiles 消费同一 selected capability source。
- [ ] 再修改 Pure/Framed compiler，使 compact bytes 成为唯一 provider bytes authority。
- [ ] 再接通 plan/authorization/attempt binding、budget preflight 和 compiler-cutover recovery。
- [ ] 更新生产 schema definitions、derived inspection 和 architecture guards；inspection 仍是
  non-authoritative projection。
- [ ] 跑 capability/profile、Style Master、Pure、Framed、progressive raw owner、transport、
  invalidation 和 CLI diagnostic focused tests。
- [ ] 跑 `npm test` 与 `npm run test:sweep`，处理全部回归。
- [ ] 跑 OpenSpec strict validation，确保 proposal/design/delta specs/tasks 与 main specs 一致。
- [ ] provider-free 地重新测量 v8 25 页最终 compact prompt，记录 code points、UTF-16 units、
  UTF-8 bytes 和所选 profile budget。
- [ ] 未经 owner 明确授权，不执行真实 provider generation 或边界探测。
- [ ] change 完成后才 archive；不得以“代码已写”代替 spec sync、测试和 cutover 验证。

### 核心 change 的 Done Definition

以下条件满足后，本计划直接关闭，不再挂后续 Harness TODO：

- [ ] OpenSpec artifacts、实现、main spec sync、focused tests、全量回归和 strict validation 全部完成。
- [ ] 4K、16K 和一个第三方任意数字 profile fixture 均证明为同一数据驱动 contract，不存在数字
  special case。
- [ ] Pure、Framed 和 Style Master 均绑定 selected capability profile；实际发送的 exact prompt
  已在 provider work 前完成预算校验。
- [ ] 旧 plan 只走一次 compiler/profile cutover；历史 evidence 保留，不能从旧 plan 提交。
- [ ] 现有 Run Bundle 缺少 profile 时返回一个明确、可执行的配置修复动作，Deck Agent 无需理解
  Harness 内部 schema 或继续开发 Harness。
- [ ] change 已归档；另一个 Agent 可以从正常 Deck Controller 入口继续工作。

### Change 完成后的立即使用流程（不是 Harness TODO）

另一个 Deck Agent 只需要做正常生产操作：

1. 为 `deck_ai_sdlc_keynote` 选择并记录 owner 已确认的 capability profile；不得从
   `gpt-image-2` alias 自动猜测。当前完整 v8 prompt 应选择能够容纳它的已确认 profile。
2. 重跑一次 `image2 plan`，然后按现有流程执行
   pilot → authorize → generate → review → expansion → accept → build。
3. 在 Complete Page Review 中判断字体、CJK 可读性、文图比、色系和 identity 一致性。

到这里即完成交接。没有第二个必需 change，也没有 change 落地后的 Harness 清理阶段。

### 不在本计划 Tracking 内

- Provider failure request ID/headers 的诊断增强不影响本次可用性，不在本计划继续追踪。
- 若未来要求当前 4,215 字符设计系统也必须通过 4K route，那是新的产品语义选择；另行提出时再
  决定是编辑 deck source，还是创建独立 OpenSpec change。当前 change 不自动摘要、不截断。
