# 执行状态 (_state)

**这里放什么:** playbook 跑到哪了——当前节点、闸门、进度。不是素材，也不是生成的 PPT。

**谁读写:** MD Controller / agent、`scripts/lib/state.mjs`、`ppt_flow.mjs state`。

**主要文件:**
- `state.yaml` — 执行进度真相源（原子写）
- `history.jsonl` — 可选参考日志（首次 append 才出现；不参与自动恢复）

**字段一览:** `playbook` · `current_node` · `nodes.*` · `gates.content/visual` · `deck.*` · `playbook_stack`

**权威说明:** `PPTMAKER_FRAMEWORK/charter/NODE-SPEC.md`  
**API:** `PPTMAKER_FRAMEWORK/scripts/lib/state.mjs`

**别手改乱改** `state.yaml`——优先用 CLI/API，否则可能破坏原子写约定。

**和 `project-metadata.yaml` 的关系:** metadata 管静态配置 + 管线闸门字段；这里管 playbook 执行进度与 playbook 闸门。两份共存，不要当成同一份文件合并。
