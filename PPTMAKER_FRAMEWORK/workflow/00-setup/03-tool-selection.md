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
| **当前默认** | Async relay (submit/poll/download) | **必填** `IMAGE2_BASE_URL` |
| **其他供应商** | 需匹配同一 submit/poll/download contract；差异改 `image_api_client.mjs` | 由你配置 |

### 环境变量配置（Image2 契约 · SSOT）

在 deck 根（优先）或 repo 根创建 `.env`：

```
IMAGE2_API_KEY=sk-...
IMAGE2_BASE_URL=https://your-relay/v1
```

两者都必填。`IMAGE2_API_KEY` + `IMAGE2_BASE_URL` 是唯一的凭据组合。CLI `--base-url` 可在运行时覆盖 URL。

写进 **deck 根（优先）或 repo 根** 的 `.env`（walk-up 加载）。默认 doctor 不读取或要求 Image2；显式 `doctor --image2` 才离线检查 key、URL、Stage 2 implementation 与 resolved count。缺 key 或 URL 只让 Image2 mode **NOT READY**，不撤销 base READY。

Contract：

```
POST /images/generations       → 提交 prompt + reference image，拿到图或 task_id
GET  /tasks/{task_id}          → 轮询状态，直到 completed（async）
GET  /tasks/{task_id}/result   → 下载生成的图片（async）
```

submit / poll / result 均认 `data` 为对象或数组包络（含 `{ code, data:[{ task_id }] }`）。sync 响应可直接带图 ref。

### 离线 presence 与确认后的 live probe

缺凭据、显式 Image2 doctor 报缺 URL、或第一次出图失败时，Agent 先把本地检查与 live provider submit 分开：

1. 问用户要候选 key / URL
2. 写入获准的 `.env` 后先跑 `node PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs doctor --image2`；这是离线 presence/resolver-count 检查，provider submit 为 0
3. 需要第一家通道诊断时，先披露 `doctor --smoke` 会向第一家提交 **1 次**、可能计费，并取得用户明确确认；拒绝时不调用
4. 症状持续且需要逐家体检时，先从离线输出取得 resolved count，披露 `doctor --probe-vendors` 将每家 **1 次**、说清总 submit 数，并取得用户明确确认
5. `--smoke` 与 `--probe-vendors` 互斥；长出图持续转述 heartbeat、`i/N` 与 Summary。redirect、5xx、timeout 或 ambiguous network failure 不在同一次 doctor probe 内重试
6. style-master 是真实生产 reference asset，不是 channel diagnostic substitute；probe success 也不批准 style-master、build 或页面 refinement
7. **通了 → 按下一节在另一次确认后落点**

下次进 deck：先扫 `_lessons/`（若有 `image2-proven.yaml` 优先读）再猜 endpoint。

### 试通落点（密钥 ≠ 教训）

| 写什么 | 写哪 | 指定的事儿 |
|--------|------|------------|
| 生效密钥 | `.env`（优先 deck 根） | 密钥 / 机器加载 |
| 非密钥回执 | `deck_*/_lessons/image2-proven.yaml` | **一类教训条目**（服从 `_lessons/README` 规矩） |

`_lessons/` 是 run bundle **自留教训面**（遇事自己克服 → 留下 → 下次先读），不是 Image2 专用夹。`image2-proven.yaml` 只是例子。  
字段：`proven_at`、`base_url`、`via`（`env`|`cli`|`user-provided`）、可选 `notes`；**无 API key 字段**。

禁止：经验只留聊天；密钥进 `_lessons/`；自创非宪法目录装教训；探针成功后未经单独确认就写 `.env`。写入后只用离线 `doctor --image2` 复查 presence，不自动追加一次 `--smoke`；若确需再 smoke，重新披露 1 次 submit 并重新确认。

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
- [ ] 运行 `npm run setup:chromium` 安装固定 Playwright 配对的 Chromium
- [ ] `node PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs doctor` 显示 READY
- [ ] framework 内置 HTML WOFF2 字体通过 `html_fonts`；用户未被要求安装系统字体或联网下载字体
- [ ] 仅当用户选择 Image2 时，`IMAGE2_API_KEY` + `IMAGE2_BASE_URL` 已设置且离线 `doctor --image2` READY
- [ ] 若已有 `_lessons/image2-proven.yaml`，先读再猜 endpoint
- [ ] 任何 live doctor probe 都先披露 submit 总数并得到确认；style-master 不作诊断替代
- [ ] Stage 3 的 legacy canvas 字体 warning 与 HTML runtime 的 blocking WOFF2 检查没有混为一谈
