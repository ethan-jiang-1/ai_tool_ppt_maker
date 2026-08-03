# BUG-037: Image2 API (APIMART gpt-image-2) 不遵守请求尺寸

> 严重级别: P1 | 发现: 2026-07-30 | 状态: 已修复并通过真实 v7 验收（2026-08-04）

## 关闭证据（2026-08-04）

根因已校正为“请求尺寸不是返回 bytes 契约”，而不是以 resize 掩盖 provider 原件。
`2026-08-04-align-page-authority-native-media-contract` 保留 `2000x1125` transport request，
将验证/ingress 契约设为原生 `2048x1136` PNG。v7 的 25/25 raw 均为该原生尺寸，且 25/25
Pure final 与 raw 字节相同、PPTX media 也按序相同；没有 resize、crop 或 transcode。本卡关闭。

## 关闭前复核

`harden-page-authority-provider-boundary` 已在 selected adapter/provider-result
边界以 CRC-checked PNG decode 验证精确 `2000x1125`。空 bytes、损坏/非 PNG 与错误
尺寸均在 raw materialization、provenance 和 `succeeded` attempt 之前进入既有 bounded
`known_failure`，不会 resize 或伪造合格原件；Pure 与 Framed 共用这一边界。

这证明本地 deterministic 防护已完成，不证明 APIMART 已停止返回错误尺寸。是否 provider
当前仍会发生该偏差，仍需一次单独授权的真实 run/live probe 验收。

2026-08-03 指定 v7 已完成 provider-free source validation 并停在 Style Master gate；没有
provider authorization 或 raw materialization，因此该验收没有伪造 live-probe 结论。

## 历史记录

### 症状

`async-generate.mjs` 请求 `size: "2000x1125"`，但 API 返回的实际图片尺寸不一致：

- 9 张为 2000x1120（高度少 5px）
- 16 张为 1672x941（完全错误）

`framed_composition.mjs` 要求 raw PNG 必须正好 2000x1125，导致 `ppt_flow.mjs build` 报错：
```
FAILED: Framed raw PNG must be exactly 2000x1125
```

### 根因

APIMART 的 `gpt-image-2` 模型不保证输出尺寸与请求参数一致。响应中的图片实际分辨率由模型自行决定，`size` 参数是建议值而非硬约束。

管线在 `framed_composition.mjs` 第 13 行做硬校验：
```js
if (png.width !== 2000 || png.height !== 1125) throw new Error("Framed raw PNG must be exactly 2000x1125");
```

### 历史复现

```bash
export IMAGE2_API_KEY=$(grep '^IMAGE2_API_KEY=' .env | cut -d= -f2)
export IMAGE2_BASE_URL=$(grep '^IMAGE2_BASE_URL=' .env | cut -d= -f2)
node deck_ai_sdlc_keynote/3_versions/v4/_scratch/async-generate.mjs --only=TriYear
# 检查 raw/TriYear.png 尺寸
```

### 当时修复方向

两条路径：

1. **上游**：向 APIMART 确认 `gpt-image-2` 模型是否支持精确尺寸输出，若不支持则换模型或接受后处理
2. **下游防护**：在 `async-generate.mjs` 或 `framed_composition.mjs` 中增加 resize 步骤。`framed_composition.mjs` 可以将硬报错改为自动 resize（用 sharp/canvas），而不是让整个 build 失败

建议两条都做：上游确认模型能力，下游加防护 resize 避免管线断裂。

### 关联

- 本次生产通过 `_scratch/resize-raw.mjs` 做了全部 25 张的 sharp resize 绕过此问题
- 与 BUG-035/BUG-036 无直接关联，但同属 production pipeline 的数据质量链路
