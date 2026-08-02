# BUG-042: 每页 provider prompt（JSON）不外露，无法诊断

> 严重级别: P1 | 发现: 2026-08-02 | 状态: 活跃

## 症状

生产过程中，每页实际发给 Image2 provider 的 prompt（`JSON.stringify(request)`）**不外露**——plan/投影只存 `raw_contract_sha256` digest，模型到底收到什么文字指令不可见。出问题（如 BUG-041：图里没字）时无法直接看 prompt 定位。

## 根因

`targetPageAuthoritySubmitFactory`（`PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs:1734-1736`）在内存里拼 `prompt: JSON.stringify(request)` 直接发出，request 不落盘、不展示。`image2 plan` 投影只带 `raw_contract_sha256`（哈希），`provider_requests_by_slide` 只在 plan 构建函数的返回值里、不进持久化投影。诊断链断裂：结果不对时看不到输入。

## 复现

```bash
node PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs image2 plan <run-dir> --json
# 投影里只有 raw_contract_sha256，没有每页 provider request/prompt 文本
# generate 时 prompt 仅内存，日志不输出
```

## 修复关联

在 provider-free 的 plan 投影（或 `_generated/page_authority_image2/`）持久化每页 provider request/prompt 的可重建投影，供诊断；debug 输出可显式 dump 单页 prompt。修复后 BUG-041 这类"prompt 语义错误"能直接可见。
