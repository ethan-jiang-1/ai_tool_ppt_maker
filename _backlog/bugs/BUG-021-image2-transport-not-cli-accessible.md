# BUG-021: Phase 4 Image2 transport 需要代码注入，CLI 无法使用

> 严重级别: P0 | 发现: 2026-07-21 | 状态: 活跃

## 症状
`ppt_flow image2 plan` → `authorize` 均成功，但 `generate` 报错：
```
modern refinement transport must be injected after authorization
```

## 根因
Phase 4 Image2 refinement 的 transport 设计为 `createRefinementTransport({ submit, reconcile })`——
需要调用方注入 `submit`/`reconcile` 回调函数（transport.mjs:46-47,108）。
这与 legacy pipeline 从 `.env` 读 `IMAGE2_API_KEY` + `IMAGE2_BASE_URL` 的方式完全不同。

`ppt_flow image2 generate` CLI 命令不接受 transport 回调参数，
导致 authorize 之后的整个流程无法从命令行推进。

## 复现
1. `ppt_flow image2 plan v2` ✓
2. `ppt_flow image2 authorize v2 --plan-hash <hash>` ✓
3. `ppt_flow image2 generate v2 --attempt-id <id>` → ❌ transport must be injected

## 修复关联
两个方向：
A. 让 CLI 支持从 `.env` 加载 IMAGE2 凭据并自动构建 transport（对齐 legacy pipeline）
B. 提供 `--provider` / `--base-url` CLI 参数显式传入凭据
