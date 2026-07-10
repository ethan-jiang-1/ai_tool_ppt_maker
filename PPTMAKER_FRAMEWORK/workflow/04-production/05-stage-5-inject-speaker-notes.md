---
title: '05 — Stage 5: Inject Speaker Notes + The Editing Chains'
stage: workflow/04-production
position: 06 of 06
type: methodology
summary: 方法论文件。Agent 理解其中原理并应用于对话引导。
depends_on:
- workflow/04-production/README.md
- workflow/04-production/04-stage-4-build-the-pptx-container.md
feeds_into: []
agent_action: execute_pipeline
---

# 05 — Stage 5: Inject Speaker Notes + The Editing Chains

← [04](04-stage-4-build-the-pptx-container.md) | [README](README.md)

## Stage 5 做什么

从源 markdown（02 的产出）中提取每张 slide 的 SPEAKER NOTE，注入到 PPTX 的 notes 面板中。

输入：源 markdown + Stage 4 产出的 `.pptx`
输出：原地修改的 `.pptx`（每个 slide 的 notes 面板被填充）

## 为什么这是最后一个阶段

Speaker notes 是唯一对视觉没有影响的元素。它们存在于 PPTX 的 notes 面板中——只在 Presenter View 中可见，不影响 slide 画面。因此它们可以最后注入——在所有视觉相关阶段（1-4）完成之后。

这也意味着：**Stage 5 是唯一原地修改 PPTX 的阶段。** Stages 1-4 都是 "读取输入、写入新输出"。Stage 5 是 "读取输入、修改现有文件"。因此在运行 Stage 5 之前，必须先备份 PPTX：

```bash
cp _generated/ppt/{NAME}.pptx _generated/ppt/{NAME}.backup.pptx
node PPTMAKER_FRAMEWORK/scripts/stage5_inject_notes.mjs --run-dir ...
```

## 提取 Speaker Notes

源 markdown 中每张 slide 的 SPEAKER NOTE 位于 `> **SPEAKER NOTE**` blockquote 中：

```markdown
> **SPEAKER NOTE**
>
> **Narrative flow:**
> ...
>
> **Terms:**
> ...
>
> **Takeaway:**
> ...
```

提取逻辑（伪代码）：

```
for each ## Slide NN block in markdown:
  if block contains SPEAKER NOTE section:
    notes_text = extract_all_lines_after("SPEAKER NOTE")
    notes_text = strip_blockquote_prefixes(notes_text)  // remove "> "
    slide_notes.append(notes_text)
  else:
    slide_notes.append("")  // no notes for this slide

assert len(slide_notes) == len(pptx_slides)
```

## 注入 PPTX Notes 面板

```javascript
import PptxGenJS from "pptxgenjs";

const pptx = new PptxGenJS();
await pptx.load("_generated/ppt/{NAME}.pptx");

pptx.slides.forEach((slide, i) => {
  const notesText = slideNotes[i];
  if (notesText) {
    slide.addNotes(notesText);
  }
});

await pptx.writeFile({ fileName: "_generated/ppt/{NAME}.pptx" });
```

**务必先备份**——`pptxgenjs` 的 `writeFile()` 会覆盖原文件，没有 undo。

## 三条编辑链：完整工作流

编辑链是整个管线最实用的概念。不同类型的改动走不同的阶段子集：

### 链 A：改标题文字（Kicker / Title / Subtitle）

**场景**："Slide 8 的标题不够 sharp，改成更直接的表述。"

**影响范围**：单张或多个 slide 的 header 文字
**走哪些 Stage**：1 → 3 → 4 → 5
**为什么跳过 Stage 2**：画面没变——AI 生成的 body visual 不需要重新生成。Stage 3 需要重跑因为 header 文字变了（需要重新叠加）。

**耗时**：~5 分钟（Stage 1: 30s → Stage 3: 30s → Stage 4: 30s → Stage 5: 30s）

### 链 B：改画面视觉（Image Prompt）

**场景**："Slide 12 的 layout 太拥挤，改成上下结构而非左右结构。"

**影响范围**：单张 slide
**走哪些 Stage**：1 → 2 → 3 → 4 → 5
**为什么全走**：IMAGE PROMPT 变了 → 需要重新解析（Stage 1）→ 重新生图（Stage 2）→ 重新叠加 header（Stage 3）→ 重新打包（Stage 4）→ 重新注入 notes（Stage 5）
**只生这一张**：Stage 2 用 `--only slide_12` 或 skip-if-exists 机制。其他 18 张不需要重生的会跳过。

**耗时**：~5 分钟/页（Stage 1: 30s → Stage 2: 30-60s → Stage 3: 30s → Stage 4: 30s → Stage 5: 30s）

### 链 C：改讲稿备注（Speaker Notes）

**场景**："Slide 5 的 takeaway 要改一下，把 emphasis 从 efficiency 改为 speed。"

**影响范围**：单张 slide 的 speaker notes
**走哪些 Stage**：5（只 Stage 5）
**为什么只走 Stage 5**：Speaker notes 不影响任何视觉元素。只改 markdown 里的 SPEAKER NOTE → 只重跑 Stage 5。

**耗时**：~30 秒

### 编辑链的纪律

| 链 | 违规操作 | 后果 |
|----|---------|------|
| A | 跑了 Stage 2 | 浪费 20 分钟重新生图 + AI 非确定性可能导致画面意外变化 |
| B | 没跑 Stage 1 | `slide_plan.json` 是旧的 → Stage 3 用旧的 render_mode → 静默做错 |
| C | 没备份 PPTX | Stage 5 原地修改 → 注入出错无法回滚 |

## Gate Check：Stage 5 完成后必须确认什么

- [ ] PPTX 中每个 slide 的 notes 面板已填充
- [ ] Notes 内容和源 markdown 的 SPEAKER NOTE 一致（没有被截断）
- [ ] 所有 slide 都有 notes（没有遗漏）
- [ ] PPTX 仍然可以正常打开（Stage 5 的写入没有 corrupt 文件）

---

> **案例**：T10 项目频繁使用三条链——链 A（客户反馈改了 4 个 slide 的标题，5 分钟搞定）、链 B（Slide 10 的视觉 prompt 重写，只生这一张，5 分钟）、链 C（演讲者干跑后改了 6 个 slide 的 takeaway，30 秒完成）。在项目最后一周，90% 的改动都在链 C 上——所有视觉已经锁定，只 tune 讲稿。

> **Next**: `reference-pipeline-scripts.md` — 6 个管线的关键模式参考（注释版伪代码），帮助你在自己的项目中实现这些阶段。
