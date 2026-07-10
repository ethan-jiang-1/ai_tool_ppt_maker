## Context

主 spec 有两类与现状的差距：
1. State 存储从单文件 `run-bundle-state.yaml` 迁移到 `_state/` 目录 (已实现于 `scripts/lib/state.mjs`，已 sync 到主 spec，commit `6d76edc`)。
2. 结构计数 + 命名引用漂移 (charter/playbook 文件数、root 子目录数、reference 大小写、旧 playbook 名、错误脚本名、gate 键名)。

用 delta spec 做 surgical fix，逐条对齐现状，不改无关内容。核对基准：文件系统 (`PPTMAKER_FRAMEWORK/{charter,playbook,reference}/`) 与代码 (`scripts/lib/state.mjs`, `scripts/ppt_flow.mjs`, `scripts/unified_pipeline.mjs`)。

## Delta Specs

### framework-charter
- RENAMED: `…exactly three files` → `…exactly four files`
- MODIFIED: charter 四文件 (+`NODE-SPEC.md`); root 五子目录 (+`playbook/`); reference 文档小写 (`quick-start`/`glossary`/`anti-patterns`/`version-log`); "exactly five markdown files" scenario 括号小写
- REMOVED: 三条噪声 tombstone (`01-directory-template.md is deleted and merged`, `Reference documents are in 00_project_setup`, `00_project_setup README reflects new file inventory`)——已从主 spec 删除

### playbook-execution
- MODIFIED: playbook 六文件 (五 controller + shared node `classify-change.md`); "State file created on start" → `_state/state.yaml`; "Gates enforced" → 读 `_state/state.yaml`, gate 键 `gates.visual`
- REMOVED: `State file coexists with project-metadata.yaml`

### node-specification
- MODIFIED: "State file is YAML…" → `_state/` 目录 + history + scenario 修 `ppt_flow.mjs`/`gates.visual`; "Node frontmatter…" scenario `create-deck` + `node_completed:seed-topics`; "Shared nodes…" scenario `edit-text`/`edit-visual`
- ADDED: `History log is append-only`
- REMOVED: `State API handles corruption and absence gracefully` (行为仍在 `scripts/lib/state.mjs` 中，但按简化设计不再作为 spec 级需求)

## Notes
- `checkEntry`/`checkExit` 已在主 spec 返回 `{pass, missing, unknown}`，与代码一致，无需 delta。
- 格式规范化 (`## ADDED Requirements` → `## Purpose` + `## Requirements`) 是 repo-wide 问题，另开 change，不在本次范围。
