# BUG-015: html-first 渲染以文字排版为主，缺乏视觉表达能力

> 严重级别: P1 | 发现: 2026-07-20 | 状态: 活跃

## 症状
html-first-v1 pipeline 产出的 HTML 幻灯片以文字排版（typography + spacing + palette）为
核心，visual expression 能力严重不足：

- **hero 页**：只有 `hero_statement` + 可选 `supporting_line` + `callout`。`primary_visual`
  的 `abstract-pattern` fallback（gradient-field/line-grid/soft-orbs）只能提供背景纹理，
  不能承载任何信息密度。
- **split/comparison 页**：纯文字 block，无图表/示意图/图标支撑。
- **quote 页**：引语 + 可选 attribution/context + 可选 `supporting` text block。
  视觉表达完全空白。
- 整个 pipeline **没有 diagram、illustration、icon composition 的本地渲染路径**——
  `visual-focus` family 存在但依赖 `primary_visual`，而 `primary_visual` 的三个
  fallback kind 中，`asset`/`icon-composition` 需要预先注册的外部资产文件，
  `abstract-pattern` 只能做装饰背景。

结果是：一个 keynote 级别的 deck 产出的 HTML 页面看起来像排版草稿，而不是 presentation
slide。用户反馈"纯文字，不像 PPT"。

## 根因
html-first 的架构设计围绕 "structured text layout" 而不是 "visual communication"。
渲染器的 component registry 缺少以下关键能力：

1. **本地 diagram 渲染** — 没有 flowchart/架构图/概念图的原语（CSS-only 或 ECharts
   非 data 场景）
2. **概念插画** — `icon-composition` 理论上可以组合 SVG 图标表达概念，但内置图标库
   为空，deck 作者需要手工提供 SVG 资产
3. **ECharts 集成范围窄** — 只有 `data` family 可以用 ECharts，且需要完整的
   chart.categories + chart.series 数据。概念性的"示意图"（如四层架构图、信息加工链
   流程图）没有对应的 family 或组件
4. **CSS 表达能力未充分利用** — 现代 CSS（grid, flexbox, gradients, transforms,
   animations）可以做非常丰富的视觉表达（参考: CSS art, single-div drawings,
   CSS-only diagrams），但 pipeline 只用了基本的 typography + spacing

## 复现
1. 创建任意 html-first-v1 deck
2. 写满 hero/split/comparison/quote family 的 slide
3. `pilot` → `build`
4. 打开 HTML 页面 — 所有视觉元素仅限于文字、色块、间距

## 修复关联
待定。可能的方向（需进一步评估）：
- 扩展 `visual-focus` family 或新增 family，支持 CSS/SVG-based conceptual diagram
- 为 `icon-composition` fallback 提供内置 SVG 图标库
- 允许 `flow`/`comparison`/`split` 中嵌入 diagram 原语
- 利用 ECharts 做非 data 场景的概念图渲染
