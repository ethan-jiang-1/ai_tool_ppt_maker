## Why

PPTMAKER_FRAMEWORK 将被放入 coding agent 项目作为方法论内核. coding agent 运行环境自带 Node.js, 不保证有 Python. 目标平台包含 Windows, 不能依赖 bash. 当前全部工具链 (19 个 Python 文件, ~5400 行, 依赖 Pillow + python-pptx + requests) 必须替换为 Node.js 原生实现.

## What Changes

- **BREAKING**: 删除所有 Python 脚本 (`.py`), 以 TypeScript/Node.js 重写
- **BREAKING**: 删除 `stage2_generate_images.LEGACY.py` (已废弃, 不保留)
- 环境检查从 "检查 Python/UV" 改为 "检查 Node.js/npm"
- 管线脚本从 `uv run python ...` 改为 `npx tsx ...` 或 `node ...`
- 所有 AGENTS.md / BOOTSTRAP.md / README 中的命令示例同步更新
- `00_project_setup/02-python-environment.md` 重写为 Node.js 环境文档

## Capabilities

### New Capabilities

- `nodejs-production-pipeline`: 5 个 Stage 的 TypeScript/Node.js 实现. Markdown → JSON → 图片 → Header-Lock → PPTX → 演讲备注. 功能等价于原 Python 管线, 对外接口不变.

### Modified Capabilities

_无. 所有 capability 的行为需求不变, 仅实现语言变更._

## Impact

| 影响面 | 说明 |
|--------|------|
| `06_reference_scripts/*.py` | 全部删除, 以 `.ts` 重写 |
| `00_project_setup/00-auto-env-check.py` | 删除, 重写为 `.ts` |
| `00_project_setup/test_env_check.py` | 删除, 重写 |
| `00_project_setup/02-python-environment.md` | 重写为 Node.js 环境文档 |
| `00_project_setup/03-tool-selection.md` | 更新技术栈描述 |
| AGENTS.md, BOOTSTRAP.md, AGENT_CONTRACT.md, README.md | 更新命令示例 |
| `openspec/config.yaml` | 更新 context 中的工具引用 |
| 测试 (7 文件) | `.py` → `.ts`, vitest 替代 pytest |
