---
title: "02 — Python/UV 环境搭建"
stage: "00_project_setup"
position: "03 of 05"
type: methodology
summary: "Agent 初始化 run bundle 时的 Python 环境配置——UV 包管理、核心依赖、pyproject.toml。"
depends_on:
  - "00_project_setup/README.md"
  - "00_project_setup/01-directory-template.md"
feeds_into:
  - "00_project_setup/03-tool-selection.md"
agent_action: internalize
---

# 02 — Python/UV 环境搭建

← [01](01-directory-template.md) | [Next →](03-tool-selection.md)

## Agent 在初始化项目时需要做什么

创建 run bundle 之后，需要确保 Python 环境可用。PPT 生产管线依赖三个核心 Python 包。

## UV 包管理器

本项目用 [uv](https://docs.astral.sh/uv/) 管理 Python 依赖。

> **推荐路径（不用手敲）**：Phase 0 的 `bundle_layout.py --init deck_{NAME}` **已经在 deck 里铺好了最小 `pyproject.toml`**（含 `python-pptx` / `Pillow`）。deck 建好后在 deck 目录跑一次：
> ```bash
> uv sync        # 按 pyproject 装依赖，创建 .venv/
> ```
> 之后 `uv run python .../unified_pipeline.py ...` 就能解析到依赖。

**手动路径（老流程 / 不用 `--init` 时的 fallback）**：

```bash
# 在 run bundle 根目录
uv sync
```

`.venv/` 自动创建。

| 包 | 用途 | 哪个 stage 用 |
|---|---|---|
| `python-pptx` | PPTX 容器构建（Stage 4）、Speaker notes 注入（Stage 5）；会**传递带入 Pillow** | 管线 Stage 4-5 |
| `Pillow` | Header 文字叠加（Stage 3）——像素级精确渲染 | 管线 Stage 3 |
| `httpx` | 当前 image skill 的 HTTP client | 管线 Stage 2 |

## 凭据：`.env`（key + 图像 base URL，问一次自动带）

图像生成的 key 和 base URL **不进 pyproject**，放 deck 根目录的 `.env`。框架对外统一使用 `OPENAI_*` 名称，再由 wrapper/pipeline 桥接到当前 skill 的原生变量：

```
OPENAI_API_KEY=sk-...              # 必填
OPENAI_BASE_URL=https://<relay>/v1  # 可选：不填用默认端点
# （若中转原生用别的名字，填 APIMART_API_KEY / APIMART_BASE_URL 也认。）
```

`unified_pipeline`、`generate_style_master.py` 和 env-check 都会加载 `.env` 并桥接变量。**填好后务必真跑一页图试一下**——env-check 只能确认配置存在。

## 最小 pyproject.toml（`--init` 铺的就是这个）

```toml
[project]
name = "deck-{NAME}"
version = "0.0.0"
requires-python = ">=3.11"
dependencies = [
    "python-pptx>=1.0",
    "Pillow>=10.0",
]

[tool.uv]
package = false
```

## Agent 检查清单

初始化 run bundle 后，确认：
- [ ] `uv sync` 成功（`.venv/` 已创建）
- [ ] `uv run python -c "import pptx, PIL, httpx"` 无报错
- [ ] Stage 2 需要图像生成 → deck 根 `.env` 里有 `OPENAI_API_KEY`（或 `APIMART_API_KEY`），可选 `OPENAI_BASE_URL`

> 项目根 `AGENTS.md` 有更详细的 UV 配置说明。本文件聚焦于 PPT 生产管线的最小 Python 依赖。
