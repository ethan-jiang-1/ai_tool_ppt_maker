# BUG-015: Page Authority visual-language registry 缺少关系型概念视觉的可验证语义

> 严重级别: P2 | 发现: 2026-07-20 | 状态: 活跃（已重定界） | 基线校准: 2026-07-28

## 当前症状

HTML-first 已从 current production surface 退休，因此“HTML rendering 只能产生文字+色块”不再是一个可复现的
框架 bug。现在每个 Page Authority 页面都有受信的 `VISUAL BRIEF`，由 Image2 raw contract 生成 Pure/Framed
页面视觉；它已经能表达非文本的视觉语言，不应再用旧 HTML family 或 ECharts 解释当前行为。

仍保留的能力缺口是：当前 registry 只解析 recipe / composition / motif 的 provider clauses、兼容性和 digest；
它没有有限且可验证的“关系模型”来表示层级、因果、循环、权衡、边界或概念对照。单一 provider clause 可以提示
这些关系，却不能让 source、review 和 raw-contract test 证明所声明的关系类型、阅读顺序或受限 fallback 已被选择。

## 当前根因

Page Authority registry 的 schema 故意只接受受保护的文字 clause 和有限的 recipe/composition/motif 组合；它没有
关系类型、可用 composition variant、阅读顺序、声明性 visual primitive 或 fallback policy 的 source contract。
这不是 renderer 故障，也不能通过自由 SVG/CSS、ECharts、浏览器图层或绕开 provider raw contract 的临时通道解决。

## 最小验证

后续 OpenSpec change 至少选定两类真实叙事关系（例如 `layer-stack` 与 `causal-flow`），为每类提供：

1. closed Page Authority registry/source schema，及显式 relationship type 和受限 primitive/reading-order projection；
2. relationship selection 对 raw image contract digest 的确定性影响，且保留 stable `slide_id` lineage；
3. pure Node contract test 覆盖 schema、注册表兼容性、relationship projection、fallback/error diagnostics 和
   fingerprint，不依赖浏览器、Canvas、PPTX 或外部 provider；
4. 仅在实现完成前抽样审阅一组 provider output；其审美结果不作为默认开发态 gate。

## 修复方向

以小的、受控的 Page Authority relationship capability 扩展现有 registry，而不是新增任意绘图通道：

- 先支持有限的关系模型与对应 registry projection，复用现有 visual-language digest、raw contract 与 review lineage；
- 若需要 icon/SVG，只能来自版本化、审核过的 reference catalog；不得成为未登记的 second renderer；
- 关系 primitive 的存在、兼容性和 fallback 必须由 source schema 和 contract test 决定，不能由 provider output
  或 reviewer 猜测；
- provider output 继续是受审阅的生产 artifact，不是结构 correctness 的唯一 authority。

## 非目标

- 不恢复 HTML-first、HTML compositor、ECharts 或 visual-slot refinement。
- 不承诺通用 diagram editor、自由 SVG/CSS/JS 或动画系统。
- 不把真实 provider、浏览器或审美断言加入 `npm test` 的 core tier。
