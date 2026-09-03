# BUG-008: image_api_client 的 submit 解析不认 `data:[{task_id}]` 数组格式，出图全线卡死

> 严重级别: P1（阻断所有出图：style master + Stage 2 全部页图） | 发现: 2026-07-11 | 状态: 已修复 (clarify-image-api-credentials-contract)

## 症状

`ppt_flow style-master`（及任何 Stage 2 出图）提交任务后立即失败：

```
Submit → https://api.apib.ai/v1
Mirror failed (…): No task_id in submit response: {"code":200,"data":[{"status":"submitted","task_id":"task_01KX7MV8Y6QP3P80DY3KVST06E"}]}
… (三个 mirror 端点同样) …
✗ No task_id in submit response: {"code":200,"data":[{"status":"submitted","task_id":"…"}]}
{"ok":false,"code":"FAILED",…,"where":"ppt_flow.style-master"}
```

注意：API **返回 `code:200`、任务已 `submitted`、`task_id` 就在 `data[0].task_id` 里**——提交其实**成功**、服务端已建任务；客户端只是读不到 id 去轮询，于是把成功当失败、逐个 mirror 放弃。三个端点全挂（同一解析问题，与端点无关）。**后果：style master 与全部 22 页都生不出来，视觉迭代完全阻断。**

## 根因

`PPTMAKER_FRAMEWORK/scripts/image_api_client.mjs:113`：

```js
const taskId = data.task_id || data.id || data.data?.task_id || data.data?.id;
```

本 API 的 submit 响应形如 `{ code:200, data:[ { status:"submitted", task_id:"…" } ] }`——`data.data` 是**数组**。`data.data?.task_id` 在数组上取值为 `undefined`，四个候选路径全落空 → 抛 "No task_id"。正确路径应是 `data.data?.[0]?.task_id`（数组首元素）。

**契约不一致（同文件内自相矛盾）**：同一文件的 **result 解析**（`:181`、`:192`）用的是 `data.data?.[0]?.b64_json` / `data.data?.[0]?.url`——**已正确处理 `data.data[0]` 数组形态**。唯独 **submit 解析（:113）漏了数组形态**，只认 `data.data.task_id`（对象）。客户端自己在 result 端知道这个 API 用 `data:[…]`，submit 端却没对齐。

## 复现

```
cd deck_ai_sdlc_bpm_keynote && node …/ppt_flow.mjs style-master …/3_versions/v1 --force --resolution 1k
# → Mirror failed … No task_id in submit response: {"code":200,"data":[{…,"task_id":"…"}]}
```
前置：`.env` 需有 `IMAGE2_API_KEY` + base url（`IMAGE2_BASE_URL` / `IMAGE2_BASE_URL`）——本次这些都已就绪，连接与提交均成功，纯粹是响应解析问题。

## 契约探针 · 横切

类："`image_api_client` 对 API 响应包的 `data:[…]` 数组形态处理不一致"。

| 阶段 | 位置 | 是否处理 `data.data[0]` 数组 |
|------|------|------------------------------|
| submit | `:113` | ❌ 只认 `data.data.task_id`（对象），**缺 `data.data[0].task_id`** |
| poll | `:136-138` | 未走到，需复查是否假设单一形态 |
| result | `:181, :192` | ✅ 已用 `data.data?.[0]?.…` |

**修复方向**：submit 解析补 `|| data.data?.[0]?.task_id || data.data?.[0]?.id`，与 result 端对齐；顺带核对 poll 端对 `{code,data:[…]}` 的处理。补一条针对该响应包形态的解析单测。

## 修复关联

已在 change `clarify-image-api-credentials-contract` 中用 `unwrapDataRecord` 对齐 submit/poll/result 的 `data` 数组包络，并补单测。
