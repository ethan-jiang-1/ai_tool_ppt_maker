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
