# BUG-042: 每页 provider prompt（JSON）不外露，无法诊断

> 严重级别: P1 | 发现: 2026-08-02 | 状态: 待真实 run 验收（本地诊断投影完成：2026-08-02）

## 当前复核

`harden-page-authority-provider-boundary` 已让 provider-free `image2 plan` 返回当前
`provider_request_inspection` 的 run-relative path、digest 与 plan hash。对应可重建
sidecar 保存每页实际提交的 prompt JSON 与安全 transport 事实，并绑定当前 plan/request
digest；它不含 credential、Authorization header、环境值、image data URL 或 provider
response。正常 CLI 输出和失败 envelope 仍不打印 prompt。

本地 fixture 已覆盖 Pure/Framed 的 replay、drift replacement 和 secret-safe CLI 行为；
指定的 v7 已到达 provider-free Style Master inspect，但尚未具备 human selection，因而未创建
真实 run 的 image2 plan/inspection sidecar。仍需在第 9 步中由人确认该诊断投影足以定位实际
provider prompt 问题。

## 症状

生产过程中，每页实际发给 Image2 provider 的 prompt（`JSON.stringify(request)`）**不外露**——plan/投影只存 `raw_contract_sha256` digest，模型到底收到什么文字指令不可见。出问题（如 BUG-041：图里没字）时无法直接看 prompt 定位。

## 原始根因

`targetPageAuthoritySubmitFactory`（`PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs:1734-1736`）在内存里拼 `prompt: JSON.stringify(request)` 直接发出，request 不落盘、不展示。`image2 plan` 投影只带 `raw_contract_sha256`（哈希），`provider_requests_by_slide` 只在 plan 构建函数的返回值里、不进持久化投影。诊断链断裂：结果不对时看不到输入。

## 复现

```bash
node PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs image2 plan <run-dir> --json
# 投影里只有 raw_contract_sha256，没有每页 provider request/prompt 文本
# generate 时 prompt 仅内存，日志不输出
```

## 修复关联

在 provider-free 的 plan 投影（或 `_generated/page_authority_image2/`）持久化每页 provider request/prompt 的可重建投影，供诊断；debug 输出可显式 dump 单页 prompt。修复后 BUG-041 这类"prompt 语义错误"能直接可见。
