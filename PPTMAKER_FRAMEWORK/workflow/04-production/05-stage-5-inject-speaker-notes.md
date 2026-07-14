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

这也意味着：**Stage 5 是唯一原地替换 PPTX 的阶段。** Stages 1-4 都是“读取输入、写入新输出”。Canonical run-bundle 路径会保留备份、在同目录临时文件中完成修改、原子替换 PPTX，并在成功后写 `_generated/qa/notes_injection.json` receipt：

```bash
node PPTMAKER_FRAMEWORK/scripts/unified_pipeline.mjs --run-dir <version-dir> --stage 5
```

低层 Expert 模式可用 `node PPTMAKER_FRAMEWORK/scripts/stage5_inject_notes.mjs --pptx <file> --input <spec.md>`，但它不是 run-bundle receipt 路径。

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

Run-bundle 路径自动保留备份并原子替换；不要手工改 `_generated/` 或绕过 receipt。

## 三条刷新路径：完整工作流

按内容所有权和失效产物选择最小刷新路径。Generated Image Rebuild 是经过强制重生与 review 的逻辑工作流，不要求一次命令跑完全部 Stage：

### 标题修改：先按 resolved render mode 分流

**场景**："Slide 8 的标题不够 sharp，改成更直接的表述。"

统一入口是 `ppt_flow refresh --kind title`。当 raw-image contract 不变时，`body+header-lock` 的 KICKER/TITLE/SUBTITLE 使用 Header Text & Style Refresh（1 → 3 → 4 → 5），因为文字由 Stage 3 渲染；`full-page` 的标题烧在图里，使用 Generated Image Rebuild，通过所选页 pilot 强制重生、完成当前 header review，再复用已审图完成 3/4/5。

**耗时**：body-lock 通常 ~5 分钟；full-page 按受影响页数计。

### Generated Image Rebuild：改画面视觉（Image Prompt）

**场景**："Slide 12 的 layout 太拥挤，改成上下结构而非左右结构。"

**影响范围**：单张 slide
**逻辑执行**：1 → 强制所选 2 → review → 3/4/5
**为什么全走**：IMAGE PROMPT 变了 → 需要重新解析（Stage 1）→ 重新生图（Stage 2）→ 重新叠加 header（Stage 3）→ 重新打包（Stage 4）→ 重新注入 notes（Stage 5）
**只生这一张**：使用 `ppt_flow refresh --kind visual --only slide_12`，或 raw Stage 2 的 `--only slide_12 --force-images`。`--only` 本身不 force，skip-if-exists 会保留已有图片；其他 18 张不重生。

**耗时**：~5 分钟/页（Stage 1: 30s → Stage 2: 30-60s → Stage 3: 30s → Stage 4: 30s → Stage 5: 30s）

### Notes-Only Refresh：改讲稿备注（Speaker Notes）

**场景**："Slide 5 的 takeaway 要改一下，把 emphasis 从 efficiency 改为 speed。"

**影响范围**：单张 slide 的 speaker notes
**走哪些 Stage**：5（只 Stage 5）
**为什么只走 Stage 5**：Speaker notes 不影响任何视觉元素。只改 markdown 里的 SPEAKER NOTE → 只重跑 Stage 5。

**耗时**：~30 秒

### 刷新路径的纪律

| 路径 | 违规操作 | 后果 |
|------|---------|------|
| Header Text & Style Refresh | 在 raw-image contract 未变时跑 Stage 2 | 浪费时间重新生图 + AI 非确定性可能导致画面意外变化 |
| Generated Image Rebuild | 没跑 Stage 1，或 raw `--only` 未配 `--force-images` | plan 仍旧，或已有图未实际重生，产生静默错误 |
| Notes-Only Refresh | 没备份 PPTX | Stage 5 原地修改 → 注入出错无法回滚 |

## Gate Check：Stage 5 完成后必须确认什么

- [ ] PPTX 中每个 slide 的 notes 面板已填充
- [ ] Notes 内容和源 markdown 的 SPEAKER NOTE 一致（没有被截断）
- [ ] 所有 slide 都有 notes（没有遗漏）
- [ ] PPTX 仍然可以正常打开（Stage 5 的写入没有 corrupt 文件）

---

> **案例**：T10 项目频繁使用三条刷新路径：
> - Header Text & Style Refresh 用于 4 个 body-lock 标题。
> - Generated Image Rebuild 用于 Slide 10 的视觉 prompt。
> - Notes-Only Refresh 用于干跑后的 6 页 takeaway。项目最后一周大部分改动只刷新讲稿，因为所有视觉已经锁定。

> **Next**: `reference-pipeline-scripts.md` — 6 个管线的关键模式参考（注释版伪代码），帮助你在自己的项目中实现这些阶段。
