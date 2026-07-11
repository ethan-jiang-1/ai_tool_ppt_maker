## Why

**场景（北星）：** 小白用户做到一半断线 / 清聊天 / 合盖再开，回来只想问一句——「我原来做到哪儿了？从那儿继续。」

回答不能靠聊天记忆，也不能只答 playbook 名。**整条 workflow**（环境 → 内容/视觉 → 生产 → 迭代）都要能从磁盘恢复位置：`_state` 里的 playbook 断点 **加上** 产物与门闩（`status`：style master / 页图 / pptx / gates）。旧名 `recoverable-playbook-resume` 容易让人以为只续 playbook；本 change 改名为 **`recoverable-session-resume`**，强调**会话级 / 整流程续跑**。

## What Changes

- **Where-am-I 续跑仪式（agent）：** 已有 `deck_*` → 先读盘（`state` + `status`）→ 用人话报告「做到哪 + 下一步」→ 从断点续；禁止默认绿场 intake / 从 node 1 重开。
- **Where-am-I 卡（CLI）：** 扩展现有 `state`/`status`（仍 12 命令）：playbook 断点 + 可选 `waiting_for` + **流程摘要**（由 playbook/node/产物启发式拼出，不另造 Phase 状态机字段）+ `suggested_next`。
- **Write discipline：** 节点进出必 `writeState`；等人写 `waiting_for`/`note`。
- **approve 双写：** metadata ↔ `_state.gates`，避免「状态说 approved、status 说 waived」。
- **Docs：** COMMANDS「接着做 / 做到哪了 / 断线了继续」；BOOTSTRAP / CONTRACT：进度在 deck 上，不在聊天里。

**Non-goals：** mid-node Step 图；Image2 task_id 进 `_state`；history 自动重放；新子命令；把 `_lessons` 当进度。

## Capabilities

### New Capabilities

- (none)

### Modified Capabilities

- `playbook-execution` — 整会话续跑仪式 + COMMANDS 续跑说法（不限 playbook 名）
- `node-specification` — `waiting_for`/`note`；写盘纪律；heal 保字段
- `cli-surface` — where-am-I 卡；approve 双写；`deckRoot` 解析
- `framework-charter` — 入口：进度 SSOT = `_state` + 产物
- `run-bundle-management` — `_state` README / deck-guide：断线后先 `ppt_flow state`

## Impact

- `ppt_flow.mjs`、`lib/state.mjs`（`buildResumeCard`）、NODE-SPEC / STATE README
- BOOTSTRAP、COMMANDS、AGENT_CONTRACT、template-deck-guide、轻量 playbook 注记
- 验收锚点：`deck_ai_sdlc_keynote`（小白断线后应能说出 review-gate / 等人审图 / 页图进度）

## Apply-ready acceptance

1. `state --json` 含 playbook、current_node、`suggested_next`，以及可读的流程摘要字段（如 `where` / `workflow_summary`）
2. `status` 露出 Playbook 断点（与 state 同源）
3. `approve` 后 metadata ≡ `_state.gates`
4. COMMANDS 支持「做到哪了 / 断线了继续」且不写死「从第一个 node 开始」
5. `npm test` 绿；12 命令不变
