---
title: '04 — Stage 4: Build the PPTX Container'
stage: workflow/04-production
position: 05 of 06
type: methodology
summary: 方法论文件。Agent 理解其中原理并应用于对话引导。
depends_on:
- workflow/04-production/README.md
- workflow/04-production/03-stage-3-lock-headers-deterministically.md
feeds_into:
- workflow/04-production/05-stage-5-inject-speaker-notes.md
agent_action: execute_pipeline
---

# 04 — Stage 4: Build the PPTX Container

← [03](03-stage-3-lock-headers-deterministically.md) | [Next →](05-stage-5-inject-speaker-notes.md)

## Stage 4 做什么

把 Stage 3 产出的最终 PNG 图片按顺序装入一个 `.pptx` 文件——每张 slide 是一张全屏图片，按 `slide_plan.json` 中定义的顺序排列。

输入：`_generated/header_locked/*.png`（Stage 3 产出）+ `_generated/slide_plan.json`（排序依据）
输出：`_generated/ppt/{NAME}.pptx`

脚本：`node PPTMAKER_FRAMEWORK/scripts/stage4_build_pptx.mjs --run-dir ...`

## PPTX 作为媒体容器的理念

这个管线产出的 PPTX 不是传统的 PowerPoint 文件——没有 editable text boxes、没有 shapes、没有 master slides。每张 slide 是一张全幅 PNG 图片，填满整个 16:9 画布。

**为什么选择这个方案**：
- AI 生成的视觉画面无法拆解为 editable objects（图表、图标、颜色渐变都是像素）
- Editable text 会引入字体依赖——在没有安装特定字体的电脑上 PPT 会用 fallback 字体，破坏视觉一致性
- Image-based slides 在任何设备上看起来完全一样——不需要担心字体、版本、操作系统

**这个方案的 trade-off**：文字不可编辑。所有文字已经 "烧入" 图片中（包括 Stage 3 叠加的 header）。如果需要改一个标题文字，你不能在 PowerPoint 里改——你需要回到源 markdown，重跑管线。但这是有意为之的——slide 是视觉成品，不是可继续编辑的模板。

## 技术实现

使用 `pptxgenjs` 库：

```javascript
import PptxGenJS from "pptxgenjs";

const pptx = new PptxGenJS();
pptx.defineLayout({ name: "HD", width: 13.333, height: 7.5 });
pptx.layout = "HD";

for (const slide of slidePlan.slides) {
  const s = pptx.addSlide();
  const imgPath = `_generated/header_locked/${slide.NN}_${slide.id}.png`;
  s.addImage({
    path: imgPath,
    x: 0,
    y: 0,
    w: "100%",
    h: "100%",
  });
}

await pptx.writeFile({ fileName: "_generated/ppt/{NAME}.pptx" });
```

关键参数：
- **Slide 尺寸**：16:9 = 13.333" × 7.5"——匹配 1672×941 px 的图片（约 125 DPI）
- **Layout**：自定义 HD layout——无占位符干扰
- **图片位置**：(0, 0)，宽度和高度完全等于 slide 尺寸

## 排序

Slide 顺序来自 `slide_plan.json` 中 slides 数组的顺序——就是 Stage 1 解析 markdown 时 `## Slide NN` 出现的顺序。Stage 4 不重新排序。

如果你想调整顺序：回到源 markdown，调整 `## Slide NN` 的编号和顺序，重跑管线。

## Gate Check：Stage 4 完成后必须确认什么

- [ ] PPTX 包含的 slide 数 = `slide_plan.json` 的 slide 数
- [ ] Slide 顺序和 `slide_plan.json` 一致
- [ ] 图片没有拉伸或变形（aspect ratio 匹配）
- [ ] 没有空 slide 或空白占位符
- [ ] 文件可以在 PowerPoint/Keynote/Google Slides 中正常打开

---

> **案例**：T10 项目最终产出 `T10v3_strategic_briefing.pptx`——19 张 slide，约 30 MB。每张 slide 是一张 1672×941 的全屏图片。文件在所有主流 PPT 软件中兼容。PNG 输出平衡文件大小和画质。

> **Next**: `05-stage-5-inject-speaker-notes.md` — Stage 5 详解：怎么把 speaker notes 注入 PPTX + 三条编辑链的完整工作流。
