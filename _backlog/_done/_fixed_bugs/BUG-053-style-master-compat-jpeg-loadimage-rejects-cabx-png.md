# BUG-053: Style Master 兼容 JPEG 投影失败 —— @napi-rs/canvas `loadImage` 拒载带 `caBX` chunk 的 provider PNG

> 严重级别: P1 | 发现: 2026-08-05 | 状态: 活跃

## 症状

真实 deck `deck_dark_factory`（pure workflow）Style Master 候选生成成功（两个 candidate 都 `succeeded`），
但 `style-master accept --decision proceed --candidate-id candidate-002` 提交 selection 后，派生的兼容
JPEG 投影持续失败：

```
FAILED: The Style Master selection committed, but its compatibility JPEG projection needs replay.
reason: { "kind": "compatibility_projection_failed" }
```

按诊断 rerun 同一 accept 调用仍失败（`requires_human: false`，但重跑不修复）。selection 已提交
（`1bdc61cc…`），但 `visual-style/style_master.jpg` 无法生成，Style Master promotion 无法完成，deck
卡在 Style Master gate，无法进入 page raw 规划。

## 根因

`encodeStyleMasterCompatibilityJpeg`（`PPTMAKER_FRAMEWORK/scripts/shared/image2/style_master_plan.mjs:1971`）
用 `loadImage(candidate.bytes)`（@napi-rs/canvas）解码候选 PNG。真实 provider 返回的候选 PNG 携带**非标准
`caBX` chunk**（IHDR, **caBX**, IDAT, IEND），@napi-rs/canvas 原生解码器遇到该 chunk 即整图拒载，报误导性
错误 `Invalid SVG image`。

实证（探针）：
- `file` 确认候选是合法 PNG：`1536 x 1024, 8-bit/color RGB, non-interlaced`
- chunk 遍历：`IHDR, caBX, IDAT, IEND`（`caBX` 非标准私有 chunk）
- `loadImage(bytes)` → `Invalid SVG image`
- **剥离 `caBX` 后 `loadImage` 正常**（1536×1024 解码 OK）
- 控制组 canvas 生成的 PNG（无 caBX）`loadImage` 正常
- 候选校验用的 `fast-png` 解码器不受影响（候选因此校验 `succeeded`）

即：PNG 本身有效，问题在兼容 JPEG 投影层的 `loadImage` 对带未知/私有 chunk 的 provider PNG 不兼容。

## 影响范围

- 所有真实 provider 生成的 Style Master 候选（若含 `caBX` 等非标准 chunk）都无法完成 accept promotion。
- `visual-style/style_master.jpg`（`STYLE_MASTER_IMAGE`）是下游 raw 规划的 Style Master 引用
  （`source_asset: "visual-style/style_master.jpg"`），缺失即阻断 `plan-target-pure-progressive-raw`。
- 不涉及候选生成/校验（`fast-png` 路径正常）；不涉及 page raw 的 `inspectExactPageAuthorityPng`。

## 修复方向

`encodeStyleMasterCompatibilityJpeg` 不得依赖 @napi-rs/canvas `loadImage` 解码任意 provider PNG。候选方案：

1. 用 `fast-png`（框架已有、候选校验在用）解码 PNG，把 RGBA 像素画进 canvas 再 `toBuffer("image/jpeg")`；
   完全绕开 `loadImage` 的格式检测。
2. 或在 `loadImage` 前剥离非标准/非关键 chunk（如 `caBX`），保留 IHDR/IDAT/IEND。
3. 或 JPEG 编码改用不经 `loadImage` 的路径（如直接 `jpeg-js`/`sharp`，但需评估依赖边界）。

需要 regression：用带 `caBX` chunk 的 fixture PNG 覆盖 accept → compat JPEG 投影成功。

## 复现

```bash
node PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs style-master accept deck_dark_factory/3_versions/v1 \
  --plan-hash 6747ec0b7784cc57177eca78eeb85228b3307909917bb0e8ff011829be82404b \
  --decision proceed --candidate-id candidate-002
```

## 关联

- 触发于 `harden-style-master-provider-boundary`（BUG-046..052）修复后：候选从 `unknown`/失败变为 `succeeded`，
  首次暴露 accept 的兼容 JPEG 投影路径。
- deck_dark_factory 生产（Style Master gate）被此 bug 阻塞。
