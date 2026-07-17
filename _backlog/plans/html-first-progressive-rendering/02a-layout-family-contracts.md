# 专题 02A: Layout Family 合同

> 总控: [`../html-first-progressive-rendering.md`](../html-first-progressive-rendering.md)
> 上游: [`02-slide-content-and-layout.md`](02-slide-content-and-layout.md)
> 状态: v1 合同已锁定 | 更新: 2026-07-17

## 共同类型

所有 family 共享 header 和可选 `callout`；`primary_visual` 默认可选，但 `visual-focus` 必填、精确结构 family 禁止。以下是 body 内可复用的 typed blocks：

| 类型 | 字段 | v1 容量 |
|---|---|---|
| `text_block` | `heading?`, `body?`, `bullets?` | heading 最多 60 graphemes/目标 1 行；body 最多 240；bullets 2-5 条、每条最多 90 |
| `card` | `label`, `value?`, `body?`, `icon?` | label 最多 40 graphemes/目标 1 行；body 最多 120 |
| `metric` | `value`, `label`, `detail?` | value 最多 24、label 最多 40 graphemes/各目标 1 行；detail 最多 80 |
| `step` | `label`, `body?`, `icon?` | label 最多 40 graphemes/目标 1 行；body 最多 100 |
| `data_series` | `name`, `values` | 最多 4 series；values 数量必须与 chart categories 一致 |
| `quote_block` | `quote`, `attribution?`, `context?` | quote 最多 280 graphemes |

grapheme 上限按用户可见字符计数，是跨中英文的粗粒度 preflight guard，不代替渲染后的像素 overflow 检查。所有可见文字来自这些 typed blocks，visual brief 不得补充文字。

## Family discriminated union

| Family | 必填 body 字段 | 数量 | `primary_visual` 存在时的 placement |
|---|---|---|---|
| `hero` | `hero_statement?`, `supporting_line?` | statement 最多 2 行 | `full-bleed` |
| `split` | `mode: text-text` 时 `left + right`；`mode: text-visual` 时 `text + primary_visual` | 每个 text block 的 bullets 最多 4 | `text-text` 禁止；`text-visual` 必须为 `left` 或 `right`，`text` 自动占另一侧 |
| `cards` | `cards: card[]` | 2-4 | 不允许 |
| `kpi` | `metrics: metric[]` | 1-3 | 不允许 |
| `comparison` | `left: text_block`, `right: text_block` | 每侧 bullets 2-5 | 不允许 |
| `flow` | `steps: step[]` | 3-5 | 不允许 |
| `timeline` | `steps: step[]` | 3-5 | 不允许 |
| `data` | `chart.kind`, `series`, `insight?` | kind=`bar|line|area`; 1-4 series | 不允许 |
| `quote` | `quote: quote_block`, `supporting?` | 一个主引语 | `left` 或 `right` |
| `visual-focus` | `caption?: text_block`, `primary_visual` | caption 最多 3 bullets | 必须为 `body` |

不在表内的字段、placement 或数量 fail closed。`split` 用 `mode` 做真正的 discriminated union，禁止同时提交 `left/right` 与 `text/primary_visual` 两组字段；`text-visual` 的准确标签应放在 `text` 或 callout。`hero` 的 body 字段可以为空，因为结构化 TITLE 已构成页面主陈述；`visual-focus` 则必须有非空的本地主视觉 fallback，不能形成空白 body。

共同的 `primary_visual` 必须声明 `placement`、无准确文字的 `brief`、`fit: cover`、`focal_point` 和结构化 `fallback`；`selection` 可为 null 或正式资产 binding。`data.chart` 必须声明 `kind`、1-12 个 `categories` 与 1-4 个 `series`，每个 series 的 values 与 categories 等长。

## Slot geometry

所有几何由 visual config 的 normalized 1000 x 562.5 逻辑画布按比例投影，不在 slide source 写像素。下表是 v1 必须随 visual config seed 的 canonical geometry，不是散落在 renderer 中的 magic numbers；v1 所有 preset 共用，未来改变须新 requirement 和像素回归：

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
| `icon-composition` | split、quote、visual-focus | `asset_ids`：1-3 个已登记 icon/SVG asset + 无文字 CSS composition |
| `asset` | hero、split、quote、visual-focus | `asset_id`：一个已登记 asset；按 fit/focal point 裁切 |
| `abstract-css` | hero、visual-focus | `recipe`：从受支持 recipe enum 选择；由 visual config tokens 驱动 |
| `none` | hero、split、quote | 保持背景/留白；结构化 TITLE、text 或 quote 仍须独立构成完整页面 |

fallback 必须是结构化对象；引用资产时在 Stage 1 验证其存在。任意自由 HTML/SVG 字符串不进入 slide source。`visual-focus` 不允许 `none`；它必须由 `icon-composition`、`asset` 或 `abstract-css` 在零远端条件下完成。

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
