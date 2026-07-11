---
title: Change Classifier
stage: automation
position: toolkit
type: reference
summary: Agent 决策树——用户的自然语言改动 → 编辑链分类 → 沟通模板。用户永远不需要知道 Chain A 或 Stage 3。
depends_on:
- BOOTSTRAP.md
- AGENTS.md
feeds_into: []
agent_action: classify_changes
---

# Change Classifier — Natural Language to Editing Chain

> Agent 使用这个决策树，将用户的自然语言改动请求分类到正确的编辑链。
> **用户永远不需要知道 "Chain A" 或 "Stage 3"。** Agent 内部分类，告诉用户影响，执行。

---

## 决策树

收到用户的改动请求后，按以下顺序判断：

### Level 1: 改动的是什么？（5 秒判断）

```
用户说 → 分类到

"改第 3 页的标题"                    → Chain A
"把 kicker 改成 XXX"                → Chain A
"标题太长了，缩短一点"               → Chain A
"这个 subtitle 不够有力"            → Chain A

"第 7 页的画面不太对"                → Chain B
"这个图换成 XXX 的例子"             → Chain B
"颜色太暗了/太亮了"                 → Chain B（涉及所有 slides）
"加一张 slide 在 4 和 5 之间"       → Chain B（新 slide 需要生图）
"删掉第 8 页"                      → 结构改动（需重新编号）
"这个 KPI 数字换成 50%"             → 通常 Chain B（KPI 多数烧在 body 图片里；只有 header 字段才是 Chain A）

"speaker note 里加上 XXX 的案例"    → Chain C
"演讲时这里应该说慢一点"             → Chain C
"备注里补充数据来源"                → Chain C
```

### Level 2: 影响多少 slides？（10 秒判断）

```
影响范围 → 重跑策略

1 张 slide → 只重跑该 slide
  - Chain A（改标题文字）: `--stage 1,3,4,5`（**不要加 `--only`**——A 不含 Stage 2，`--only` 只限制生图，对 A 是空操作；1/3/4/5 会处理全部 slide，但很快、无生图）
  - Chain B（改画面）: `--stage 1,2,3,4,5 --only slide_NN --force-images`（`--only` 限定生图；**重渲须显式 `--force-images`**；多张用逗号 `--only s5,s7`；1/3/4/5 仍处理全部，很快）
  - Chain C（改讲稿）: `--stage 5`（整体重跑，但只改 note）

2-5 张 slides → 重跑受影响 slides
  - 告知用户："这会重新生成 N 张 slide，约 X 分钟"

全部 slides（如改配色）→ 全量重跑 Stage 2，并显式加 `--force-images`
  - 告知用户："这会重新生成全部 Y 张 slide，约 Z 分钟。建议先跑 3 张确认效果？"
  - **如果是改配色：硬性前置条件——必须先更新 style_master.jpg。** 改了 deck_system.txt 和 color_palette.json 的颜色但没重生 style_master → 生图阶段用的是旧配色 style master + 新配色文本约束 → 画面矛盾。顺序：编辑颜色文件 → 重生 style_master → 试点 3 张 → 全量

结构改动（加/删/重排 slides）→ `bundle_layout.mjs --new-version` 创建干净版本
  - 告知用户："这是结构改动，我会创建 v{n+1} 版本来保留当前版本。"
  - 在新版本中：更新 Block Map → 重新编号 → 重跑受影响范围
```

### Level 3: 是否建议试点？

```
场景 → 建议

改配色/TONE → "先跑 3 张代表性 slides（opener, content, closer）确认效果？"
改 prompt 写法 → "先跑 1 张看效果，满意了再批量？"
新增 slide → 直接跑（单张成本低）
改全部 slides 的文字 → 直接跑（Chain A 成本低，5 分钟）
```

---

## 用户沟通模板

### 模板 1: 小改动（单页，Chain A/C）

```
用户说：{REQUEST}

Agent 回复：
"好的，改 Slide {N} 的 {WHAT}。只改文字不动画面，约 2 分钟。"
→ 执行 → "{N} 页已更新，PPTX 刷新完成。"
```

### 模板 2: 中等改动（单页，Chain B）

```
用户说：{REQUEST}

Agent 回复：
"好的，重新生成 Slide {N} 的画面。改完后 Stage 3（Header-Lock）会把标题叠加上去，约 5 分钟。"
→ 执行 → "Slide {N} 已更新。要看一下效果吗？"
```

### 模板 3: 大改动（多页/配色/结构）

```
用户说：{REQUEST}

Agent 回复：
"这会影响到 {N} 张 slides。我的建议：
1. 先跑 {M} 张代表性 slides 确认新方向（约 {X} 分钟）
2. 满意后批量跑剩余 {Y} 张（约 {Z} 分钟）
现在开始第一步？"
```

### 模板 4: 结构改动

```
用户说：{REQUEST}

Agent 回复：
"这是结构改动（{WHAT}），我会：
1. 创建 v{n+1} 保留当前版本
2. 在新版本中调整 slide 结构和编号
3. 重新生成受影响的 slides

当前版本 v{n} 保持不变，随时可以回退。开始？"
```

---

## 常见边界情况

### "这个 slide 看起来不对"

→ 追问一句："是文字（标题/内容）不对，还是画面/布局不对？" → 然后分类。

### "整体感觉不够 {X}"

→ 这通常是视觉预设级别的改动。提示："这个改动影响所有 slides。要不要试试另一个视觉预设？或者只调整 {X} 相关的颜色？"

### "数据是错的"

→ 第一步：确认正确数据。第二步：判断文字实际由谁渲染。只有 KICKER/TITLE/SUBTITLE 属于 Chain A；KPI、卡片、图表标签等 body 内容都属于 Chain B，即使只是改一个数字。

### "我不确定哪里不对，但就是不对"

→ 不要盲目开始改。追问一个问题帮用户定位："是论证逻辑不对（内容没说服力），还是视觉不对（颜色/布局不舒服），还是节奏不对（slide 太多/太少）？"

---

## 快速参考：Chain → Stage 映射

| Chain | Stage 序列 | 时间 | 适合 |
|-------|-----------|------|------|
| **A** (text only) | 1 → 3 → 4 → 5 | ~5 min | 标题/副标题/标注文字改动 |
| **B** (visual) | 1 → 2 → 3 → 4 → 5 | ~5 min/page | 画面/配色/prompt 改动 |
| **C** (notes only) | 5 | ~30 sec | Speaker notes 改动 |
| **结构** (add/del/reorder) | cp 3_versions/v{n} → 3_versions/v{n+1} + 受影响 slides | 视范围 | 加/删/重排 slides |

使用统一管线脚本：
```bash
# Chain A: text only (re-parses all slides, re-locks headers, rebuilds PPTX)
node PPTMAKER_FRAMEWORK/scripts/unified_pipeline.mjs --run-dir deck_X/3_versions/v1 --stage 1,3,4,5

# Chain B: visual — single slide (--only limits Stage 2; --force-images required to regenerate)
node PPTMAKER_FRAMEWORK/scripts/unified_pipeline.mjs --run-dir deck_X/3_versions/v1 --stage 1,2,3,4,5 --only slide_NN --force-images

# Chain C: notes only
node PPTMAKER_FRAMEWORK/scripts/unified_pipeline.mjs --run-dir deck_X/3_versions/v1 --stage 5

# Full visual rerun（配色/style master/全局 prompt 改动）
node PPTMAKER_FRAMEWORK/scripts/unified_pipeline.mjs --run-dir deck_X/3_versions/v1 --stage all --force-images
```

> **Note**: `--only` 只限制 Stage 2；**不会**隐式强制重渲——已有图默认跳过，要刷新须加 `--force-images`。Stage 1/3/4/5 仍处理全部 slides。全量视觉刷新使用 `--force-images`。`--only` 也接受页号（`3`）或前缀（`s03`）。
