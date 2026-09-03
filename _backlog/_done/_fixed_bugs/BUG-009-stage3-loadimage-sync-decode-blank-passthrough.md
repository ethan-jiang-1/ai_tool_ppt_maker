# BUG-009: Stage 3 header-lock 同步解码图像失败，输出全白图，导致 PPTX 25 页白板

> 严重级别: P0 | 发现: 2026-07-11 | 状态: 已修复 (2026-07-12)

## 症状

`build`（Stage 3 → Stage 4）产出的 `ppt/ai_sdlc_bpm_keynote.pptx` 只有 **75 KB**，用 Keynote/PowerPoint 打开是 **25 页白板**（无任何 slide 内容）。

拆包证据：
- `ppt/media/` 里 25 张内嵌图 **MD5 完全相同**、每张 **6221 字节**、尺寸 1672×941 RGBA——是同一张**近乎空白**的图。
- 上游 `page_images_full/` 的真图完好（每张 3–4 MB 2K sketch）。
- `header_locked/`（Stage 3 输出）里 25 张 PNG 也全是 6221 字节、同一 MD5 → **Stage 4 没错，白图是 Stage 3 产的**，Stage 4 只是忠实嵌入。

## 根因

`scripts/stage3_lock_headers.mjs` 的 `_loadImageToCanvas()`（约 940–947 行）：

```js
function _loadImageToCanvas(imgPath, targetSize) {
  const img = new Image();
  img.src = readFileSync(imgPath);          // ← 赋值后未等待解码
  const canvas = createCanvas(targetSize[0], targetSize[1]);
  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0, targetSize[0], targetSize[1]);  // ← 图还没解码就画
  return canvas;
}
```

当前安装的 `@napi-rs/canvas` 版本中，`img.src = <Buffer>` **不是同步解码完成**的；紧接着的 `drawImage` 画到的是一张尚未解码的空 Image → 得到**全透明/空白画布**。

对 `full-page` 模式尤其致命：passthrough 分支 `finalCanvas = imageCanvas` 直接返回这张空白画布（`_drawHeader` 都没走），于是每一页都被写成同一张空白图。全 deck 都是 full-page（本 bundle 25/25），所以整本 PPTX 全白。

**契约层问题**：Stage 3 在"passthrough"语义下必须逐字节保真地把真图带到下游，却在图像加载环节静默丢失了内容，且无任何校验拦截（写出前不检查画布是否为空/是否与源图字节量级相符）。

## 复现

```bash
node PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs build deck_ai_sdlc_bpm_keynote/3_versions/v1
# 检查产物
unzip -o -q deck_ai_sdlc_bpm_keynote/3_versions/v1/_generated/ppt/ai_sdlc_bpm_keynote.pptx -d /tmp/probe
du -sh /tmp/probe/ppt/media/     # 应几十 MB，实际 ~200 KB
md5 /tmp/probe/ppt/media/image-*-1.png | sort | uniq -c   # 25 张同一 MD5
```

## 当前绕过（已交付可用 PPTX）

绕过 Stage 3，直接用真图 `page_images_full/` 喂 Stage 4：

```bash
node PPTMAKER_FRAMEWORK/scripts/stage4_build_pptx.mjs \
  --images deck_ai_sdlc_bpm_keynote/3_versions/v1/_generated/page_images_full \
  --slide-plan deck_ai_sdlc_bpm_keynote/3_versions/v1/_generated/slide_plan.json \
  --out deck_ai_sdlc_bpm_keynote/3_versions/v1/_generated/ppt/ai_sdlc_bpm_keynote.pptx \
  --title "AI SDLC Keynote"
```

产出 103 MB、内嵌 25 张真图（MD5 各异）的正常 deck。**仅当全 deck 为 full-page 时安全**（body+header-lock 页会丢标题叠加）。

## 建议修复方向（交框架侧）

1. `_loadImageToCanvas` 改用 `@napi-rs/canvas` 的异步 `loadImage(buffer)`（`await`），确保解码完成再 `drawImage`；`lockHeaders` 循环相应 `await`。
2. **横切排查**：全仓搜 `new Image()` + `img.src =` 后同步 `drawImage` 的同类写法（style master / contact sheet / 其它合成点）——同一解码竞态可能不止这一处。
3. 加一道**产物哨兵**：Stage 3/4 写出前校验每张输出图非空（如字节量级/非纯色断言），空图立即 fail-loud，杜绝"静默白板"再次逃逸到 PPTX。

## 修复关联

待开 OpenSpec change（framework 生产管线，非 run-bundle 结构）。发现时 run bundle：`deck_ai_sdlc_bpm_keynote`。
