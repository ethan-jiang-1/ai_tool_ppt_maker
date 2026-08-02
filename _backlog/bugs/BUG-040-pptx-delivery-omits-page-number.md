# BUG-040: PPTX 交付不贴页码

> 严重级别: P1 | 发现: 2026-08-02 | 状态: 活跃

## 症状

`ppt_flow build` 产出的 PPTX 每页**没有任何页码**。以 `deck_ai_sdlc_keynote/3_versions/v5/_generated/page_authority_image2/final/deck.pptx` 为例，解包 slide XML 无任何 `<a:t>` 文本、无 `<fld>`/`sldNum` 页码域。观众翻页时无法定位页码。

## 根因

`assemblePptx`（`PPTMAKER_FRAMEWORK/scripts/05-delivery/index.mjs:162-180`）只做整页铺图：

```js
for (const item of input.manifest.items) {
  pptx.addSlide().addImage({ path: ..., x: 0, y: 0, w: 13.333333, h: 7.5 });
}
```

不添加任何 footer/页码。与此同时，**workflow / charter / reference / openspec spec 对页码行为零规定**（grep `页码|page number|footer|slideNum|序号` 无命中），所以既无实现也无契约——交付能力缺口 + 文档空白并存。

final-slide manifest 已携带 `position`（1-based）与 `slide_id`（`page-authority-final-slide-manifest-v2`），页码所需数据现成，纯属交付层没做。

## 复现

```bash
node PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs build <run-dir>
unzip -p <run-dir>/_generated/page_authority_image2/final/deck.pptx ppt/slides/slide1.xml
# 无 <a:t> 文本、无 sldNum
```

## 修复关联

OpenSpec change（pptx-assembly / delivery）：`assemblePptx` 默认给每页叠加页码 footer（纯文案、右下角、N 位补零），框架默认开启、deck 可通过配置关闭；行为写入 workflow 05-delivery 与 pptx-assembly spec。修复后重跑 build 即可重建。
