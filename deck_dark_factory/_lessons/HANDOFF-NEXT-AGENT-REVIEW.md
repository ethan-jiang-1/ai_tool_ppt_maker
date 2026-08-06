# Handoff — 请下一个（多模态）Agent 评判 deck_dark_factory 的视觉产出

> 生成日期: 2026-08-05 | 请求: 用户反馈「生产的东西很烂，什么都看不清楚」—— 本机 Agent 无多模态，
> 无法自判视觉效果。请你打开下面的产物，评判视觉质量，并给出修复方向。

## 一句话背景

这是一个 13 页 keynote「The AI Dark Factory」（Patrick Debois · AI Native Dev keynote）。用 framework
（`ppt_maker_harness`）的 Page Authority 工作流制作，产出了**两个版本**：v1（pure 工作流）和
v2（framed 工作流）。用户对 v2（framed，最新）的视觉效果不满意，说「什么都看不清楚」。

## 产物在哪、是什么

根路径：`/Users/bowhead/ai_tool_ppt_maker/deck_dark_factory`

### v2（framed，最新，用户正在看这个）
- 最终 PPTX：`deck_dark_factory/3_versions/v2/_generated/page_authority_image2/final/deck.pptx`
- 最终单页 PNG（13 张）：`deck_dark_factory/3_versions/v2/_generated/page_authority_image2/final/01_DkfGo.png` … `13_ContGo.png`
- **Contact sheet（一页看全部 13 页，建议先看这个）**：`deck_dark_factory/3_versions/v2/_generated/page_authority_image2/final/projection.png`
- **raw underlay（text-free 背景，文字是 framework 叠加的）**：`deck_dark_factory/1_upstream_raw_material/page-production-iterations/plans/f520896be72de827557b7f4e890912d0233aa7133a0312d8736072b4e606ecce/materializations/*/raw.png`

### v1（pure，早期版本，被 v2 取代前用户也看过）
- 最终 PPTX：`deck_dark_factory/3_versions/v1/_generated/page_authority_image2/final/deck.pptx`
- 最终单页 PNG（13 张）：`deck_dark_factory/3_versions/v1/_generated/page_authority_image2/final/01_DkfGo.png` … `13_ContGo.png`

### Style Master（视觉参考图，两版各自有）
- `deck_dark_factory/1_upstream_raw_material/style-master-iterations/plans/*/candidates/*/image.png`
- v2 framed 用的是 `8d070272…` 计划的 `candidate-001`

## 两版是怎么产出的（上下文）

### 共同流程（Page Authority 工作流）
1. **Source**（`deck_dark_factory/3_versions/v{n}/slide-specifications.md`）：每页有
   `KICKER / TITLE / SUBTITLE / VISUAL SCENE / VISUAL BRIEF（recipe+composition+motifs+negative_constraints）/ SPEAKER NOTE`。
2. **Style Master**：先生成一张风格参考图（provider 生成），人工选择接受。
3. **Raw 图**：每页按 prompt 生成一张 raw 图（provider 生成，付费）。
4. **Build**：合成最终 PPTX。

### v1 = pure 工作流（先做的）
- 每页 raw 图就是**最终页**：provider 把文字（title/body）直接渲染进图里。
- 为了文字更突出，framework 改了 provider prompt（显式 text 契约，见 `openspec/changes/render-pure-slide-text-in-provider-prompt/`）。
- 用户反馈 v1 的问题：**各页字体/字号/色调/layout 不统一**（BUG-057）。

### v2 = framed 工作流（后做的，为解决 v1 的不统一）
- 每页 raw 图是 **text-free underlay（纯背景）**；文字由 framework 用**锁定的 Text Frame 排版**统一叠加
  （固定的字体、字号、标题位置）。
- 这正是为了「全 deck 一个调」。但用户看后说 **「什么都看不清楚」**。

## 用户的核心不满 + 需要你评判的点

1. **文字清晰度**：标题/kicker 是否清楚可读？还是被背景吃掉 / 对比度低 / 太小？
2. **背景（underlay）**：是否太花/太暗/太乱，盖住了文字？
3. **整体观感**：两个版本各自看起来怎么样？哪个更好？为什么？
4. **一致性**：v2 是否达到了「全 deck 统一」？（这是做 v2 的目的）

请打开上面路径的图（尤其 v2 的 `projection.png` 和若干单页，以及对应 `raw.png` underlay 对比），给出：
- 你看到的实际画面描述
- 具体问题（哪一页、什么不清楚）
- 修复方向（例如：调 Text Frame 字号/颜色/对比度、加文字背景遮罩、换 Style Master 风格、调 underlay 生成 prompt 等）

## 已知约束

- Provider 是 MICU（`IMAGE2_BASE_URL`），返回 2048×1136 原生 PNG（16-bit，见 BUG-059）。
- framed 的 Text Frame 是 framework canonical（`standard-v1`，标题 46px/2行、kicker 16px、subtitle 23px），
  标题过长会被 source 校验拒绝（已把长标题精简过一遍）。
- 相关 bug 卡片在 `/Users/bowhead/ai_tool_ppt_maker/_backlog/bugs/`（BUG-046..059）。
