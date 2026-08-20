# Image2 Vendor 实验与路由选择

> 历史实验记录（2026-08-19）。本文记录当日的 deck-local scratch 观察，不单独代表
> 当前 Harness 行为。当前 provider profile、transport 合同和生产状态以
> `2_backbone/visual-style/image2-provider-profile.yaml`、Harness owner 输出和当前
> `_state/` 为准。

**实验日期:** 2026-08-19

**遇到什么:**

这个 deck 的 Pure Page Image 需要同时携带完整中文文案、版式规则、视觉约束、禁区和
Style Master。Harness 为 `AiLeap` 编译出的真实 prompt 是 20,002 Unicode code
points；把所有约束永久压缩到约 4,000 字符会损失复杂页面所需的控制力，因此需要找出
真正能承载长 prompt 和参考图的 Image2 Vendor。

实验只记录非密钥事实。凭证始终在 `.env`，不得复制到本目录。

## 怎么试的

统一测试条件：

- 模型：`gpt-image-2`
- Style Master：`2_backbone/visual-style/style_master.png`
- 短 prompt：`AiLeap` 预览 prompt，1,314 Unicode code points
- 长 prompt：Harness 当前 `AiLeap` compiled provider input，20,002 Unicode
  code points
- 目标画幅：16:9；根据 Vendor 接口分别测试 `2000x1125` 与 `2048x1152`
- 只把成功预览写入 `3_versions/v1/_scratch/pilot-preview-micu/`，不冒充
  `_generated/` lifecycle evidence

## 实验结果

| Vendor | Endpoint / 请求形态 | 结果 | 结论 |
|---|---|---|---|
| Duckcoding | `https://www.duckcoding.ai/v1/images/generations`，JSON | 返回 HTML-like 内容；Harness 记录 `invalid_json` | 当前不可用 |
| Duckcoding | `https://api.duckcoding.ai/v1/models` | HTTP 200，但 Content-Type 仍是 HTML | 换 `api` host 不能解决 |
| Micu | `https://www.micuapi.ai/v1/models` | HTTP 200 JSON，公开列出 `gpt-image-2` | 鉴权和模型发现正常 |
| Micu | `/v1/images/generations`，短 prompt + `image` data URL，`2000x1125` | 成功，返回 2048×1136 PNG | 适合短 prompt 视觉 Pilot |
| Micu | 同 endpoint，20,002 字符长 prompt | HTTP 400：prompt 约 20,002 chars，最大约 4,000 | 不适合当前完整 compiled prompt |
| Packy | `https://www.packyapi.ai/v1/models` | HTTP 200 JSON，但列表未公开 `gpt-image-2` | 模型列表不能作为唯一判断 |
| Packy | `/v1/images/generations`，短 prompt | HTTP 403 `region_restricted` | 当前地区不能走 generations |
| Packy | `/v1/images/edits`，multipart Style Master，`2000x1125` | HTTP 400：宽高必须都是 16 的倍数 | 尺寸契约与 Harness 当前值不兼容 |
| Packy | `/v1/images/edits`，短 prompt，`2048x1152` | 成功，返回 2048×1152 PNG | edits 路由可用 |
| Packy | `/v1/images/edits`，20,002 字符及本 deck 最大 21,241 字符 prompt，`2048x1152` | 两次均成功，返回 2048×1152 PNG | 当前长 prompt + Style Master 最强候选 |
| APIMART / `api.apib.ai` | `/v1/models` | HTTP 200 JSON，列出 `gpt-image-2` | 模型发现正常 |
| APIMART / `api.apib.ai` | `/v1/images/generations`，20,002 字符长 prompt | HTTP 200，返回异步 task；当前直接脚本未取得最终内联 PNG | 已证明接受长 prompt，尚未证明端到端取图 |

## 结论

1. **视觉预览首选 Packy edits。** 它已经端到端证明能处理 Style Master、
   本 deck 最大 21,241 字符 compiled prompt 和 2048×1152 输出。
2. **Micu 适合短 prompt，不适合当前 Harness 完整 prompt。** 1,314–1,603
   字符的三页 Pilot 均成功；20,002 字符被明确拒绝。
3. **Duckcoding 当前停止重试。** `www` 与 `api` host 都没有返回预期 JSON API
   形态。
4. **APIMART 保留为候选，不标记 proven。** 它接受长 prompt，但还需要把异步 task
   result 的 URL/媒体提取闭环跑通。
5. **在本次实验时，Packy 不是 Harness 标准生产的即插即用替换。** 当时 Harness 硬编码 JSON
   `POST /images/generations`、请求尺寸 `2000x1125`；Packy 在本环境成功的是 multipart
   `POST /images/edits` 与 `2048x1152`。在 Harness 增加 operation/transport capability
   前，只能把 Packy 成功视为 deck-local preview capability，不能伪造 raw receipt。

## 配置现状

- Repo 根 `.env` 与当前 deck 根 `.env` 已按人类最终决定全部对齐到 Packy：
  `https://www.packyapi.ai/v1`，profile ID 为 `packy-gpt-image-2`。
- `2_backbone/visual-style/image2-provider-profile.yaml` 同步声明
  `packy-v1-edits / packy-image2-edits / gpt-image-2`；prompt budget 保守记录为当前
  14 页已知最大 compiled prompt 21,241 Unicode code points。
- deck `.env` 仍然具有 startup precedence，但它与 repo 根 `.env` 内容一致，不再形成
  Vendor 覆盖或歧义。
- 配置对齐不等于当日 Harness transport 已兼容：当时标准 generations 路径仍未打通，
  Packy 已证明可用的是 edits 路径。这个结论只描述本次实验时点；不要把 preflight 的
  变量存在性检查当成出图证明。
- 所有 API key 只存在 `.env`，本 lesson 不记录、不回显。

## 可检查的预览

- 当前三页 Packy Pilot：`3_versions/v1/_scratch/pilot-packy/`
- Pilot 生成清单：`3_versions/v1/_scratch/pilot-packy/manifest.json`
- Micu 短 prompt：`3_versions/v1/_scratch/pilot-preview-micu/01_AiLeap.png`
- Packy edits 短 prompt：
  `3_versions/v1/_scratch/pilot-preview-micu/01_AiLeap_packy_edit.png`
- Packy edits 长 prompt：
  `3_versions/v1/_scratch/pilot-preview-micu/01_AiLeap_packy_edit_long.png`
- Packy edits 本 deck 最大 prompt：
  `3_versions/v1/_scratch/pilot-preview-micu/03_WorkArc_packy_edit_long.png`
- 本轮短 prompt 集：
  `3_versions/v1/_scratch/pilot-preview-micu/pilot-prompts.json`

## 下次先看哪

1. 先读本文件，不要从 Duckcoding 或 host 猜测重新开始。
2. 只是要快速看视觉：在当前 Harness/profile 允许该 route 时，才用 Packy
   `/images/edits` + `2048x1152`，允许完整长 prompt。
3. 要进入 Harness 正式 raw lifecycle：先检查当前 owner 是否已经支持
   `images/edits`、multipart image input 和 16 倍数尺寸；未支持则保持 hard boundary，
   不把 `_scratch` 图复制进 `_generated/`。
4. 如果继续验证 APIMART，优先补齐异步 `/tasks/<task_id>` 最终 result URL/媒体提取，
   不重复只验证 submit HTTP 200。
5. prompt budget 不可信时，先测真实 Vendor limit，再让 profile 与 compiler admission
   boundary 对齐。相关生产问题已登记在 `_backlog/bugs/BUG-089-*` 与 `BUG-090-*`。
