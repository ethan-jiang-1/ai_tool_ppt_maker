# BUG-050: Style Master 与 page raw 的 provider fetch 无显式超时，慢 provider 撞 undici 300s

> 严重级别: P2 | 发现: 2026-08-04 | 状态: 活跃

## 症状

`styleMasterSubmitFactory`（`ppt_flow.mjs:2019`）与 `targetPageAuthoritySubmitFactory`
（`ppt_flow.mjs:1880`）对 provider 的 `fetchImpl(...)` 调用**没有显式 AbortController**。Node 22
全局 `fetch`（undici）默认 `headersTimeout` / `bodyTimeout` 均为 **300000ms**。当 provider 生成
超过约 5 分钟仍未开始返回时，undici 会 abort 连接并抛网络错误。

该错误不携带 `style_master_known_failure` / `progressive_raw_known_failure` 标记，于是被分类为
`attempt_unknown`（Style Master）/ `attempt_unknown`（page raw 的 unresolved），计划永久阻塞，
只能 abandon（见 [[BUG-049]]）。

本次生产实测：DUCK 对同一 Style Master prompt 有时 67s 成功、有时 >300s，慢时段即触发此路径。

## 根因

`ppt_flow.mjs` 两处 transport 的 fetch 均无 `signal: AbortController`：

```js
// styleMasterSubmitFactory（2019-2058）
let response;
try {
  response = await fetchImpl(`${transport.base_url}/images/generations`, { ... });  // 无 signal
} catch {
  const error = new Error("Style Master provider submission did not return a response");
  error.code = "style_master_provider_submit_failed";  // 无 known_failure 标记
  throw error;
}
```

超时行为完全由 undici 默认值决定，不可配置、不可预测，且对用户透明（错误信息被框架吞掉）。

## 复现

在生成耗时 >300s 的 provider 上运行 `style-master generate`（或 page raw generate），
undici abort → `attempt_unknown`。对照：`doctor --smoke` 用 30s AbortController，但那是诊断路径。

## 修复方向

- 给两处 transport 的 fetch 加显式 `AbortController`，超时**足够长**（建议 600s+）且做成可配置
  （环境变量或 profile 字段），超时后按可控的 failure 分类处理，而不是留下 unknown/submitted。
- 关联 [[BUG-046]]（主因是尺寸/prompt 错配，超时是次级诱因）、[[BUG-049]]（unknown 无 reconcile）。
