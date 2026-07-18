---
title: 'Reference: Pipeline Script Patterns'
stage: workflow/04-production
position: reference
type: reference
summary: 参考模式。Agent 查阅并适配到具体项目中。
depends_on:
- workflow/04-production/README.md
feeds_into: []
agent_action: copy_and_adapt
---

# Reference: Pipeline Script Patterns

> **此文件保留作为架构参考。** 完整的可运行 Node.js 实现位于 `scripts/` ——五个 Stage 的 `.mjs` 生产脚本，通过 `unified_pipeline.mjs --run-dir` 就地运行，修改脚本顶部常量即可适配项目。
>
> 以下是六个关键模式的注释版伪代码——展示每个阶段的核心代码结构和设计决策。读它来理解**为什么这样设计**；用 `scripts/` 来**实际执行**。

---

## Pattern 1: Markdown Parser（Stage 1）

**做什么**：从半结构化 markdown 提取结构化字段（`stage1_build_inputs.mjs`）。

```javascript
import { readFileSync } from "node:fs";

function parseSlides(mdPath) {
  const text = readFileSync(mdPath, "utf-8");
  const slideBlocks = text.split(/## Slide \d+:/).slice(1);
  return slideBlocks.map((block) => ({
    id: extractId(block),
    visual_type: extractField(block, "VISUAL TYPE"),
    kicker: extractField(block, "KICKER") ?? "",
    headline: extractField(block, "TITLE"),
    subtitle: extractField(block, "SUBTITLE") ?? null,
    image_prompt: extractCodeBlock(block, "IMAGE PROMPT"),
  }));
}

function extractField(block, fieldName) {
  const match = block.match(new RegExp(`\\*\\*${fieldName}\\*\\*:\\s*(.+)`));
  return match ? match[1].trim() : null;
}

function extractCodeBlock(block, label) {
  const match = block.match(new RegExp(`\\*\\*${label}\\*\\*:.*?\\n\`\`\`\\n([\\s\\S]*?)\`\`\``, "s"));
  return match ? match[1].trim() : "";
}
```

**关键设计决策**：
- **宽容解析**：字段缺失时返回 None 而非抛异常——markdown 是人类写的
- **正则 vs 逐行解析**：正则更简洁但脆弱。如果你的 markdown 格式不统一，改用逐行状态机解析
- **`extract_code_block`**：依赖 ``` 标记——确保你的 markdown 约定一致

---

## Pattern 2: Prompt Assembler（Stage 1）

**做什么**：把源 IMAGE PROMPT 和系统级 contracts 组装成完整 prompt。

```javascript
const SYSTEM_HEADER_CONTRACT = (headerSafeZone) => `
HEADER CONTRACT (ABSOLUTE):
The top ${headerSafeZone}px of this image (y=0 to y=${headerSafeZone})
is the header zone. Keep this area clean, dark navy (#0a1628),
with NO text, NO visual elements, NO decorations.
Stage 3 (Header-Lock) will overlay the header text after generation.
`;

function assemblePrompt(sourcePrompt, layoutContract, isFullPage) {
  if (isFullPage) {
    return `FULL-PAGE: Render the complete slide including all text.\n\n${sourcePrompt}`;
  }
  const contract =
    SYSTEM_HEADER_CONTRACT(layoutContract.header_safe_zone) +
    SYSTEM_BODY_TEXT_CONTRACT;
  return `${contract}\n\n---\n\n${sourcePrompt}\n\n---\n\n${SYSTEM_STYLE_ANCHORING}`;
}
```

**关键设计决策**：
- **Contracts 是常量**：在脚本顶部定义，方便统一修改。不要让不稳定的文字散落在各处
- **IMAGE_DIRECT 例外**：跳过 header contract——AI 渲染完整画面
- **Layout contract 参数化**：`header_safe_zone` 等值从 layout_contract 传入，而非硬编码

---

## Pattern 3: Async Image Generator（Stage 2）

**做什么**：Submit → poll → download，skip-if-exists，mirror fallback。官方路径：`unified_pipeline.mjs` → 框架内 `stage2_generate_images.mjs` → `image_api_client.mjs`。

```javascript
const MIRRORS = [
  "https://api.primary.com/v1",
  "https://api.fallback1.com/v1",
];
const MAX_POLLS = 120;
const POLL_INTERVAL_MS = 5000;

async function generateImage(prompt, outputPath, { model = "gpt-image-2", resolution = "2k" } = {}) {
  if (existsSync(outputPath)) {
    console.log(`  Skip — already exists: ${outputPath}`);
    return null;
  }
  // Submit through the in-framework API client, poll task, download PNG, write trace JSON
  // See unified_pipeline.mjs runStage2() for production wiring
}
```

**关键设计决策**：
- **Mirror 列表外部化**：放在脚本顶部或 config 文件——方便添加/删除 mirror
- **Skip-if-exists**：恢复运行默认跳过已有图片；raw `unified_pipeline --only` 只限定范围，明确重建已有单页必须配 `--force-images`；公共 `ppt_flow refresh --kind visual` 会为明确 scope 加 force
- **Trace 文件**：每个图片配一个——调试时 invaluable

---

## Pattern 4: Header Overlay（Stage 3）

**做什么**：Node `@napi-rs/canvas` 在 AI 生成的画面上叠加 header 文字（`stage3_lock_headers.mjs`）。

```javascript
import { createCanvas, loadImage, registerFont } from "@napi-rs/canvas";

// Fonts — resolved cross-platform (bundled fonts/ → $PPT_FONT_DIR → OS dirs),
// with a size-respecting fallback and a hard abort if nothing is usable.
registerFont("SourceSansPro-Semibold.otf", { family: "Kicker", weight: "600" });
registerFont("SourceSansPro-Bold.otf", { family: "Title", weight: "700" });
registerFont("SourceSansPro-Regular.otf", { family: "Subtitle", weight: "400" });

const KICKER_POS = { x: 46, y: 24 };
const TITLE_POS = { x: 46, y: 58 };
const KICKER_COLOR = "#becbda";
const TITLE_COLOR = "#f4f8fc";
const SUBTITLE_COLOR = "#a4b8cc";
const CANVAS_SIZE = { width: 1672, height: 941 };

async function lockHeader(imgPath, slidePlan, outputPath) {
  const img = await loadImage(imgPath);

  if (slidePlan.render_mode === "full-page") {
    const canvas = createCanvas(CANVAS_SIZE.width, CANVAS_SIZE.height);
    const ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0, CANVAS_SIZE.width, CANVAS_SIZE.height);
    writeFileSync(outputPath, canvas.toBuffer("image/png"));
    console.log(`  PASS-THROUGH: ${slidePlan.id}`);
    return;
  }

  const canvas = createCanvas(CANVAS_SIZE.width, CANVAS_SIZE.height);
  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0, CANVAS_SIZE.width, CANVAS_SIZE.height);

  const kicker = slidePlan.kicker ?? "";
  if (kicker && kicker !== "(无)" && kicker !== "(none)") {
    ctx.font = "22px Kicker";
    ctx.fillStyle = KICKER_COLOR;
    ctx.fillText(kicker.toUpperCase(), KICKER_POS.x, KICKER_POS.y);
  }

  ctx.font = "46px Title";
  ctx.fillStyle = TITLE_COLOR;
  let y = TITLE_POS.y;
  for (const line of wordWrap(slidePlan.headline, ctx, CANVAS_SIZE.width - 92)) {
    ctx.fillText(line, TITLE_POS.x, y);
    y += 52;
  }

  if (slidePlan.subtitle) {
    y += 8;
    ctx.font = "27px Subtitle";
    ctx.fillStyle = SUBTITLE_COLOR;
    ctx.fillText(slidePlan.subtitle, TITLE_POS.x, y);
  }

  writeFileSync(outputPath, canvas.toBuffer("image/png"));
  console.log(`  DREW HEADER: ${slidePlan.id}`);
}

function wordWrap(text, ctx, maxWidth) {
  const words = text.split(" ");
  const lines = [words[0]];
  for (const word of words.slice(1)) {
    const test = `${lines.at(-1)} ${word}`;
    if (ctx.measureText(test).width <= maxWidth) lines[lines.length - 1] = test;
    else lines.push(word);
  }
  return lines;
}
```

**关键设计决策**：
- **Font resolution (fail-loud)**：跨平台查找目标字体(bundled `fonts/` → `$PPT_FONT_DIR` → 系统目录);缺失则降级到**字号正确**的后备 sans 并打响亮 warning;毫无可用字体才硬中止。
- **Word wrap**：Title 可能超过一行——必须 wrap。用 `ctx.measureText()` 测量文字实际宽度
- **full-page = pass-through**：不画任何东西——AI 生成的完整画面直接保存

---

## Pattern 5: PPTX Builder（Stage 4）

**做什么**：把最终 PNG 按顺序装入 PPTX 容器（`stage4_build_pptx.mjs`，`pptxgenjs`）。

```javascript
import PptxGenJS from "pptxgenjs";
import { readFileSync } from "node:fs";

const SLIDE_WIDTH = 13.333;
const SLIDE_HEIGHT = 7.5;

function buildPptx(slidePlanPath, imagesDir, outputPath) {
  const plan = JSON.parse(readFileSync(slidePlanPath, "utf-8"));
  const pptx = new PptxGenJS();
  pptx.defineLayout({ name: "HD", width: SLIDE_WIDTH, height: SLIDE_HEIGHT });
  pptx.layout = "HD";

  for (let i = 0; i < plan.slides.length; i++) {
    const slide = plan.slides[i];
    const s = pptx.addSlide();
    const filename = `${String(i + 1).padStart(2, "0")}_${slide.id}.png`;
    s.addImage({
      path: `${imagesDir}/${filename}`,
      x: 0,
      y: 0,
      w: "100%",
      h: "100%",
    });
  }

  pptx.writeFile({ fileName: outputPath });
  console.log(`PPTX saved: ${outputPath} (${plan.slides.length} slides)`);
}
```

**关键设计决策**：
- **Blank slide**：`pptxgenjs` 默认空白 slide——避免任何占位符干扰
- **图片 aspect ratio**：1672×941 渲染到 13.333"×7.5" 是精确匹配（约 125 DPI），不会拉伸
- **文件大小**：19 张 2K PNG → ~30 MB PPTX。如果需要更小，可以用 JPEG 压缩（trade-off 画质）

---

## Pattern 6: Notes Injector（Stage 5）

**做什么**：从 markdown 提取 SPEAKER NOTE，注入 PPTX notes 面板（`stage5_inject_notes.mjs`）。

```javascript
import PptxGenJS from "pptxgenjs";
import { readFileSync } from "node:fs";

function extractNotes(mdPath) {
  const text = readFileSync(mdPath, "utf-8");
  const slideBlocks = text.split(/## Slide \d+:/).slice(1);
  return slideBlocks.map((block) => {
    const match = block.match(/> \*\*SPEAKER NOTE\*\*\s*\n((?:> .*\n?)*)/);
    if (!match) return "";
    return match[1].replace(/^> ?/gm, "").trim();
  });
}

async function injectNotes(pptxPath, notesList) {
  const pptx = new PptxGenJS();
  await pptx.load(pptxPath);
  if (notesList.length !== pptx.slides.length) {
    throw new Error(`Notes count (${notesList.length}) != slides (${pptx.slides.length})`);
  }
  pptx.slides.forEach((slide, i) => {
    if (notesList[i]) slide.addNotes(notesList[i]);
  });
  await pptx.writeFile({ fileName: pptxPath });
  console.log(`Notes injected into ${pptxPath}`);
}
```

**关键设计决策**：
- **原地修改**：这是唯一修改输入文件的阶段——务必先备份
- **Assert 数量匹配**：如果 notes 数和 slides 数不一致，立即报错——说明解析或 markdown 有问题
- **Notes 为空时 skip**：不是每个 slide 都需要 speaker notes

---

## 在你的项目中适配这些模式

这些伪代码展示的是**结构**和**设计决策**——不是可以直接运行的完整脚本。适配时：

1. **修改常量**：canvas size、header safe zone、font paths、API credentials——这些都是项目特定的
2. **替换 API 调用**：把 `requests.post(f"{mirror}/images/generations")` 替换为你的实际 image generation API
3. **添加错误处理**：伪代码省略了 retry logic、timeout handling、partial failure recovery
4. **工具栈**：本框架使用 checked-in profile 支持的 Node.js 22/24/26、`@napi-rs/canvas`（Stage 3）、`pptxgenjs`（Stage 4–5）；模式与语言无关，但参考实现已是 Node `.mjs`。

完整的生产实现参考：`scripts/` 目录（通过 `unified_pipeline.mjs --run-dir` 就地运行，不复制进 run bundle）。历史案例 T10 当年把脚本放在 `session_ppt_flow_T10/v3/scripts/`——那是本框架成形前的做法，当前布局已改为脚本就地运行、产物统一写入 `_generated/`。
