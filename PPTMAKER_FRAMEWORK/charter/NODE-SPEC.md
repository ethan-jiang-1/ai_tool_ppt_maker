# Node 规格宪法

> 本文定义 Playbook 体系中 **Node** 的解剖结构、State Schema、和执行规则.
> 这是整个 MD Controller 体系的基石——所有 playbook 和 CLI 脚本都按此规格读写 state.

## Node 解剖

每个 Node 是一个 Markdown 文件, 由 **YAML frontmatter** (元数据) 和 **Markdown body** (执行步骤) 组成.

### Frontmatter 字段

```yaml
---
node: <kebab-case>           # Node 唯一标识
playbook: <playbook-name>    # 所属 playbook (shared node 此项为空)
phase: <00-05>               # 对应 Phase
requires:                    # 前置 node, 必须 completed 才能进
  - <node-name>
optional-deps:               # 可选前置, 有更好没有也可以
  - <node-name>
produces:                    # 产出物 (文件 / gate 决策 / state 字段)
  - <artifact-name>
entry:                       # ENTRY GATE: 进场前必须满足的条件
  - <condition>
exit:                        # EXIT GATE: 出场前必须满足的条件
  - <condition>
shared: false                # true = 可被多个 playbook 通过 includes 引用
---
```

### Body 结构

Node body 是 Agent 读取的执行指令. 每步标注类型:

```markdown
## Step N — MD
Agent 读方法论文档、做创意判断、人机交互.
引用 workflow/ 下的文件, 不重复其内容.

## Step N — CLI
调脚本. 写完整命令 + 参数占位符.
node scripts/<script>.mjs --arg <value>
```

## State Schema

> **单一真相源**: state 模型的规范定义在 openspec spec [`node-specification`](../../openspec/specs/node-specification/spec.md) 和 [`playbook-execution`](../../openspec/specs/playbook-execution/spec.md). 下面是给 agent 的**快速参考快照**——若快照与 spec 冲突, **以 spec 为准**, 并同步更新本快照 (这是防止 state 模型再次漂移的约定).

State 存放在 run bundle 根目录的 `_state/` 目录 (`deck_<name>/_state/`): `state.yaml` 是唯一真相源 (原子写), `history.jsonl` 是 append-only 参考日志 (仅供 LLM 参考, 不参与自动恢复). 与 `project-metadata.yaml` **共存**: state 管执行进度, metadata 管静态配置.

```yaml
# _state/state.yaml
playbook: create-deck       # 当前 playbook
current_node: wave0           # 当前执行到的 node
started_at: 2026-07-10T14:00:00Z
updated_at: 2026-07-10T14:23:00Z

nodes:                        # 每个 node 的状态
  instantiation:
    status: completed
    started: 2026-07-10T14:00:00Z
    completed: 2026-07-10T14:05:00Z
  hitl1:
    status: completed
    decision: proceed          # node 特有字段可选
  wave0:
    status: in_progress
  review-gate:                 # 示例：等人审图
    status: in_progress
    waiting_for: user:review-style-master   # 可选；短 machine token
    note: open style_master.jpg → LOCK/RETRY/BACK  # 可选；人话

gates:                        # 人审 gate
  content: pending             # pending | approved | waived
  visual:  pending

deck:                         # 静态 deck 信息 (从 metadata 镜像)
  name: my_deck
  type: keynote
  style: dark-executive
```

### Node Status 枚举

| Status | 含义 |
|--------|------|
| `pending` | 未开始 |
| `in_progress` | 正在执行 |
| `completed` | 所有 exit 条件满足 |
| `skipped` | 用户明确跳过 |
| `failed` | 阻塞, 需人工干预 |

### Gate Status 枚举

| Status | 含义 |
|--------|------|
| `pending` | 等待人审 |
| `approved` | 人审通过 |
| `waived` | 用户明确跳过 |

## Playbook 规则

### Node 串联

Playbook 是**有序 node 序列**. Agent 按 playbook 中 node 出现的顺序执行. 每个 node 的 `requires` 字段声明前置依赖——如果前置 node 不是 `completed`, Agent 必须先完成它.

### Shared Node

`shared: true` 的 node 可被多个 playbook 引用. Playbook 通过 frontmatter 的 `includes` 字段声明:

```yaml
---
playbook: edit-text
includes: [classify-change]
---
```

引用的 shared node 行为上等同于写在 playbook 里, 但不复制内容.

### CLI ⇔ MD 协议

- **MD → CLI**: Agent 执行 CLI step 前, 确保 `entry` 条件满足. 将 `_state/state.yaml` 路径传给脚本
- **CLI → MD（成功）**: 脚本执行后写 state (node status, 产出物路径, 时间戳). exit 0
- **CLI → MD（失败 · 宪法）**: entry 不满足、参数非法、未捕获异常等硬失败 → **非零 exit + stderr 最后一个非空行为单行 JSON envelope**
  （`ok:false`, 稳定 `code`, `message`, `hint`, `where`）。MD Controller / agent 取末非空行 `JSON.parse`，按 `code`/`hint` 修复。
  禁止仅打印散文 `Fatal error` 致盲。权威: `charter/CONSTITUTION.md`「CLI 失败回执宪法」。
- **State 读写**: 写操作只更新自己负责的字段. 读操作前先加载最新 state

## State API

`scripts/lib/state.mjs` 提供完整 CRUD + Query API.

**READ**: `readState(deckDir)`, `writeState(deckDir, state)`, `statePath(deckDir)`, `historyPath(deckDir)`

**HISTORY**: `appendHistory(deckDir, event)` (原子 append 一行 JSON 到 `_state/history.jsonl`), `readHistory(deckDir)` (返回所有可解析事件, 跳过损坏行). History 仅供 LLM 参考, 不参与自动恢复.

**QUERY**: `getNodeStatus(state, name)`, `getCurrentNode(state)`, `getCompletedNodes(state)`, `getPendingNodes(state)`, `isNodeCompleted(state, name)`, `isPlaybookComplete(state)`, `getGateStatus(state, name)`, `isGateApproved(state, name)`

**VALIDATE**: `checkEntry(node, playbookDir, state, ctx)`, `checkExit(node, playbookDir, state, ctx)`, `getMissingConditions(node, playbookDir, state, ctx)`, `validateState(state)`

**WRITE**: `setNodeStatus(state, name, status, extra)`, `resetNode(state, name)`, `skipNode(state, name, reason)`, `setGate(state, name, status)`, `switchPlaybook(state, newPlaybook)`, `resumePlaybook(state)`, `startPlaybook(state, playbook)`, `createInitialState(deckName, deckType, style)`

**SAFETY**: `readState` 文件不存在 → 返回初始态. **默认 heal**（`heal: true`）：容错解析 + schema 归一；脏则规范回写；完全不可解 → `state.yaml.broken.<ts>` + seed 可用态. `{corrupted:true}` 仅 `heal: false` 诊断或无法产出可用态时. `writeState` 原子写 (tmp → rename). MD：先修后问，不把 YAML 语法题甩给用户（见 CONSTITUTION「MD↔JS 互补健壮性」).

## Gate Conditions Catalog

条件名统一格式: 参数化条件用冒号 (`gate_approved:visual`), 原子条件用下划线 (`run_bundle_exists`). 所有 playbook frontmatter 的 entry/exit 条件必须使用本 catalog 中的标准名.

### FILESYSTEM — 检查 run bundle 内文件/目录

| 条件名 | 检查 | 路径 (相对 ctx) |
|--------|------|----------------|
| `run_bundle_exists` | deck dir 存在 | `ctx.deckDir` 本身 |
| `deck_guide_created` | deck-guide.md 存在 | `ctx.deckDir/deck-guide.md` |
| `visual_preset_seeded` | 配色方案已落盘 | `ctx.deckDir/2_backbone/visual-style/color_palette.json` |
| `style_master_exists` | 视觉锚点图已生成 | `ctx.deckDir/2_backbone/visual-style/style_master.jpg` |
| `slide_specs_exists` | slide 规格文件存在 | `ctx.runDir/slide-specifications.md` |
| `stage1_output_exists` | Stage 1 产出物存在 | `ctx.runDir/_generated/slide_plan.json` |
| `pptx_generated` | PPTX 已产出 | `ctx.runDir/_generated/ppt/*.pptx` |
| `speaker_notes_injected` | 备注已注入 | pptx notes panel 非空 |

### STATE — 检查 `_state/state.yaml` 字段

| 条件名 | 检查 | state 路径 |
|--------|------|-----------|
| `node_completed:<name>` | node 已完成 | `state.nodes.<name>.status === 'completed'` |
| `node_done:<name>` | node 已完成或被跳过 | `['completed','skipped'].includes(state.nodes.<name>?.status)` |
| `node_status:<name>:<s>` | node 处于某状态 | `state.nodes.<name>.status === <s>` |
| `gate_approved:<name>` | gate 非 pending | `state.gates.<name> !== 'pending'` |
| `current_node_is:<name>` | 当前在某 node | `state.current_node === <name>` |
| `playbook_is:<name>` | 当前在某 playbook | `state.playbook === <name>` |

`node_done:<name>` 用于 requires 链——跳过的 node 不阻塞下游. `node_completed:<name>` 用于严格检查.

### USER — 检查用户决策 (存储在 node extra 字段)

| 条件名 | 检查 | state 路径 |
|--------|------|-----------|
| `user_confirmed_direction` | hitl1 有决策 | `state.nodes.hitl1?.decision` 存在 |
| `review_decision:proceed` | 用户选 proceed | `state.nodes.hitl2?.decision === 'proceed'` |
| `review_decision:repair` | 用户选 repair | `state.nodes.hitl2?.decision === 'repair'` |

### Playbook 栈

`state.playbook_stack` 数组保存切换前的 `{playbook, current_node}`. `switchPlaybook` push, `resumePlaybook` pop 恢复.

### 自定义条件策略

不在 catalog 中的条件名 → checkEntry/checkExit 返回 `{unknown: [...]}`. Agent 人工判断. 允许 node 特有 prose 条件逐步补进 catalog.

## 示例: 一个完整的 Node

```markdown
---
node: wave0
playbook: create-deck
phase: 04
requires: [seed-topics]
produces: [wave0-artifacts, foundation-sources]
entry:
  - run_bundle_exists
  - seed_topics_complete
exit:
  - wave0_sources_collected
  - wave0_evidence_indexed
---

# wave0: Foundation Shared Reference

## Step 1 — MD
读 workflow/02-content/04-create-content-assets.md.
为每个 topic 收集 foundation source metadata.

## Step 2 — CLI
node scripts/unified_pipeline.mjs --run-dir <dir> --stage 1

## Step 3 — Gate
人工审查收集的 source. 确认齐全后更新 state: node wave0 → completed
```
