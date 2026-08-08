# BUG-055: page raw generate 报 invalid_json，但 provider 实际返回合法 JSON —— 无响应可见性导致盲烧提交

> 严重级别: P1 | 发现: 2026-08-05 | 状态: 已修复（`add-bounded-provider-response-shape-diagnostics`, 2026-08-08）

## 症状

deck_dark_factory pure 生产 Expansion 批量授权后，连续 11 次 `image2 generate` 全部 `known_failure`
（`provider_failure.classification: invalid_json`），烧光 10 次提交 + 1 次超时 unknown，零产出。Pilot
3 张在更早时间成功。

## 诊断证据

直接 POST provider（`IMAGE2_BASE_URL` = duckcoding.ai `/v1`）`/images/generations`：

| 测试 | body | 结果 |
|---|---|---|
| 简化 prompt + 无图 | `{model,prompt,n,size}` | 200，合法 JSON `{"data":[{"b64_json":...}]}` |
| 图引用 + 短 prompt | 含 style master data URL | 200，content-length 2.87MB，完整读取合法 JSON |
| **framework 精确 prompt + 图引用** | SysGo 完整 request JSON + 图 | 200，63s，2439160 字节，**合法 JSON**，b64_json 解码 PNG `89504e47...` |

即：provider 服务在线、返回合法 JSON 和真实 PNG，包括 framework 的精确请求。但 framework 侧 11 次
生成全判 invalid_json。

framework 侧核查：
- `readImage2ProviderResponseJson`（ppt_flow.mjs:1880）逻辑正确：600s deadline、timer 清理、
  `response.text()` 后 `JSON.parse`，失败才 `invalid_json`。
- `imageBytesDataUrl` 产生的 data URL 与诊断一致。
- 请求格式一致，deadline 600s 覆盖 provider 60-230s 响应。

## 根因（已确证）

**provider（duckcoding.ai）对 Node.js 系 TLS 客户端返回 "Service unavailable" HTML 页，但对 Python
urllib 返回合法 JSON 图像。**

- 同一请求（SysGo 完整 prompt + style master 图引用）：
  - Python `urllib` POST `/images/generations` → 200，**合法 JSON**（`{"data":[{"b64_json":...}]}`，
    49-65s，2.4-2.9MB，b64 解码 PNG）
  - Node `fetch`（undici）POST → 200，**3994 字节 HTML**，`<title>Service unavailable</title>`
  - Node `https` 模块 POST → 200，同样的 "Service unavailable" HTML
  - undici 加 User-Agent / `accept-encoding: identity` / `accept: application/json` 均无效
- 请求内容完全一致，差异只在 HTTP 客户端（TLS 指纹 / undici 与 urllib 的 HTTP 行为）。
- Pilot 3 张当初用 Node fetch 成功，说明该拦截是后发的（限流/反爬策略升级），非持久配置。

framework 的 `readImage2ProviderResponseJson` 对 HTML 响应 `JSON.parse` 失败 → 分类 `invalid_json`，
无任何响应特征暴露，operator 无法看出是 provider 返回了 HTML 页。

## 修复方向

- **framework 诊断增强**（推荐，先做）：`invalid_json`（以及 http_error）时，在 known-failure facts 中暴露
  **有界响应特征**（content-type、content-length、body 的 SHA-256 或前 N 字节），secret-safe，不泄露
  provider body 原文；让后续 Agent/human 能判断根因而非盲试。
- **不稳定 provider 的提交策略**：评估是否给瞬时 `invalid_json` 增加**有界重试**（区别于确定性 HTTP/媒体
  失败），避免一次性烧光 grant；需确认与 `simple-reliable-control` 的「无自动重试」边界。
- 运行期缓解：本 deck 当前 provider 已恢复（诊断成功），可换新 batch 重试剩余 slide。

## 复现

```bash
# 直接打 provider，观察返回（200 + 合法 JSON）：
# 用根 .env 的 IMAGE2_BASE_URL/API_KEY，POST {base}/images/generations
# 对比 framework generate 的 invalid_json 分类
```

## 关联

- BUG-054（provider 尺寸错配）修复后首次暴露：provider 交互不稳定时的诊断盲区。
- 触发于 deck_dark_factory Expansion（10 次提交全烧）。
- 当前 provider（duckcoding.ai）诊断显示已可正常返回图像。

## 修复证据 — 2026-08-08

`add-bounded-provider-response-shape-diagnostics` 在同一个共享
`readImage2ProviderResponseJson` 边界上修复了本卡的可见性缺口：只要 HTTP 成功响应已完整读取、
但 JSON 解析失败，既有 `invalid_json` fact 现在附带一个闭集
`response_shape: empty | html_like | other_non_json`。其中 `html_like` 仅识别前导空白后明确的
`<!doctype html` 或 `<html` 文档标记，大小写不敏感且带 tag/doctype boundary。

- Page Image 的既有 `provider_failure` CLI projection 仅在 `invalid_json` 时白名单透传这个有限字段；
  空字段、未知字段、其它 classification 与旧 record 保持原行为。
- Style Master 共用该分类来走既有 terminal known-failure 路径，但不把该 fact 写入 attempt state，
  也不增加 CLI field、重试、授权或 recovery route。
- HTTP non-OK 仍不读取 body；body 读取中断仍是 uncertainty/reconciliation；valid JSON 和 invalid media
  都不携带 `response_shape`。provider body、headers、length、digest、task ID、prompt、credential 与
  provider identity 均不输出。

验证：`tests/shared/image2/test_style_master_raw_binding.mjs` 覆盖 Page Image 与 Style Master 的
empty、HTML-like、other non-JSON 和原有 HTTP/unreadable 边界；raw-owner 测试证明任意额外 provider
fields 被过滤；Style Master lifecycle 测试证明不新增持久状态或 replay；process CLI suite 覆盖三种 shape
且不泄露 sentinel。74 项 focused Image2 tests、12 项 process diagnostics、`npm test` 与 all-spec strict
validation（27/27）均通过。

**Out of scope:** 修复或绕过 duckcoding.ai 针对 Node/TLS 客户端的返回行为，以及为 `invalid_json`
增加自动 retry。它们是独立的 provider availability / cost-control 决策，不能作为本安全诊断修复的隐式副作用。
