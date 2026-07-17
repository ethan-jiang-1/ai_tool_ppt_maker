---
title: Change Classifier
stage: automation
position: toolkit
type: reference
summary: Agent 决策树——用户的自然语言改动 → intent route → Structural Versioning Path / refresh path。用户无需学习内部路径名。
depends_on:
- BOOTSTRAP.md
- AGENTS.md
feeds_into: []
agent_action: classify_changes
---

# Change Classifier — Natural Language to Refresh Path

> Agent 使用这个决策树，把用户的自然语言请求先路由到 controller，再按内容所有者和失效产物选择执行路径。
> **用户不需要知道 refresh path 或 Stage 编号。** Agent 用人话说明影响、成本和 review，再执行。

## 正式路径与兼容旧称

| 正式名称（兼容旧称） | 适用边界 | 逻辑执行 |
|----------------------|----------|----------|
| Header Text & Style Refresh（页眉文字与样式刷新；formerly Chain A） | resolved `body+header-lock` 的 KICKER/TITLE/SUBTITLE，或 Stage 3 拥有的字体/颜色/位置/间距；raw-image contract 不变 | Stage 1 → 3 → 4 → 5 |
| Generated Image Rebuild（生成图重建；formerly Chain B） | full-page header、body 文案/数据、画面/prompt，或 mode/safe-zone 等 raw-image contract | Stage 1 → 强制重生所选 Stage 2 → review → Stage 3/4/5（复用已审图） |
| Notes-Only Refresh（仅备注刷新；formerly Chain C） | speaker notes only | Stage 5 |
| Structural Versioning Path（结构版本路径；formerly Structural） | 增/删/重排 slide | stable-ID snapshot preview → exact hash 提交 vNext → verified raw-only materialization → target-local rebuild |

旧字母不是缩写。只在本兼容映射中保留；下文使用正式英文名。

---

## 决策树

收到用户的改动请求后，按以下顺序判断：

### Level 1: 是否改变 slide 集合或顺序？

```
用户说 → 分类到

"加一张 slide 在 4 和 5 之间"       → Structural Versioning Path → 新版本中为新增/受影响页选择 refresh path
"删掉第 8 页"                      → Structural Versioning Path → snapshot 绑定 ID → preview/hash 确认 → renderer-free vNext
"把 UX gap 那页移到第 6 页后面"      → Structural Versioning Path → spoken ID + position 同快照解析 → preview/hash 确认
"加一页新的成本结论"                 → Structural Versioning Path → Agent 命名如 AICost → insert preview → renderer-free vNext
```

### Level 2: 内容由谁渲染、哪个产物失效？（5 秒判断）

```
用户说 → 分类到

"改第 3 页的标题"                    → 先查 resolved mode：body+header-lock = Header Text & Style Refresh；full-page = Generated Image Rebuild
"把 kicker 改成 XXX"                → 同上
"标题太长了，缩短一点"               → 同上
"这个 subtitle 不够有力"            → 同上
"改 body-lock 标题的字体/颜色/位置"    → Header Text & Style Refresh（仅限 raw-image contract 不变）
"改 header safe-zone 高度"            → Generated Image Rebuild（raw-image contract 改变）
"把这页切到/切出 header-lock"         → Generated Image Rebuild（raw-image contract 改变）

"第 7 页的画面不太对"                → Generated Image Rebuild
"这个图换成 XXX 的例子"             → Generated Image Rebuild
"颜色太暗了/太亮了"                 → Generated Image Rebuild（涉及所有 slides）
"这个 KPI 数字换成 50%"             → Generated Image Rebuild（KPI 烧在 body 图片里；只有 header overlay 字段可走 Header Text & Style Refresh）

"speaker note 里加上 XXX 的案例"    → Notes-Only Refresh
"演讲时这里应该说慢一点"             → Notes-Only Refresh
"备注里补充数据来源"                → Notes-Only Refresh
```

### Level 3: 影响多少 slides？（10 秒判断）

```
影响范围 → 重跑策略

1 张 slide → 先把 position/title/spoken selector 解析为正式 ID，再只重跑该 ID
  - Header Text & Style Refresh: `ppt_flow refresh --kind title --only UXGap`，或明确的 Stage 3 overlay-style refresh；不含 Stage 2
  - Generated Image Rebuild: `ppt_flow refresh --kind visual --only UXGap`（public route 自动 force）；raw `unified_pipeline` 必须显式 `--only UXGap --force-images`
  - Notes-Only Refresh: `--stage 5`（整体重跑，但只改 note）

2-5 张 slides → 重跑受影响 slides
  - 告知用户："这会重新生成 N 张 slide，约 X 分钟"

全部 slides（如改配色）→ 全量重跑 Stage 2，并显式加 `--force-images`
  - 告知用户："这会重新生成全部 Y 张 slide，约 Z 分钟。建议先跑 3 张确认效果？"
  - **如果是改配色：硬性前置条件——必须先更新 style_master.jpg。** 改了 deck_system.txt 和 color_palette.json 的颜色但没重生 style_master → 生图阶段用的是旧配色 style master + 新配色文本约束 → 画面矛盾。顺序：编辑颜色文件 → 重生 style_master → 试点 3 张 → 全量

Structural Versioning Path（加/删/重排 slides）→ `ppt_flow slides` preview/hash 创建干净版本
  - 告知用户："这是结构改动，我先展示 before/after；确认后创建 v{n+1} 保留当前版本。结构提交不会生图。"
  - 在目标版本中：更新 Block Map → position 自动投影 → verified raw materialization → cheap local rebuild；只有 `needs_render` IDs 另行授权
```

### Level 4: 是否建议试点？

```
场景 → 建议

改配色/TONE → "先跑 3 张代表性 slides（opener, content, closer）确认效果？"
改 prompt 写法 → "先跑 1 张看效果，满意了再批量？"
新增 slide → 先完成 Structural Versioning Path；新版本中的新增/受影响页再按刷新路径判断是否需要 pilot
改全部 slides 的 header 文字 → 先按 resolved mode 分组；Generated Image Rebuild 部分需要 pilot/review 后再批量
```

---

## 用户沟通模板

### 模板 1: 小改动（Header Text & Style Refresh / Notes-Only Refresh）

```
用户说：{REQUEST}

Agent 回复：
"好的，Slide {N} 使用确定性标题层，只需重画标题并刷新 PPTX，约 2 分钟。"
→ 执行 → "{N} 页已更新，PPTX 刷新完成。"
```

### 模板 2: 中等改动（Generated Image Rebuild）

```
用户说：{REQUEST}

Agent 回复（按实际 mode 描述，不承诺一定经过 Header-Lock）：
"好的，这项改动会进入 Slide {N} 的生成图片。我会只重生这一页并重新检查标题，约 5 分钟。"
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

当前版本 v{n} 会保留。需要回访时按小修复当前版本 → clean vNext → 新 deck 的 escape ladder 处理，不覆盖或删除可见版本。开始？"
```

---

## 常见边界情况

### "回到以前版本 / 用 Git 撤掉一个源改动"

→ 先区分两件事。要回访可见 deck `vN`：保留所有版本，按 escape ladder 选择当前版本小修复、同方向 clean vNext、vNext 中明确缺图 rebuild，或受众/主叙事/设计系统分叉时新 deck。不要删除、覆盖、改名或复制一个可见版本来充当 rollback。

→ 要处理用户自己 Git 仓库里的 source history：本框架没有 Git history reader、自动 source replacement、`git checkout` / `git restore` fallback 或默认 recovery protocol。只有用户明确授权一个命名 Git 操作及其精确范围时，Agent 才能复述并协助该操作；不得自行选择 generic recovery command。

### "这个 slide 看起来不对"

→ 追问一句："是文字（标题/内容）不对，还是画面/布局不对？" → 然后分类。

### "整体感觉不够 {X}"

→ 这通常是视觉预设级别的改动。提示："这个改动影响所有 slides。要不要试试另一个视觉预设？或者只调整 {X} 相关的颜色？"

### "数据是错的"

→ 第一步：确认正确数据。第二步：判断文字实际由谁渲染。只有 `body+header-lock` 的 KICKER/TITLE/SUBTITLE 及 Stage 3 overlay style 可用 Header Text & Style Refresh；full-page header 与 KPI、卡片、图表标签等使用 Generated Image Rebuild。

### "我不确定哪里不对，但就是不对"

→ 不要盲目开始改。追问一个问题帮用户定位："是论证逻辑不对（内容没说服力），还是视觉不对（颜色/布局不舒服），还是节奏不对（slide 太多/太少）？"

---

## 快速参考：Refresh Path → 执行映射

| 正式路径 | 逻辑执行 | 时间 | 适合 |
|---------|----------|------|------|
| Header Text & Style Refresh | 1 → 3 → 4 → 5 | ~5 min | body+header-lock 的 header 文字与 overlay style |
| Generated Image Rebuild | 1 → 强制 2 → review → 3/4/5 | ~5 min/page | full-page header、mode/safe-zone、body/画面/配色/prompt |
| Notes-Only Refresh | 5 | ~30 sec | Speaker notes |
| Structural Versioning Path | new version → 受影响页 refresh | 视范围 | 加/删/重排 slides |

使用统一管线脚本：
```bash
# Header Text & Style Refresh: body+header-lock header only
node PPTMAKER_FRAMEWORK/scripts/unified_pipeline.mjs --run-dir deck_X/3_versions/v1 --stage 1,3,4,5

# Generated Image Rebuild: full-page header, mode switch, or visual — single slide
node PPTMAKER_FRAMEWORK/scripts/unified_pipeline.mjs --run-dir deck_X/3_versions/v1 --stage 1,2,3,4,5 --only slide_NN --force-images

# Notes-Only Refresh
node PPTMAKER_FRAMEWORK/scripts/unified_pipeline.mjs --run-dir deck_X/3_versions/v1 --stage 5

# Full visual rerun（配色/style master/全局 prompt 改动）
node PPTMAKER_FRAMEWORK/scripts/unified_pipeline.mjs --run-dir deck_X/3_versions/v1 --stage all --force-images
```

> **Note**: `--only` 只限制 Stage 2；**不会**隐式强制重渲——已有图默认跳过，要刷新须加 `--force-images`。Stage 1/3/4/5 仍处理全部 slides。全量视觉刷新使用 `--force-images`。`--only` 也接受页号（`3`）或前缀（`s03`）。

> 新 deck 的 `render.default` 为 `full-page`。full-page header 只尽力稳定；要求像素位置和清晰度时，用户确认后把 slide id 加入 `render.header-lock`，再通过 Generated Image Rebuild 强制重生并重新 review。若用户接受残余风险，在版本 Change Log 或 playbook state extra 持久记录 slide id 与症状。整册目标 geometry 改动属于 visual-config 变更，不是 exception。

## Structural Versioning 决策细则

1. `position` 只属于当前 snapshot；正式 `slide_id` 才跨版本稳定。候选与回执显示 `position · slide_id · title`。
2. exact ID、spoken mnemonic（如“UX gap”）、`N`/`pN`、唯一标题、legacy prefix 按共享 resolver 解析；一个请求里的所有 selector 先绑定，再执行任何 mutation。
3. move/delete/insert 默认只 preview。Agent 保存 canonical `plan_sha256`，用户确认 before/after 后才以同一 hash apply；bare apply、stale source 和 hash drift 都 fail closed，重新 preview 而非 rebase。
4. 新页 ID 由 Agent 根据 `SUBJECT + MOVE` 命名：5–8 ASCII 字母、恰好两个 BlockCase 块，优先 5–6；避免单词类别、数字/随机后缀和为了缩短而失去可读性。
5. apply 只发布 source/control vNext，不调用 renderer。跨版本只 materialize manifest 证明完整的 `raw-render`；target 本地重建 Stage 3、contact sheet、PPTX、notes。
6. `needs_render` 不扩大授权。先向用户报告明确 ID、预计调用与 review 成本，再单独调用 Generated Image Rebuild；用户只授权结构时远端调用必须为零。
7. 逃生阶梯：stale/小冲突重新 preview；同一方向的大改另起 vNext；受众、主叙事或设计系统已分叉时建议新 deck。不要为了“必须在这一版修好”而无限叠补丁。

可见 `vN` 是 deck 工作版本权威。Git 仅可作为用户拥有的 source/control 审计和比较，不替代版本、结构 preview/hash 或 renderer 授权。本 change 不提供 Git history reader、自动 source replacement、`git checkout` / `git restore` fallback 或默认 recovery protocol；用户明确授权一个命名 Git 操作和范围后，Agent 才复述并协助该操作本身。
