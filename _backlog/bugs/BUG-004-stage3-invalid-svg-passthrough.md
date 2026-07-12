---
id: BUG-004
title: Stage 3 passthrough 对某些 vendor 的 full-page 图抛 "Invalid SVG image"
severity: medium
status: open
found_at: 2026-07-13
found_in: deck_ai_sdlc_keynote, Phase 3 production
reproduced: once
---

## 症状

Stage 3（Lock Headers）处理全部 25 张 full-page 图时报错：

```
01_s01_cover.png  (full-page)
02_s02_opening.png  (full-page)
03_s03_why_software_first.png  (full-page)
04_s04_one_tool_two_modes.png  (full-page)
✗ Stage 3: Lock Headers FAILED: Invalid SVG image
```

25 页全部是 `full-page`，Stage 3 应该全部 passthrough（不叠加文字），但却在第 4 张图崩了。

## 根因推测

- 图中混合了多个 vendor 的输出：s01-s04 是 APIMART vendor 生成的，s05/s06/s18/s22 是 LCON vendor（sync mode, "sync image returned (no task) → saving"）
- LCON sync mode 返回的 PNG 可能格式/编码与 APIMART 不同，导致 Stage 3 的 canvas 库在读取时误判为 SVG
- 或者 Stage 3 在 full-page passthrough 路径中不应该调用 canvas 解析，但实际代码路径触发了图片解析

## 影响

- 纯 full-page deck 无法正常走 Stage 3
- workaround：跳过 Stage 3，直接用 `page_images_full/` 的图跑 `stage4_build_pptx.mjs`
- 对于纯 full-page deck 这完全够用——Stage 3 对 full-page 本来就只是 passthrough（复制原图）

## 复现

1. 混合使用不同 vendor 生成 full-page 图
2. 跑 `--stage 3`
3. 可能在某个 vendor 的图上报 "Invalid SVG image"

## 建议修复

1. Stage 3 在 full-page passthrough 路径中不应解析图片内容——直接 `copyFileSync` 即可
2. 如果必须解析（如需要 resize/convert），应 catch 解析错误并 fallback 到直接复制
