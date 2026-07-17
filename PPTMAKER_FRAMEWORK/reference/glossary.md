---
title: GLOSSARY — 关键术语
stage: root
position: appendix
type: reference
summary: 框架中所有关键术语的定义。遇到不认识的词，先查这里。
depends_on: []
feeds_into: []
agent_action: reference
---

# GLOSSARY — 关键术语

> 不知道东西往哪放？**先 GREP，再 mkdir。** 对 Where Map 里的 **Term**（路径/文件名）跑 `rg`，命中本文件即规矩。  
> Capability: **`run-bundle-layout`**（run bundle `deck_*` 树本体）≠ `framework-directory-layout`（软包 `PPTMAKER_FRAMEWORK/`）。  
> 下文：先 Where Map → 再分组定义。

## Where Map

> Grep anchors = left column / `###` headings below. One term → one path → one role. Owned by **run-bundle-layout**.

| Term (GREP this) | Path | Means / put here | Do **not** |
|------------------|------|------------------|------------|
| `run bundle` | `deck_{NAME}/` | Whole project workspace | Soft bundle |
| `soft bundle` | `PPTMAKER_FRAMEWORK/` | Read-only methodology | Project files |
| `--run-dir` | `deck_*/3_versions/v{n}/` | Version leaf pipeline runs on | Deck root |
| `_scratch/` | `…/v{n}/_scratch/` | Version temp / `.bak` / drafts | Deck root; `_generated/` |
| `_generated/` | `…/v{n}/_generated/` | Pipeline derived (rebuildable) | Hand-edit |
| `slide-specifications.md` | `…/v{n}/slide-specifications.md` | Per-slide source SSOT | Prompt copies under `_generated/` |
| `style_master.jpg` | `2_backbone/visual-style/style_master.jpg` | Shared visual anchor | Rejected rounds (→ upstream) |
| `style-master-prompt.md` | `…/visual-style/style-master-prompt.md` | Source that generates the jpg | Throw away after generate |
| `contact_sheet` / `pilot` | `…/_generated/preview/*contact_sheet*.jpg` | Few-page visual gate (小样) | Final PPTX as review proxy |
| `pptx` (deliverable) | `…/_generated/ppt/*.pptx` | Output deck | Edit in PPT as SSOT |
| `_state/` | `deck_*/_state/` | Playbook progress pointer | Lessons / secrets |
| `_lessons/` | `deck_*/_lessons/` | Non-secret hard-won notes | Progress; API keys |
| `1_upstream_raw_material/` | deck root | Raw research; rejected style rounds | Version bak |
| `2_backbone/` | deck root | Shared metaphor / formula / visual | Version-only deltas |
| `overrides/` | `…/v{n}/overrides/` | This version’s deltas only | Copy whole backbone |
| structure gradient / 上严下松 | (rule) | Root strictest; temp sinks **down** | Litter deck root; invent `_tmp/` |
| `asset-manifest.yaml` | `2_backbone/visual-style/assets/asset-manifest.yaml` | Visual asset SSOT catalog | Put secret keys |
| `assets/` (visual) | `2_backbone/visual-style/assets/` | Optional visual asset files (svg/reference/icons) | Non-visual files |
| `**VISUAL ASSETS**` | (field in slide-specifications.md) | Per-slide asset binding | IMAGE PROMPT text |

**Also-search → canonical:** `bak` / `temp` / `scratch` → `_scratch/` · `小样` / `preview` → `contact_sheet` / `pilot` · `style master` → `style_master.jpg` · `production` / `derived` → `_generated/` · `视觉资产` / `visual asset` → `asset-manifest.yaml`

---

## 核心概念

### run bundle
Filesystem instance for one PPT project: `deck_{NAME}/`. All design docs, images, JSON, PPTX live here. No DB, no workflow server — `ls` / `diff -r`; a user-owned Git history may optionally audit source/control changes.

**≠ `--run-dir`.** Run bundle = whole tree. `--run-dir` = one version leaf inside it.

### soft bundle
`PPTMAKER_FRAMEWORK/` — read-only methodology, templates, scripts. Teaches how to think; never holds a specific deck’s content. Soft-bundle **folder** rules live under capability `framework-directory-layout`, not `run-bundle-layout`.

### --run-dir
Path argument to the pipeline: `deck_*/3_versions/v{n}/`. That leaf holds `slide-specifications.md`, `overrides/`, `_generated/`, `_scratch/`. Do not pass the deck root as `--run-dir`.

### Source File（源文件）
Human-edited truth: `slide-specifications.md`, backbone markdown, `style-master-prompt.md`, etc. Change these; regenerate derived. They are eligible for user-owned Git tracking, not intrinsically Git-tracked.

### _generated/
Pipeline output under `3_versions/v{n}/_generated/` — `slide_plan.json`, images, PPTX, preview. Rebuildable from sources. **Never hand-edit.** (Also called Derived Artifact.)

### _scratch/
Official **version-local temp outlet**: `3_versions/v{n}/_scratch/`. Pre-edit `.bak`, throwaway drafts, one-off comparisons for **this version only**. Not SSOT; deletable. Structure gradient leaf (上严下松 — loosest).

**Do not:** invent `_tmp/` / `backup/` / `_bak/`; dump bak at run-bundle root or in `2_backbone/`.  
**Route elsewhere:** rejected style-master rounds → `1_upstream_raw_material/style-master-iterations/` · pipeline backups → `_generated/` · lessons → `_lessons/` · progress → `_state/`.

### structure gradient / 上严下松
Organizational rule: run-bundle **root strictest** (constitution entries only) → mid layers whitelisted → `_generated/` regenerable → `_scratch/` loosest. Temporary files sink **down**; never escape **up** to deck root.

---

## 视觉系统

### style_master.jpg
Reference image at `2_backbone/visual-style/style_master.jpg` — palette, type scale, grid, components. **Visual Style Master** / visual anchor for every slide generation (SHOW, don’t only describe).

**为什么重要**：这是整个框架最核心的洞察——用图片而不是文字来描述视觉风格。文字说"deep teal"每次都不一样；图片展示 exact teal swatch，每次都一样。

### Style Anchoring（风格锚定）
把 visual style master 作为 reference image 传给模型，让每一页 slide 都校准到同一个视觉参考上。

**为什么重要**：它解决了"文字描述风格 → 每页都漂移 → 死循环调整"的问题。SHOW, don't DESCRIBE.

### Anchoring Clause（锚定条款）
追加到每个 slide prompt 末尾的一段固定文字，告诉模型"严格匹配 reference image 的风格，不要偏离。" 内容大致是：

> "Use the reference image(s) as your EXACT visual style guide. Match the color palette, typography scale, layout grid... Only change the slide content, not the style."

### deck_system.txt
一份独立的文本文件，定义了全 deck 的 **textual constraints**——语言策略、禁用元素、文字密度、tone、颜色规则。它和 visual style master 互补：style master 展示视觉风格，deck_system.txt 规定文字约束。

**为什么重要**：Stage 1 脚本读取它，向每个 slide prompt 注入系统级 contract。它和 style master 共同构成 AI 模型的完整创作边界。

### Visual Asset（视觉资产）

一个命名、编目的视觉文件（SVG/PNG/JPG），存储在 `2_backbone/visual-style/assets/` 中，在 `asset-manifest.yaml` 注册，通过 `**VISUAL ASSETS**` 字段绑定到 slide。作为附加 reference image 随 `style_master.jpg` 一起传入 GPT Image 2 API。

**为什么重要**：当 slide 需要特定 diagram、SVG、reference photo 等模型不知道的视觉元素时，资产提供了 per-slide 的附加视觉锚点。它是可选基础设施——不需要时忽略即可。

### asset-manifest.yaml

视觉资产目录的 SSOT，位于 `2_backbone/visual-style/assets/asset-manifest.yaml`。每个资产一条记录：id（kebab-case）、path（相对于 assets/ 的路径）、type（svg|png|jpg）、label、description（多模态描述）、usage_guidance。Stage 1 据此验证 `**VISUAL ASSETS**` 引用。

**为什么重要**：manifest 是资产系统的注册中心——没有它，资产文件只是磁盘上的孤立文件，管线无法发现、验证或使用它们。

### VISUAL ASSETS

`slide-specifications.md` 中的 per-slide 字段：`**VISUAL ASSETS**: id1, id2`。逗号分隔的资产 ID 列表。可选字段——不引用资产时不写。当存在时，Stage 1 验证引用（WARNING 级），Stage 2 将对应的资产文件作为附加 reference image 传入 API。

**为什么重要**：这是用户绑定资产到 slide 的唯一入口点。和 `**RENDER MODE**` 一样，它是 per-slide 的显式决策——不需要额外配置文件。

---

## 内容设计

### Core Metaphor（核心隐喻）
用一句具体的、可感知的话抓住你要讲的故事的本质。它不是 tagline——它是一个 conceptual anchor，帮助观众把复杂信息组织成 mental model。

**为什么重要**：隐喻是你整个 deck 的地基。如果隐喻能在 5 秒内向陌生人解释清楚，你的 deck 就有了叙事锚点。

### Core Formula（核心公式）
用一句可证伪的话表达你要论证的命题。典型形式是 A + B = C。

**为什么重要**：不可证伪的公式（"AI is important"）没有论证力。可证伪的公式（"Readable Data + Managed Agents = AI Adoption"）驱动整份 deck——每张 slide 都在论证公式的一部分。

### Block（叙事块）
按叙事目的分组的 slide 集合（通常 3-7 张）。每个 Block 回答观众在旅程中的一个核心问题。

### 四层规格（Four-Layer Slide Spec）
每张 slide 的完整设计，包含四个独立层：
- **Meta**：VISUAL TYPE、KICKER、TITLE（给 pipeline 脚本读）
- **Concept**：MUST communicate、MUST NOT、Bridge（给人类 reviewer 读）
- **Image Prompt**：精确视觉描述，200-500 字（给 AI image model 读）
- **Speaker Note**：叙事流、术语解释、takeaway（给演讲者读）

### VISUAL TYPE（页面视觉类型）
一张 slide 的布局标签——Title / Opener、Concept Split、Direction、Evidence、Framework、Section Divider、Closer 等。新 deck 的 top-level `render.default: full-page` 是默认策略；`VISUAL TYPE` 不会把普通页自动降为 body-lock。只有没有 top-level `render` 的 legacy deck 才按 VISUAL TYPE 派生 mode，也可用显式 render policy/override 调整。

### KICKER
一行短小的全大写文字（3-6 词），放在 slide 左上角，告诉观众"你现在在哪个部分"。它是标签，不是 claim。如 `THE PROBLEM`、`HOW IT WORKS`。

### TITLE / CLAIM
这张 slide 的核心主张。必须是一个完整的、可争论的句子。不是 topic label（"Market Trends"），而是 claim（"Dashboards show you the traffic jam. Decisions tell you to take Exit 47."）。

---

## 生产管线

### Slide Identity / Position
`slide_id` 是一页跨版本稳定的身份；`position` 是当前 slide document 顺序派生的 1-based 页序。人类输出统一为 `07 · UXGap · Why onboarding breaks`。新 deck frontmatter 声明 `identity.scheme: mnemonic-v1`；Agent 使用 5–8 个 ASCII 字母、恰好两个 BlockCase 语义块，优先 5–6，如 `DeckGo`、`UXGap`、`AICost`。页码可用于当下口述，但重排后引用必须回到 ID。

### Render Artifact Identity
生成 artifact 的逻辑身份是 `(slide_id, render_engine, artifact_kind, fingerprint)`。`raw-render` 是昂贵生成物；`final-slide` 是 Stage 3 本地派生物。只有 manifest 的 kind/engine/fingerprint/profile/byte SHA 全部验证后状态才是 `verified`；只能从旧文件名定位但证据不全时是 `legacy-located`，不能跨版本复用。

### Header-Lock（标题锁定）
把 slide 的标题文字从 AI image generation 中分离出来，交给 Node `@napi-rs/canvas` 做确定性渲染。AI 负责 body visual（图表、卡片、颜色），确定性层负责 header text（kicker + title + subtitle），在精确的像素位置、用精确的字体大小。

**为什么重要**：AI 在文字位置、字体大小、拼写上不可靠。确定性渲染在精确文字上 100% 可靠。**Split the work where each tool is strongest.**

### RENDER MODE（唯一对外词汇）
每张 slide 的生产方式，**只使用这两个词**（写在 slide-specifications.md，也写入 `slide_plan.json` 的 `layout_contract.render_mode`）：

| RENDER MODE | 含义 | 典型页 |
|-------------|------|--------|
| **`full-page`** | AI 画整页（含 Stage 1 注入的结构化 header），Stage 3 不叠字 | 新 deck 默认；header 稳定度尽力保证 |
| **`body+header-lock`** | AI 只画 body（顶部留白），Node 叠 kicker+title | 按需升级；保证文字清晰度与像素位置 |

旧词 `normal` / `image_direct` 仅作输入别名兼容，**文档与新产出禁止再用**。Stage 3 读 `render_mode`；若遇到旧 `slide_plan.json` 里的 `header_variant`，会自动映射。

### Refresh Path
按内容所有者和失效产物选择最小安全路径。英文是正式名称；中文只作解释；旧字母不是缩写，只作兼容检索。

- **Header Text & Style Refresh**（页眉文字与样式刷新；formerly Chain A）：只适用于 resolved `body+header-lock` 的 KICKER/TITLE/SUBTITLE，或 Stage 3 拥有的字体、颜色、位置、行高与间距；raw-image contract 必须不变。Stage 1 → 3 → 4 → 5（~5 分钟）。
- **Generated Image Rebuild**（生成图重建；formerly Chain B）：生成图或 raw-image contract 失效。Stage 1 → 对所选页强制 Stage 2 → review → Stage 3/4/5；full-page 标题使用 pilot/review 后复用已审图（~5 分钟/页）。
- **Notes-Only Refresh**（仅备注刷新；formerly Chain C）：只改 speaker notes。Stage 5（~30 秒）。
- **Structural Versioning Path**（结构版本路径；formerly Structural）：增/删/重排先用 stable-ID snapshot preview 和 exact hash 发布干净 vNext，再只物化 verified raw、在目标本地重建 cheap outputs；`needs_render` 需另行授权。它不是第四条并列 refresh path。

标题意图统一走 `ppt_flow refresh --kind title`：resolved `body+header-lock` 使用 Header Text & Style Refresh；resolved `full-page` 使用 Generated Image Rebuild，需要所选页生图与 header review。safe-zone 或 render mode 变化也属于 Generated Image Rebuild。

### Gate Check（闸门检查）
每个 Phase 和 Stage 结束时的强制检查点。Agent 停下来等用户确认后才能继续。**跳过闸门 = 下游改动成本指数增长。**

### Stage（管线阶段）
生产管线的 5 个步骤：Stage 1（markdown→JSON）、Stage 2（text→images）、Stage 3（Header-Lock）、Stage 4（build PPTX）、Stage 5（inject notes）。每个 Stage 有明确的输入/输出，可以独立运行和 debug。

### pilot / contact_sheet（小样）
Few-page visual gate before full production. Artifacts under `_generated/preview/` (e.g. `*contact_sheet*.jpg`). Command: `ppt_flow.mjs pilot <--run-dir>`. Show the sheet; do not treat final PPTX as the pilot review stand-in.

---

## 迭代

### 结构化迭代（Structured Iteration）
把"反复改、来回调"变成有纪律的流程：明确要改什么和为什么 → 审核影响范围 → 实施变更 → 记录归档。不管用什么工具（Claude Code 的 OpenSpec、changelog + git、issue tracker），核心纪律不变。

### 版本快照（Version Snapshot）
`bundle_layout.mjs --new-version deck_X/3_versions/v{n}`——只复制下游源 delta，并创建干净 `_generated/`。适用于砍/加/重排 slide 等下游结构改动；隐喻/公式/共享视觉属于 backbone，不应借开版本逃避共享语义。

### 结构逃生阶梯
结构计划 stale 或小冲突时重新 preview；同一方向变化大时另起 vNext；受众、主叙事或设计系统分叉时另建 deck。Git 可作为用户拥有的 source/control 审计和比较，但不替代 run-bundle 的版本边界，也不提供框架默认回退或 source replacement。

### 可选 Git 审计
Git 是用户拥有的 source/control 审计与比较层，不是 deck 工作版本、slide order、renderer cache 或 pipeline gate。可见 `vN` + Structural Versioning Path 才是 deck 工作版本权威；`_generated/` 始终是派生品，不 force-track，也不是 recovery target。没有用户对命名操作和精确范围的明确授权，Agent 不检查 Git 状态或执行 Git mutation；本框架没有默认 `git checkout`、`git restore` 或其它 source-recovery protocol。

---

## API & 工具

### GPT Image 2
本框架唯一使用的 image generation model。支持 reference image 作为输入（style anchoring 的前提），文字渲染质量和色彩一致性在目前所有模型中最好。通过 OpenAI 兼容 API 访问——可以直接连 OpenAI，也可以通过中转服务。

### Async API Pattern（异步 API 模式）
Image generation 的调用模式：submit（提交 prompt）→ poll（轮询任务状态）→ download（下载生成的图片）。不是"发请求 → 等图片"，而是"发请求 → 拿到 task_id → 过几秒问一次做好了没 → 做好了再下载"。

---

> 有术语缺失？先 `rg` 真路径/文件名（Where Map）；再查 [charter/AGENT_CONTRACT.md](../charter/AGENT_CONTRACT.md)。Where Map 缺行补本文件——别另造目录名。Run-bundle 树定义属 **run-bundle-layout**，软包树属 **framework-directory-layout**。
