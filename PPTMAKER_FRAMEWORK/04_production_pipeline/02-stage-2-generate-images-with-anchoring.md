---
title: '02 — Stage 2: Generate Images with Style Anchoring'
stage: 04_production_pipeline
position: 03 of 06
type: methodology
summary: 方法论文件。Agent 理解其中原理并应用于对话引导。
depends_on:
- 04_production_pipeline/README.md
- 04_production_pipeline/01-stage-1-parse-content-to-specs.md
feeds_into:
- 04_production_pipeline/03-stage-3-lock-headers-deterministically.md
agent_action: execute_pipeline
---

# 02 — Stage 2: Generate Images with Style Anchoring

← [01](01-stage-1-parse-content-to-specs.md) | [Next →](03-stage-3-lock-headers-deterministically.md)

## Stage 2 做什么

把 Stage 1 产出的 text prompts 变成 PNG 图片——通过 async image generation API，用 style master 作为视觉锚点。

输入：`_generated/page_prompts/_prompts.json`（19 个完整 prompt）+ `2_backbone/visual-style/style_master.jpg`（视觉参考）
输出：`_generated/page_images_full/*.png`（19 张原始 AI 生成的画面）+ `.apimart-task.json`（每张的 trace）

## 为什么用 Async API

Image generation（尤其是 2K 分辨率）不是瞬时操作——一张图可能需要 20-60 秒。同步 API（发出请求 → 阻塞等图片 → 收到图片）处理 19 张 slide 需要 6-19 分钟，中间任何网络波动都会断掉。

Async API 的模式：**submit → poll → download**。

```
1. POST /images/generations       → 提交任务，拿到 task_id
2. GET  /tasks/{task_id}          → 每 N 秒轮询一次，直到 status == "completed"
3. GET  /tasks/{task_id}/result   → 下载生成的图片
```

好处：
- 不阻塞——你可以同时提交多个任务，然后轮询
- 容错——单个任务失败不影响其他任务
- 可恢复——task_id 存在 trace 文件里，断网后可以继续轮询

## 四个关键模式

### 模式 1：Skip-if-exists

在提交任务之前，先检查输出文件是否已经存在。如果存在，跳过生成。

```
for each slide in page_prompts/_prompts.json:
  output_path = f"_generated/page_images_full/{NN}_{slide.id}.png"
  if file_exists(output_path):
    log(f"Skipping {slide.id} — already generated")
    continue
  task_id = submit_task(slide.prompt)
  ...
```

**为什么重要**：改了一张 slide 的 IMAGE PROMPT 之后，你只重新生成这一张。其他 18 张保持不变。Skip-if-exists 让你不需要每次都用 `--only` 手动指定——自动跳过已有的。

统一管线中，`--only slide_12` 表示明确刷新指定页面，会自动传递 `--force`。全量视觉变化使用 `--force-images`；普通恢复运行仍默认跳过已有图片。

### 模式 2：Mirror/Fallback

API endpoint 可能偶发不可用。用多个 mirror URL 做容错：

```
mirrors = [
  "https://api.primary.com/v1",
  "https://api.fallback1.com/v1",
  "https://api.fallback2.com/v1",
]

for mirror in mirrors:
  try:
    task_id = submit_to(mirror, prompt)
    break
  except ConnectionError:
    continue
```

### 模式 3：Poll with Timeout

轮询直到任务完成或超时：

```
max_polls = 120          // 120 * 5s = 10 min max
poll_interval = 5        // seconds

for i in range(max_polls):
  status = get_task_status(task_id)
  if status == "completed":
    download_result(task_id, output_path)
    break
  if status == "failed":
    log_error(task_id, status.error_message)
    break
  sleep(poll_interval)
```

### 模式 4：Trace File

每张生成的图片配一个 trace 文件，记录任务元数据：

```json
{
  "base_url": "https://api.primary.com/v1",
  "task_id": "task_abc123",
  "model": "gpt-image-2",
  "size": "16:9",
  "resolution": "2k",
  "prompt_chars": 1847,
  "poll_count": 8,
  "total_seconds": 42
}
```

当图片出了问题（颜色不对、文字位置偏了），trace 文件让你能追溯：
- 用的是什么 model？（不同 model 能力不同）
- prompt 有多长？（可能被截断）
- API endpoint 是哪个？（不同 mirror 可能有不同质量）

## Style Anchoring：为什么这张图看起来像 deck 的一部分

Stage 2 不只是"把 prompt 变成图"——它还要确保这张图**和 deck 中其他 18 张图是同一个家族的**。这靠的是 Style Anchoring。

### Anchoring 的工作原理

Stage 1 已把 **Anchoring Clause** 组装进最终可审计 prompt；统一管线以 `--prompt-is-final` 调用 Stage 2，Stage 2 只附加 reference image，不再修改 prompt 文本：

```
Use the reference image(s) as your EXACT visual style guide.
Match the color palette, typography scale, layout grid, component patterns,
and overall visual language precisely. The reference defines the deck's
design system — do not deviate from it. Only change the slide content, not the style.
```

同时，prompt 的头部声明了 style master 作为 reference image。Multimodal model 接收 text prompt + reference image——它**看到** style master 上的颜色、字体层级、组件样式，然后在新画面中**匹配**这些属性。

> Style Anchoring 的完整原理和方法论在 [01_visual_style_master](../01_visual_style_master/) 中详细展开。Stage 2 是 anchoring 的执行环节——在这里，anchoring clause 被实际发送给 model。

### 分辨率决策

| 分辨率 | 何时用 | 耗时 | 画质 |
|--------|-------|------|------|
| 1K | Pilot/测试阶段 | ~15-25s | 可接受的——检查 layout 和颜色 |
| 2K | 最终生产 | ~30-60s | 细节锐利——适合 16:9 全屏显示 |

建议：pilot 阶段用 1K 快速迭代（便宜、快），确认 design 后用 2K 跑最终版。

## Stage 2 不做什么

- **不处理文字位置**：AI 生成的画面中可能包含文字，但位置不精确——这由 Stage 3 的 Header-Lock 解决
- **不做视觉 QA**：Stage 2 只负责生成。QA 是人工检查（header zone 干净？body text 可读？callout bar 对吗？）
- **不修改 prompt**：prompt 来自 Stage 1。Stage 2 只执行

## Gate Check：Stage 2 完成后必须确认什么

- [ ] 生成的图片数量 = `page_prompts/_prompts.json` 中的 slide 数量
- [ ] 每张图片的 header zone（顶部 260px）干净——没有 AI 生成的文字侵入
- [ ] 每张图片的 body text 可读——没有乱码、截断、严重错位
- [ ] 每张图片有对应的 `.apimart-task.json` trace 文件
- [ ] Style coloring 一致——所有 slide 使用相同的调色板（如果某张偏暖色，说明 anchoring 没有生效，需要检查 prompt）

---

> **案例**：T10 项目使用 APIMart API 的三个 mirror URL，model `gpt-image-2`，16:9，2K 分辨率。19 张 slide，skip-if-exists 机制让 prompt 没变的 slides 自动跳过。每张图配 `.apimart-task.json` 记录 task ID、model、耗时。某张 slide 的 callout bar 颜色偏了——查 trace 发现用了不同的 mirror（不同 mirror 的 model 版本可能不同），重新指定 mirror 后修正。

> **Next**: `03-stage-3-lock-headers-deterministically.md` — Stage 3 详解：Header-Lock 机制怎么用 Python/Pillow 精确叠加标题文字。
