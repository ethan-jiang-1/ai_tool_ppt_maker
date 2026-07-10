---
title: "03 — 工具与 API 配置"
stage: "workflow/00-setup"
position: "04 of 05"
type: methodology
summary: "图片生成只用 GPT Image 2。框架内 Node API client；无外部 skill。"
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

### API 接入方式

框架用 **内置** `scripts/image_api_client.mjs`（Node `fetch`）调用异步生图 API。**不依赖外部 skill**，不跑 Python / bash。

| 方式 | 说明 | `OPENAI_BASE_URL` |
|------|------|-------------------|
| **当前默认** | APIMart-compatible async relay | **必填**（或 `APIMART_BASE_URL` / `APIMART_BASE_URLS`） |
| **其他供应商** | 需匹配同一 submit/poll/download contract；差异改 `image_api_client.mjs` | 由你配置 |

### 环境变量配置

```
export OPENAI_API_KEY="sk-..."           # 你的 API key
export OPENAI_BASE_URL="https://..."     # API endpoint（直接或中转）
```

Stage 2 和 style-master 自动读取这两个变量（也认 `APIMART_*`）。Contract：

```
POST /images/generations       → 提交 prompt + reference image，拿到 task_id
GET  /tasks/{task_id}          → 轮询状态，直到 completed
GET  /tasks/{task_id}/result   → 下载生成的图片
```

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
- [ ] `OPENAI_API_KEY` 与 `OPENAI_BASE_URL` 已设置
- [ ] 字体文件存在于 `stage3_lock_headers.mjs` 可解析路径（bundled `fonts/` 或系统字体）
