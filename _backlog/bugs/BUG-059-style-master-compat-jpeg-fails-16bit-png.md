# BUG-059: Style Master 兼容 JPEG 投影对 16-bit provider PNG 失败（loadImage 无法解码）

> 严重级别: P2 | 发现: 2026-08-05 | 状态: 活跃

## 症状

deck_dark_factory v2 framed Style Master accept（candidate-001，MICU provider 生成）时，selection 已提交
（`05c81d65…`）但派生兼容 JPEG 投影持续失败：

```
FAILED: The Style Master selection committed, but its compatibility JPEG projection needs replay.
reason: { "kind": "compatibility_projection_failed" }
```

按诊断 rerun 同一 accept 调用仍失败。selection 已 promoted（`terminal_reason: promoted`），所以不阻塞
Style Master 使用，但 `visual-style/style_master.jpg` 派生产物无法生成。

## 根因

候选 PNG 是 **16-bit/color RGB**（MICU provider 返回）：

```
PNG image data, 2048 x 1136, 16-bit/color RGB, non-interlaced
```

`encodeStyleMasterCompatibilityJpeg`（`style_master_plan.mjs`）用 @napi-rs/canvas `loadImage(candidate.bytes)`
解码候选 PNG，@napi-rs/canvas 对 16-bit PNG 解码失败 → 整段投影抛 `compatibility_projection_failed`。

这与 BUG-053（@napi-rs/canvas 拒载带 `caBX` chunk 的 8-bit PNG）**同类但根因不同**：
- BUG-053：未知 chunk（caBX）→ loadImage 拒载
- 本 bug：**16-bit 位深** → loadImage 无法解码
两者都发生在 Style Master 兼容 JPEG 投影层，暴露 @napi-rs/canvas `loadImage` 对 provider 任意 PNG 格式的
不兼容。

## 影响范围

- MICU（及任何返回 16-bit PNG 的 provider）的 Style Master 候选 accept 时 compat JPEG 失败。
- Style Master selection 本身 promoted（不阻塞 raw 生产），但派生 JPEG 缺失。
- 后续同样会遇到：page raw 若走 @napi-rs/canvas loadImage 的路径（如 framed compositor 的 underlay 解码）。

## 修复方向

`encodeStyleMasterCompatibilityJpeg` 不得依赖 @napi-rs/canvas `loadImage` 解码任意 provider PNG。复用 BUG-053
修复方向：
1. 用 `fast-png`（框架已有、候选校验在用）解码 PNG（支持 16-bit? 需验证），把 RGBA 像素画进 canvas 再
   `toBuffer("image/jpeg")`；
2. 或先把 16-bit PNG 降到 8-bit（fast-png 解码后重编码），再走 loadImage；
3. 统一封装一个「任意 provider PNG → canvas」的兼容解码路径，Style Master 与 page raw 共用。

需要 regression：16-bit PNG fixture 覆盖 accept → compat JPEG 投影成功。

## 复现

```bash
node PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs style-master accept deck_dark_factory/3_versions/v2 \
  --plan-hash 8d070272a7a9f205c597dfc69a32cb1eb5575098d8bfd19def814c6fb92052da \
  --decision proceed --candidate-id candidate-001
```

## 关联

- BUG-053（caBX chunk）同类问题的 16-bit 变体；都在 Style Master compat JPEG 投影层。
- 触发于 v2 framed Style Master（MICU provider，16-bit PNG）。
