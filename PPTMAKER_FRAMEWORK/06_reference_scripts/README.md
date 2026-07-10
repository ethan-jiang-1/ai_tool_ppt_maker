---
title: Reference Scripts — 参考实现
stage: 06_reference_scripts
position: entry
type: reference
summary: 五个 Stage 的完整 Python 参考实现 + 安装配置指南。
depends_on:
- 04_production_pipeline/README.md
feeds_into: []
agent_action: run_in_place
---

# Reference Scripts — 参考实现

本目录包含 PPT 生产管线五个 Stage 的**完整 Python 参考实现**。它们是 `04_production_pipeline/reference-pipeline-scripts.md` 中伪代码的对应可运行版本。

> **推荐使用统一管线入口**：[`unified_pipeline.mjs`](unified_pipeline.mjs) — 单一命令运行全部或部分 Stage，自动检测 skill 脚本路径。底下的独立脚本仍然可用（Expert Mode 或需要深度定制时），但大多数情况用统一入口即可。

## 环境准备

### 1. Python 和包管理器

需要 Python 3.11+。推荐用 [uv](https://docs.astral.sh/uv/) 管理依赖。

`bundle_layout.mjs --init` 已在 run bundle 根生成 `pyproject.toml`，无需再次 `uv init`。

### 2. 安装依赖

三个核心 Python 包，分别服务不同的 Stage：

| 包 | 用途 | 哪个 Stage 用 |
|----|------|-------------|
| `httpx` | HTTP client——供当前 image skill 调用 async API | Stage 2 |
| `Pillow` | 图片处理——Header-Lock 文字叠加，像素级精确渲染 | Stage 3 |
| `python-pptx` | PPTX 容器——创建 .pptx、插入图片、注入 speaker notes | Stage 4-5 |

安装：

```bash
# 在 run bundle 根目录
uv sync
```

验证安装：

```bash
node -c "import httpx; from PIL import Image; from pptx import Presentation; print('All good')"
```

### 3. 字体

Stage 3（Header-Lock）需要在图片上渲染文字，依赖系统字体文件。

**推荐字体**：Source Sans Pro（清晰的无衬线字体，适合 presentation）。如果需要渲染中文字符，换用 Noto Sans CJK。

| 操作系统 | 字体默认路径 | 安装方式 |
|---------|------------|---------|
| macOS | `/Library/Fonts/` 或 `~/Library/Fonts/` | 下载 .otf 文件，双击安装 |
| Linux | `/usr/share/fonts/truetype/` | `sudo apt install fonts-source-sans-pro` 或手动复制 |
| Windows | `C:/Windows/Fonts/` | 下载 .otf，右键 → 安装 |

字体现在**跨平台自动解析**,无需改代码:把 Source Sans Pro 的 .otf 丢进 `06_reference_scripts/fonts/`(bundled,优先级最高、可复现),或设 `$PPT_FONT_DIR`,或依赖系统已安装字体。找不到目标字体时降级到可读且**字号正确**的后备 sans(打响亮 warning),完全没有可用字体才硬中止——绝不静默产出错字号标题。

### 4. API 密钥

Stage 2（生图）需要 GPT Image 2 API 访问权限。设置两个环境变量：

```bash
export OPENAI_API_KEY="sk-..."           # 你的 API key
export OPENAI_BASE_URL="https://..."     # API endpoint
```

当前项目级 skill 使用 APIMart-compatible async relay；留空 base URL 使用 skill 默认 mirrors。其他供应商必须提供匹配其 API contract 的 skill adapter，不能只替换 URL 就假设兼容。

## 核心脚本

| 脚本 | Stage | 输入 | 输出 | 依赖 |
|------|-------|------|------|------|
| `stage1_build_inputs.mjs` | 1 | `3_versions/v1/slide-specifications.md` + `2_backbone/visual-style/deck_system.txt` | `_generated/slide_plan.json` + `_generated/page_prompts/_prompts.json` | 标准库 |
| **Stage 2（官方）** | 2 | skill: `image2-ppt/scripts/generate_full_page_images.py` | `_generated/page_images_full/*.png` | skill + API key |
| `stage2_generate_images.LEGACY.py` | 2（遗留） | 仅无 skill 时用；**默认忽略** | 同上 | `requests` + API key |
| `stage3_lock_headers.mjs` | 3 | `_generated/page_images_full/*.png` + `_generated/slide_plan.json` + `2_backbone/visual-style/color_palette.json` | `_generated/header_locked/*.png` | `Pillow` + 系统字体 |
| `stage4_build_pptx.mjs` | 4 | `_generated/header_locked/*.png` + `_generated/slide_plan.json` | `_generated/ppt/{NAME}.pptx` | `python-pptx` |
| `stage5_inject_notes.mjs` | 5 | `_generated/ppt/{NAME}.pptx` + `3_versions/v1/slide-specifications.md` | `_generated/ppt/{NAME}.pptx`（原地修改） | `python-pptx` |
| `generate_style_master.mjs` | Phase 2 | `style-master-prompt.md` + `.env` | `style_master.jpg` + trace | image2-imagegen skill |
| `bundle_layout.mjs --new-version` | 版本 | 当前版本源 delta | 干净的新版本 | 标准库 |
| `vitest run` | QA | 全部 `test_*.py` | 汇总结果 | 项目运行环境 |

## 使用方法

> **脚本就地运行，不复制进 run bundle。** 通过 `unified_pipeline.mjs --run-dir` 指向你的 run bundle 版本目录即可。run bundle 里**没有** `scripts/` 目录。所有产出写入 `3_versions/v{n}/_generated/`。

### 推荐：统一管线入口

```bash
# 已完成 pilot 后，运行全部 5 个 stage
node PPTMAKER_FRAMEWORK/06_reference_scripts/unified_pipeline.mjs \
  --run-dir deck_{NAME}/3_versions/v1 --stage all

# 首次生产 pilot：先 1，再选 3 张代表页跑 1K Stage 2
node PPTMAKER_FRAMEWORK/06_reference_scripts/unified_pipeline.mjs \
  --run-dir deck_{NAME}/3_versions/v1 --stage 1
node PPTMAKER_FRAMEWORK/06_reference_scripts/unified_pipeline.mjs \
  --run-dir deck_{NAME}/3_versions/v1 --stage 2 \
  --only opener_id,content_id,closer_id --resolution 1k

# 只跑某个 stage（如只重新 lock headers）
node PPTMAKER_FRAMEWORK/06_reference_scripts/unified_pipeline.mjs \
  --run-dir deck_{NAME}/3_versions/v1 --stage 3

# 编辑链：改标题只跑 1,3,4,5；改画面跑 1,2,3,4,5；改 notes 只跑 5
node PPTMAKER_FRAMEWORK/06_reference_scripts/unified_pipeline.mjs \
  --run-dir deck_{NAME}/3_versions/v1 --stage 1,3,4,5

# 全量视觉刷新（配色/style master/全局 prompt 变化）
node PPTMAKER_FRAMEWORK/06_reference_scripts/unified_pipeline.mjs \
  --run-dir deck_{NAME}/3_versions/v1 --stage all --force-images
```

统一入口自动处理所有路径：源文件从 `3_versions/v{n}/`（slide-specifications.md）+ `2_backbone/visual-style/` 读，派生品写到 `_generated/`，PPTX 文件名从 `deck_{NAME}` 目录名推导。

### 适配项目（可选）

v1 canvas 固定为 1672×941。常规项目优先通过 `color_palette.json` 调 header 字号、颜色和 safe zone，不要复制脚本：

- **stage1**：哪些 VISUAL TYPE 是 full-page；safe zone 从 palette 读取
- **stage2**：官方路径是 skill，无需改本目录脚本
- **stage3**：kicker/title/subtitle 的字体大小和颜色（字体路径已跨平台自动解析，见下）
- **stage4 / stage5**：无需修改

### Expert Mode：手动逐 stage 运行

如果需要绕过统一入口单独调试某个 stage（各脚本的 `--out-dir` / `--out` 直接指向 `_generated/`，`--style-dir` 指向 `2_backbone/visual-style/`）：

```bash
cd deck_{NAME}

# Stage 1: markdown → JSON（写入 _generated/，style 从 2_backbone/visual-style/ 读）
node PPTMAKER_FRAMEWORK/06_reference_scripts/stage1_build_inputs.mjs \
  --input 3_versions/v1/slide-specifications.md \
  --out-dir 3_versions/v1/_generated/ \
  --style-dir 2_backbone/visual-style/

# Stage 2: text → images（需要 API key）
node <skills>/image2-ppt/scripts/generate_full_page_images.py \
  --prompt-json 3_versions/v1/_generated/page_prompts/_prompts.json \
  --style-reference 2_backbone/visual-style/style_master.jpg \
  --out-dir 3_versions/v1/_generated/page_images_full/

# Stage 3: Header-Lock（style 从 2_backbone/visual-style/ 读取 color_palette.json）
node PPTMAKER_FRAMEWORK/06_reference_scripts/stage3_lock_headers.mjs \
  --images 3_versions/v1/_generated/page_images_full/ \
  --slide-plan 3_versions/v1/_generated/slide_plan.json \
  --out 3_versions/v1/_generated/header_locked/ \
  --style-dir 2_backbone/visual-style/

# Stage 4: images → PPTX（{NAME} = deck_{NAME} 目录名去掉 deck_ 前缀）
node PPTMAKER_FRAMEWORK/06_reference_scripts/stage4_build_pptx.mjs \
  --images 3_versions/v1/_generated/header_locked/ \
  --slide-plan 3_versions/v1/_generated/slide_plan.json \
  --out 3_versions/v1/_generated/ppt/{NAME}.pptx

# Stage 5: inject speaker notes（管线会自动备份；手动跑时先备份）
cp 3_versions/v1/_generated/ppt/{NAME}.pptx 3_versions/v1/_generated/ppt/{NAME}.backup.pptx
node PPTMAKER_FRAMEWORK/06_reference_scripts/stage5_inject_notes.mjs \
  --pptx 3_versions/v1/_generated/ppt/{NAME}.pptx \
  --input 3_versions/v1/slide-specifications.md
```

> **Stage 2 官方路径只有一条**：`unified_pipeline.mjs` → skill `image2-ppt/scripts/generate_full_page_images.py`。本目录的 `stage2_generate_images.LEGACY.py` 是无 skill 时的遗留参考，**默认不用**。

### 选择性重跑

如果你只改了一张 slide 的 IMAGE PROMPT，不需要从头跑整个管线：

```bash
# 只重新生成 slide_07 这一张图，然后重跑 3,4,5
node PPTMAKER_FRAMEWORK/06_reference_scripts/unified_pipeline.mjs \
  --run-dir deck_{NAME}/3_versions/v1 --stage 2 --only slide_07
node PPTMAKER_FRAMEWORK/06_reference_scripts/unified_pipeline.mjs \
  --run-dir deck_{NAME}/3_versions/v1 --stage 3,4,5
```

`--only` 表示明确刷新指定图片，统一管线会自动传递 `--force`。不带 `--only` 时默认跳过已有图片，便于断点恢复；全量刷新使用 `--force-images`。

### 统一测试入口

```bash
node PPTMAKER_FRAMEWORK/06_reference_scripts/vitest run
```

## 自定义 API 适配

如果你的 API endpoint 格式和 OpenAI 不完全一致，优先改 skill 层适配；仅在无 skill 时才改 `stage2_generate_images.LEGACY.py` 中的三个函数：

- `submit_task()` — POST 请求格式
- `poll_task()` — 状态轮询和 response 解析
- `download_result()` — 图片下载 URL 的提取逻辑

每个函数都有清晰的注释说明它期望的 request/response 格式。参考 `00_project_setup/03-tool-selection.md` 了解 API 配置的更多细节。

## 常见问题

**Q: `ModuleNotFoundError: No module named 'httpx'`**

在 deck 根运行 `uv sync`；初始化生成的 `pyproject.toml` 已声明 `httpx`、`Pillow` 和 `python-pptx`。

**Q: `OPENAI_API_KEY environment variable is not set`**

Stage 2 需要 API key。设置 `export OPENAI_API_KEY="sk-..."`。

**Q: 生成图片上的文字是乱码**

检查 prompt 中是否混入了 CJK 字符。GPT Image 2 对英文文字渲染最稳定。如果确实需要中文，用 `full-page` 模式（全页 AI 渲染），并在 pilot 阶段测试中文渲染质量。

**Q: Header 文字位置不对**

检查 `stage3_lock_headers.mjs` 中的 `CANVAS_SIZE` 和 `stage1_build_inputs.mjs` 中的 `NORMAL_HEADER_SAFE_ZONE` 是否匹配你的 canvas 尺寸。

**Q: 字体找不到，Pillow 用了 fallback 字体**

字体跨平台自动解析:优先 `06_reference_scripts/fonts/`(bundled)→ `$PPT_FONT_DIR` → 系统字体目录(macOS `/Library/Fonts/`、Linux `/usr/share/fonts/`、Windows `C:/Windows/Fonts/`)。目标字体缺失 → 降级到字号正确的后备 sans + 响亮 warning;毫无可用字体才中止。要精确匹配风格锚,把 Source Sans Pro 的 .otf 放进 `fonts/`。CJK 文本:加 Noto Sans CJK 并改 `FONT_BOLD/SEMIBOLD/REGULAR`。
