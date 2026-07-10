## Context

当前 gate 条件是 playbook frontmatter 中的人读字符串。测试无法验证它们。需要可执行的 CONDITIONS 注册表。

关键设计问题: **gate 条件的数据从哪来？** 每个条件要么查 run bundle 文件系统，要么查 _state/ 目录 (nodes.yaml + gates.yaml + session.yaml + trace.jsonl)，要么查用户决策。必须精确到路径。

## State 在 Run Bundle 中的位置 — 极简两文件

```
deck_<name>/                          ← deckDir
├── project-metadata.yaml             ← 静态配置 (不改)
│
├── _state/                           ← 执行状态目录
│   ├── state.yaml                    ← 唯一真相源 (原子写: tmp → rename)
│   │   playbook: create-deck
│   │   current_node: wave0
│   │   playbook_stack: []
│   │   nodes:
│   │     instantiation: { status: completed }
│   │     wave0: { status: in_progress, attempts: 2 }
│   │   gates: { content: pending, visual: approved }
│   │   deck: { name: my_deck, type: keynote, style: dark-executive }
│   │
│   └── history.jsonl                 ← 可选, 纯记录, 不参与任何自动恢复
│       {"at":"...","node":"instantiation","action":"complete"}
│       {"at":"...","node":"wave0","action":"retry","attempt":2}
│
├── 1_upstream_raw_material/
├── 2_backbone/visual-style/
│   ├── color_palette.json            ← FILESYSTEM: visual_preset_seeded
│   └── style_master.jpg              ← FILESYSTEM: style_master_exists
│
└── 3_versions/v1/                    ← runDir
    ├── slide-specifications.md       ← FILESYSTEM: slide_specs_exists
    └── _generated/
        ├── slide_plan.json           ← FILESYSTEM: stage1_output_exists
        └── ppt/*.pptx                ← FILESYSTEM: pptx_generated
```

### 设计哲学: 简单即健壮

- **一个真相源** (`state.yaml`): LLM 打开就看懂. 坏了? LLM 一眼看到语法错误. node 状态不对? LLM 直接改.
- **一个可选日志** (`history.jsonl`): append-only, 纯记录. 不参与任何自动恢复逻辑. LLM 修 state.yaml 前参考它.
- **JS 不做聪明事**: 不自动重建, 不降级恢复, 不检测非法转换. JS 只做: 读 state.yaml、原子写 state.yaml、追加 history.jsonl. LLM 是大脑, JS 是手脚.
- **坏了怎么修**: LLM 读 state.yaml → 发现问题 → 读 history.jsonl 理解发生了什么 → 手动修 state.yaml. 不依赖 JS 的自动恢复.

### 原子写

`writeState` 写 tmp 文件 → `rename` 到 state.yaml. 崩溃安全.

## Decisions

### 1. Gate Conditions Catalog — 条件到数据源的精确映射

所有条件名使用 kebab-case。三类，每个条件标注数据来源的精确路径:

**FILESYSTEM** — 检查 run bundle 内的文件/目录:
| 条件名 | 检查 | 路径 (相对 deckDir) |
|--------|------|---------------------|
| `run_bundle_exists` | deck dir 存在 | `deckDir` 本身 |
| `deck_guide_created` | deck-guide.md 存在 | `deck-guide.md` |
| `visual_preset_seeded` | 配色方案已落盘 | `2_backbone/visual-style/color_palette.json` |
| `style_master_exists` | 视觉锚点图已生成 | `2_backbone/visual-style/style_master.jpg` |
| `slide_specs_exists` | slide 规格文件存在 | `3_versions/v{n}/slide-specifications.md` |
| `stage1_output_exists` | Stage 1 产出物存在 | `3_versions/v{n}/_generated/slide_plan.json` |
| `pptx_generated` | PPTX 已产出 | `3_versions/v{n}/_generated/ppt/*.pptx` |
| `speaker_notes_injected` | 备注已注入 | `.pptx 文件的 notes panel 非空` |

**STATE** — 检查 `_state/ 目录 (nodes.yaml + gates.yaml + session.yaml + trace.jsonl)` 字段:
| 条件名 | 检查 | state 路径 |
|--------|------|-----------|
| `node_completed:<name>` | node 已完成 | `_state/nodes.yaml: <name>.status === 'completed'` |
| `node_status:<name>:<s>` | node 处于某状态 | `_state/nodes.yaml: <name>.status === <s>` |
| `gate_approved:<name>` | gate 非 pending | `_state/gates.yaml: <name> !== 'pending'` |
| `current_node_is:<name>` | 当前在某 node | `_state/session.yaml: current_node === <name>` |
| `playbook_is:<name>` | 当前在某 playbook | `_state/session.yaml: playbook === <name>` |

**USER** — 检查用户决策 (存储在 `_state/nodes.yaml` 的 node extra 字段中):
| 条件名 | 检查 | state 路径 |
|--------|------|-----------|
| `user_confirmed_direction` | hitl1 有决策 | `_state/nodes.yaml: hitl1.decision` 存在 |
| `review_decision:proceed` | 用户选 proceed | `_state/nodes.yaml: hitl2.decision === 'proceed'` |
| `review_decision:repair` | 用户选 repair | `_state/nodes.yaml: hitl2.decision === 'repair'` |

### 1b. ctx 参数 — 传递路径上下文

`checkEntry` 和 `checkExit` 接受 `ctx` 参数，提供文件系统路径:

```javascript
const ctx = {
  deckDir: '/path/to/deck_myproject',     // deck 根
  runDir: '/path/to/deck_myproject/3_versions/v1',  // 当前版本
  frameworkDir: '/path/to/PPTMAKER_FRAMEWORK',       // 框架根
};
```

### 2. State API — 完整 CRUD + Query

MD 和 CLI 交替执行: 读盘→干活→写盘。State 是两边的通信协议。`state.mjs` 暴露完整的查询和操纵 API。

**READ / QUERY:**

```javascript
readState(deckDir) → state              // 读 state.yaml, 不存在→createDefaultState()
writeState(deckDir, state)              // 原子写 state.yaml (tmp→rename)
appendHistory(deckDir, event) → void    // 追加 history.jsonl (可选, 纯记录)
readHistory(deckDir) → Event[]          // 读 history.jsonl, 跳过损坏行
statePath(deckDir) → string             // deckDir/_state/

getNodeStatus(state, name)
getCurrentNode(state)
getCompletedNodes(state)
getPendingNodes(state)
isNodeCompleted(state, name)
isNodeDone(state, name)                 // completed OR skipped
isPlaybookComplete(state)
getGateStatus(state, name)
isGateApproved(state, name)

checkEntry(nodeName, playbookDir, state, ctx) → { pass, missing[], unknown[] }
checkExit(nodeName, playbookDir, state, ctx)  → { pass, missing[], unknown[] }
getMissingConditions(nodeName, playbookDir, state, ctx) → string[]
```

**WRITE / MANIPULATE — 写状态:**

```javascript
// 节点操纵
setNodeStatus(state, name, status, extra) → state
  // status ∈ pending | in_progress | completed | skipped | failed
  // extra: { decision: 'proceed', topic_count: 5, ... }
resetNode(state, name) → state               // 回退到 pending (rerun 用)
skipNode(state, name, reason) → state        // 标记 skipped + 记录原因

// Gate 操纵
setGate(state, name, status) → state

// Playbook 操纵
switchPlaybook(state, newPlaybook) → state   // 切换 playbook, 保留已有 node 状态
startPlaybook(state, playbook) → state       // 初始化新 playbook

// 工厂
createInitialState(deckName, deckType, style) → state

// 验证
validateState(state) → { valid: boolean, errors: string[] }
```

**SAFETY:** `readState` 文件不存在→返回默认空 state. YAML 损坏→返回 `{corrupted:true}`. `writeState` 原子写. JS 不自动修复——LLM 发现问题后手动修 state.yaml.

### 3. CLI 命令

```bash
# Agent 查状态
node scripts/ppt_flow.mjs state <runDir>
# → 人类可读: playbook, current_node, 已完成/待做 node, gate 状态

node scripts/ppt_flow.mjs state <runDir> --json
# → JSON, 脚本消费

# CLI 脚本验证 gate (Stage 2 前检查)
node scripts/ppt_flow.mjs state <runDir> --check-gates
# → exit 0 当 content_gate≠pending AND visual_gate≠pending
# → exit 1 + 打印缺失的 gate
```

### 4. CONDITIONS 注册表实现

```javascript
// scripts/lib/state.mjs
export const CONDITIONS = {
  'run_bundle_exists': (state, ctx) => 
    existsSync(ctx.deckDir),
  'node_completed:instantiation': (state) => 
    state.nodes.instantiation?.status === 'completed',
  'gate_approved:visual': (state) => 
    state.gates.visual !== 'pending',
  // ...
};
```

参数化条件 (`node_completed:<name>`) 在注册表中是函数工厂:
```javascript
function nodeCompleted(name) {
  return (state) => state.nodes[name]?.status === 'completed';
}
```

### 5. checkEntry/checkExit

```javascript
function checkEntry(nodeName, playbookDir, state, ctx = {}) {
  const conditions = parseNodeEntry(nodeName, playbookDir);
  const missing = [];
  const unknown = [];
  for (const cond of conditions) {
    const fn = resolveCondition(cond);
    if (!fn) { unknown.push(cond); continue; }    // 不在 catalog → 标记 unknown
    if (!fn(state, ctx)) missing.push(cond);
  }
  return { pass: missing.length === 0 && unknown.length === 0, missing, unknown };
}
```

`parseNodeEntry(nodeName, playbookDir)` — `playbookDir` 为 `PPTMAKER_FRAMEWORK/playbook/` 目录. 在该目录下搜索包含 `node: <nodeName>` 的 MD 文件, 解析其 frontmatter 的 entry/exit 列表.

**自定义条件策略**: 不在 catalog 中的条件名 → `unknown` 数组返回。Agent/测试据此知道"这个条件还没有可执行校验，需人工判断"。这允许 node 特有条件 (如 `wave0_evidence_indexed`) 先以 prose 形式存在，后补进 catalog。

### 6. 对齐 playbook frontmatter 到 catalog — 完整映射 (31 条件)

审计发现 31 个条件不在 catalog 中。全部映射如下。`custom:` 前缀的条件允许 unknown。

**create-deck 条件映射:**

| Node | 旧名 (prose) | 新名 (catalog) |
|------|-------------|---------------|
| instantiation entry | `env_check_passed` | `node_status:instantiation:completed` |
| hitl1 exit | `intake_complete` | **删除** (自指循环——拆为 `user_confirmed_direction` + setup entry 检查 `node_done:hitl1`) |
| seed-topics entry | `visual_style_locked` | `gate_approved:visual` |
| seed-topics exit | `topics_generated` | `custom:topics_generated` |
| seed-topics exit | `block_map_confirmed` | `custom:block_map_confirmed` |
| wave0 entry | `content_gate_approved` | `gate_approved:content` |
| wave0 entry | `visual_gate_approved` | `gate_approved:visual` |
| wave0 exit | `slide_specs_l1_l2_l4_complete` | `custom:slide_specs_l1_l2_l4_complete` |
| wave0 exit | `wave0_sources_collected` | `custom:wave0_sources_collected` |
| wave1 exit | `all_l3_prompts_filled` | `custom:all_l3_prompts_filled` |
| wave1 exit | `stage1_validate_passes` | `stage1_output_exists` |
| hitl2 exit | `review_complete` | `custom:review_complete` |
| readiness entry | `review_decision: proceed` | `review_decision:proceed` |
| readiness exit | `all_checks_pass` | `custom:all_checks_pass` |
| rerun entry | `review_decision: repair` | `review_decision:repair` |
| rerun exit | `fixes_confirmed` | `custom:fixes_confirmed` |
| final exit | `deck_delivered` | `custom:deck_delivered` |

**edit-text 条件映射:**

| Node | 旧名 | 新名 |
|------|------|------|
| stage-text entry | `target_slide_identified` | `custom:target_slide_identified` |
| stage-text exit | `stage_complete` | `custom:stage_complete` |
| verify-output exit | `title_updated_correctly` | `custom:title_updated_correctly` |

**edit-visual 条件映射 (含 bug 修复):**

| Node | 旧名 | 新名 | 备注 |
|------|------|------|------|
| pilot entry | `target_slides_identified (opener/body/closer)` | `custom:target_slides_identified` | 去掉括号注释 |
| pilot exit | `pilot_approved_by_user` | `custom:pilot_approved` | **统一命名** |
| confirm entry | `pilot_approved` | `custom:pilot_approved` | **与 pilot exit 对齐** |
| confirm exit | `scope_confirmed` | `custom:scope_confirmed` |
| regenerate exit | `all_images_regenerated` | `custom:all_images_regenerated` |
| regenerate exit | `pptx_updated` | `custom:pptx_updated` |
| verify-output exit | `visual_change_verified` | `custom:visual_change_verified` |

**edit-notes 条件映射:**

| Node | 旧名 | 新名 |
|------|------|------|
| inject-notes entry | `pptx_exists` | `pptx_generated` (别名) |
| inject-notes exit | `notes_injected` | `speaker_notes_injected` (别名) |

**restructure-slides 条件映射:**

| Node | 旧名 | 新名 |
|------|------|------|
| new-version entry | `current_version_exists` | `custom:current_version_exists` |
| new-version exit | `new_version_created` | `custom:new_version_created` |
| regenerate-affected exit | `affected_slides_regenerated` | `custom:affected_slides_regenerated` |

**classify-change (shared):**

| Node | 旧名 | 新名 |
|------|------|------|
| entry | `user_request_received` | `custom:user_request_received` (始终 unknown——Agent 人工判断) |
| exit | `change_type_identified` | `custom:change_type_identified` |
| exit | `playbook_selected` | `custom:playbook_selected` |

### 7. 审计修复 — 7 个 CRITICAL

**1. 条件名格式统一**: 参数化条件用冒号 (`gate_approved:visual`), 原子条件用下划线 (`run_bundle_exists`). `review_decision: proceed` → `review_decision:proceed`.

**2. `node_done:<name>` 条件**: 接受 `completed` OR `skipped`. 替代 `node_completed:<name>` 用于 requires 链. 跳过的 node 不阻塞下游.

**3. Playbook 栈**: state 加 `playbook_stack: [{playbook, current_node}]`. `switchPlaybook` push 当前位置. `resumePlaybook` pop 恢复.

**4. 原子写**: `writeState` 先写 `.tmp` 文件再 `rename`——防 crash 损坏.

**5. `intake_complete` 自指修复**: hitl1 exit = `user_confirmed_direction` 单条件. setup entry = `node_done:hitl1` + `user_confirmed_direction`. 不再自指.

**6. Rerun 循环**: 用 `resetNode` (→ pending) 而非 `setNodeStatus(completed→in_progress)` 重新进入. resetNode 清除 extra 字段, 允许重新执行. `validateState` 检查 `resetNode` 调用是否合法 (只有 rerun 路径允许).

**7. `pptx_exists` / `notes_injected` 别名**: 注册为 catalog 别名指向 `pptx_generated` / `speaker_notes_injected`.

### 8. 测试扩展

新增 10 个测试场景:
1. checkEntry 返回 {pass:false, missing:[...]}
2. checkExit 返回 {pass:true} 当条件满足
3. validateState 检测非法状态转换 (completed→in_progress 被拒绝)
4. node_done 接受 skipped (skipNode → checkEntry passes)
5. resetNode 清除 extra 字段, 允许 rerun
6. playbook_stack: switchPlaybook push → resumePlaybook pop 恢复位置
7. 原子写: 写入临时文件 → rename → 读回正确
8. YAML round-trip: 特殊字符保真
9. state 损坏: 写入无效 YAML → readState 返回 {corrupted:true}
10. 空 state: 文件不存在 → readState 返回初始态
