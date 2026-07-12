# Node 规格宪法

> 本文定义 MD Controller 的 Playbook Node、state schema 与 gate 条件。`playbook/*.md` 是工作流内容、节点顺序与声明的唯一真相源；`scripts/lib/md_controller_reader.mjs` 只负责读取、解析、索引和校验，不定义、生成、修改或执行 playbook。

## 规范层级

- **Lifecycle Phase**：`0 → 1/2 → 2.7 → 3 → 4`
- **Method Module**：`00-setup`、`01-visual`、`02-content`、`03-prompts`、`04-production`、`05-iteration`
- **Pipeline Stage**：生产脚本 Stage 1–5
- **Playbook Node**：MD Controller 中的有序执行节点

这四个层级不可混称。尤其禁止用旧字段 `phase: 04` 表示 Method Module。

## Node 声明

有序 controller 在 Markdown 中使用 fenced YAML；standalone shared node 使用文档 frontmatter。每个 node ID 必须是全局唯一 kebab-case，且不得占用系统保留 ID `header-review`。

```yaml
node: wave0
lifecycle_phase: 1
method_module: 02-content
requires: [seed-topics]
entry: []
exit:
  - slide_specs_exists
  - evidence:l1-l2-l4-complete
produces: [slide-specifications]
```

必填字段：`node`、`lifecycle_phase`、`method_module`、`requires`、`entry`、`exit`。可选字段包括 `produces`。控制后续分支的 GATE node 还必须声明非空、无重复的 `decisions` enum。

`requires` 是唯一 node-to-node 前置机制：runtime 会在显式 `entry` 之前把每项按 `node_done:<id>` 检查。不要在 `entry` 重复前驱完成条件。

## Node body

每个 node 至少包含一个 canonical step；编号从 1 开始单调递增，类型只能是 MD、CLI、GATE：

```markdown
**Step 1 — MD**: 读方法论、做判断或更新源文件。

**Step 2 — CLI**: 运行完整 Node 命令或调用 state API。

**Step 3 — GATE**: 向用户展示可审查产物，记录 typed decision/evidence。
```

禁止 `CLI/State` 等混合标签；需要分别落成 CLI 与 MD/GATE step。

## State Schema v2

State 位于 run bundle 根目录 `_state/state.yaml`，由 `scripts/lib/state.mjs` 原子写入。`history.jsonl` 仅供审计，不参与恢复。默认 read 会按顺序 heal v1→v2，且二次读取幂等。

```yaml
schema_version: 2
playbook: create-deck
current_node: wave0
execution_id: exec-...
execution_started_at: 2026-07-12T06:00:00.000Z
started_at: 2026-07-12T05:00:00.000Z   # 整个 workflow 的稳定开始时间
updated_at: 2026-07-12T06:20:00.000Z

nodes:
  wave0:
    status: in_progress
    execution_id: exec-...
    evidence:
      sources-collected:
        met: true
        kind: agent
        at: 2026-07-12T06:15:00.000Z
  hitl2:
    status: completed
    execution_id: exec-...
    decision:
      value: proceed
      kind: user
      at: 2026-07-12T06:18:00.000Z

gates:
  content: approved
  visual: approved

playbook_stack:
  - playbook: create-deck
    current_node: rerun
    execution_id: exec-parent
    execution_started_at: 2026-07-12T06:00:00.000Z
    controller_nodes: {}
```

### Execution working set

顶层 `nodes` 只包含当前 execution 的 controller working set，加上独立 freshness contract 管理的系统保留记录（目前为 `header-review`）。controller record、evidence 与 decision 都必须匹配当前 `execution_id`；旧 execution 不能授权新 execution。

- `startPlaybook`：顶层启动新 execution；清理旧 controller records，保留系统记录。未完成 execution 只有显式 `{replace:true}` 才能替换；stack 非空时禁止调用。
- `switchPlaybook`：把 parent 的 `{playbook,current_node,execution_id,execution_started_at,controller_nodes}` 深拷贝进 stack，再创建干净 child execution。
- `resumePlaybook`：丢弃 child controller working set，恢复五字段 parent snapshot，同时保留最新系统记录。
- legacy pointer-only stack 无法恢复 provenance 时，heal 成安全阻塞 snapshot，并记录诊断；禁止猜测归属。

### Status enums

Node status 只能是 `pending`、`in_progress`、`completed`、`skipped`、`failed`。Gate status 只能是 `pending`、`approved`、`waived`。writer 拒绝其他值；heal 把非法持久值降级为阻塞的 `pending` 并保留诊断。重启 completed node 会清掉旧 `completed` 时间；完成 node 会清掉不兼容的 failure 字段。

### Typed evidence 与 decision

Evidence 形状：`{met:true, kind:"user"|"agent"|"cli", at:<ISO>, note?:<string>}`。

Decision 形状：`{value:<declared enum>, kind:"user"|"agent"|"cli", at:<ISO>, note?:<string>}`。

用 `setNodeEvidence` 与 `setNodeDecision` 写入；decision value 必须存在于 canonical node 的 `decisions` enum。legacy boolean/scalar 只可保守迁移为 `kind: agent`，绝不能伪造用户批准。

## CLI ⇔ MD 协议

- MD → CLI：先过 entry gate，再执行 CLI step。
- CLI 成功：exit 0；需要的 durable evidence/state 由负责该动作的调用方写入。
- CLI 硬失败：非零 exit，stderr 最后一个非空行必须是唯一单行 JSON envelope：`ok:false`、稳定 `code`、非空 `message`、`hint`、`where`。
- State 写入：只改本动作负责的字段；temp 文件必须与 `_state/state.yaml` 同目录，再 atomic rename。

## State API

- READ/HISTORY：`readState`、`writeState`、`statePath`、`historyPath`、`appendHistory`、`readHistory`
- QUERY：`getNodeStatus`、`getCurrentNode`、`getCompletedNodes(state,nodeIds?)`、`getPendingNodes(state,nodeIds?)`、`isNodeCompleted`、`isPlaybookComplete(state,nodeIds?)`、`getGateStatus`、`isGateApproved`
- VALIDATE：`checkEntry`、`checkExit`、`getMissingConditions`、`validateState`、`getEligibleNextNodes`
- WRITE：`setNodeStatus`、`resetNode`、`skipNode`、`setGate`、`setNodeEvidence`、`setNodeDecision`、`startPlaybook`、`switchPlaybook`、`resumePlaybook`

传入 canonical node-ID list 时，尚未写入或 execution-mismatched 的 node 都按 pending 处理；系统记录和 controller 外节点不影响 playbook completion。

## Gate Conditions Catalog

未知 condition 必须 fail closed，返回 `unknown`；不得当作“人工判断后默认通过”。`requires` 由 runtime 单独按 `node_done:<id>` 强制执行。

### Deterministic artifact conditions

| Condition | 类型 / 数据源 | 精确检查 |
|---|---|---|
| `run_bundle_exists` | filesystem / `ctx.deckDir` | run bundle 目录存在 |
| `deck_guide_created` | filesystem | `<deckDir>/deck-guide.md` 存在 |
| `visual_preset_seeded` | filesystem | `2_backbone/visual-style/color_palette.json` 存在 |
| `style_master_exists` | filesystem | `2_backbone/visual-style/style_master.jpg` 存在 |
| `slide_specs_exists` | filesystem | `<runDir>/slide-specifications.md` 存在 |
| `slide_specs_valid` | Stage 1 validation | 调用 Stage 1 同一 side-effect-free validator；零错误、无 L3 placeholder、render-required 字段齐全 |
| `pptx_generated` | filesystem | `_generated/ppt/` 恰有当前非 backup PPTX 产物 |
| `speaker_notes_injected` | receipt | 校验 `_generated/qa/notes_injection.json` schema v1、contained paths、当前 input/PPTX SHA-256 与 count equality |
| `header_review_current` | header review contract | 按当前 profile 与 execution classification scope 检查 relevant `full-page` IDs 的 reviewed hashes/fingerprint；无 relevant full-page 时才 vacuous pass |

### State/gate condition families

| Condition | 数据源 | 规则 |
|---|---|---|
| `gate_approved:<name>` | `state.gates` | status 为 `approved` 或 `waived` |
| `node_completed:<id>` | active node record | 同 execution 且 status 为 `completed` |
| `node_done:<id>` | active node record | 同 execution 且 status 为 `completed` 或 `skipped`；`requires` 自动使用此条件 |
| `node_status:<id>:<status>` | active node record | 同 execution 且精确 status 匹配 |

### Typed evidence/decision families

| Condition | 允许位置 | 规则 |
|---|---|---|
| `evidence:<key>` | 当前 node exit only | 当前 node 同 execution 的有效 evidence，任意 provenance |
| `user_evidence:<key>` | 当前 node exit only | 同上，但 `kind:user` |
| `decision_recorded` | 当前 node exit only | 当前 node 有有效 typed decision |
| `user_decision_recorded` | 当前 node exit only | 当前 node 有 `kind:user` 的 typed decision |
| `node_evidence:<required-node>:<key>` | downstream entry | source 必须在 `requires` 中、同 execution、status=`completed`；skipped 不供 evidence |
| `node_decision:<required-node>:<value>` | downstream entry | 同上，且 value 精确匹配 upstream `decisions` enum |

如果 downstream 使用 `node_decision:<node>:<value>`，upstream 必须声明该 value、包含 GATE step，并以 `decision_recorded` 或 `user_decision_recorded` 退出。

## 完整 Node 示例

````markdown
```yaml
node: wave0
lifecycle_phase: 1
method_module: 02-content
requires: [seed-topics]
entry: []
exit:
  - slide_specs_exists
  - evidence:l1-l2-l4-complete
  - evidence:sources-collected
produces: [slide-specifications]
```

# wave0: Foundation Shared Reference

**Step 1 — MD**: 读 `workflow/02-content/04-create-content-assets.md`，完成 L1/L2/L4 与来源收集。

**Step 2 — CLI**: 用 `setNodeEvidence` 记录 `l1-l2-l4-complete` 与 `sources-collected`，再 `writeState`。
````

Registry validator 必须对 9 个有序 controllers、1 个 shared node、40 个全局唯一 nodes 做零错误校验：parse、ID/reserved collision、includes/requires、dependency order/cycle、metadata、step grammar、condition catalog、decision enum 与 impossible self-entry。
