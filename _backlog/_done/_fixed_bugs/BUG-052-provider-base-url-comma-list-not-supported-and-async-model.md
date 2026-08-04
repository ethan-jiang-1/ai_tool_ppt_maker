# BUG-052: provider base_url 逗号分隔多 URL 不被支持；async task 模型不被 Style Master 支持

> 严重级别: P2 | 发现: 2026-08-04 | 状态: 活跃

## 症状

`.env` 中注释掉的 `IMAGE2_BASE_URLS_APIMART` 是**逗号分隔的多 URL 列表**：

```
IMAGE2_BASE_URLS_APIMART=https://api.apib.ai/v1,https://api.aiuxu.com/v1,https://api.aishuch.com/v1
```

把这类值放进 `IMAGE2_BASE_URL` 后跑 generate，provider 收到一个把整个列表当 path 的请求：

```
{"error":{"message":"Invalid URL (POST /v1,https://api.aiuxu.com/v1,https://api.aishuch.com/v1/images/generations)..."}}
```

同时，即使把列表拆成单 URL，APIMART 返回的是 **async task 模型**：

```json
{"code":200,"data":[{"status":"submitted","task_id":"task_01KZ..."}]}
```

而 `styleMasterSubmitFactory`（`ppt_flow.mjs:2019`）只处理 inline `b64_json` / `bytes_base64`，
不轮询 task，导致 `imageBytesFromPageAuthorityProvider` 找不到图片字节 → `known_failure`。
（page raw 的 `targetPageAuthoritySubmitFactory` 支持 task 轮询 `resolvePageAuthorityProviderTask`，
但 style-master 没有。）

## 根因

1. `shared/image2/credentials.mjs` / `ppt_flow.mjs` 只按**单个 URL** 处理 base_url；逗号分隔的
   failover 列表没有解析/fallback 逻辑。
2. `styleMasterSubmitFactory` 只支持 sync inline 图片响应，缺失 async task 提交 + 轮询分支（与
   page raw 不一致）。

## 复现

```bash
export IMAGE2_BASE_URL='https://api.apib.ai/v1,https://api.aiuxu.com/v1,https://api.aishuch.com/v1'
export IMAGE2_API_KEY=...
node --env-file=.env PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs style-master generate <run-dir> --plan-hash <sha>
# → Invalid URL / images/generations 404；或 async task 响应被判 known_failure
```

## 影响面 / 修复方向

- 若支持 failover URL 列表：在 transport 层解析逗号列表并逐个尝试。
- 若支持 async 模型 provider：给 style-master transport 增加 task 提交 + 轮询（复用
  `resolvePageAuthorityProviderTask`），并校验轮询结果的尺寸（见 [[BUG-046]]）。
- 相关 [[BUG-046]]（尺寸校验）、[[BUG-049]]（unknown 处理）。
