# BUG-054: Page raw provider 返回非契约原生尺寸，pilot 提交全部 known_failure

> 严重级别: P1 | 发现: 2026-08-05 | 状态: 活跃

## 症状

deck_dark_factory（pure workflow）Pilot 批量授权后，`image2 generate` 对每个 slide 提交都被判
`known_failure`：

```
provider_media: {
  expected: { format: "png", width: 2048, height: 1136 },
  actual:   { format: "png", width: 1684, height: 934 }
}
```

两次生成（DejaVu）烧掉 2/3 次提交，均 known_failure。继续 generate 会确定性重复失败并烧光 grant。

## 根因

配置的 provider（`IMAGE2_BASE_URL=https://www.duckcoding.ai`，micuapi relay）对请求尺寸
`PAGE_AUTHORITY_IMAGE2_REQUEST_SIZE = "2000x1125"` 返回其**自有原生尺寸** `1684x934`，不满足
`inspectExactPageAuthorityPng`（`page_authority_media_contract.mjs`）要求的 **exact 2048x1136** native PNG。

这与 BUG-046（Style Master 候选尺寸/provider 错配）**同类**：provider 不 honor 请求尺寸、返回自有 native
尺寸。区别是 BUG-046 已把 **Style Master** 路径加固为接受任意正尺寸 native PNG，但 **page raw** 路径仍保持
exact 2048x1136 校验（v7 生产中 provider 恰好返回 2048x1136 才通过）。

`PAGE_AUTHORITY_IMAGE2_REQUEST_SIZE` 与 `PAGE_AUTHORITY_NATIVE_RAW_PNG` 都是 framework 常量，无数据配置
旋钮；.env 只能换 provider host，不能改契约尺寸。

## 影响范围

- 所有依赖当前 provider（duckcoding.ai/micuapi）的 page raw 提交：确定性 known_failure，每次烧一次付费
  提交，Pilot/Expansion 都无法产出 raw evidence。
- Style Master 路径不受影响（已接受 native 尺寸，本 deck 的 Style Master 候选 1536x1024 正常）。
- PPTX final/delivery 依赖 accepted raw evidence，故整条 pure raw 生产被此阻塞。

## 修复方向

需在「page raw 接受 provider-native 原生尺寸」与「让 provider 产出 2048x1136」之间选一：

1. **仿 BUG-046 加固 page raw media 契约**：接受 CRC 有效、正尺寸的原生 PNG 为 accepted raw，并在不可变
   provenance 中保留真实尺寸；PPTX/framed assembly 按实际尺寸验证（需评估 framed 固定 2000x1125 与 pure
   原生尺寸的兼容）。
2. **提供方协商**：换一个能产出 2048x1136 的 provider 端点，或确认 provider 是否支持指定尺寸的参数。
3. 若契约必须 exact 2048x1136，则在授权前对 provider 做尺寸 preflight，避免烧付费提交（前置失败短路）。

需要 regression：mock provider 返回非 2048x1136 native PNG，覆盖授权后生成、known_failure 分类、以及
（若采用方案 1）native 尺寸 accepted + provenance 尺寸保留。

## 复现

```bash
node PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs image2 authorize deck_dark_factory/3_versions/v1 \
  --plan-hash 185e5d973406581b7ed89dee0b8446f68c4c4f091cc1d9c684348515c7b9c80c \
  --batch-hash f0526c828f0879612e1a807c967760f4f128a27575ed1c0aa7cedec4a8f0a650
node PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs image2 generate deck_dark_factory/3_versions/v1 \
  --plan-hash 185e5d973406581b7ed89dee0b8446f68c4c4f091cc1d9c684348515c7b9c80c \
  --batch-hash f0526c828f0879612e1a807c967760f4f128a27575ed1c0aa7cedec4a8f0a650
```

## 关联

- BUG-046（Style Master 尺寸校验/provider 错配）同类问题的 page raw 侧。
- 触发于本 deck 首次通过 Style Master gate（`harden-style-master-provider-boundary` 后）进入 page raw
  pilot。
- deck_dark_factory 生产被此阻塞（Pilot 3/3 提交无法产出）。
