# BUG-060: framed 捕获 `cropOneDeviceRow` 行跨步错误损坏 final PNG（alpha 污染 + 底部透明）

> 严重级别: **P0** | 发现: 2026-08-06 | 状态: 活跃

## 症状

`03-framed-image` 工作流的每一张 final 合成图都是坏的：整页半透明（alpha≈亮度）、底部 ~30%
全透明、上半部有条带。用户观感「完全瞎扯淡 / 什么都看不清楚」。**所有 framed 合成无一幸免**。

在 deck_dark_factory v2（以及任意 framed compose）的 `final/*.png` 上：

```
PNG image data, 2000 x 1125, 8-bit/color RGBA
alpha 直方图（fast-png 解码）: a=0:749388  a=235:201440  a=231:173025  a=226:120723  a=1:87470 ...
opaque(255)=96  semi=1500516  transparent=0:749388   （总共 2250000 像素）
```

正常截图应为 ~100% opaque(255)。

## 根因

`ppt_maker_harness/scripts/03-framed-image/internal/capture_runtime.mjs` 的 `cropOneDeviceRow`：

```js
function cropOneDeviceRow(decoded) {
  if (decoded.width !== 2000 || decoded.height !== 1126) throw ...;
  const rowBytes = decoded.width * 4;   // ← 硬编码 4 bytes/pixel（RGBA）
  const data = new Uint8Array(rowBytes * 1125);
  for (let row = 0; row < 1125; row++) {
    data.set(decoded.data.subarray(row * rowBytes, (row + 1) * rowBytes), row * rowBytes);
  }
  return encodePng({ width: 2000, height: 1125, data });
}
```

chromium `page.screenshot` 对不透明页面产出 **RGB PNG（3 bytes/pixel，无 alpha）**，`decodePng`
如实返回 3 bytes/pixel。但这里按 `width*4` 计算行跨步，实际行跨步是 `width*3`：

- 每行按 8000 字节读取，实际每行只有 6000 字节 → **行错位**：输出行 r 读到的是输入行
  r*(4/3) 附近的错位字节，产生 alpha≈亮度、条带伪影；
- 读到 buffer 末尾越界（`undefined` → 0）→ **底部 ~30% 全透明**。

`assertNonBlankPng` 只检查非空白/非单色，不检查 opacity，所以这个 bug 静默通过全部校验。

## 复现（最小）

对任意不透明 HTML（白底 + 一个 `rgba(245,240,235,0.96)` 面板）跑 `captureHtmlPng`：

```
RAW screenshot           bpp=3（RGB）      ← 正常，无 alpha
after cropOneDeviceRow   bpp=4（RGBA）     ← 污染：semi=656880 transparent=561000
```

raw 截图 3bpp、crop 后 4bpp 且半透明/全透明激增 = 行跨步错乱铁证。

## 影响范围

- **所有 framed 工作流的 final 合成**（Text Frame + underlay）都损坏。
- PPTX、单页 PNG、projection contact sheet 全部受影响（delivery 直接写 compose 的 bytes）。
- 旧 `PPTMAKER_FRAMEWORK` 时代（deck v2, 2026-08-05 交付）同样损坏 —— 长期存在、被静默接受的 bug。

## 修复方向（一行）

`cropOneDeviceRow` 的行跨步应为实际 bytes/pixel，而非硬编码 4：

```js
const bytesPerPixel = decoded.data.length / (decoded.width * decoded.height); // 3 或 4
const rowBytes = decoded.width * bytesPerPixel;
```

并按其把 1125 行裁出（数据是 RGB 时保持 RGB 重编码，或转 RGBA 时补 alpha=255）。
建议同时加一个 regression：capture 输出断言 `opaque 占比`（如 >99.9% 或 alpha 通道不存在）。

## 关联

- BUG-059（16-bit provider PNG）与 BUG-053（caBX chunk）都是 provider PNG 兼容问题；
  本 bug 是 capture 层独立的行跨步缺陷。
- 触发于：deck_dark_factory framed v2 交付；任何 `composeFramedRenderContracts` 调用。
