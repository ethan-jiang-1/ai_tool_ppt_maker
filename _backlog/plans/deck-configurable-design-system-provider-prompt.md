# Plan: 让 deck 可配置的设计系统 prompt 注入每页 provider input

> 类型: 设计 / 分析 | 更新: 2026-08-15 | 状态: 待 review（上下文交接 + 推荐，不是最终 change）

---

## 一句话

新 harness 的每页 provider prompt 只有「硬编码的通用 instruction + 闭集短标签」，而 V1 靠的是「每页注入一段 deck 专属的富设计系统文本」（宋体硬规则、文图比、CJK 可读性、禁用清单）。要复现 V1 的画面效果，需要给 harness 加一个 **deck 可配置、注入每页 provider prompt 的设计系统文本**。

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

（另有每页各自的具体场景段，如 05 页：`LEFT SIDE (~40%): A traditional programmer at a desk... RIGHT SIDE (~50%): ONE AI partner. Use the Agent visual spec...`——这部分暂不属本 change，见末尾开放问题 4。）

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

## 方案（推荐 + 备选，待 review 定夺）

### 推荐：新增 deck 可配置的 `page-design-system.md`，注入每页 provider prompt

- **新增 deck 配置**：`2_backbone/visual-style/page-design-system.md`（自由 markdown 文本，deck 作者写一次；内容就是上面 V1 那段设计系统，或 deck 作者自选；沿 `style-master-prompt.md` 先例）。
- **harness 读取**：像读 `style-master-prompt.md` 一样读它（UTF-8、有界长度、可空——为空则不注入）。
- **注入点**：`04-pure-image/index.mjs` 的 `compilePureProviderInput` + `03-framed-image/index.mjs` 的 `compileFramedProviderInput`（对称）。
- **注入形式（两变体）**：
  - **A. 追加进 `instruction`**：把设计系统文本拼进现有 instruction 之后（provider 看到连续 prompt，最贴近 V1；改动最小）。
  - **B. 新增独立字段 `design_system`**：compiled provider input JSON 加一个字段（结构清晰，但 provider 侧要认新字段）。
- **倾向 A（追加进 instruction）**：provider 已经在消费 instruction，行为最可预测，不需要认识新字段。

### 备选（记录理由）

- **扩充 `editorial-serif` 枚举为富文本**：把字体规则写死在 harness 里 → 字体/密度/CJK 是 deck 专属，写死会污染所有 deck，不可伸缩。**不推荐**。
- **复用 `style-master-prompt.md` 文本也注入每页**：语义上 style-master 是"风格参考图"意图，不是"每页排版规则"；且它受 4000 字节 compiled 限制。**次选**（若不想加新文件可走这条）。

---

## 改哪里 / 输入输出（精确）

| 文件 | 位置 | 改动 |
|---|---|---|
| `ppt_maker_harness/scripts/04-pure-image/index.mjs` | `compilePureProviderInput`（~L711–736，上文已摘） | 读取 deck 设计系统文本，追加进 `instruction`（方案 A）或加 `design_system` 字段（方案 B） |
| `ppt_maker_harness/scripts/03-framed-image/index.mjs` | `compileFramedProviderInput`（~L865–890） | 同上，对称 |
| `ppt_maker_harness/scripts/shared/run-bundle/bundle_layout.mjs` | `VISUAL_STYLE_FILES`、`_ALLOWED_IN_VISUAL_STYLE` | 把 `page-design-system.md` 纳入 visual-style 白名单 + seed |
| `ppt_maker_harness/scripts/02-visual-system/internal/…`（或共享 resolver） | 新增读取/校验函数 | UTF-8、有界长度（建议 ≤8192 字节，对齐 style-master-prompt） |
| `ppt_maker_harness/schema/stages/image2-request.yaml` 或 `serialization-contracts.yaml` | 描述新注入 | 记录 compiled provider input 的新增事实 |

**输入**：`2_backbone/visual-style/page-design-system.md`（deck 作者自由文本，内容参考上文 V1 设计系统）。
**输出**：compiled provider input 的 `instruction`（追加后）或新增 `design_system` 字段。
**不动的**：source schema（slide-specs）、state contract、reference material 格式、reference image 传输、闭集枚举本身（保留，作结构化兜底）、`instruction` 的现有语义（设计系统是"补充"不是"替换"）。

---

## 风险 / 取舍

- [自由文本削弱确定性] → 有界长度 + UTF-8 校验 + 可空约束；设计系统文本是 deck 作者显式拥有（"人类拥有内容"）。
- [与 instruction 语义重叠] → 设计系统负责字体/密度/CJK/禁用；instruction 继续负责"渲染完整页 + 集成排版"。
- [provider 对长 prompt 容忍度] → 有界长度兜底；V1 共享块 ~1.5–2KB，当前每页 compiled input ~7.5KB，有余量。
- [两 adapter 漂移] → pure/framed 同步改 + 针对性测试。
- [FramAut 偶发 provider `known_failure`] → 与 role_clause 富化后偶发失败有关，待排查是内容策略还是偶发；本 change 或需顺带在注入层确认无超长/敏感内容触发。

---

## 落地关联

- 走 `openspec/changes/`。
- 相关 spec：`openspec/specs/image-generation/spec.md`（provider input 编译）、`openspec/specs/visual-config/spec.md`、`openspec/specs/run-bundle-layout/spec.md`（visual-style 白名单）。
- 测试：`npm test`；新增单测断言「compiled provider input 含 deck 设计系统文本」。
- 与已完成的 `restore-identity-role-clause-provider-input` 同属「deck 富文本 → provider」主线。

---

## 给 review Agent 的开放问题

1. 方案 A（追加进 `instruction`）还是 B（新增 `design_system` 字段）？是否先 A 后 B？
2. 新文件放 `2_backbone/visual-style/page-design-system.md`，还是复用 `style-master-prompt.md`？
3. 长度上限定多少（8192 字节？）；是否复用 style-master-prompt 的约束？
4. 是否顺带解决「per-slide 场景文本」注入（V1 的每页具体场景，如 `LEFT ~40% / RIGHT ~50%`）？本次只解决共享设计系统，每页场景仍是闭集构图标签——留作后续第三个 change 还是本次一起？
5. FramAut 的 provider `known_failure` 是否要一并排查？
