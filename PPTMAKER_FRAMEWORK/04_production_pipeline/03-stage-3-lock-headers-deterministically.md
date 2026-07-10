---
title: '03 — Stage 3: The Header-Lock Mechanism'
stage: 04_production_pipeline
position: 04 of 06
type: methodology
summary: 方法论文件。Agent 理解其中原理并应用于对话引导。
depends_on:
- 04_production_pipeline/README.md
- 04_production_pipeline/02-stage-2-generate-images-with-anchoring.md
feeds_into:
- 04_production_pipeline/04-stage-4-build-the-pptx-container.md
agent_action: execute_pipeline
---

# 03 — Stage 3: The Header-Lock Mechanism

← [02](02-stage-2-generate-images-with-anchoring.md) | [Next →](04-stage-4-build-the-pptx-container.md)

## Stage 3 做什么

把 Stage 2 生成的 AI 画面和 Stage 1 定义的标题文字合成为最终 slide 图片。

- **`body+header-lock` slides**（~80%）：用 Python/Pillow 在画面顶部叠加 kicker + title + subtitle，精确像素位置
- **`full-page` slides**（~20%）：什么都不做——AI 已经画了完整画面，pass-through 保存

输入：`_generated/page_images_full/*.png`（Stage 2 产出）+ `_generated/slide_plan.json`（Stage 1 产出）
输出：`_generated/header_locked/*.png`（最终 slide 图片）+ `_generated/qa/header_lock_qa.json`（QA 记录）

## Header-Lock 的核心原理

AI image model 在文字渲染上有三个系统性弱点：
1. **位置飘忽**：同一个 prompt "title at y=58"，两次生成可能偏 3-5px
2. **字体大小不一致**：model 没有字体大小的精确概念——"46px" 对它来说是一个视觉印象
3. **偶发拼写错误**：极少但可能——尤其是大写字母序列

Python/Pillow 在这三件事上是精确的：
1. **像素级定位**：`draw.text((46, 58), text)` — 每次都画在同一个位置
2. **精确字体大小**：`ImageFont.truetype("SourceSansPro-Black.otf", 46)` — 46 就是 46pt
3. **文字内容无误**：你给 Python 什么 string，它就渲染什么 string

因此分工：**AI 负责画面（body visual），Python 负责标题文字（header text）。**

## 两种 RENDER MODE 的处理逻辑

### body+header-lock（Python 叠加 header）

```
1. 打开 AI 生成的图片 → 转为 RGBA
2. 在图片上叠加文字：
   - Kicker:  (x=46, y=24), font=Semibold 22px, color=#becbda, tracking=5
   - Title:   (x=46, y=58), font=Black 46px, color=#f4f8fc, word-wrap enabled
   - Subtitle: (below title), font=Regular 27px, color=#a4b8cc (if exists)
3. 保存为 .png, quality=94
```

**关键参数**（这些来自视觉系统设计——01 的 typography scale）：

| 参数 | 含义 | 从哪里来 |
|------|------|---------|
| Header safe zone | 顶部多少 px 是 header 区域（如 260px） | 01 的 layout grid |
| Font paths | 字体文件位置 | 系统安装的字体 |
| Font sizes | Kicker 22px / Title 46px / Subtitle 27px | 01 的 typography scale |
| Font colors | Kicker #becbda / Title #f4f8fc / Subtitle #a4b8cc | 01 的 color system |
| Text positions | (x=46, y=24/58) | 01 的 layout grid |

**注意**：Header 叠加是**透明文字**——不画背景条、不画分割线。文字直接放在 AI 生成的深色背景上。这要求 AI 生成的画面在 header zone 保持干净的深色背景。

### full-page（Pass-through）

```
1. 打开 AI 生成的图片
2. 检查尺寸 → 如果不符合 canvas，resize 适配
3. 直接保存——不叠加任何文字
```

`full-page` 用于 opening、section divider、closing 等 slide。这些 slide 的标题是画面构图的一部分——由 AI 完整生成，Python 不做任何处理。

## 怎么判定 RENDER MODE

Stage 3 **不自己判定** slide 类型。它从 `slide_plan.json` 的 `layout_contract.render_mode` 读取——这个字段是 Stage 1 填的（旧 plan 若仍有 `header_variant`，Stage 3 会映射到 canonical）。

这很重要：如果 Stage 1 把某张 slide 错标成了 `body+header-lock`（但应该是 `full-page`），Stage 3 会在它的 opening 页面上叠一个 header——破坏画面。反过来，如果把 `body+header-lock` 错标成 `full-page`，标题文字就不会被画上去。

**黄金法则：改了 VISUAL TYPE / RENDER MODE → 必须重跑 Stage 1。** `slide_plan.json` 是 Stage 3 判定 header 要不要画的唯一依据。

## 字体依赖

Header-Lock 依赖系统安装的字体。推荐的字体选择：

| 用途 | 推荐字体 | 备选 |
|------|---------|------|
| Kicker | Semibold（如 Source Sans Pro Semibold） | 粗体 sans-serif |
| Title | Black/ExtraBold（如 Source Sans Pro Black） | 最粗的 sans-serif |
| Subtitle | Regular/Light（如 Source Sans Pro Regular） | 细体 sans-serif |

**为什么用 sans-serif**：幻灯片文字在屏幕上阅读，serif 字体在小字号下可能模糊。Sans-serif 在全屏 16:9 上更清晰。

**字体不在系统上怎么办**：Stage 3 用可读且字号正确的后备 sans（打响亮 warning），完全没有可用字体才硬中止。

## QA 输出

Stage 3 产出一个 QA JSON：

```json
{
  "total": 19,
  "full_page_pass_through": 3,
  "body_header_lock_drawn": 16,
  "canvas": [1672, 941],
  "slides": [
    {
      "id": "s1_b1_01_title",
      "render_mode": "full-page",
      "action": "PASS-THROUGH"
    }
  ]
}
```

这个 QA 文件让你快速确认：所有 slide 都处理了？full-page 的三张 title 完整？body+header-lock 的 header 文字没有和 body 撞车？

## Gate Check：Stage 3 完成后必须确认什么

- [ ] full-page slides 的标题完整（没有被意外叠加文字）
- [ ] body+header-lock slides 的 header 文字没有和 AI 生成的 body 内容重叠
- [ ] 所有文字的字体、大小、颜色、位置符合视觉系统规范
- [ ] Canvas 尺寸一致（所有输出图片都是 1672×941）
- [ ] QA JSON 的 slide 数 = slide_plan.json 的 slide 数

---

> **案例**：T10 项目使用 Source Sans Pro 字体（Semibold/Black/Regular），kicker 22px, title 46px Black, subtitle 27px。19 张 slide 中 3 张 pass-through（title/bridge/closer），16 张叠加 header。字体由跨平台解析（bundled `fonts/` → `$PPT_FONT_DIR` → 系统字体）。Header-Lock 实现细节可演进，但 AI+Python 分工原则不变。

> **Next**: `04-stage-4-build-the-pptx-container.md` — Stage 4 详解：怎么把最终图片封装进 PPTX 容器。
