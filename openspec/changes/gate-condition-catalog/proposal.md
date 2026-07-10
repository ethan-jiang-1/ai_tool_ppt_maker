## Why

Playbook 体系定义了 Node 的 entry/exit gate 概念，但 gate 条件只存在于 frontmatter 的人读字符串中——没有可执行的校验逻辑。`state.mjs` 能存取数据但不能验证流程。`tests_e2e/` 只能测数据持久化，不能测 gate 逻辑。

测试倒逼设计：要写出有意义的 state machine 测试，必须先定义 gate 条件如何被检查。

## What Changes

**1. charter/NODE-SPEC.md 补全 Gate Conditions Catalog**

可执行的条件词汇表。每个条件有标准名称、检查逻辑、实现方式:

| 条件名 | 类型 | 检查逻辑 |
|--------|------|---------|
| `run_bundle_exists` | FILESYSTEM | deck dir 存在 |
| `env_check_passed` | STATE | node instantiation = completed |
| `intake_complete` | STATE + USER | node hitl1 = completed + decision 字段 |
| `visual_preset_seeded` | FILESYSTEM | color_palette.json 存在 |
| `content_gate_approved` | STATE | gate content ≠ pending |
| `visual_gate_approved` | STATE | gate visual ≠ pending |
| `pptx_generated` | FILESYSTEM | .pptx 文件存在 |
| ... | ... | ... |

三种类型: FILESYSTEM (检查文件)、STATE (检查 state 字段)、USER (检查用户决策)。

**2. scripts/lib/state.mjs 实现 checkEntry/checkExit**

```javascript
checkEntry(nodeName, playbookDir, state) → { pass: bool, missing: string[] }
checkExit(nodeName, playbookDir, state) → { pass: bool, missing: string[] }
```

读 playbook MD 文件的 node frontmatter，解析 entry/exit 条件列表，对每个条件调用 CONDITIONS 注册表中的检查函数。

**3. tests_e2e/ 扩展测试**

真实 gate 测试: 调 checkEntry/checkExit，验证返回值。非法状态转换、skipped 状态、YAML round-trip。

## Capabilities

### Modified Capabilities

- `node-specification`: charter/NODE-SPEC.md 新增 Gate Conditions Catalog
- `playbook-execution`: state.mjs 新增 gate 校验函数
- `state-simulation-tests`: tests_e2e/ 扩展覆盖
