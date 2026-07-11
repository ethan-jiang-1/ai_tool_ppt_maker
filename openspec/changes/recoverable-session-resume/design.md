## Context

**北星场景：** 小白断线 → 新会话只给 `deck_*`（或问「做到哪了」）→ Agent 必须从**磁盘**回答整条 workflow 位置并继续，而不是重做 intake，也不是只甩一个 playbook 文件名。

Playbook `current_node` 是指针的一层；**整流程**还包括门闩与产物（style master、slide plan、页图比例、pptx、pilot）。二者合成「你在哪儿」。旧 framing「playbook resume」过窄；本设计叫 **session / whole-workflow resume**。

真机锚点：`deck_ai_sdlc_keynote`（`iterate-style`@`review-gate`，`waiting_for`，gates waived，页图部分就绪）。

约束：Node ESM；12 命令；不新建 Phase 状态机文件；不把 API 任务塞进 `_state`。

## Goals / Non-Goals

**Goals:**

- 小白一问「做到哪了」→ 一句人话 + 可执行下一步（整流程，不只 playbook）
- 清上下文后续跑仪式强制读盘
- 节点写盘 + `waiting_for`
- approve 双写消漂移
- 文档与 COMMANDS 同义词覆盖断线/接着做

**Non-Goals:**

- 另建 `workflow_phase.yaml` 第二真相源（用启发式摘要即可）
- mid-node Step 图；history 自动重放；第 13 命令；会话 DB

## Decisions

### D1 — 续跑仪式 = 整会话入口（不是新 playbook）

已有 `deck_*` 或用户说「做到哪了 / 接着做 / 断线了继续」时：

1. `ppt_flow state`（`deckRoot(resolve(runDir))`）
2. `ppt_flow status`（产物 + metadata 门闩）
3. 合成 where-am-I（见 D3）用人话讲给用户
4. 加载活跃 `playbook/<name>.md` 从 `current_node` 续（`checkEntry`）
5. 确认：「从这里接着做？」——用户否认重开才重置

绿场「帮我做个新 PPT」且无 in-progress state 时才走 intake。

### D2 — Write discipline + `waiting_for`

同前：进出节点 `writeState`；等人 `waiting_for`/`note`；heal 保字段。

### D3 — Where-am-I 卡（state 为主，status 互补）

`state.mjs` 导出 `buildResumeCard(state, statusSnapshot?)`：

**必有字段：**

| 字段 | 含义 |
|------|------|
| `playbook`, `current_node`, `node_status` | 执行指针 |
| `waiting_for`, `note` | 等人原因（可空） |
| `gates` | `_state` 门闩 |
| `playbook_stack` | 栈顶摘要 |
| `workflow_summary` | **整流程人话一行**（中英均可，默认中文短句） |
| `suggested_next` | 下一步短句 |

**`workflow_summary` 启发式（只读，不写盘）——按优先级拼短句，例如：**

1. 有 `waiting_for` → 「卡在等人：`<waiting_for>`（playbook/node）」
2. 否则结合可选 status 快照：缺 style master → 「视觉母版未就绪」；有 master 无人图/少图 → 「内容/视觉已有源，生产页图进行中 N/M」；有 pptx → 「已有交付 PPTX，可迭代修改」
3. 再贴 playbook/node：「执行点：`<playbook>` / `<current_node>`」

无 status 快照时，仅用 state 也能给出「执行点 + waiting」摘要（降级可接受）。

**`suggested_next`：** 同前（waiting → continue → advance → inspect）。

`ppt_flow state`：打印卡；`--json` 含上述字段。  
`ppt_flow status`：增加 Playbook 断点行；若方便可打印同一 `workflow_summary`（可再调 `buildResumeCard`）。

仍 **12** 命令。

### D4 — approve 双写

不变：metadata + `_state.gates` + `writeState`。

### D5 — Docs / 小白说法

COMMANDS 节名用 **续跑 / 做到哪了**（勿叫成仅 playbook）：断线、清聊天、接着做、我做到哪了 → 仪式。  
BOOTSTRAP / CONTRACT：进度在 deck（`_state` + `_generated` 产物），不在聊天。  
强调：Agent 回答小白时先读卡，再动手。

### D6 — 真机锚点

`deck_ai_sdlc_keynote`：断线后应能说出「视觉审图等待 / review-gate / 页图未满」并继续 iterate-style，而不是重跑 migrate 或绿场。

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| 名字/文档仍像只续 playbook | 已改 change 名；COMMANDS/BOOTSTRAP 用「做到哪了」 |
| `workflow_summary` 不准 | 短启发式 + 以 state 指针为准；status 仅补产物 |
| 双真相（state vs status 门闩） | D4 双写 |

## Migration Plan

1. `buildResumeCard` + CLI + `deckRoot` 修正 + 测试  
2. NODE-SPEC / STATE README  
3. Docs（续跑说法面向小白整流程）  
4. 真机 deck 冒烟  

## Open Questions

无。
