## Why

Agent 在 run bundle 的 MD 文件中手写结构化内容（YAML frontmatter、slide specs 格式）时，缺乏产出即校验的机制。JS 管线代码要么对要么 crash——不需要 lint。但 agent 手写的 MD 可能格式松散：frontmatter YAML 缩进错、不闭合，slide specs 缺字段或留 placeholder 残余。当前校验分散在 `stage1_build_inputs.mjs`、`state.mjs`、`render_policy.mjs`、`notes_receipt.mjs` 四个模块，问题往往到下游 stage（甚至 PPTX 构建）才暴露。

## What Changes

- **JS 层 — linter 工具**: 新建 `scripts/lib/lint_output.mjs`，提供 `lintYaml`、`lintMarkdown`（frontmatter 校验）、`lintSlideSpecs`（placeholder/缺字段/重复 ID）、`lintFile`、`lintNodeProduces`。纯函数库，不做循环和控制
- **JS 层 — CLI 工具**: `ppt_flow.mjs` 新增 `lint` 子命令（`--file`、`--run-dir --node`、`--tolerant`、`--json`），供 agent 在 node 执行期间调用
- **JS 层 — boolean gate**: 新 condition `outputs_linted` 加入 `DETERMINISTIC_CONDITIONS` 和 `CONDITIONS`，调 `lintNodeProduces` → 全部 `ok: true` 才 pass。不返回详细报告——详细报告由 agent 通过 CLI 获取
- **JS 层 — ctx 注入**: `checkExit`/`checkEntry` 自动注入 `nodeId` 和 `playbookDir` 到 ctx
- **MD 层 — PDCA**: `create-deck.md` 中有 MD 文件产出的 4 个 node 各加一个 **Step N — CLI**，指示 agent 跑 `ppt_flow lint`、读结果、修文件、重跑（最多 3 轮）。3 轮仍 fail → hard stop 上报用户
- **MD 层 — exit gate**: 上述 4 个 node 的 `exit` 各加 `outputs_linted`
- **文档**: `NODE-SPEC.md` condition catalog + PDCA protocol、`COMMANDS.md` lint 命令、`AGENT_CONTRACT.md` §7 引用

## Capabilities

### New Capabilities
- `output-linting`: agent 产出 MD 文件的格式校验。聚焦 run bundle 中 agent 手写的 5 个结构化 MD 文件（deck-guide.md、core-metaphor.md、core-formula.md、slide-specifications.md×2 阶段）。JS 管线输出和 pure evidence produces 不在范围内。PDCA 由 playbook node 指令驱动

### Modified Capabilities
- `playbook-execution`: 新增 `outputs_linted` deterministic exit condition；`checkExit`/`checkEntry` 注入 `nodeId` + `playbookDir` 到 ctx；`create-deck.md` 4 个 node 加 lint CLI step 和 exit gate
- `node-specification`: condition catalog 新增 `outputs_linted`（boolean gate，exit-only）；新增 PDCA lint protocol 文档
- `cli-surface`: `ppt_flow.mjs` 新增 `lint` 子命令，command 数 12→13

## Impact

| 操作 | 文件 | 变更 |
|------|------|------|
| 新建 | `PPTMAKER_FRAMEWORK/scripts/lib/lint_output.mjs` | linter 纯函数库 |
| 新建 | `PPTMAKER_FRAMEWORK/tests/lint_output.test.mjs` | 单元测试 |
| 修改 | `PPTMAKER_FRAMEWORK/scripts/lib/md_controller_reader.mjs` | `DETERMINISTIC_CONDITIONS` 加 `outputs_linted` |
| 修改 | `PPTMAKER_FRAMEWORK/scripts/lib/state.mjs` | `CONDITIONS` 加实现；`checkExit`/`checkEntry` 注入 ctx |
| 修改 | `PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs` | 加 `lint` 命令（13th） |
| 修改 | `PPTMAKER_FRAMEWORK/playbook/create-deck.md` | 4 node 加 step + exit |
| 修改 | `PPTMAKER_FRAMEWORK/charter/NODE-SPEC.md` | condition catalog + PDCA protocol |
| 修改 | `PPTMAKER_FRAMEWORK/COMMANDS.md` | lint 命令文档 |
| 修改 | `PPTMAKER_FRAMEWORK/charter/AGENT_CONTRACT.md` | §7 引用 |

依赖: 复用现有 `yaml` npm 包、`cli_error.mjs` envelope、`state.mjs` checkEntry/checkExit 框架、`md_controller_reader.mjs` playbook index
