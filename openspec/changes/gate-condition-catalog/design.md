## Context

当前 gate 条件是 playbook frontmatter 中的人读字符串。测试无法验证它们。需要可执行的 CONDITIONS 注册表。

关键设计问题: **gate 条件的数据从哪来？** 每个条件要么查 run bundle 文件系统，要么查 run-bundle-state.yaml，要么查用户决策。必须精确到路径。

## State 在 Run Bundle 中的位置

```
deck_<name>/                          ← deckDir (所有条件的根)
├── project-metadata.yaml             ← 静态配置 (不改)
├── run-bundle-state.yaml             ← 执行状态 (Agent 读写)
│   ├── playbook: create-deck         ← "我在哪个 workflow"
│   ├── current_node: wave0           ← "我现在在哪个 node"
│   ├── nodes: {...}                  ← 每个 node 的状态
│   ├── gates: {content, visual}      ← 人审 gate
│   └── deck: {name, type, style}     ← 静态信息镜像
│
├── deck-guide.md
├── CLAUDE.md
│
├── 1_upstream_raw_material/          ← 原始素材
│
├── 2_backbone/                       ← 主干 (共享)
│   ├── core-metaphor.md
│   ├── core-formula.md
│   ├── visual-style/
│   │   ├── color_palette.json        ← FILESYSTEM: visual_preset_seeded
│   │   ├── style_master.jpg          ← FILESYSTEM: style_master_exists
│   │   ├── deck_system.txt
│   │   └── style-master-prompt.md
│   └── ...
│
└── 3_versions/
    └── v1/                           ← runDir
        ├── slide-specifications.md   ← FILESYSTEM: slide_specs_exists
        ├── overrides/
        └── _generated/
            ├── slide_plan.json       ← FILESYSTEM: stage1_output_exists
            ├── page_prompts/
            ├── page_images_full/
            ├── header_locked/
            └── ppt/
                └── <name>.pptx       ← FILESYSTEM: pptx_generated
```

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

**STATE** — 检查 `run-bundle-state.yaml` 字段:
| 条件名 | 检查 | state 路径 |
|--------|------|-----------|
| `node_completed:<name>` | node 已完成 | `state.nodes.<name>.status === 'completed'` |
| `node_status:<name>:<s>` | node 处于某状态 | `state.nodes.<name>.status === <s>` |
| `gate_approved:<name>` | gate 非 pending | `state.gates.<name> !== 'pending'` |
| `current_node_is:<name>` | 当前在某 node | `state.current_node === <name>` |
| `playbook_is:<name>` | 当前在某 playbook | `state.playbook === <name>` |

**USER** — 检查用户决策 (存储在 state 的 node extra 字段中):
| 条件名 | 检查 | state 路径 |
|--------|------|-----------|
| `user_confirmed_direction` | hitl1 有决策 | `state.nodes.hitl1?.decision` 存在 |
| `review_decision_proceed` | 用户选 proceed | `state.nodes.hitl2?.decision === 'proceed'` |
| `review_decision_repair` | 用户选 repair | `state.nodes.hitl2?.decision === 'repair'` |

### 1b. ctx 参数 — 传递路径上下文

`checkEntry` 和 `checkExit` 接受 `ctx` 参数，提供文件系统路径:

```javascript
const ctx = {
  deckDir: '/path/to/deck_myproject',     // deck 根
  runDir: '/path/to/deck_myproject/3_versions/v1',  // 当前版本
  frameworkDir: '/path/to/PPTMAKER_FRAMEWORK',       // 框架根
};
```

### 2. CONDITIONS 注册表实现

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

### 3. checkEntry/checkExit

```javascript
function checkEntry(nodeName, playbookDir, state, ctx = {}) {
  const conditions = parseNodeEntry(nodeName, playbookDir);
  const missing = [];
  for (const cond of conditions) {
    const fn = resolveCondition(cond, state);
    if (!fn(state, ctx)) missing.push(cond);
  }
  return { pass: missing.length === 0, missing };
}
```

`parseNodeEntry` 读 playbook MD 文件，解析 frontmatter 的 `entry` 列表。

### 4. 测试扩展

新增 5 个测试场景:
1. checkEntry 返回 missing 列表
2. checkExit 在条件满足时返回 pass
3. 非法状态转换 (completed → in_progress) 被拒绝
4. skipped 状态对 requires 链的影响
5. YAML round-trip: 特殊字符、嵌套对象保真
