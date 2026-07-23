# BUG-015: HTML-first 的概念视觉语法仍不足以表达信息关系

> 严重级别: P1 | 发现: 2026-07-20 | 状态: 活跃 | 基线校准: 2026-07-23

## 症状

现有 HTML contract 并非只有文字页：closed registry 已覆盖 `hero`、`split`、`cards`、`kpi`、
`comparison`、`flow`、`timeline`、`data`、`quote` 与 `visual-focus`；`primary_visual` 也支持受控 asset、
icon-composition 和 abstract-pattern，`data` family 有确定性的 chart SVG。

但这些能力仍不足以稳定表达非数据型关系，例如层级、因果、循环、权衡、系统边界和概念对照。现有 flow/timeline
主要是已定义文本 records 的布局，asset/icon-composition 要求 deck 预先提供登记资产，abstract-pattern 只是装饰。
所以问题不是“HTML 完全不能画图”，而是作者没有一个受控、语义化、可复用的概念视觉语法，结果仍会退化为文字+色块。

## 当前根因

registry 的 family/body schema 没有为概念关系定义明确的 source model、geometry variant、accessibility text、
fallback 和 deterministic output contract。用自由 CSS art、任意 SVG、或把 ECharts 扩展成非数据图的临时容器会
绕开 schema/asset/provenance 边界，也会把不稳定第三方渲染带入日常验证。

## 最小验证

后续 proposal 至少选定两类真实叙事关系（例如 layer-stack 与 causal-flow），为每类提供：

1. closed body schema 与显式 visual primitive；
2. stable `slide_id`-bound geometry/reading order 与受限 fallback；
3. 不依赖浏览器、HTML compositor、ECharts、Canvas 或外部图像引擎的 deterministic contract test，验证
   schema、semantic output tree、asset binding、overflow/error diagnostics 和 fingerprint；
4. 仅在实现完成前按需抽样一次 compositor 结果，不作为默认开发态 gate。

## 修复方向

以小的、受控的 local visual-primitives capability 扩展现有 registry，而不是新增任意绘图通道：

- 先支持有限的关系模型与对应 adapter，优先复用现有 token/geometry/asset catalog；
- 内置图标或 SVG 仅能来自版本化、审核过的 catalog，继续使用现有 passive-SVG 约束；
- `flow`、`comparison`、`visual-focus` 是否承载新 primitive，必须由 source schema 和 deletion test 决定，不能靠
  renderer 猜测；
- 不以真实外部图像、浏览器效果或 ECharts 非数据 hack 作为 correctness authority。

## 非目标

- 不把 Image Production、visual-slot provider 调用或 HTML renderer 作为解决概念表达的默认依赖。
- 不承诺一次性实现通用 diagram editor、自由 SVG/CSS/JS 或动画系统。
