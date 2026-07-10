---
title: "03 — 工具与 API 配置"
stage: "00_project_setup"
position: "04 of 05"
type: methodology
summary: "图片生成只用 GPT Image 2。API 配置（直接或中转均可）。参考脚本在 06_reference_scripts/。"
depends_on:
  - "00_project_setup/README.md"
  - "00_project_setup/02-python-environment.md"
feeds_into:
  - "00_project_setup/04-conventions.md"
agent_action: internalize
---

# 03 — 工具与 API 配置

← [02](02-python-environment.md) | [Next →](04-conventions.md)

## 图片生成：只用 GPT Image 2

本框架基于 **GPT Image 2** 设计和验证。它是目前做 image-based PPT 效果最好的模型——style anchoring 机制、文字渲染质量、色彩一致性都最优。

### API 接入方式

框架通过已安装的 `image2-ppt` / `image2-imagegen` skill 调用 GPT Image 2。当前项目级 skill 使用 APIMart-compatible async API；更换供应商时应替换 skill adapter，而不是假设所有 OpenAI-compatible endpoint 都具有相同的异步 task contract。

| 方式 | 说明 | `OPENAI_BASE_URL` |
|------|------|-------------------|
| **当前默认** | APIMart-compatible async relay | 留空使用 skill 默认 mirrors |
| **其他供应商** | 提供匹配该供应商 contract 的 skill adapter | 由 adapter 定义 |

**模型保持 GPT Image 2，但供应商的 submit/poll/download contract 不一定兼容。** 供应商差异应封装在 skill 层。

### 环境变量配置

```bash
export OPENAI_API_KEY="sk-..."           # 你的 API key
export OPENAI_BASE_URL="https://..."     # API endpoint（直接或中转）
```

Stage 2 和 style-master wrapper 自动读取这两个变量，并桥接到当前 skill 使用的 `APIMART_*` 名称。当前 adapter contract 是：

```
POST /images/generations       → 提交 prompt + reference image，拿到 task_id
GET  /tasks/{task_id}          → 轮询状态，直到 completed
GET  /tasks/{task_id}/result   → 下载生成的图片
```

如果你用的中转服务和这个格式有差异，优先改 skill 层；仅无 skill 时才改 `stage2_generate_images.LEGACY.py` 中的 `submit_task()` / `poll_task()`。

## 参考脚本

`06_reference_scripts/` 包含管线脚本 + 统一入口。**就地运行，不复制进 run bundle。** Stage 2 官方走 skill。

| 脚本 | Stage |
|------|-------|
| `stage1_build_inputs.mjs` | markdown → JSON |
| image2-ppt skill（经 `unified_pipeline.mjs`） | text → images（需要 API） |
| `stage2_generate_images.LEGACY.py` | 遗留参考（默认不用） |
| `stage3_lock_headers.mjs` | Header-Lock（需要 Pillow） |
| `stage4_build_pptx.mjs` | images → PPTX（需要 python-pptx） |
| `stage5_inject_notes.mjs` | speaker notes 注入 |

## Python 工具链

| 工具 | 用途 | Stage |
|------|------|-------|
| `httpx` | HTTP client——由 image skill 调用 generation API | Stage 2 |
| `Pillow` | Header 文字叠加——像素级精确渲染 | Stage 3 |
| `python-pptx` | PPTX 容器构建 + speaker notes 注入 | Stage 4-5 |

## Agent 初始化检查清单

Phase 0 创建 run bundle 后，确认：

- [ ] 在 deck 根运行 `uv sync` 成功
- [ ] `00-env-check.mjs` 显示 READY
- [ ] `OPENAI_API_KEY` 环境变量已设置
- [ ] 如需固定 relay，`OPENAI_BASE_URL` 已设置；否则使用 skill 默认 endpoint
- [ ] 字体文件存在于 `stage3_lock_headers.mjs` 中配置的路径（macOS: `/Library/Fonts/`，Linux: `/usr/share/fonts/`，Windows: `C:/Windows/Fonts/`）
