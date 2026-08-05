# BUG-057: Pure workflow 各页视觉系统不一致（字体/字号/色调/layout 每页自由发挥）

> 严重级别: P1 | 发现: 2026-08-05 | 状态: 活跃

## 症状

deck_dark_factory（pure workflow）完整 13 页 PPT 构建后，页面之间**视觉系统不统一**：每页的字体选择、
字号、色调倾向、layout 结构都像是各自独立发挥的，不像同一个 PPT 里的一套。内容每页不同是合理的，但
**字体、字号、layout 风格应该全 deck 一致**（一个「调」），当前没有。

用户原话：『总体来说感觉内容字体的选择、色调的选择、layout 的风格，多少每一页都是自己在发挥。既然在
一个 PPT 里，实际上应该定个调，这个调定了大家都差不多这个样子，你每页的内容发挥是可以的，但字体、字号、
layout 随意发挥就有点多了，它毕竟是整体是一个 PPT。』

## 根因

Pure workflow 每页的 raw 图由 provider **独立生成**，provider 输入只有：
- 一张 Style Master 参考图（风格/情绪参考）
- 每页的 VISUAL BRIEF（recipe/composition/motifs）+ VISUAL SCENE
- 每页的 display（kicker/title/subtitle/callout）+ body 文字

Style Master 参考图确立的是**色彩/氛围基调**，但**没有锁定的视觉系统规范**约束每页的排版：标题放哪、
kicker 字号、body 字号、字重、行距、色彩用法、留白比例、layout 结构都由 provider 每页自己决定。于是
13 页出现 13 种字体/字号/layout 组合。

Framed workflow 有锁定的 Text Frame + render profile 保证排版一致；pure workflow 把文字排版完全交给
provider，没有对等的「锁定视觉系统」。

## 修复方向

需要为 pure workflow 建立**每页一致的、provider 可遵循的锁定视觉系统**，内容可变、视觉系统不变：

1. **Provider prompt 增加 locked visual-system 契约**：在 prompt 中显式定义全 deck 一致的排版规则
   （标题/kicker/body 的位置与字号关系、字体风格、色彩用法、layout 结构、留白），作为每页生成时都要
   遵循的固定规范。这是对 `render-pure-slide-text-in-provider-prompt` 的扩展。
2. **纯 workflow 引入 Text Frame 式锁定排版**（对齐 framed）：由 framework 定义每页一致的文本布局
   （标题区、正文区、kicker 位置），provider 只生成背景/视觉，framework 叠加锁定排版的文字。
3. 在 Visual-system 层定义**全 deck 级 style tokens**（字体族、字号阶梯、主色/辅色、layout 模板），
   provider prompt 引用同一套 tokens，保证跨页一致。

需要 regression：mock provider 输出多页，断言每页 prompt 都携带同一 locked visual-system 契约，且
visual-system digest 全 plan 一致（只内容 digest 变化）。

## 关联

- 直接触发于 `render-pure-slide-text-in-provider-prompt` 之后（文字能渲染了，但每页排版仍各自发挥）。
- deck_dark_factory 13 页全部受影响。
