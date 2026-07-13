# Plan: Image2 多 Vendor —— 本质就是"多几组 base_url + key"，别搞复杂

> 类型: 设计 / 复盘 | 更新: 2026-07-11

## 背景 —— 一次"对着假设架构"的反面教材

单一 relay（apib.ai）502 + 拥堵阻断出图后，我一度想为"多 vendor"搭 registry + 契约 strategy + 能力 router 的重框架。**这是错的**：我把"vendor 之间有很多差异"当成了既定前提——那其实是个**我自己造出来的、不合理的诉求**；照它实现只会把问题越搞越复杂。

**实验直接推翻了这个假设**（2026-07-11，curl LCON `s.lconai.com/v1`）：
- 我们框架现有参数（`size:"16:9"`, `resolution:"1k"`）和 OpenAI 标准参数（`size:"1024x1024"`, `quality:"low"`）**都返 HTTP 200 + 图片 URL**；vendor 把不认的字段当 `auto` 忽略。
- 背后都是同一个 `gpt-image-2`。**参数/模型层面行为一致，没有参数层面的真差异。**（唯一真实差异是"取图方式" sync/async，且仅 apib.ai 是异步——见下节实测。）

## 本质：多 vendor = 多几组 (base_url, key)，顺序试

image2 这类 API 都是 OpenAI 兼容、同一个模型。所以"支持多个 vendor"本质就是：

- 配置里放**一组 `(base_url, key)` 条目**；
- 调用时**顺序试**，一个失败（502 / 超时 / 报错）就换下一个；
- 失败**原样报给用户看**（别静默兜底）；
- 想多支持几个？**再加一条 `(base_url, key)`**，就结束了。

## 同步 vs 异步：实验实测（2026-07-11，curl 同一个 `/images/generations`）

| vendor | 用时 | 返回 | 契约 |
|--------|------|------|------|
| **LCON** | 14.4s | `data[0].url` | **同步**（submit 直接返图） |
| **Zenmux** | 13.1s | `data[0].b64_json` | **同步** |
| **apib.ai** | **0.38s** | `{data:[{status:"submitted", task_id}]}` | **异步**（只给 task_id，要 poll） |

**结论**：直觉对一半——**image2 家族（LCON/Zenmux）确实全同步**（提交后阻塞 ~13–14s 直接给图）；但差异真实存在，就 **apib.ai 一个是异步**（relay 自己的包装 quirk，秒回 task_id、无图）。

- 若**标准化到 image2（都同步）** → 客户端可以**纯同步**，连那 25 行 async 分支都不用。**这是最简路线，也正好甩掉 apib.ai。**
- 若还想留 apib.ai 当 fallback → 保留那 25 行分支（图当场回来就存 / 没回来就 poll）即可，成本极低。
- 输出形态 `url`（LCON）与 `b64_json`（Zenmux）虽不同，但**同步两家不用再分**——`extractImageRef` 一个函数已同时认。

## 曾以为是差异、其实不是的东西（别为它们建抽象）

| 曾以为是差异 | 实际 |
|-------------|------|
| 请求参数（size / quality / resolution） | 同模型，vendor 忽略不认字段；现有参数直接能用 |
| model id | 裸名 `gpt-image-2` 通用（Zenmux 也认 `openai/` 前缀，但非必须） |
| 参考图（style-reference） | 是 **endpoint 层面**问题（`/generations` 无输入图 vs `/edits` 有），不是 per-vendor 差异；要用参考图另说，别塞进"多 vendor"里 |

## 已验证 vendor（实测证据，加新 vendor 照抄这张表）

| vendor | base_url | key 环境变量 | model | 返回形态 | 契约 | 实测 |
|--------|----------|-------------|-------|---------|------|------|
| **LCON** | `https://s.lconai.com/v1` | `CODEX_API_KEY_LCONAI` | `gpt-image-2` | `data[0].url`（CDN PNG） | 同步 | 本轮 curl 两种参数都 200 出图（~57–64s） |
| **Zenmux** | `https://zenmux.ai/api/v1` | `CODEX_API_KEY_ZENMUX` | `openai/gpt-image-2`（裸名也行） | `data[0].b64_json` | 同步 | summary.json 实测 ~11–30s |
| apib.ai（现用/异步） | `https://api.apib.ai/v1`（+2 镜像 aiuxu/aishuch） | `IMAGE2_API_KEY` | `gpt-image-2` | poll `data.result.images[0].url` | 异步 | 时通时 502/拥堵 |

不可用（probe 结论）：MIRROR/AICodeMirror（`SETTLEMENT_UNKNOWN_MODEL`）、DUCK（返 HTML）、CTOK（key 限额）、Zenmux 的 `-pro`（`404 invalid_model`）。
原始证据：`ait_exam_docker/cli_codex/image2/summary.json` + `probe_archive/`。

## 配置怎么组织（.env 的 key-value）—— 把"路由表"和"密钥"解耦

难点：`.env` 是扁平 `KEY=VALUE`，而我们要一个**有序的 (base_url, key) 列表**，且 key 是密钥、不该到处复制。

**笨办法（不推荐）**：
- 平行列表 `IMAGE2_BASE_URL=a,b` + `IMAGE2_KEYS=k1,k2` —— **靠位置配对，最易错位**。
- 每个 vendor 把密钥再抄一份进新变量 —— **重复、易漏改**。

**聪明办法（推荐）：列表只存 `base_url` +「用哪个 key 变量名」，密钥值仍留在各自已命名的变量里**（`CODEX_API_KEY_LCONAI` / `CODEX_API_KEY_ZENMUX` / `IMAGE2_API_KEY` —— 环境里本来就有，不用重抄）。一行，顺序=优先级：

```
IMAGE2_BASE_URL=https://s.lconai.com/v1|CODEX_API_KEY_LCONAI,https://zenmux.ai/api/v1|CODEX_API_KEY_ZENMUX,https://api.apib.ai/v1|IMAGE2_API_KEY
```

- 每项 `base_url|KEY_ENV_VAR`；解析：按 `,` 切成 vendor、再按 `|` 切成 `(url, KEY_ENV)`，`key = process.env[KEY_ENV]`。
- 缺 `|KEY_ENV` 的项，回退共享 `IMAGE2_API_KEY`。
- **好处**：① 密钥不进列表、与路由表**解耦**（列表非密、可读、甚至可提交，密钥另存）；② 顺序即优先级；③ 加 vendor = 追加一项 `,url|KEYVAR`；④ 复用已有命名 key，不重抄。
- **向后兼容**：老的 `IMAGE2_BASE_URL` + 单 `IMAGE2_API_KEY`（共用一把 key）继续认。

解析约 6 行代码，替换现 `resolveBaseUrls`/`resolveApiKey` 的"单 key"假设为"per-vendor key"。

## 方案（就这么点）

1. 凭据配置支持**多组 `(base_url, key)`**（现 `resolveBaseUrls` 已支持多 base_url 列表，只差"每个 URL 配自己的 key"）。
2. 顺序试 + 失败 failover + **错误原样上报**（现有 mirror-loop 已是雏形）。
3. 同步 / 异步薄分支（**已做**）。
4. 完。**不要** registry / 契约 strategy 类 / capability router。

## 风险 / 取舍

- 唯一要动的：每个 vendor 一把自己的 key（不共用）——配置从"base_url 列表 + 单 key"扩成"`(base_url, key)` 列表"。小改。
- 加新 vendor 前**先 curl 一下**确认它就是 OpenAI 兼容即可（`ait_exam_docker/cli_codex/image2/` 已验证 LCON / Zenmux）。
- 纪律：**别再因"假设的差异"往里加抽象**——先实验，再动手。

## 落地关联

- 极小 OpenSpec change：凭据配置支持多组 `(base_url, key)` + 顺序 failover；sync/async 分支已在 `image_api_client.mjs`。
- 反面教材（"对着假设架构"）已同步进 `_backlog/learning/` 的复盘取向。
- 途中修的 `image_api_client` / pipeline robustness bug（不属"多 vendor 设计"、按约定放别处，此处交叉引用，别丢）：
  - BUG-008（submit 不认 `data:[{task_id}]` 数组）→ `_backlog/bugs/BUG-008-…`
  - `/tasks/{id}/result` 端点不存在 → 已改成优先取 poll 完成响应内嵌图（`image_api_client.mjs`）
  - `unified_pipeline` 的 `planFile` 未定义 → 已修
  - 复盘：`_backlog/learning/2026-07-11-visual-iterate-and-image-api-fixes.md`
