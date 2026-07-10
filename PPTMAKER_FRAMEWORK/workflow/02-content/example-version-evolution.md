---
title: "Case Study: T10 项目版本演进 v1→v4"
stage: workflow/02-content
position: example
type: reference
summary: 真实项目的四次版本迭代——每次改了什么、为什么改、学到了什么。作为 few-shot 参考，不是模板。
depends_on:
- workflow/02-content/README.md
- workflow/02-content/05-iterate-with-version-discipline.md
feeds_into: []
agent_action: reference
---

# Case Study: T10 项目版本演进 v1→v4

> 这是一个真实项目的四次版本迭代故事。读它不是为了学这个项目的具体内容，而是看**这套方法论在真实生产中如何运作**——什么决策触发了版本升级，每次学到了什么，以及那些"早知道就好了"的教训。
>
> 把它当作 few-shot 参考：当你自己的项目遇到类似时刻，这里有人替你踩过坑。

---

## 项目背景

为一个 precision manufacturing（精密制造）客户做 AI 战略 keynote——英语 slides + 中文演讲，面向集团管理层和各厂 GM。三场 session 共 30 张 slides + breakout。

## v1：先跑通再说

**做了什么**：14 张 slide，只覆盖 Session 1。用最基本的 prompt 结构，没有 header-lock，没有 style master。纯靠文字 prompt 描述视觉风格。

**发现的问题**：
- 每页的颜色在漂移。"Deep teal" 在第 3 页是 teal，到第 9 页变成了 muddy blue-green
- 标题位置每页不一样——有的偏上 10px，有的偏下 15px
- 字体大小飘忽——同一句 "large headline" 在不同页大小差 2 倍

**学到的**：**文字描述风格不 work。** 你说 "deep teal"，模型每次都猜一个不同的 deep teal。需要一种方式让模型**看到**你要什么颜色，而不是猜你要什么颜色。

→ 触发 v2：引入 style master（一张视觉参考图，展示 exact color swatches、typography scale、layout grid）。

---

## v2：发现了对的视觉方向

**做了什么**：引入 style master——生成一张 `style_master.jpg`，上面有 color palette swatches（带 hex code）、typography 四层 sample、layout grid wireframe。每张 slide prompt 把这张图作为 reference image 传入。

**关键决策——从 multi-color 转向 single-family palette**：
- v1 用了 amber（警告）、emerald（增长）、red（风险）、gold（强调）的多色系
- v2 初版发现多色系让每页看起来像"从不同 deck 拼凑出来的"
- 产品本身给了线索：PVD-coated micro fasteners 在光线下呈现 subtle blue-cyan iridescence
- 决定词："Jewel-like, not industrial. Think Swiss watch components, not construction bolts."
- 最终 palette：Deep Navy → Steel Blue → Cyan → Electric Blue → Teal——全部在 blue-cyan-teal 家族内

**发现的问题**：
- Style anchoring 解决了颜色漂移，但**标题位置仍然不稳定**
- AI 生成的 title 字体大小每页浮动，即使 prompt 写了 "46px"——模型不会数字体，它生成的是 "看起来像 46px" 的 approximation
- 偶尔拼错 headline 中的关键词

**学到的**：**AI 在精确文字渲染上不可靠。** Node `@napi-rs/canvas`（Header-Lock）恰恰相反——pixel-perfect，每次都一样。让 AI 做它擅长的（创意视觉），让确定性 canvas 做它擅长的（精确标题文字）。

→ 触发 v3：Header-Lock——AI 生成 body 视觉（画面），Stage 3 叠加 header 文字（标题）。

---

## v3：Header-Lock 和生产线化

**做了什么**：引入 Header-Lock 机制。核心设计决策：

**透明 header overlay，不是不透明底板**：
- 初版试了不透明深色底板覆盖 header 区域——但底板边缘在复杂背景上产生可见的色差接缝
- 改为透明文字叠加：只把有颜色的字符像素覆盖到 raw 图上，其他区域保持透明
- 效果：header 稍微错位时也不会出现一整块底板压住主体图

**五种 header variant**（不是两种）：
- `body+header-lock`（260px safe zone）：适用于绝大多数内容页
- `opener`（390px，82px title）：session 开场标题页需要更大的视觉冲击
- `long`（320px）：长标题需要额外空间
- `normal_extra_safe`（360px）：少数复杂图（如 habit loop diagram）的 AI 生成内容容易侵入 header 区
- `full-page`（0px，pass-through）：视觉停顿页、closing page——AI 全页生成完整画面

**发现 body_shift 机制**：
- 某些 slide 的 AI 生成画面离 header 太近（差了 24px）
- 与其重新生成 raw 图（可能引入新的问题），不如在 Stage 3 把 body 下移 24px
- 露出的顶部区域用 raw 图顶部 texture 补齐，不用硬编码纯色
- 但这个机制有边界：**如果 raw 图本身没留够 header safe zone，不能靠 body shift 硬补——必须回到 prompt 源头重生 raw。**

**学到的**：
- **Header 稳定性来自源头 prompt contract**，不是后期修图
- **特殊页不要盲目继承普通页版式**——视觉停顿页用 `full-page` 比强行套 header grid 更自然
- **小字问题不是后期能救的**——prompt 必须限制文字区数量（每页 3-5 个），禁止 dashboard microtext 和假 UI 字
- **如果一页已经违反 safe zone，优先重生 raw，不要无限叠加 body shift**

**v3 规模**：扩展到 30 张 slides（3 个 session），Breakout 独立为 Session 3。

---

## v4：反馈驱动的简化

**做了什么**：基于客户 review 反馈，从 30 张砍到 18 张。

**砍的原则**：
- 砍掉 filler slides——那些"有必要但可以口头说"的内容
- 合并同质 slide——两张都在论证同一个点时，保留更强的那张
- 让 breakout session 独立——不再挤在同一个 keynote 文件里

**学到的**：
- **少即是多。** 18 张有论证力的 slide > 30 张有 filler 的 slide
- **不是所有内容都需要上 slide。** 有些数据口头说更自然
- **Breakout 和 keynote 是不同的 presentation mode。** 分开管理，不要混在一个文件里

---

## 四条跨版本教训

这些是从 v1 到 v4 反复验证的——不是一次性发现：

### 1. Show, don't describe
颜色、字体层级、空间关系——用图片展示，不要用文字描述。Style Anchoring 不是锦上添花，是**必须的**。没有它，到第 15 页你的 deck 看起来像 15 个不同的人做的。

### 2. Split the work where each tool is strongest
AI 负责创意视觉（charts、cards、icons、color）。Stage 3 Header-Lock 负责精确文字（kicker、title、subtitle，在精确的像素位置）。不要用一个替代另一个。

### 3. Fix upstream, not downstream
如果 raw 图的 header zone 被 AI 内容侵入，问题不在 Stage 3（header overlay）——问题在 Stage 1 的 prompt。回到源头修 prompt 中的 header contract，不要靠后期 trick 硬补。

### 4. Gates exist for a reason
v2→v3 之间最大的教训：style master 没锁就生成了半套 deck。改了 style master → 前面生成的 slides 全废。**每个闸门存在是有原因的——跳过闸门的代价是指数级的。**

---

> 这是 T10 的故事。你的项目会有自己的版本演进——v1 跑通、v2 找对方向、v3 生产线化、v4 因反馈而简化。当你在 v1 卡住时，记住：v1 不需要完美，它只需要告诉你 v2 该往哪走。
