## Why

PPTMAKER_FRAMEWORK 将被放入 coding agent 项目作为方法论内核. coding agent 运行环境自带 Node.js, 不保证有 Python. 目标平台包含 Windows, 不能依赖 bash. 当前全部工具链 (19 个 Python 文件, ~5400 行, 依赖 Pillow + python-pptx + requests) 必须替换为 Node.js 原生实现.

## What Changes

- **BREAKING**: 删除所有 Python 脚本 (`.py`), 以 Node.js ESM (`.mjs`) 重写
- **BREAKING**: 删除 `stage2_generate_images.LEGACY.py` (已废弃, 不保留)
- 环境检查从 "安装 Python/UV/依赖" 改为 "安装 Node.js/npm/依赖"
- 管线脚本从 `uv run python ...` 改为 `node ...`
- 所有 AGENTS.md / BOOTSTRAP.md / README 中的命令示例和环境安装说明同步更新
- `00_project_setup/02-python-environment.md` 重写为 Node.js 环境安装文档

## Capabilities

### New Capabilities

本次迁移将全部 Python 工具链重写为 Node.js ESM, 涉及系统注册表中的全部 capability:

- `content-parsing`: Stage 1 markdown→JSON (← `stage1_build_inputs.py`)
- `image-generation`: Stage 2 路由到外部 skill (← LEGACY 删除)
- `header-lock`: Stage 3 文字叠加图片 (← `stage3_lock_headers.py`)
- `pptx-assembly`: Stage 4 图片→PPTX (← `stage4_build_pptx.py`)
- `notes-injection`: Stage 5 演讲备注注入 (← `stage5_inject_notes.py`)
- `pipeline-orchestration`: 统一编排 + 编辑链 A/B/C (← `unified_pipeline.py`)
- `run-bundle-management`: 目录结构宪法 (← `bundle_layout.py`)
- `visual-config`: Stage 1/3 共享视觉配置 (← `visual_config.py`)
- `style-master-generation`: style_master.jpg 生成 (← `generate_style_master.py`)
- `environment-check`: 零依赖运行时检查 (← `00-auto-env-check.py`)
- `cli-surface`: ppt_flow 命令面 (← `ppt_flow.py`)

### Modified Capabilities

_无. 所有 capability 的行为需求不变, 仅实现语言变更._

## Impact

| 影响面 | 说明 |
|--------|------|
| `06_reference_scripts/*.py` | 全部删除, 以 `.mjs` 重写 |
| `00_project_setup/00-auto-env-check.py` | 删除, 重写为 `00-env-check.mjs` |
| `00_project_setup/test_env_check.py` | 删除, 重写 |
| `00_project_setup/02-python-environment.md` | 重写为 Node.js 环境安装文档 |
| `00_project_setup/03-tool-selection.md` | 更新技术栈描述为 Node.js |
| `00_project_setup/00-zero-to-ready.md` | 更新用户安装指南: Python→Node.js, UV→npm |
| AGENTS.md, BOOTSTRAP.md, AGENT_CONTRACT.md, README.md | 更新命令示例和环境安装说明 |
| `openspec/config.yaml` | 更新 context 中的工具引用 |
| `PPTMAKER_FRAMEWORK/package.json` | 新增, 声明 npm 依赖 |
| `tests/` (repo 根) | 新增 11 个 `.mjs` 测试文件, vitest |
