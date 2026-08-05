# BUG-055: page raw generate 报 invalid_json，但 provider 实际返回合法 JSON —— 无响应可见性导致盲烧提交

> 严重级别: P1 | 发现: 2026-08-05 | 状态: 活跃

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

## 根因（待确认）

二选一或并存：

1. **provider 间歇性返回损坏/截断响应**：失败期间 provider 偶发返回非 JSON（网络抖动/中继不稳定），现已
   恢复（诊断 3/3 成功）。若如此，框架把这类瞬时错误当**确定性 known_failure** 且**不重试**，导致整批
   付费提交被烧掉 —— 对不稳定 provider 是代价极高的处理策略。
2. **framework 诊断盲区**：`invalid_json` 分类只暴露 `{classification: "invalid_json"}`，不含响应
   content-type、body 大小/hash 等有界线索。operator/agent 无法区分「provider 挂了」「返回 HTML 错误页」
   「响应被截断」「framework 解析问题」，只能盲试或盲换 provider。

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
