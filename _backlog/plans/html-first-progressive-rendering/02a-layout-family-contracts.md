# 专题 02A: Layout Family 合同

> 总控: [`../html-first-progressive-rendering.md`](../html-first-progressive-rendering.md)
> 上游: [`02-slide-content-and-layout.md`](02-slide-content-and-layout.md)
> 状态: v1 合同已锁定 | 更新: 2026-07-17

## 共同类型

所有 family 共享 header、可选 `callout` 和可选 `primary_visual`；以下是 body 内可复用的 typed blocks：

| 类型 | 字段 | v1 容量 |
|---|---|---|
| `text_block` | `heading?`, `body?`, `bullets?` | heading 1 行；body 最多 240 字符；bullets 2-5 条、每条最多 90 字符 |
| `card` | `label`, `value?`, `body?`, `icon?` | label 1 行；body 最多 120 字符 |
| `metric` | `value`, `label`, `detail?` | value/label 各 1 行；detail 最多 80 字符 |
| `step` | `label`, `body?`, `icon?` | label 1 行；body 最多 100 字符 |
| `data_series` | `name`, `values`, `labels` | 最多 4 series、12 categories；labels 必须显式提供 |
| `quote_block` | `quote`, `attribution?`, `context?` | quote 最多 280 字符 |

字符上限是 preflight guard，不代替渲染后的像素 overflow 检查。所有可见文字来自这些 typed blocks，visual brief 不得补充文字。

## Family discriminated union

| Family | 必填 body 字段 | 数量 | `primary_visual.placement` |
|---|---|---|---|
| `hero` | `hero_statement?`, `supporting_line?` | statement 最多 2 行 | `full-bleed` |
| `split` | `left: text_block`, `right: text_block` | 每侧 bullets 最多 4 | `left` 或 `right`，被占一侧改为 visual、另一侧保留 text |
| `cards` | `cards: card[]` | 2-4 | 不允许 |
| `kpi` | `metrics: metric[]` | 1-3 | 不允许 |
| `comparison` | `left: text_block`, `right: text_block` | 每侧 bullets 2-5 | 不允许 |
| `flow` | `steps: step[]` | 3-5 | 不允许 |
| `timeline` | `steps: step[]` | 3-5 | 不允许 |
| `data` | `chart.kind`, `series`, `insight?` | kind=`bar|line|area`; 1-4 series | 不允许 |
| `quote` | `quote: quote_block`, `supporting?` | 一个主引语 | `left` 或 `right` |
| `visual-focus` | `caption?: text_block` | caption 最多 3 bullets | `body` |

不在表内的字段、placement 或数量 fail closed。`split` 一侧变为 visual 时，该侧不得同时声明可见 text block；准确标签应放在另一侧或 callout。

## Slot geometry

所有几何由 visual config 的 normalized 1000 x 562.5 逻辑画布按比例投影，不在 slide source 写像素：

| Placement | 逻辑区域 `[x,y,w,h]` | 用途 |
|---|---|---|
| `full-bleed` | `[0,0,1000,562.5]` | hero 背景；header 仍由 HTML overlay |
| `left` | `[48,158,430,330]` | split/quote 左侧主视觉 |
| `right` | `[522,158,430,330]` | split/quote 右侧主视觉 |
| `body` | `[48,150,904,338]` | visual-focus 大幅主体 |

`callout` 存在时 body slot 高度由 visual config 缩短，resolved geometry 进入 visual contract fingerprint。所有 slot 使用 `overflow:hidden`、`fit:cover` 和 focal-point-based crop。

## Fallback 合同

| Kind | 允许 family | 输入 |
|---|---|---|
| `icon-composition` | split、quote、visual-focus | 1-3 个已登记 icon asset + 无文字 CSS composition |
| `asset` | hero、split、quote、visual-focus | 一个 asset ID；按 fit/focal point 裁切 |
| `abstract-css` | hero、visual-focus | visual config tokens 驱动的无文字形状/纹理 |
| `none` | hero、split、quote、visual-focus | 保持背景/留白；页面仍须完整可交付 |

fallback 必须是结构化对象并在 Stage 1 验证其资产存在。任意自由 HTML/SVG 字符串不进入 slide source。

## Layout 与视觉所有权

- cards、kpi、comparison、flow、timeline、data 依赖准确结构表达，v1 不开放 Image2 slot。
- hero、split、quote、visual-focus 才允许主视觉精修。
- Image2 只填充 slot 像素；HTML 仍绘制所有 typed blocks、header 和 callout。
- future family 或新 placement 必须通过新的 OpenSpec requirement 和像素 overflow 测试添加，不能由 Agent 临时发明。

## 验收样例

- 每个 family 至少有最小、最大容量和非法字段 fixture。
- 每个开放 slot 的 HTML fallback、candidate preview 和 accepted asset 使用相同 resolved geometry。
- 同一 family 在 callout on/off 时几何变化可预测且进入 fingerprint。
- 中英文 fixture 都通过字体覆盖、换行与像素 overflow 检查。
