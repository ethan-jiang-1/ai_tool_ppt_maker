# 执行状态 (_state)

**这里放什么:** playbook 跑到哪了——当前节点、闸门、进度。不是素材，也不是生成的 PPT。整流程「做到哪了」以这里为执行指针，再配合 `ppt_flow status` 看产物。

**谁读写:** MD Controller / agent、`scripts/lib/state.mjs`、`ppt_flow.mjs state`。

**主要文件:**
- `state.yaml` — 执行进度真相源（原子写）
- `history.jsonl` — 可选参考日志（首次 append 才出现；不参与自动恢复）

**字段一览:** `playbook` · `current_node` · `nodes.*`（`status`；可选 `waiting_for` / `note`）· `gates.content/visual` · `deck.*` · `playbook_stack`

**断线 / 清聊天后续跑:** 先跑 `node PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs state <runDir>`（where-am-I 卡：指针 + `workflow_summary` + `suggested_next`），再动手。进度在 deck 盘上，不在聊天里。

**权威说明:** `PPTMAKER_FRAMEWORK/charter/NODE-SPEC.md`  
**API:** `PPTMAKER_FRAMEWORK/scripts/lib/state.mjs`

**别手改乱改** `state.yaml`——优先用 CLI/API。格式小瑕疵会在下次 `readState` 时尽量自动整理（读容错、写洗净）。`waiting_for` / `note` 会在 heal round-trip 中保留。

**和 `project-metadata.yaml` 的关系:** metadata 管静态配置 + 管线闸门字段；这里管 playbook 执行进度与 playbook 闸门。两份共存，不要当成同一份文件合并。

**自留教训不在这里:** 遇事克服后的非密钥教训在 `_lessons/`（先读再猜；见 `_lessons/README.md`）。密钥只写 `.env`。
