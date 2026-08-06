# framed capture BUG-060 与 bundle 内绕法

**遇到什么:**
v2 framed 的每一张 final 合成图都是坏的——整页半透明（alpha≈亮度）、底部 ~30% 全透明，
用户观感「什么都看不清楚」。曾以为 underlay/风格问题，实际是 harness 捕获管线 bug。

**怎么试的:**
1. 像素级诊断：`fast-png` 解码 final，alpha 直方图 opaque(255) 只有 96/2250000 像素。
2. 隔离 chromium 原始截图 vs `cropOneDeviceRow` 之后：原始截图 3 bytes/pixel（RGB，无 alpha，
   正常），crop 后变 4bpp 且半透明/全透明激增 → 根因锁定。
3. 最小不透明 HTML 复现同样坏 → 与 deck 内容无关，是 harness bug（`_backlog/bugs/BUG-060`）。

**结论:**
`capture_runtime.mjs` 的 `cropOneDeviceRow` 硬编码 `rowBytes = width*4`（RGBA），但 `decodePng`
对无 alpha 截图返回 3bpp RGB → 行跨步错位 + 越界读成 0。**所有 framed 合成都坏**，静默通过
`assertNonBlankPng`（它不查 opacity）。

**bundle 内绕法（不修改 harness）：**
`3_versions/v2/_scratch/rebuild_final.mjs`（保留着）：
- 复制 harness 的 `compileDocument` 布局（standard-v1 preset + underlay + 文字），
- 用 playwright 自己截图，**按真实 bpp（3）裁剪**、强制 RGBA alpha=255，
- 用现有已验收 raw underlay 重合成（**零付费**），
- 走 harness 自己的 `publishCurrentFinalSlideManifest` + `deliverTargetFinalSlideManifest` +
  `recordTargetProgressiveFinalManifest/DeliveryReceipt` 更新 state。
- 用法：`node rebuild_final.mjs --compose-only <dir>`（先自检）/ `--deliver`（交付）。

**下次先看哪:**
- `_backlog/bugs/BUG-060-*.md`——harness 修复前，任何 framed 文本改动后的重合成都要用这个绕法脚本；
  直接用 harness 的 `refreshFramedTargetText`/deliver 会再次产出坏 final。
- 修 harness 只需把 `cropOneDeviceRow` 的行跨步改为 `width * (data.length/(width*height))`。
