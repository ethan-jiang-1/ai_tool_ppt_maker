## Why

**场景（北星）：** 小白用户做到一半断线 / 清聊天 / 合盖再开，回来只想问——「我原来做到哪儿了？从那儿继续。」

回答不能靠聊天记忆，也不能只答 playbook 文件名。**整条 workflow**（环境 → 内容/视觉 → 生产 → 迭代）都要能从**磁盘**恢复位置：

| 层 | 真相 | 回答什么 |
|----|------|----------|
| 执行指针 | `_state/state.yaml` | 哪个 playbook / node / 是否在等人 |
| 产物与管线门闩 | `ppt_flow status`（metadata + `_generated`） | 母版有没有、页图 N/M、有没有 pptx |
| where-am-I | 二者合成（启发式，**不写第二份状态文件**） | 人话「做到哪 + 下一步」 |

旧名 `recoverable-playbook-resume` 过窄；本 change 为 **`recoverable-session-resume`**（会话级 / 整流程续跑）。

## What Changes

- **Session resume ritual（agent）：** 已有 `deck_*` 或「做到哪了 / 接着做 / 断线了」→ 先 `state` + `status` → 人话汇报 → 从 `current_node` 续；禁止默认绿场 intake / 从 node 1 重开。
- **Where-am-I 卡（CLI）：** 扩展现有 `state`/`status`（仍 **12** 命令）：指针 + 可选 `waiting_for`/`note` + `workflow_summary` + `suggested_next`；`buildResumeCard` 住在 `state.mjs`。
- **Write discipline：** 节点进出必 `writeState`；等人写 `waiting_for`/`note`；heal 保这些字段。
- **approve 双写：** metadata ↔ `_state.gates`。
- **Docs：** COMMANDS「续跑 / 做到哪了」；BOOTSTRAP / CONTRACT：进度在盘上，不在聊天；Agent 路由删掉「一律从第一个 node 开始」。

**Non-goals：** mid-node Step 图；Image2 task_id 进 `_state`；history 自动重放；第 13 命令；`workflow_phase.yaml`；把 `_lessons` 当进度。

## Capabilities

### New Capabilities

- (none)

### Modified Capabilities

- `playbook-execution` — 整会话续跑仪式 + COMMANDS 续跑说法
- `node-specification` — `waiting_for`/`note`；写盘纪律；heal 保字段；state 卡字段
- `cli-surface` — where-am-I 卡；status 露出断点；approve 双写；`deckRoot` 解析
- `framework-charter` — 入口：进度在盘（指针 + 产物），不信赖聊天
- `run-bundle-management` — `_state` README / deck-guide：断线后先 `ppt_flow state`

## Impact

- `ppt_flow.mjs`、`lib/state.mjs`（`buildResumeCard`）、NODE-SPEC / STATE README
- BOOTSTRAP、COMMANDS、AGENT_CONTRACT、template-deck-guide、轻量 playbook 注记（`create-deck` / `iterate-style` 为主）
- 验收锚点：`deck_ai_sdlc_keynote`

## Apply-ready acceptance

1. `state --json` 含 `playbook`、`current_node`、非空 `workflow_summary`、非空 `suggested_next`；有 `waiting_for` 时两者都反映「等人」
2. `status`（人读 + `--json`）露出 `playbook` / `current_node`（同源 `_state`）
3. `approve` 后 metadata ≡ `_state.gates`
4. COMMANDS 有「续跑 / 做到哪了」；Agent 路由不再写死「从第一个 node 开始」
5. 真机冒烟：只给 `deck_ai_sdlc_keynote` → 卡能表达「iterate-style / review-gate / 等人审 style master」类信息；`suggested_next` 含 `user:review-style-master`（或等价 waiting 前缀）
6. `npm test` 绿；命令数仍为 12
