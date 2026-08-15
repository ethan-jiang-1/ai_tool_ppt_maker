# Plan: 让 deck 可配置的设计系统 prompt 注入每页 provider input

> 类型: Harness 设计 / 落地计划 | 更新: 2026-08-15 | 状态: 已完成、已归档至 `_done`、已提交

---

## 一句话

新 harness 的每页 provider prompt 只有「硬编码的通用 instruction + 闭集短标签」，而 V1 靠的是「每页注入一段 deck 专属的富设计系统文本」（宋体硬规则、文图比、CJK 可读性、禁用清单）。要复现这类效果，需要给 harness 加一个 **deck 可配置、注入每页 provider input 的共享设计系统文本**。该能力必须同时适用于 Pure 与 Framed，并可被未来任意 deck 使用；`deck_ai_sdlc_keynote/v8` 只作为验证样本，不是默认内容、运行时分支或特殊协议。

---

## 背景 / 现状

### 触发问题

`deck_ai_sdlc_keynote` v8（新 harness `page-image-workflow` + pure）出图与 V1 的最终画面仍有明显距离。V1 的每页 IMAGE PROMPT 在 `3_versions/v1/_generated/page_prompts/*.prompt.md`（如 `05--s05_partner_not_tools.prompt.md`、`01--s01_cover.prompt.md`）。

### V1 每页 prompt 里那段「共享设计系统」（就是它让 V1 一致、好看，逐字摘录）

V1 的 25 页 prompt，**每一页都带下面这段完全相同的设计系统文本**（这是关键——它是一段 deck 专属、自由文本、注入每页）：

> TYPOGRAPHY (HARD RULE — ONE typeface family for the whole deck, never vary): ALL Chinese text on EVERY slide must be rendered in a SONG / MING serif typeface — specifically the look of 思源宋体 / Source Han Serif (a.k.a. Noto Serif CJK SC): upright, high-contrast strokes with clear triangular serifs (三角形衬线), even weight, classic and bookish. ALL English/Latin text must be in a matching SERIF face (Source Serif / Times-like), so Chinese and English read as one consistent serif system. NEVER mix in sans-serif, handwritten, brush/calligraphy, rounded, display, or decorative fonts for the text. Every slide must use the SAME Chinese font and the SAME English font — no per-slide variation. The hand-drawn/etching quality applies to the ILLUSTRATION only, NOT to the text: text is always clean printed Song/Ming serif, not sketched or hand-lettered lettering.
>
> CJK LEGIBILITY (HARD RULE): The image model only garbles TINY Chinese characters (footnote-size / dense micro-text — broken strokes, invented glyphs). Large AND medium Chinese render fine — use them freely for title, core claims, tier labels, short descriptions, and pull-quotes. The ONLY thing to avoid is TINY Chinese: no footnote-size Chinese, no axis/tick labels in Chinese, no dense micro-annotations in Chinese, no small Chinese source notes. For a zone that would be that small, either make it medium-size, or use an English/number label instead, or drop it. Rule of thumb: if a Chinese phrase is readable at a glance on the slide, keep it Chinese; only genuinely tiny text goes English/number. Do NOT over-strip Chinese — medium descriptions are welcome.
>
> TEXT-TO-IMAGE RATIO: Text area 50-60% of slide, sketch/illustration 40-50%. Every slide must have enough Chinese text (title + key concepts + data/quotes) to be understood at a glance without the speaker. The sketch is supporting visual — not the entire slide.
>
> TEXT DENSITY: Title (large serif Chinese, 1 line). Core claim or key concept (medium-large Chinese, 1-2 lines). Supporting text or data (medium Chinese, 2-4 short lines — readable at a glance, NOT tiny). Pull quotes where relevant. Never paragraphs — short blocks, cards, or labels only. Only genuinely tiny text (footnotes, micro-labels) should be English/number instead of Chinese.
>
> BACKGROUND: Cream paper #F5F0EB on every slide. Exception: closer slide uses near-black warm brown. COLOR FAMILY: Earth tones only — cream, sepia brown, warm gray-brown, amber. FORBIDDEN: blue, green, neon, purple, pure black, pure white, cool grays.
>
> FORBIDDEN: Photography, 3D renders, vector clip art, smooth digital icons, stock photos, corporate logos, watermarks, page numbers, source notes, draft labels, glowing orbs, gradient backgrounds, circuit boards, robot imagery, brain icons.
>
> TONE: Warm, intellectual, human. Confident but curious. Sketch style signals 'thinking in progress.'
>
> SUBJECTS ARE CONTEMPORARY: All human figures and objects are present-day — modern casual / business-casual clothing (tees, hoodies, open collars, sneakers), current devices (laptops, phones, monitors, large screens), present-day workplaces (open-plan desks, standing desks, whiteboards). The etching / cross-hatch look is a DRAWING TECHNIQUE (historical); the SUBJECTS are not. On people & objects, FORBIDDEN: period costume, 19th-century dress, top hats, waistcoats, quills, parchment, antique props — UNLESS a slide's own prompt deliberately invokes a historical metaphor (e.g., the Roman-legion pyramid on the hierarchy slide).
>
> SKETCH QUALITY: Visible hand-drawn lines. Slight irregularity. Cross-hatched shadows. Sepia ink on cream paper. Deliberate, not messy. CONSISTENCY: Every slide must feel like a page from the same sketchbook.

（另有每页各自的具体场景段，如 05 页：`LEFT SIDE (~40%): A traditional programmer at a desk... RIGHT SIDE (~50%): ONE AI partner. Use the Agent visual spec...`——这部分暂不属本 change，见本文“明确不在本 change”。）

### 新 harness 每页 provider prompt 实际有什么（贫）

`04-pure-image/index.mjs` 的 `compilePureProviderInput` 当前代码：

```js
function compilePureProviderInput({ slideId, rawContract, generationProfile } = {}) {
  const contract = validatePureRawContract(rawContract);
  if (!contract.ok || rawContract.slide_id !== slideId || !generationProfile || typeof generationProfile !== "object") {
    throw new PureImageWorkflowError("pure_provider_input_invalid", "Pure provider input requires one valid selected raw contract and generation profile");
  }
  const utf8 = canonicalJson({
    schema: "page-image-pure-provider-input",
    slide_id: slideId,
    instruction: "Render one complete premium keynote page. Render every header literal and provider-rendered content item as readable integrated page typography; preserve exact literals unless an item explicitly allows presentation adaptation.",
    provider_rendered_content: rawContract.provider_rendered_content,
    visual: {
      recipe: rawContract.provider_clauses.recipe,
      composition: rawContract.provider_clauses.composition,
      motifs: rawContract.provider_clauses.motifs,
      relationship: rawContract.provider_clauses.relationship || null,
      identity: buildPureProviderIdentity(rawContract),
    },
    page_presentation: rawContract.page_presentation,
    generation_profile: generationProfile,
  });
  return Object.freeze({ schema: TARGET_COMPILED_PROVIDER_INPUT_SCHEMA, utf8, sha256: sha256Bytes(Buffer.from(utf8, "utf8")) });
}
```

`03-framed-image/index.mjs` 的 `compileFramedProviderInput`（~L865–890）结构对称，`instruction` 是 Framed 的 header-reservation 文案。

**关键点**：`instruction` 是**硬编码**的通用一句话；`visual.recipe/composition/motifs` 是闭集短标签（来自 `page-image-visual-language.yaml` 的 provider_clause，被 `normalizePageImageVisualClause` 禁止 `typography`/`text`/`title`/`label` 等 token）；`page_presentation.typography.voices` 是闭集枚举 `editorial-serif`/`editorial-sans`/`geometric-sans`/`humanist-sans`。**没有任何一个 source 级槽位能放上面 V1 那段富设计系统文本。**

### 已做但不够的 source 级努力

- role_clause 已注入 agent 四层构造（第一次 change `restore-identity-role-clause-provider-input`，已实现）：`neutral androgynous amber glass silhouette... internal topological network...` 已进 provider prompt。
- 构图扩到 13 种（`page-image-visual-language.yaml` 的 compositions）。
- recipe provider_clause 改成「sparse decorative sketch accents... generous negative space」。

这些只解决了「agent 外观」「构图」「意象稀疏度」，**没解决字体/文图比/CJK/禁用清单**——因为它们在新 harness 里没有 free-form 槽位。

---

## 根因分析（核心）

新 harness 从 V1 的「自由 markerless IMAGE PROMPT」转向了「闭集结构化 provider input」，这是**刻意的设计取舍**（换确定性、可校验、可溯源）。但它把 V1 里「deck 专属的设计系统文本」这一层**丢掉了**：

- V1：每页 prompt = 共享设计系统块（deck 专属、自由文本）+ 每页具体场景。
- 新 harness：每页 prompt = 硬编码通用 instruction + 闭集短标签 + 结构化文本。

要拿回 V1 的画面效果，就要在**不破坏结构化输入的前提下**，补回「deck 专属的自由文本注入」。这是本 change 的定位。

---

## 已定设计

### 能力边界

- 新能力的 canonical source 是 `page-design-system.md`：一个 deck 级、共享、自由文本的 Page Image 设计系统。它可表达字体、CJK 可读性、文本/图像比例、密度、色彩、禁用元素和整体调性，但不改写 slide source、Provider Content Schema、视觉语言 registry 或本地 Framed header 的所有权。
- 每个 Pure 和 Framed 页面都接收同一份当前已解析的设计系统文本。Pure 继续生成整页；Framed 将文本交给其内部 provider 页面，以约束 body、visual 和 provider-rendered text treatment，但 local header、`protected_composition` 和 `subject_restrictions` 的现有合约不变。
- 这是所有 run bundle 均可采用的 Harness 能力。V1 的设计系统段仅是一个 deck 作者可选的内容样本；Harness 不植入 V1/v8 的字体、颜色、人物或主题默认值，也不按 deck 名称分支。

### Source 位置、覆盖和有效值

- canonical backbone location：`2_backbone/visual-style/page-design-system.md`。
- version override location：`3_versions/vN/overrides/visual-style/page-design-system.md`。存在 override 时，它完整替代 backbone 值；一个空 override 可以显式关闭 inherited design system。
- 文件是 opaque UTF-8 prose。扩展名为 Markdown 仅方便作者编辑；Harness 不解析 front matter、变量、模板或 Markdown 语法，也不重写非空文本。
- resolver 必须先检查 override path；仅当 override path 不存在时才读取 backbone path。存在但为 symlink、目录、不可读、逃逸 deck root、非 UTF-8 或超出限制的 override 是 hard-stop，绝不回退 backbone。
- 缺失、零字节或仅空白字符的 regular file canonicalize 为 `null`，即 provider input 仍带字段但不注入文本。任一含非空白文本的文件保留其精确 UTF-8 文本和 SHA-256。
- 非空 source 上限固定为 **8,192 UTF-8 bytes**。每个最终 canonical page provider input 上限固定为 **32,768 UTF-8 bytes**；这是 Harness 的本地完整输入上限，不是对 provider 外部上限的推断。超过任一上限必须在 provider-free planning 失败，不截断、不回退、不初始化 provider。
- 新 bundle 可以创建零字节 seed 以提高可发现性，但不得写入 deck 专属示例 prose。缺失与空 seed 的 runtime 语义相同。

### Contract 和编译形式

选择原方案 **B**，不拼接 `instruction`：

1. `02-visual-system` 解析一次 source，产生一个内部、已验证的 binding：`{ schema, text: string|null, sha256: string|null }`。物理路径和 source origin 只可用于本地诊断，不得出现在 provider-facing input。
2. Page Image Core 接收该 binding，并在每个 core slide / provider-input binding 中保留 nullable `page_design_system_sha256`。Core 只拥有共有 digest 事实，不拥有 prompt 拼装或 prose 语义。
3. Pure 和 Framed raw contract 都保留 exact `page_design_system: { text, sha256 }`，且 validator 验证 null 对称性或文本与 UTF-8 digest 的一致性。
4. 两个 adapter 分别从已验证 raw contract 编译自己的 canonical JSON。两个 provider input 都有 top-level `design_system: string|null`；其中只放文本，绝不放路径、SHA、source origin 或任何生命周期事实。
5. Pure 的现有 `instruction` 保持自身精确语义。Framed 的 `instruction` 必须继续逐字等于 `FRAMED_EXCLUSIVE_HEADER_RESERVATION_INSTRUCTION`，不允许拼接或弱化；Framed 专用 validator 同时验证 `design_system` 与 raw contract 的精确对应。
6. shared runtime / submitter 把 adapter 已绑定的 `compiled_provider_input.utf8` 原样传输。它不得重新读取 `page-design-system.md`、重建文本或加入字段。

这保留了闭集 visual-language registry 的职责边界：registry 仍只给出已注册的 visual clauses，新的 explicit source 才是受限的自由文本入口。它也避免把共享设计系统塞入 Pure-only 的 `pure-deck-visual-system.yaml`，后者继续保持 Pure presentation contract，Framed 不读取它。

### 生命周期、失效和兼容性

- `page_design_system_sha256` 必须进入普通 raw plan、progressive raw plan、authorization scope、derived request inspection 和 invalidation comparison 的 exact binding 形状。
- source 从 `null` 变为文本、文本变更、或文本变为 `null` 时，两个 workflow 的 compiled provider-input digest 和 raw-plan identity 都必须改变。当前计划在 authorize/generate 前重新解析 source；若 stored plan 不再相等，操作在 provider call 前停止并走现有 Generated Image Rebuild 路径。
- 已接受的 raw bytes、attempt、review、final media、delivery 和历史 plan 一律不可改写。此 compiler cutover 不迁移旧 plan；旧 current plan 在下一次使用时只能被判为不再可提交，并通过 fresh plan + exact authorization 建立新链路。
- 已有 deck 没有该文件时仍可重建为 `design_system: null`。这保证 source 兼容，但不豁免旧 plan 的 compiler-cutover preflight。
- 此文件是每页 provider input source，不是 Style Master intent 或 selection authority。它不自动替换 Style Master；当 deck 作者同时改变视觉参考意图时，仍通过已有 Style Master owner 显式处理，不能由本 change 推断或静默修改。
- deterministic binding 只证明提交了正确的文字，不证明 provider 像素遵从它。Pure/Framed 的 Complete Page Review 仍是视觉验收权威。

---

## 改动面

| 区域 | 文件 / 入口 | 必须完成的改动 |
|---|---|---|
| run-bundle layout | `scripts/shared/run-bundle/bundle_layout.mjs` | 增加 `PAGE_DESIGN_SYSTEM_FILE`、visual-style whitelist、override 可见性、零字节 seed 和 README/tree 文案；layout check 覆盖 backbone 与 override。 |
| source owner | `scripts/02-visual-system/internal/page_design_system.mjs`（新）及 `index.mjs` | 实现 confined override-first resolver、UTF-8/byte/regular-file 校验、null semantics 和 immutable binding。不能依赖会掩盖 dangling override 的简单 fallback。 |
| shared core | `shared/page-image/page_image_core.mjs` | 接收并验证共享 digest，写入 core semantic facts；不加入 provider prompt compiler。 |
| adapter raw contracts | `03-framed-image/index.mjs`、`04-pure-image/index.mjs` | raw-contract exact keys / validators / candidate compiler 接入 binding；adapter 从 raw contract 编译 `design_system`。 |
| Framed exact guard | `03-framed-image/internal/framed_provider_input_contract.mjs` | 扩展 request exact keys；保留 instruction 的严格相等校验；拒绝缺失、伪造或与 raw contract 不一致的 `design_system`。 |
| plan / progressive contracts | `shared/image2/page_image_artifacts.mjs`、`shared/image2/page_image_progressive_schema.mjs`、相关 plan constructors | 将 nullable `page_design_system_sha256` 纳入所有 exact binding shape 和普通/progressive cross-bound checks。 |
| invalidation / runtime | `shared/page-image/page_image_invalidation.mjs`、`shared/image2/page_image_target_runtime.mjs` | design-system drift 触发 raw rebuild；stored-plan preflight / request inspection / submit 保持现有 exact-byte 规则，runtime 不读 source。 |
| declared contracts | `openspec/specs/image-generation/spec.md`、`openspec/specs/visual-config/spec.md`、`openspec/specs/run-bundle-layout/spec.md`、`schema/stages/image2-request.yaml`、`schema/serialization-contracts.yaml` | 写明 shared source、Pure/Framed 对称性、Framed reservation 不变、cutover、invalidation、inspection 和无路径/无 digest provider surface。 |
| regression / guard | `tests/02-visual-system/`、`tests/03-framed-image/`、`tests/04-pure-image/`、`tests/contracts/` | 为 source resolver、两 adapter、stale-plan、runtime exact transport 和 compiler-locality architecture guard 添加覆盖。 |

---

## 验收测试矩阵

### Source resolver

- backbone nonempty source、nonempty override 和空 override 都解析到正确的 semantic binding。
- 缺失、零字节、仅空白 source 都产生 `text: null, sha256: null`；empty override 不继承 backbone。
- 8,192-byte UTF-8 source 可通过；symlink（含 dangling）、目录、不可读、root escape、非 UTF-8、8,193-byte source 必须在 provider-free planning 前失败；存在坏 override 时不得回退。

### Adapter / contract 对称性

- 同一 source 文本在 Pure 与 Framed 的 canonical input 中逐字出现在 `design_system`，并且没有 SHA、path 或 origin。
- `design_system: null` 的 field 仍存在，Pure 不获得 Framed composition，Framed 不获得 Pure-only presentation facts。
- Pure raw contract、Framed raw contract、Core binding、普通和 progressive plan 都拒绝缺失/多余/不匹配的 design-system 字段。
- Framed validator 拒绝删改 `design_system`、伪造 digest、改变 raw contract text，或用追加文本改变其 exact reservation instruction。
- 两个 adapter 都验证完整 canonical input 的 32 KiB 边界：刚好在限额内可编译，超出一 byte 即在 provider-free planning 失败。

### 生命周期 / 负路径

- 修改 nonempty design-system 文本后，已有 plan 的 authorize 和 generate 都在 provider call 前失败；重新计划得到新的 digest 并要求现有 exact authorization / review 路径。
- 修改为空或从空改为非空同样触发 rebuild；未选中的 backbone 文本变动不影响已有 nonempty override。
- request inspection 与 derived `image2-request` 展示的是已绑定 canonical bytes；provider transport 提交的 prompt 与它完全相同，不会 reread source。
- 历史 evidence、review、media、delivery 和旧 plan 不能被 patch；compiler cutover 的旧 plan 只可作为历史审计数据。

### 总体验证

- 新增测试使用 temporary synthetic bundles，不使用 `deck_ai_sdlc_keynote/v8`。
- 执行针对性 Vitest、完整 `npm test`、serial sweep、`openspec validate --strict`、`node .../bundle_layout.mjs --check` 的 fixture coverage，以及 `git diff --check`。

---

## 明确不在本 change

- 每页自由 scene / composition prose 的新 source 槽位。这是后续独立 change，不能借共享设计系统入口绕过 slide-level source contract。
- `FramAut` 的 provider `known_failure` 诊断。它需要独立复现和根因判断，不能被当作本 feature 的验收条件或静默修复。
- 对 `deck_ai_sdlc_keynote/v8` 的继续生成、重规划、授权或 source 修改；该 run bundle 交由其 Deck Agent。
- 扩大 visual-language registry、改变 Provider Content Schema、改写 `_generated/`、或引入新 provider transport field。

---

## 实施追踪

当前状态：OpenSpec change `add-page-design-system-provider-input` 已完成全部 24 项任务，delta specs 已同步到 main specs，并归档至 `openspec/changes/archive/2026-08-15-add-page-design-system-provider-input/`。Harness 实现、规格、文档和测试已提交为 `a8ecfab`（`feat(image): add page design system provider input`）；未修改任何 deck/run bundle。

已完成：

- [x] 确认这是通用 Harness 能力，不是 V8 特例。
- [x] 确认 Pure 和 Framed 都必须消费同一份 deck-owned source。
- [x] 固定 source 位置、override 语义、null 语义和字节预算。
- [x] 固定 provider representation 为 top-level `design_system`，保留 Framed exact instruction。
- [x] 列出 contract、invalidation、compatibility、测试和非目标边界。
- [x] 1. 创建 OpenSpec change `add-page-design-system-provider-input`，将本文件的已定设计转写为 proposal、design、delta specs 和可执行 tasks。
  完成标准：所有设计决定不再以 A/B 或“待定”形式存在；proposal 已通过最终 polish 和 strict validation。

- [x] 2. 实现 run-bundle layout 与 source resolver，并完成 resolver 的正负路径测试。
  完成标准：新旧 bundle 均可解析；坏 source / 坏 override 在任何 provider 前 fail closed。
- [x] 3. 将 binding 接入 Page Image Core、Pure/Framed raw contracts、普通/progressive plan validators 与 invalidation。
  完成标准：所有 exact shape 统一包含 nullable `page_design_system_sha256`，source drift 不能复用旧 plan。
- [x] 4. 实现 Pure provider compilation。
  完成标准：Pure canonical input 具有 exact `design_system`，没有 Framed facts，完整输入受 32 KiB 限制。
- [x] 5. 实现 Framed provider compilation 和 exact validator。
  完成标准：Framed 内部 provider 页面获得 `design_system`，但 reservation instruction / local-header boundary 的负向测试仍全部通过。
- [x] 6. 完成 runtime、inspection、stale-plan 和 historical-evidence 回归。
  完成标准：submit 使用 bound bytes；source 在 plan 后漂移时不发生 provider call；旧 evidence 不被写入或修改。
- [x] 7. 更新 schemas、specs、README/tree 文案和 architecture guards。
  完成标准：source ownership、provider-facing exclusions 与 compiler locality 都有声明和可执行 guard。
- [x] 8. 跑完整验证并修复回归。
  完成标准：targeted tests、`npm test`、serial sweep、strict OpenSpec validation、layout checks 和 `git diff --check` 全部通过。
- [x] 9. 将 delta specs sync 到 main specs，并在所有 task 完成后 archive OpenSpec change。
  完成标准：OpenSpec status 无 active change，历史 change 与本 backlog plan 的状态一致。

收尾结果：本计划已完成；OpenSpec、Harness 实现、回归验证、main-spec 同步、归档和主提交均已闭合。
