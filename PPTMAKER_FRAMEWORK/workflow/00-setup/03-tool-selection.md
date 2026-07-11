---
title: "03 — 工具与 API 配置"
stage: "workflow/00-setup"
position: "04 of 05"
type: methodology
summary: "图片生成只用 GPT Image 2。Image2 凭据契约；框架内 Node API client；冒烟与 _lessons/ 落点。"
depends_on:
  - "workflow/00-setup/README.md"
  - "workflow/00-setup/02-nodejs-environment.md"
feeds_into:
  - "workflow/00-setup/04-conventions.md"
agent_action: internalize
---

# 03 — 工具与 API 配置

← [02](02-nodejs-environment.md) | [Next →](04-conventions.md)

## 图片生成：只用 GPT Image 2

本框架基于 **GPT Image 2** 设计和验证。它是目前做 image-based PPT 效果最好的模型——style anchoring 机制、文字渲染质量、色彩一致性都最优。

这些环境变量**只用于出图**，不是 ChatGPT 聊天。

### API 接入方式

框架用 **内置** `scripts/image_api_client.mjs`（Node `fetch`）调用异步生图 API。**不依赖外部 skill**，不跑 Python / bash。

| 方式 | 说明 | Base URL |
|------|------|----------|
| **当前默认** | APIMart-compatible async relay | **必填** `IMAGE2_BASE_URL`（或非空 `IMAGE2_BASE_URLS`） |
| **其他供应商** | 需匹配同一 submit/poll/download contract；差异改 `image_api_client.mjs` | 由你配置 |

### 环境变量配置（Image2 契约 · SSOT）

**多 vendor（推荐）**——`IMAGE2_VENDORS` 非空时**优先于** `IMAGE2_BASE_URL` / `IMAGE2_BASE_URLS`；行内只写 KEY_ENV **名**：

```
# 密钥值各自放在对应变量里（勿嵌进 VENDORS 行）
CODEX_API_KEY_LCONAI=sk-...
CODEX_API_KEY_ZENMUX=sk-...
APIMART_API_KEY=sk-...
IMAGE2_VENDORS=https://s.lconai.com/v1|CODEX_API_KEY_LCONAI,https://zenmux.ai/api/v1|CODEX_API_KEY_ZENMUX,https://api.apib.ai/v1|APIMART_API_KEY
```

**单 key + URL（legacy，仍支持）**：

```
IMAGE2_API_KEY=sk-...
IMAGE2_BASE_URL=https://your-relay/v1
# IMAGE2_BASE_URLS=https://a/v1,https://b/v1   # 可选；非空可代替单条 BASE_URL
```

别名仍认：`OPENAI_*` / `APIMART_*`。解析优先级：CLI `--base-url`（仅配共享 key）→ `IMAGE2_VENDORS` → legacy URL(S)+共享 key。

写进 **deck 根（优先）或 repo 根** 的 `.env`（walk-up 加载）。doctor ≡ 运行时：缺可解析 key 或缺 URL/VENDORS → **NOT READY**（无静默默认 endpoint）。

Contract：

```
POST /images/generations       → 提交 prompt + reference image，拿到图或 task_id
GET  /tasks/{task_id}          → 轮询状态，直到 completed（async）
GET  /tasks/{task_id}/result   → 下载生成的图片（async）
```

submit / poll / result 均认 `data` 为对象或数组包络（含 `{ code, data:[{ task_id }] }`）。sync 响应可直接带图 ref。

### 冒烟赋能（禁止首败甩锅小白）

缺凭据、doctor 报缺 URL、或第一次出图失败时，Agent **必须**多组合试通，再告诉新手「你自己配」：

1. 问用户要候选 key / URL / `IMAGE2_VENDORS` 项（及别名）
2. 按优先级试：`IMAGE2_VENDORS` 各项 → 共享 `IMAGE2_*` → 别名 → `BASE_URLS` → `--base-url` → 用户给的其它 URL
3. 廉价门禁：`node PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs doctor --smoke`（第一家）  
   或：`… style-master <versionDir> --force --resolution 1k`
4. 首败换组合；禁止首败结案
5. 症状持续（smoke 败 / 502 / 全挂 / 用户说画不出）且本 session 未 probe → **白话亮能力**：要不要逐家试画画通道？→ `probe-image-channels` / `doctor --probe-vendors`（见 [COMMANDS.md](../../COMMANDS.md)「环境 / 画画通道」）。`--smoke` 与 `--probe-vendors` 互斥。长出图转述 stdout 心跳与 `i/N`。
6. **通了 → 落点（下一节）**

下次进 deck：先扫 `_lessons/`（若有 `image2-proven.yaml` 优先读）再猜 endpoint。

### 试通落点（密钥 ≠ 教训）

| 写什么 | 写哪 | 指定的事儿 |
|--------|------|------------|
| 生效密钥 + 可选 `IMAGE2_VENDORS` 路由行 | `.env`（优先 deck 根） | 密钥 / 机器加载；VENDORS 行无 secret 值 |
| 非密钥回执 | `deck_*/_lessons/image2-proven.yaml` | **一类教训条目**（服从 `_lessons/README` 规矩） |

`_lessons/` 是 run bundle **自留教训面**（遇事自己克服 → 留下 → 下次先读），不是 Image2 专用夹。`image2-proven.yaml` 只是例子。  
字段：`proven_at`、`base_url`、`via`（`env`|`cli`|`alias`|`user-provided`|`vendors`）、可选 `notes`；**无 API key 字段**。

禁止：经验只留聊天；密钥进 `_lessons/`；自创非宪法目录装教训；探针未确认就写 `.env`。

## 参考脚本

`scripts/` 包含管线脚本 + 统一入口。**就地运行，不复制进 run bundle。** 全部为 Node.js `.mjs`。

| 脚本 | Stage |
|------|-------|
| `stage1_build_inputs.mjs` | markdown → JSON + page prompts |
| `stage2_generate_images.mjs` + `make_contact_sheet.mjs` | text → images + QA sheet |
| `stage3_lock_headers.mjs` | Header-Lock（`@napi-rs/canvas` 叠标题） |
| `stage4_build_pptx.mjs` | images → PPTX（`pptxgenjs`） |
| `stage5_inject_notes.mjs` | speaker notes 注入（`pptxgenjs`） |
| `unified_pipeline.mjs` | 统一入口，编排 Stage 1–5 |

## Node.js 工具链

| 包 | 用途 | Stage |
|------|------|-------|
| `@napi-rs/canvas` | Header 文字叠加 + contact sheet | Stage 2 QA / 3 |
| `pptxgenjs` | PPTX 容器构建 + speaker notes 注入 | Stage 4–5 |
| `commander` | CLI 参数解析（`ppt_flow.mjs` 等） | 全程 |

Stage 2 HTTP 用 Node 内置 `fetch`，无额外 npm 依赖。

## Agent 初始化检查清单

Phase 0 创建 run bundle 后，确认：

- [ ] 在 repo 根运行 `npm install` 成功
- [ ] `node PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs doctor` 显示 READY
- [ ] `IMAGE2_VENDORS` 已设，**或** `IMAGE2_API_KEY` + `IMAGE2_BASE_URL`（或 `IMAGE2_BASE_URLS`）已设置
- [ ] 若已有 `_lessons/image2-proven.yaml`，先读再猜 endpoint
- [ ] 出图症状持续时已考虑 `doctor --probe-vendors` / `probe-image-channels`（见 COMMANDS「环境 / 画画通道」）
- [ ] 字体文件存在于 `stage3_lock_headers.mjs` 可解析路径（bundled `fonts/` 或系统字体）
