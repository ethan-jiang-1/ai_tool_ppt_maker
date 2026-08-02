# BUG-037: Image2 API (APIMART gpt-image-2) 不遵守请求尺寸

> 严重级别: P1 | 发现: 2026-07-30 | 状态: 活跃（当前路径复核：2026-08-02）

## 当前复核

当前 target provider request 仍声明 `2000x1125`，但
`targetPageAuthoritySubmitFactory` 只验证 response 有非空 base64 bytes；progressive
raw owner 会把这些 opaque bytes materialize。Framed 到较晚的本地 composition 才解码
并拒绝错误尺寸，Pure 则没有一个等价的 shared provider-response media boundary。

因此这里仍是当前路径的防护缺口：错误尺寸不应被静默 resize（那会伪造被接受 raw
bytes），但应在 selected adapter/provider-result 边界立即解码并以 bounded known
failure 停止，避免把无效 bytes 记为已 materialize 的生产事实。是否 provider 目前
仍会返回错误尺寸需要一次单独授权的 live probe 才能重新确认；本卡保留的是本地
deterministic 防护责任。

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
