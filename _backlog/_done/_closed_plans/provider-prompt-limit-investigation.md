# Investigation: Image API 为什么会出现约 4K 与约 16K 两种 prompt 限制

> 类型: 调查 / 设计输入 | 日期: 2026-08-15 | 范围: 第一方公开资料 + Harness 源码/规格/最近 change

## 结论

这不是一个已经证实的“同一 Image API 随机改变上限”问题。现有证据支持的更准确判断是：

1. **已证实：`micuapi.ai` 是聚合、协议转换和路由网关，不是一个单一 image backend。** 同一个公开模型别名可以被重定向到不同具体渠道；模型名、token group、节点和时间点都可能改变实际执行路径。
2. **高概率：观察到的约 4K / 16K 分裂来自不同具体路由或不同校验层。** 可能是 micu 网关校验、上游 adapter 校验或最终模型校验；它不是目前可归因给通用 `POST /v1/images/generations` 的统一性质。
3. **已证实：当前 Harness 无法对这两个限制做事后归因。** 它固定提交可重定向别名 `gpt-image-2`，inspection 只记录 `model` 和 `size`，不记录实际 base URL、token group、具体 backend 或响应 request ID；HTTP 非 2xx 时还会在读取响应正文前丢弃 body。
4. **未知：4K 和 16K 分别由哪一层发出、单位是什么。** 现有记录不足以区分 Unicode code points、JavaScript UTF-16 code units、UTF-8 bytes 或 tokens，也不足以证明 generation 与 edits/reference-image 路径是否采用不同限制。
5. **设计结论：不能把 4000 或 16000 硬编码成全局 Image2 上限。** 应把 prompt budget 建模为 provider capability profile 的一部分，并绑定具体 route/model/operation/group 与明确计数单位；现有 32,768 UTF-8 bytes 继续只作为本地 compiler safety bound，不能冒充远端能力。

因此，原 plan 对“canonical prompt 混入内部元数据、应缩减 provider-facing bytes”的根因判断仍然成立；但把 `4000 characters` 写成全局 provider invariant 不成立。正确目标应是：**同一套 compact prompt 架构支持多个显式 capability profile，包括观察到的约 4K 和约 16K 档位，而不是把任何一个数字写死在通用 Image2 contract 中。**

## 证据分级

- **已证实**：由当前仓库源码、规格或可访问的第一方页面/响应直接证明。
- **高概率**：多个第一方事实共同支持，但缺少能锁定具体请求路径的原始诊断。
- **未知**：现有材料不能可靠判断，不用经验或搜索摘要补结论。

## 第一方外部证据

### 1. micuapi 明确是聚合与协议转换网关

**已证实。** micuapi 首页把自身描述为统一的 AI 模型聚合与分发网关，并说明会把不同模型跨格式转换为 OpenAI、Claude、Gemini 兼容接口。HTTP 表面兼容不意味着后端模型、adapter 或校验器相同。

来源: <https://www.micuapi.ai/>

### 2. `gpt-image-2` 是可动态重定向的别名

**已证实。** micuapi 的公开 status response 在 2026-08-14 公告中说明：

- Image 分组保留 `gpt-image-2-openai` 与 `gpt-image-2-key`；
- 两者能力描述不同，一个支持全部参数自定义，一个仅支持 Low quality；
- 请求 `gpt-image-2` 时，默认重定向到 `gpt-image-2-key`；
- 公告称两个具体模型“支持 124K”，但没有定义单位，也没有说明这是 prompt 字符限制。

来源: <https://www.micuapi.ai/api/status>

这直接证明 nominal model string 不能唯一确定执行后端。它也说明 route 可以由服务端配置随时间切换，不需要客户端代码或请求体发生变化。

### 3. token group 和网络节点都是独立路由维度

**已证实。** micuapi 文档把 GPT Image 放在专用 `vip_2_image` group，并列出不同 image model ID。公开 status 同时公布主站与 SLB 两个网络 route。文档还要求部分 4K 图像输出走 SLB 节点，以避开默认节点的 Cloudflare 524。

来源:

- <https://docs.micuapi.ai/>
- <https://docs.micuapi.ai/tools#micu-image-mcp>
- <https://www.micuapi.ai/api/status>

这里的“4K”明确指**图像分辨率**，不是 4,000 字符。它不能证明 prompt 上限，但能证明 endpoint/node 会独立影响请求是否成功。

### 4. micuapi 自己可以生成错误 envelope

**已证实。** 本次调查分别对主站和 SLB 的 `/v1/images/generations` 做了无凭证、无费用的小请求。两者都返回 HTTP 401、`type: new_api_error` 和 `x-oneapi-request-id`。没有使用或读取任何 API key，也没有触发图片生成。

这证明至少部分错误正文由 micu gateway 自己生成，并且 request ID 可用于服务端归因。但它**不能**证明 `Prompt too long (...)` 是网关原创还是上游透传；当时的完整 response headers、error envelope 和 request ID 没有被保留。

### 5. OpenAI 官方数字在本环境无法核实

下列官方页面均从本环境直接返回 HTTP 403：

- <https://developers.openai.com/api/reference/resources/images/methods/generate>
- <https://developers.openai.com/api/reference/resources/images/methods/edit>
- <https://developers.openai.com/api/docs/models/gpt-image-1>
- <https://developers.openai.com/api/docs/models/dall-e-3>
- <https://platform.openai.com/docs/api-reference/images/create>
- <https://platform.openai.com/docs/guides/image-generation>

按本调查的来源规则，不使用搜索摘要或记忆替代官方页面。因此，本文不声称 OpenAI 官方当前规定了相关 4K 或 16K 限制，也不把 micu 的 `gpt-image-2` 当作已证实的一对一 OpenAI 官方模型。

## 仓库内部证据

### 1. Harness 固定使用一个可重定向模型别名

**已证实。** Page Image target generation profile 把模型固定为 `gpt-image-2`，不是具体 `gpt-image-2-key` 或 `gpt-image-2-openai`：

- `ppt_maker_harness/scripts/shared/image2/page_image_target_runtime.mjs:682-687`

Style Master 的默认 profile 也使用相同别名。当前 Harness 没有 provider capability 配置来表达 prompt limit、计数单位或具体 micu backend。

### 2. 一个 base URL 不代表一个稳定 capability

**已证实。** credential resolver 只选择一个 `IMAGE2_BASE_URL` 和 API key：

- `ppt_maker_harness/scripts/shared/image2/credentials.mjs:38-52`

但 micu 的第一方资料证明，同一 base URL 内仍可按 token group、model alias 和服务端路由选择不同 backend。因此只用 base URL 作为 capability key 仍然不够；API key 的 secret value 不能进入 lineage，但其**非秘密 group/route identity**需要有单独的 owner-confirmed 表达。

### 3. target 请求是 generation endpoint 上的兼容扩展形态

**已证实。** target submitter 总是 POST 到 `/images/generations`，同时发送 `image`、`images` 和 `image_urls` reference fields：

- `ppt_maker_harness/scripts/ppt_flow.mjs:2303-2329`

Style Master 也 POST 到 `/images/generations`，但只发送 text prompt，不带 reference image：

- `ppt_maker_harness/scripts/ppt_flow.mjs:2413-2428`

micu 文档把文生图、单图编辑和多图参考列为不同操作。由此可见，**高概率**存在按请求 shape 或 operation 分派到不同 adapter/backend 的空间。现有证据仍不足以证明 4K/16K 正好对应 generation 与 edit；只能确认 operation 必须进入 capability identity，不能只按 endpoint path 判断。

### 4. 当前 inspection 丢失关键 route 信息

**已证实。** provider request inspection 的 `transport` 只保留 `{ model, size }`：

- `ppt_maker_harness/scripts/shared/image2/page_image_target_runtime.mjs:240-247`
- `ppt_maker_harness/scripts/shared/image2/page_image_target_runtime.mjs:282-317`

它不保留 base URL、选中 group、concrete routed model、operation classification 或 provider request ID。于是两个字节完全相同的 plan，可能因 secret 对应的 group 或服务端 alias mapping 不同而遇到不同远端上限，而本地 inspection 看起来仍然相同。

### 5. 当前 HTTP 失败会丢弃错误正文

**已证实。** `readImage2ProviderResponseJson()` 在 `response.ok === false` 时立即根据 HTTP status 构造 bounded failure，没有读取 `response.text()`：

- `ppt_maker_harness/scripts/ppt_flow.mjs:2104-2145`

因此 Harness 自己不会保存 `Prompt too long (4001 chars, max ~4000)`、上游 error `type/code` 或 `x-oneapi-request-id`。原 plan 的 4000 证据来自另一次直接 provider 测试，不是现有 attempt/provenance 足以复核的事实。这正是目前无法判断错误来源层的原因。

### 6. 32,768 bytes 是本地 safety bound，不是远端能力声明

**已证实。** 当前 main spec 要求 canonical provider input 不超过 32,768 UTF-8 bytes，并明确按最终 serialization 的 byte length 计算：

- `openspec/specs/image-generation/spec.md:1260-1268`
- `openspec/specs/image-generation/spec.md:1317-1336`

最近 `add-page-design-system-provider-input` change 的 design 更明确说明，该数字是“intentional local compiler constraint, not a provider or Harness defect”：

- `openspec/changes/archive/2026-08-15-add-page-design-system-provider-input/design.md:194-205`
- `openspec/changes/archive/2026-08-15-add-page-design-system-provider-input/design.md:325-328`

所以最近 change 没有证明远端支持 32 KiB；它只建立了本地确定性输入的最大安全尺寸。把后续观察到的 4000 直接替换这个数字，同样会把一个具体 route 的能力错误提升为全局 contract。

## 为什么会观察到两种墙

| 解释 | 判断 | 理由与边界 |
|---|---|---|
| 相同 alias 被路由到不同 concrete backend | **高概率** | micu 明确记录 `gpt-image-2` 可重定向，且具体 variants 能力不同。缺少失败请求的 routed model/group 记录，无法逐次锁定。 |
| token 所属 group 不同 | **高概率** | micu 用 dedicated Image group 管理模型；group 由 credential 侧选择，当前 Harness 不记录非秘密 group identity。 |
| main 与 SLB 节点或中间层校验不同 | **可能** | 两个 route 已证实存在，节点也会影响图像请求；没有 4K/16K prompt 边界的逐节点无费用证据。 |
| text generation 与 reference/edit shape 进入不同 adapter | **可能且设计上必须考虑** | Harness 同一 generation path 既有纯 text，又有附带 reference images 的扩展请求；micu 文档将这些列为不同操作。没有证据把两个数字精确映射到两种 operation。 |
| 上游模型本身限制不同 | **可能** | gateway 会路由到不同具体模型/渠道，但 OpenAI 官方页面在本环境不可访问，不能给出官方数字。 |
| 一个按字符、另一个按 bytes/tokens 计数 | **可能** | 错误只写 `chars`，实现和单位未知。ASCII 边界不能区分 code points、UTF-16 units 与 UTF-8 bytes；需要 CJK/emoji 对照。 |
| 随机负载均衡到能力不一致的 backend | **未知** | micu 是聚合网关且 route 可变，但没有同一 request ID 序列或服务端路由日志证明随机分流。 |

最需要避免的误判是：看到 `4001 chars` 就认定所有 Image API 都有 4000 字符限制；或者看到一次约 16K 成功/失败，就把 16K 当成新统一上限。现有证据只支持“某个具体路径在某个时间点实施了该边界”。

## 对原 plan 的修正判断

原 plan 的两个部分应分开处理：

### 仍然成立

- provider prompt 携带大量 provider 不需要的 lineage/provenance 元数据，浪费远端输入预算；
- provider-facing prompt 应只包含 provider 需要的语义；
- 不能静默截断；
- prompt exact bytes 必须进入 plan、authorization 和 attempt binding；
- Pure 与 Framed 必须保留各自的工作流语义，而不是复制完全相同的字段集。

### 需要修改

- 删除“`micuapi.ai` 的 `gpt-image-2` 有统一 4000 字符硬上限”这一全局结论；
- 删除通用 spec 中固定 `4000 characters` 的建议；
- 验收不应要求所有 profile 都 `<= 4000`，而应要求每个请求满足**已选择 capability profile 的 exact budget**；
- `4000` 和 `16000` 可以作为经 owner 验证的 profile 数据，但不应成为代码中的两个 special-case 分支；
- 不按 base URL 或 alias model 单独推断能力，必须包含 concrete route/model、operation、group identity 和计数单位；
- capability profile 发生变化时，应像 compiler/profile cutover 一样使旧 plan stale，重新 plan 和 authorize。

## 推荐的能力模型

建议后续 OpenSpec 把远端限制建模为显式、可扩展的数据，而不是常量：

```yaml
provider_capability:
  provider: image2
  endpoint_profile: micu-main-image
  route_id: owner-declared-non-secret-id
  model: gpt-image-2-key
  operation: reference-generation
  prompt_budget:
    limit: 4000
    unit: unicode-code-points
```

另一个经验证的 route 可以声明 `limit: 16000`，未来也可以是其他数字。字段名只是调查阶段的示意，不是已批准 schema。

关键约束：

1. profile 必须由配置/owner 明确选择，不能从 API key secret、一次失败或 alias 名称中猜测；
2. `limit` 是正整数数据，不写 `if 4000 ... else if 16000 ...`；
3. `unit` 必须闭合定义，例如 `unicode-code-points`、`utf16-code-units` 或 `utf8-bytes`；
4. budget 在 plan publication、authorization、attempt 和 provider initialization 之前检查；
5. capability profile digest 进入 provider profile、plan 与 authorization binding；
6. 本地 32,768 UTF-8 byte safety bound 与远端 prompt budget 分层存在，两者都通过才可提交；
7. 实际发送的 compact prompt 是唯一 provider bytes authority，不保留“旧 canonical input 授权、新投影实际发送”的双权威；
8. response diagnostics 应 secret-safe 地保留 HTTP status、bounded provider error classification、request ID 和所选非秘密 route identity，以便以后归因，仍不保存完整 provider body 或 prompt prose。

## 还缺什么证据

要把“高概率”提升为“已证实”，需要在 owner 明确授权的低成本边界测试中，为 4K 和 16K 各保留一份脱敏记录：

- exact base URL 与 endpoint；
- requested model 和 concrete model/route（若 provider 可返回）；
- token 的非秘密 group identity；
- operation：text generation、single-reference edit 或 multi-reference；
- HTTP status、完整 error JSON、response headers 和 `x-oneapi-request-id`；
- 同一 prompt 的 Unicode code points、UTF-16 code units、UTF-8 bytes；
- ASCII、CJK、emoji 三组边界对照；
- alias 与 concrete model ID 的对照；
- main 与 SLB 的对照；
- 测试时间，因为服务端 alias mapping 会变化。

本次调查没有发起任何带凭证或可能生成图片的请求，也没有读取、输出或推断 API key。现有证据已经足以否决全局硬编码，但不足以把 4K/16K 精确归属到某两个具体 micu backend。
