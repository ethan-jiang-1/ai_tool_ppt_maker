# BUG-040: PPTX 交付不贴页码

> 严重级别: P1 | 发现: 2026-08-02 | 状态: 待真实 run 验收（本地框架修复完成：2026-08-02）

## 当前复核

`unify-page-ordinal-projections` 已让 target-v2 与 bounded CURRENT 两条
PPTX assembly 路径共用固定的右下角页码 footer。页码由当前 position 派生，至少两位
补零；target-v2 使用 final manifest position，bounded CURRENT 使用 accepted manifest
entry 顺序。整页 final PNG、stable `slide_id`、raw evidence 与 delivery lineage 均不变，
没有配置或 opt-out。

本地 delivery 测试已解开 notes 注入后的 PPTX XML，确认每页保留整页图片和 `01` footer；
但没有指定 run bundle，且本机缺少 `soffice` / `libreoffice` 进行视觉渲染。因此仍需在
用户指定的真实 run 重建 delivery 后验收可读性与实际页序。

2026-08-03 的补充静态验收读取指定 deck v5 的既有 `deck.pptx`：25/25 个 slide XML
同时含整页图片与对应 `01` 到 `25` footer。它是历史交付的 XML 证据，不替代 v7 rebuild
后的渲染可读性检查。

## 历史记录

### 症状

`ppt_flow build` 产出的 PPTX 每页**没有任何页码**。以 `deck_ai_sdlc_keynote/3_versions/v5/_generated/page_authority_image2/final/deck.pptx` 为例，解包 slide XML 无任何 `<a:t>` 文本、无 `<fld>`/`sldNum` 页码域。观众翻页时无法定位页码。

### 根因

`assemblePptx`（`PPTMAKER_FRAMEWORK/scripts/05-delivery/index.mjs:162-180`）只做整页铺图：

```js
for (const item of input.manifest.items) {
  pptx.addSlide().addImage({ path: ..., x: 0, y: 0, w: 13.333333, h: 7.5 });
}
```

不添加任何 footer/页码。与此同时，**workflow / charter / reference / openspec spec 对页码行为零规定**（grep `页码|page number|footer|slideNum|序号` 无命中），所以既无实现也无契约——交付能力缺口 + 文档空白并存。

final-slide manifest 已携带 `position`（1-based）与 `slide_id`（`page-authority-final-slide-manifest-v2`），页码所需数据现成，纯属交付层没做。

### 复现

```bash
node PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs build <run-dir>
unzip -p <run-dir>/_generated/page_authority_image2/final/deck.pptx ppt/slides/slide1.xml
# 无 <a:t> 文本、无 sldNum
```

### 修复关联

OpenSpec change（pptx-assembly / delivery）：`assemblePptx` 默认给每页叠加页码 footer（纯文案、右下角、N 位补零），框架默认开启、deck 可通过配置关闭；行为写入 workflow 05-delivery 与 pptx-assembly spec。修复后重跑 build 即可重建。
