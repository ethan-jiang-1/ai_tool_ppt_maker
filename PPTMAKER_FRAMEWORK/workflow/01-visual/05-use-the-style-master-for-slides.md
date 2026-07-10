---
title: 05 — Use the Visual Style Master For Slides
stage: workflow/01-visual
position: 06 of 06
type: methodology
summary: 生产阶段。Style master 已锁定。理解 anchoring 如何在管线中工作。
depends_on:
- workflow/01-visual/README.md
- workflow/01-visual/04-iterate-review-lock.md
feeds_into: []
agent_action: internalize
---

# 05 — Use the Visual Style Master For Slides

> 生产阶段。Visual style master 已锁定。理解 anchoring 如何工作，以及用什么脚本生成 slides。

---

**Navigation**: ← `04-iterate-review-lock.md` | Next → （参见 `template-visual-style.md` 获取填空模板）

---

## Anchoring 如何在技术上工作

当你用 `unified_pipeline.mjs`（Stage 2 → image2-ppt skill）生成 slides 时：

1. Style master 作为 reference image 传入 API（`--style-reference` 参数）
2. Stage 1 组装的最终 prompt 已含一次 **anchoring clause（锚定条款）**；Stage 2 只附加 reference image，不重复修改 prompt：

```
Use the reference image(s) as your EXACT visual style guide.
Match the color palette, typography scale, layout grid, component patterns,
and overall visual language precisely. The reference defines the deck's design
system — do not deviate from it. Only change the slide content, not the style.
```

3. 模型处理 reference image 的 visual features——colors、spatial relationships、typographic proportions——并在生成的 slide 中复现它们
4. Content changes（这页的 headline、这页的 data、这页的 diagram）因 prompt 而异；style 保持 anchored

模型不是在 "copying" style master 到每一页 slide 上。它是在 **calibrating**——匹配 visual properties 同时生成 new content。可以理解为调收音机到一个特定频率：style master 设置频率，每一页 slide 调谐到它。

## 生成工作流

完整管线在 `workflow/04-production/` 中详细展开。以下是 style master 相关的摘要：

### Step 1: 准备输入
- `3_versions/v1/slide-specifications.md`（内容规格——Phase 1 产出）
- `2_backbone/visual-style/visual-style.md`（视觉系统——Phase 2 产出，Section 7 提取为 `deck_system.txt`）
- `2_backbone/visual-style/style_master.jpg`（视觉锚点——Phase 2 产出，已锁定）

### Step 2: Pilot（试生产）
先生成 3-4 张代表性 slides 验证 style consistency：

```bash
# 先跑 Stage 1（解析 markdown → JSON，写入 _generated/）
node PPTMAKER_FRAMEWORK/scripts/stage1_build_inputs.mjs \
  --input 3_versions/v1/slide-specifications.md \
  --out-dir 3_versions/v1/_generated/ \
  --style-dir 2_backbone/visual-style/

# 手动编辑 _generated/page_prompts/_prompts.json，只保留 pilot 用的几张 slide
# 然后跑 Stage 2（生图）
node <skills>/image2-ppt/scripts/generate_full_page_images.py \
  --prompt-json 3_versions/v1/_generated/page_prompts/_prompts.json \
  --style-reference 2_backbone/visual-style/style_master.jpg \
  --out-dir 3_versions/v1/_generated/page_images_full/ \
  --resolution 1k
```

审查 pilot：所有页面看起来像同一个 deck 吗？Palette、typography、component patterns 是否一致？

### Step 3: Full Generation（全量生产）
Pilot 通过后，生成全 deck：

```bash
node <skills>/image2-ppt/scripts/generate_full_page_images.py \
  --prompt-json 3_versions/v1/_generated/page_prompts/_prompts.json \
  --style-reference 2_backbone/visual-style/style_master.jpg \
  --out-dir 3_versions/v1/_generated/page_images_full/ \
  --resolution 2k
```

### Step 4: Header-Lock + PPTX
```bash
node PPTMAKER_FRAMEWORK/scripts/stage3_lock_headers.mjs \
  --images 3_versions/v1/_generated/page_images_full/ \
  --slide-plan 3_versions/v1/_generated/slide_plan.json \
  --out 3_versions/v1/_generated/header_locked/ \
  --style-dir 2_backbone/visual-style/

node PPTMAKER_FRAMEWORK/scripts/stage4_build_pptx.mjs \
  --images 3_versions/v1/_generated/header_locked/ \
  --slide-plan 3_versions/v1/_generated/slide_plan.json \
  --out 3_versions/v1/_generated/ppt/{NAME}.pptx
```

> 实践中直接用 `unified_pipeline.mjs --run-dir deck_{NAME}/3_versions/v1 --stage all` 一条命令跑完更省事；上面拆开是为了说明 style master 在哪几步被消费。

## Deck System Text — 互补的 Contract

Style master 处理 **visual** consistency。`deck_system.txt` 处理 **textual** constraints。两者协同工作：

| Style Master | System Text |
|-------------|-------------|
| Color palette (visual) | Language policy ("English only") |
| Typography scale (visual ratios) | Forbidden elements ("no logos, no watermarks") |
| Layout grid (visual zones) | Text density rules ("max 40 words per slide") |
| Component patterns (visual) | Tone and audience guidance |
| Product DNA (visual character) | Number rounding policy |

Style master **shows** 模型产出什么。System text **tells** 模型不要产出什么。两者共同构成完整的 contract。

## 当 Style Anchoring 可能无效时

### 1. Style Master 本身质量差
如果 style master 有模糊的 colors、不清晰的 typography hierarchy 或 sloppy components，anchoring 会复现 sloppiness。**Garbage in, garbage out.**

### 2. Content Prompt 与 Style 矛盾
如果 slide prompt 说 "use a bright neon palette" 但 style master 是 dark corporate navy，模型接收到冲突指令。**修复：从 content prompt 中移除 style contradictions。**

### 3. 极度创意 / 艺术化 Deck
Style anchoring 最适合 **structured business decks**——keynotes、executive reviews、strategy presentations。对于高度艺术化或实验性的 deck，anchoring 会过度约束模型。

### 4. 非常密集的文本页
GPT Image 2 text rendering 好但并非完美。如果一页需要超过 ~50 words 的 rendered text，模型可能在 text legibility 上挣扎。**修复：减少 text density 到每页 3-5 个 readable text zones。**

## Style Master 与 Header-Lock 的关系

Style anchoring 和 Header-Lock（`stage3_lock_headers.mjs`）是互补机制：
- **Style anchoring**：确保每一页的 body visual（KPI cards、diagrams、callout bar）look 一致
- **Header-Lock**：确保每一页的 kicker/title/subtitle 文字在**精确相同的位置**，用**精确相同的字体**

Style master 的 layout grid 教模型在哪里**留出空间**给 header。Header-Lock 用 Python/Pillow 精确渲染 header 文字。

## 总结

```
Phase 1: Content Design → 3_versions/v1/slide-specifications.md
Phase 2: Visual Style Master → 2_backbone/visual-style/style_master.jpg + deck_system.txt
Phase 3: Production Pipeline (Stages 1-5) → 3_versions/v1/_generated/ppt/{NAME}.pptx
  Stage 1: markdown → JSON
  Stage 2: GPT Image 2 生图（style master 作为 visual anchor）
  Stage 3: Header-Lock（Python/Pillow 叠加标题）
  Stage 4: Build PPTX
  Stage 5: Inject speaker notes
```

投资 Phase 2。一张 locked、checklist-passed 的 visual style master 让 Phase 3 可预测。一张 rushed style master 让 Phase 3 变成与模型的战斗。

---

> **Next**: 你已完成方法论。复制 `template-visual-style.md` 到你的项目，生成你的 visual style master，迭代，锁定，然后进入 `workflow/04-production/` 和 `scripts/`。
