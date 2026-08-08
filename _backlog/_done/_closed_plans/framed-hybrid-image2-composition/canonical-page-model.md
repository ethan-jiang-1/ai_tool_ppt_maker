# Canonical Model: Pure 与 Framed 的共同页面生成模型

> Parent plan: [`../framed-hybrid-image2-composition.md`](../framed-hybrid-image2-composition.md) | 关闭: 2026-08-08 | 状态: 历史材料

## 一句话定义

Pure 与 Framed 都让 Image2 生成一张完整的 PPT 页面；Framed 只是在完整页面上增加一层透明、确定性的 `kicker/title/subtitle` 本地 overlay。

```text
Pure    = Image2 full-page composition
Framed  = Image2 full-page composition
          + transparent deterministic header overlay
```

如果一个实现让 Framed 的 Image2 只生成无字底图、只生成装饰背景，或把 body/callout/labels/metrics 改由本地 frame 负责，这个实现已经偏离本模型。

## 共同核心

Pure 与 Framed 必须共享同一个 `page_image_core`：

- 同一套 canonical source 内容权威：人/source 决定主张、数据和 exact required copy。
- 同一套 full-canvas Image2 生成能力：视觉场景、主体、body、labels、metrics、diagram text、quote、callout 与 supporting visuals。
- 同一套 page-level visual language、Style Master、identity/reference 和 generation profile 规则。
- 同一套 provider-rendered literal/data 正确性、清晰度、整体构图和 audience-facing copy 验收基线。
- 同一套 source receipt、compiled provider input、authorization、attempt、raw evidence 和 delivery lineage。

这意味着 Framed 不是另一个内容模型，只是同一页面模型上的 header rendering policy。

## 唯一关键差异

| 页面元素 | Pure | Framed |
| --- | --- | --- |
| visual scene / subject / background | Image2 渲染 | Image2 渲染 |
| body / labels / metrics / diagram text | Image2 渲染 | Image2 渲染 |
| quote / callout / supporting copy | Image2 渲染 | Image2 渲染 |
| kicker / title / subtitle | Image2 渲染 | 本地透明 overlay 渲染 |
| header 语义 | provider context + visible pixels | exact header literals as provider `context_not_to_render` + local visible pixels |
| final publication | provider page 进入 delivery | provider page 与 local header 合成后进入 delivery |

固定字段是协议闭集 `kicker/title/subtitle`。不得通过 per-slide `fixed_fields` 把 callout、正文、指标或标签逐步搬回本地 frame。

## Z-Order 与透明原则

```text
top     local kicker/title/subtitle glyphs       (Framed only)
        optional minimal contrast treatment      (Framed only)
bottom  full-canvas Image2 page                   (Pure and Framed)
```

Framed overlay 的默认 fill 是透明。所谓 minimal contrast treatment 只能是与 preset 明确绑定的小范围手段，例如文字阴影、细描边或受控的局部轻量 scrim；它不能退化为覆盖页面上部的大面积不透明卡片。

底层 Image2 页面必须完整延伸到 header 下方，因此视觉纹理、色彩和背景关系仍连续。这里的“在 body 之上叠加”描述的是 z-order，不代表允许关键 body 文字、人物脸部、指标或图表节点放在 header glyph 下方。

## Protected Zone 的准确语义

Protected zone 是 composition contract，不是 cutout：

- Image2 仍生成该区域的背景和连续画面。
- 不在该区域放 provider-rendered 文字、关键主体或高对比焦点。
- 不生成 kicker/title/subtitle 的可见副本。
- raw review 用 guide 验证避让；final composite 验证真实 header 叠加后的可读性、冲突和视觉重心。

因此，合法结果应当是“画面连续但构图安静”，而不是“顶部留一条空白”或“最终盖一张不透明 panel”。

## 内容权威与像素权威

两种 workflow 都遵守同一条不变式：

> Source owns meaning and exact required copy. The selected workflow owns rendering. Provider rendering never grants semantic invention or silent paraphrase.

Image2 可以决定 provider-rendered 内容如何与视觉共同构图，但不能自行更改主张、数字或 required literal。Framed 的本地 renderer 同样只负责确定性呈现，不拥有改写 header 内容的权限。

## Provider Contract

共同的 compiled provider input 至少表达：

```text
page_image_core
  narrative_context
  provider_rendered_content
  visual_direction
  generation_profile

header_rendering_policy
  pure
    content_to_render: kicker/title/subtitle
  framed
    context_not_to_render: exact kicker/title/subtitle literals
    protected_geometry
    duplicate_header_forbidden
```

Pure/Framed 的 adapter 可以保留各自 owner，但不得各自发明 body/visual semantics。它们应从共同 page-image contract 编译 policy-specific prompt；shared transport 只发送已被 plan、inspection 和 authorization 绑定的最终字节。

## 刷新后果

- body、labels、metrics、callout、visual direction 或 narrative context 变化：Pure/Framed 都 raw rebuild。
- Pure 的 header visible copy 变化：raw rebuild。
- Framed 的 header 变化如果改变 compiled provider context：raw rebuild。
- Framed 只有在 compiled provider input、protected geometry、raw contract/profile 全部不变时，才允许 local overlay refresh。
- notes-only 与 structural versioning 继续走各自既有 owner 路径。

## Review 基线

Pure 与 Framed 的 raw review 都必须检查完整页面是否成立，而不是只检查“图像是否漂亮”。共同检查 body/labels/metrics/callout 的完整性、exactness、清晰度、层级和单一构图。

Framed 在共同基线上增加三项：

1. raw 中没有可见的 kicker/title/subtitle 副本。
2. protected zone 对本地 header 保持足够安静，同时画面仍 full-canvas 连续。
3. production-equivalent composite 中 header 的字体、位置和风格一致，且 overlay 透明、无冲突、无大面积通用卡片。

Complete Page Review 只作一次 `proceed / repair` 决定。Framed 必须并列展示 exact raw 与 production-equivalent composite；Pure 的完整 provider page 本身就是该审查页，不另造 composite。两种模式随后仍须完成独立的 final delivery review。

## 禁止的错误解释

- `Framed = no-text underlay + local text page`
- `Framed = background image + opaque header card`
- `Framed = Image2 only draws visuals; local code owns body`
- `Pure and Framed use different body/content semantics`
- `transparent overlay = header 下可以放任意重要内容`
- `protected zone = blank strip or cropped image area`

这些错误解释一旦出现在 spec、prompt、test fixture 或 Agent 文档中，应视为领域模型回归，而不只是措辞问题。
