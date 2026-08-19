# 执行状态 (_state)

**这里放什么:** MD Controller 跑到哪了——当前执行、节点、闸门、等待原因。Playbook 内容仍以 `ppt_maker_harness/playbook/*.md` 为真相源。

**主要文件:**
- `state.yaml` — 当前执行工作集（原子写）
- `history.jsonl` — 可选参考日志，不参与自动恢复

**断线后:** 先跑 `node ppt_maker_harness/scripts/ppt_flow.mjs state <runDir>`。

**Schema 权威:** `ppt_maker_harness/charter/NODE-SPEC.md`。

**不要手改:** 优先使用 `scripts/shared/state/state.mjs` / `ppt_flow`；读取只验证当前声明的权威状态，不会重写、推断或继续不受支持的状态。
