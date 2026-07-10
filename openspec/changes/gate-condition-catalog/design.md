## Context

当前 gate 条件是 playbook frontmatter 中的人读字符串。测试无法验证它们。需要可执行的 CONDITIONS 注册表。

## Decisions

### 1. Gate Conditions Catalog

所有条件名使用 kebab-case。三类:

**FILESYSTEM** — 检查文件/目录是否存在:
| 条件名 | 检查 |
|--------|------|
| `run_bundle_exists` | `deck_<name>/` 目录存在 |
| `deck_guide_created` | `deck-guide.md` 存在 |
| `visual_preset_seeded` | `2_backbone/visual-style/color_palette.json` 存在 |
| `style_master_exists` | `2_backbone/visual-style/style_master.jpg` 存在 |
| `slide_specs_exists` | `3_versions/v{n}/slide-specifications.md` 存在 |
| `pptx_generated` | `_generated/ppt/*.pptx` 存在 |
| `stage1_output_exists` | `_generated/slide_plan.json` 存在 |

**STATE** — 检查 state 字段:
| 条件名 | 检查 |
|--------|------|
| `node_completed:<name>` | `state.nodes.<name>.status === 'completed'` |
| `gate_approved:<name>` | `state.gates.<name> !== 'pending'` |
| `current_node_is:<name>` | `state.current_node === <name>` |
| `playbook_is:<name>` | `state.playbook === <name>` |

**USER** — 检查用户决策:
| 条件名 | 检查 |
|--------|------|
| `user_confirmed_direction` | `state.nodes.hitl1?.decision` 存在 |
| `review_decision_proceed` | `state.nodes.hitl2?.decision === 'proceed'` |
| `review_decision_repair` | `state.nodes.hitl2?.decision === 'repair'` |

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
