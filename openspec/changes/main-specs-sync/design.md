## Context

主 spec 中 10+ 处 `run-bundle-state.yaml` 已过时——现在是 `_state/state.yaml` + `history.jsonl`. 用 delta spec 做 surgical fix, 不改无关内容.

## Delta Specs

### node-specification

MODIFIED:
- "State file is YAML at run bundle root" → 改为 "State files are in `_state/` directory"
  - `run-bundle-state.yaml` → `_state/state.yaml`
  - 补 `_state/history.jsonl` (append-only, LLM 参考)
- "Node frontmatter defines entry and exit gates" → checkEntry/checkExit 返回 `{missing, unknown}`
- 补 `appendHistory`/`readHistory` API
- 补 `node_done:<name>` 条件

### playbook-execution

MODIFIED:
- "State file is created on playbook start" → `_state/state.yaml`
- "Gates are enforced at node boundaries" → 脚本读 `_state/state.yaml` 
- "State file coexists with project-metadata.yaml" → 删 (已不是单文件)

### framework-charter

REMOVED:
- "Reference documents are in 00_project_setup" → 删 (已 superseded)
- "00_project_setup README reflects new file inventory" → 删 (已 superseded)
