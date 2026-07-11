## Context

**北星：** 小白断线 → 新会话只给 `deck_*`（或问「做到哪了」）→ Agent 必须从磁盘回答**整条 workflow**位置并继续——不是重做 intake，也不是只甩 playbook 文件名。

两层真相、一张卡：

```
_state (指针) ──┐
                ├──► buildResumeCard → workflow_summary + suggested_next
status (产物) ──┘
```

真机锚点：`deck_ai_sdlc_keynote`（`iterate-style` @ `review-gate`，`waiting_for: user:review-style-master`，gates waived，页图部分就绪）。

约束：Node ESM；**12** 命令；不新建 Phase 状态文件；不把 API 任务塞进 `_state`。

## Goals / Non-Goals

**Goals**

- 「做到哪了」→ 一句人话 + 可执行下一步（整流程）
- 清上下文 → 强制读盘仪式
- 节点写盘 + `waiting_for`；approve 双写消漂移
- 文档覆盖断线/接着做同义词

**Non-Goals**

- `workflow_phase.yaml` 第二写盘真相
- mid-node Step 图；history 自动重放；第 13 命令；会话 DB

## Decisions

### D1 — Session resume ritual（不是新 playbook）

触发：用户指向已有 `deck_*`，或说「做到哪了 / 接着做 / 断线了 / 清了聊天继续」。

顺序（硬）：

1. `ppt_flow state <runDir>` — 与 `status`/`approve` 一致：`deckRoot(resolve(runDir))`，**禁止**单独写 `join(runDir,'..','..')` 且不 `resolve`（相对路径、cwd 漂移会踩坑）
2. `ppt_flow status <runDir>` — 产物 + metadata 门闩
3. 用人话讲 where-am-I（优先复述卡上的 `workflow_summary` + `suggested_next`）
4. 加载 `playbook/<active>.md`，从 `current_node` 续（`checkEntry`）
5. 一句确认：「从这里接着做？」——用户明确要重开才重置

绿场「帮我做个新 PPT」且无 in-progress `_state` 时才走 intake / 从第一 node 开始。

### D2 — Write discipline + `waiting_for`

- 进出节点：`setNodeStatus` + `writeState`（或等价）后再依赖进度
- 等人：当前 node 写 `waiting_for`（短 machine token，如 `user:review-style-master`）+ 可选 `note`
- 离开等待：清或更新 `waiting_for`
- `healState` / round-trip：**不得丢弃**已有 `waiting_for` / `note`（若规范化 node 记录，这两个字段必须保留）

### D3 — `buildResumeCard(state, statusSnapshot?)`

住在 `state.mjs`，供 `state` / `status` 复用。

**返回对象（字段钉死）：**

| 字段 | 类型 | 含义 |
|------|------|------|
| `playbook` | string | 活跃 playbook |
| `current_node` | string | 当前 node |
| `node_status` | string | `nodes[current_node].status` 或 `""` |
| `waiting_for` | string \| null | 当前 node 的 waiting_for，无则 null |
| `note` | string \| null | 当前 node 的 note，无则 null |
| `gates` | object | `_state.gates` 拷贝 |
| `playbook_stack` | array | 栈摘要（可原样） |
| `workflow_summary` | string | **非空**中文短句（整流程位置） |
| `suggested_next` | string | **非空**下一步（可含 machine token） |

**`statusSnapshot`（可选）形状——与 `collectStatus` 对齐的只读子集：**

```
{
  style_master: boolean,
  raw_images: number,
  expected_slides: number,
  pptx: string[],          // 空数组 = 无 pptx
  pilot_preview: boolean,
  content_gate: string,    // metadata
  visual_gate: string
}
```

无快照时：摘要只靠 state（执行点 + waiting）——降级可接受。

#### `workflow_summary` 启发式（按优先级，取第一条能拼出的主句，再可附「执行点」）

1. 若 `waiting_for` 非空 → `卡在等人：<waiting_for>（<playbook>/<current_node>）`
2. 否则若有快照且 `!style_master` → `视觉母版未就绪（<playbook>/<current_node>）`
3. 否则若有快照且 `style_master` 且 `raw_images < expected_slides`（且 expected>0）→ `生产页图进行中 <raw>/<expected>（执行点 <playbook>/<current_node>）`
4. 否则若有快照且 `pptx.length > 0` → `已有交付 PPTX，可迭代（执行点 <playbook>/<current_node>）`
5. 否则 → `执行点：<playbook> / <current_node>`（playbook/node 空则用「（未初始化）」类兜底，仍须非空字符串）

#### `suggested_next` 启发式（按优先级）

1. `waiting_for` 非空 → `waiting:<waiting_for>`
2. 否则 `node_status === 'in_progress'` → `continue:<playbook>/<current_node>`
3. 否则有 `current_node` → `advance-or-inspect:<playbook>/<current_node>`
4. 否则 → `inspect:run ppt_flow state|status`

语言：`workflow_summary` 默认中文；`suggested_next` 可用短英文 token 前缀（便于测），人读 state 时可原样打印。

#### CLI 呈现

**`ppt_flow state`（人读）至少打印：**

- Playbook / Current / node status  
- Waiting（若有）/ Note（若有）  
- Gates（`_state`）  
- Summary（`workflow_summary`）  
- Next（`suggested_next`）  
- Done/Pending 可保留现有列表  

**`state --json`：** 在可用 state 对象上**顶层增加** `workflow_summary`、`suggested_next`（以及实现若方便可带 `node_status` / 展平的 `waiting_for`）；**不要**另起第 13 命令或只输出不含指针的瘦卡。

**`ppt_flow status`：**

- 人读：增加 Playbook / Current 行；若已调 `buildResumeCard`，可再打 Summary 一行  
- `--json`：对象须含 `playbook`、`current_node`（缺 `_state` 时仍报告 heal 后的种子值，不得静默省略）

仍 **12** 命令。

### D4 — approve 双写

`approve` 写 `project-metadata.yaml` 的 `content_gate`/`visual_gate` **且** `writeState` 同步 `_state.gates.<gate>` 为同一 `approved`|`waived`。可选 `appendHistory` `gate_set`。管线 readiness 可继续读 metadata；`state --check-gates` 与续跑读 `_state`。

### D5 — Docs / 小白说法（apply 时按此落字）

**COMMANDS.md** — 新增节（建议放在「内容 & 文字变更」与「Agent 路由逻辑」之间），标题：**续跑 / 做到哪了**

| 用户说（至少覆盖） | 动作 | 说明 |
|--------------------|------|------|
| 「接着做」「继续」 | session resume ritual | 读盘 → 从 current_node 续 |
| 「我做到哪了」「上次做到哪」 | 同上 | 先人话汇报再动手 |
| 「清了聊天继续」「断线了继续」 | 同上 | 进度在 deck，不在聊天 |

说明行写清：这是**整流程**续跑，不是新 playbook；目标 playbook = `_state.playbook`。

**Agent 路由逻辑** 改为分支，**删除**「一律从第一个 node 开始」：

```
匹配意图
  → 若已有 deck 且（续跑说法 | 用户只丢了 deck 路径）→ session resume ritual
  → 否则加载 playbook
       → 有 in-progress _state 且同 playbook → 从 current_node 续
       → 确认的绿场 → 从第一个 node 开始
  → writeState 纪律
```

**BOOTSTRAP：** 「已有 deck / 断线回来」小节：先 state+status，人话 where-am-I，再决定是否 intake。  
**AGENT_CONTRACT §1：** 进度在盘（`_state` 指针 + status/产物）；不信赖聊天；写盘纪律。  
**template-deck-guide / `_state` README：** 清上下文 → `ppt_flow state`。

Playbook 注记范围（控制 apply 面）：`create-deck`、`iterate-style` 正文加一句「进出节点 writeState；等人写 waiting_for」即可；其它 playbook 不强制本 change 逐个改完。

### D6 — 真机冒烟期望（`deck_ai_sdlc_keynote`）

在当前 truth-aligned 状态下，`state --json` 应近似满足：

- `playbook === "iterate-style"`
- `current_node === "review-gate"`
- `waiting_for` 含 `user:review-style-master`（顶层或 `nodes.review-gate`）
- `suggested_next` 含该 token（如 `waiting:user:review-style-master`）
- `workflow_summary` 含「等人」或 `waiting_for` / `review-gate` 之一类信号

Agent 清上下文后只拿到该 deck 路径时：打开 `style_master.jpg` → LOCK/RETRY/BACK 路径；**不**重跑 `migrate-import` / 绿场 intake。

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| 文档仍像只续 playbook | change 名 + COMMANDS「做到哪了」+ summary 启发式用产物 |
| `workflow_summary` 偶发不准 | 短启发式；指针优先；status 只补产物 |
| metadata vs `_state` 门闩漂移 | D4 双写 + 测试 |
| apply 时改太多 playbook | D5 限定 create-deck / iterate-style |

## Migration Plan

1. `buildResumeCard` + `deckRoot` + state/status/approve + 单测  
2. NODE-SPEC / STATE header+README  
3. Docs（COMMANDS / BOOTSTRAP / CONTRACT / deck-guide）  
4. 两 playbook 注记  
5. `npm test` + keynote 冒烟  

## Open Questions

无——启发式与验收锚点已钉死；若真机页图比例变化，summary 条文 3 仍成立，冒烟以 waiting/review-gate 为主断言。
