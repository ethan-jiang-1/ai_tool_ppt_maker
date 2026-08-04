# BUG-046: Style Master candidate dimension/prompt/provider 不兼容导致 `attempt_unknown` 且无重试路径

> 严重级别: P1 | 发现: 2026-08-04 | 状态: 活跃（真实根因复核：2026-08-04）

## 症状

真实 deck `deck_dark_factory`（pure workflow, 13 slides）生产 Style Master 时，连续 6 个计划
（gen1–gen6）都无法生成候选：候选被提交后要么 `known_failure`（micuapi 400 prompt 过长），要么
停在 `status: "submitted"` 并被分类为 `style_master_attempt_unknown`（DUCK），计划被 permanently
阻塞，唯一恢复路径是 `style-master abandon`（消耗本次授权提交）+ 重新 plan/authorize/generate。

```
GATE_BLOCKED: A submitted Style Master candidate has an unknown provider outcome.
diagnostic.reason.kind = style_master_attempt_unknown
next: review → abandon exact plan（消耗 1 次授权提交）
```

## 真实根因（2026-08-04 复核）

经 `NODE_DEBUG=undici` + fetch-trace wrapper + 直接调用 `generateStyleMasterCandidates` 的
mock-submit 探针定位，根因**不是超时**，而是两个 framework 硬性校验与当前 provider 能力的错配：

1. **`validateGeneratedCandidatePng`（`style_master_plan.mjs:905-923`）严格要求候选是
   2000x1125 的 PNG（`decoded.width !== 2000 || decoded.height !== 1125` → fail
   `style_master_attempt_unknown`）。无 resize、无容差。**
2. Style Master provider prompt 是 `style_intent` + 全部 slide 的 `style_context`
   （每个投影含 schema keys + 多个 64-char sha256 digest，结构性 ~660 字符/slide），
   13 slides 编译后 10931 字符，远超部分 provider 的 prompt 上限。

### 当前三家 provider 实测

| Provider | prompt 上限 | 响应模型 | 返回尺寸 | Style Master(2000x1125) | Page raw(2048x1136) |
|---|---|---|---|---|---|
| micuapi（原配 .env.saved） | ~4000 字符 | sync inline b64 | 2000x1125 请求 → 2048x1136 | ✗ prompt 过长 + 尺寸 2048≠2000 | ✓ 尺寸正好 2048x1136 |
| DUCK（duckcoding.ai） | 接受 10931 字符 | sync inline b64 | **忽略 size → 1536x1024** | ✗ 尺寸错 | ✗ 尺寸错 |
| APIMART / AIUXU / AISHUCH | 接受长 prompt | **async task_id（需轮询）** | 未取到（task 模型） | ✗ style-master submit 不轮询 task | 可能？task 结果尺寸未验证 |

即：**当前三家 provider 都无法产出 sync inline 2000x1125 的 Style Master 候选**。micuapi 尺寸对
但 prompt 超限且返回 2048x1136；DUCK prompt 能过但尺寸是 1536x1024；APIMART 是 async 模型而
`styleMasterSubmitFactory`（`ppt_flow.mjs:2019`）只处理 inline b64，不轮询 task。

## 复现

```bash
node --env-file=.env PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs style-master plan deck_X/3_versions/v1 --candidate-count 2
node --env-file=.env PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs style-master authorize deck_X/3_versions/v1 --plan-hash <sha>
node --env-file=.env PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs style-master generate deck_X/3_versions/v1 --plan-hash <sha>
# DUCK → attempt_unknown（返回 1536x1024，validateGeneratedCandidatePng 拒绝）
# micuapi → known_failure（400 prompt too long 10921 chars max ~4000）
```

对照：直接 fetch DUCK（相同 URL/body）→ 200 + b64，但 PNG 尺寸 1536x1024（解析 PNG header 16/20
字节确认）；直接 fetch micuapi（size 2000x1125）→ 200 + b64，尺寸 2048x1136。

## 影响面 / 横切排查

1. **`validateGeneratedCandidatePng`（style_master_plan.mjs:913）** —— 2000x1125 硬校验是主因之一。
2. **Style Master compiled prompt 结构（style_master_plan.mjs `compileStyleMasterProviderPrompt` /
   `styleContextFromCandidate`）** —— 全量 slide projection JSON（含 sha256 digest）撑大 prompt，
   超 provider 上限。
3. **`styleMasterSubmitFactory`（ppt_flow.mjs:2019）** —— 只处理 sync inline b64，不支持 async
   task 模型（page raw 的 `targetPageAuthoritySubmitFactory` 支持，见 `resolvePageAuthorityProviderTask`）。
4. **undici 300s 默认超时** —— 仍是次要隐患：当 provider 生成 >300s（如慢时段）会 abort →
   `attempt_unknown`。这在页面 raw 长生成时同样可能触发。属于本 bug 的诱因之一，但不是当前主因。
5. **`doctor --smoke` 用 1024x1024 且只查 image_ref/task_id** —— 不能发现"返回尺寸≠请求尺寸"或
   "Style Master prompt 超限"这两类生产问题。

## 修复关联

待定 — 需要 OpenSpec change。候选方向（至少选一）：

- **A（尺寸）**：让 Style Master 接受 provider 实际尺寸并做 compatibility 投影/resize 到 2000x1125
  （类似 page raw 已接受的 2048x1136 边界），或放宽到可配置尺寸。
- **B（prompt）**：压缩 Style Master context —— 只带 slide_id + 精简摘要，不带全量 projection digest
  JSON；或允许 intent 只描述全局风格。
- **C（async）**：给 `styleMasterSubmitFactory` 增加 async task 提交 + 轮询（复用
  `resolvePageAuthorityProviderTask`）。
- **D（超时）**：给 Style Master 与 page raw 的 fetch 加显式 AbortController，超时足够长且可配置。

建议先做 A + B（尺寸 + prompt），让至少一家 sync provider（micuapi 或 DUCK）能产出可用候选。

> 相关已修复 bug：**BUG-037**（`_done/_fixed_bugs/`，image2-api-size-not-honored）——页面 raw 路径已
> 把"请求尺寸 2000x1125 ≠ provider 实际返回 2048x1136"的问题按 native response contract 处理过并
> 经 v7 验收。**Style Master 路径没有做同样的处理**（仍硬校验 2000x1125），是本 bug 的缺口。

## 关联 bug（本次生产遇到的完整问题集）

- [[BUG-047]] — generate 不自动加载 `.env`，需 `node --env-file`（doctor 却自动加载）。
- [[BUG-048]] — Style Master 编译 prompt 结构性过长（全 slide projection digest JSON）超 provider 上限。
- [[BUG-049]] — `attempt_unknown` 无 reconcile，只能 abandon 烧提交（本次烧 6 次提交）。
- [[BUG-050]] — provider fetch 无显式超时，慢 provider 撞 undici 300s。
- [[BUG-051]] — `doctor --smoke` 假阳性，测不出尺寸不符与 prompt 超限。
- [[BUG-052]] — provider base_url 逗号列表不被支持；async task 模型不被 Style Master transport 支持。
