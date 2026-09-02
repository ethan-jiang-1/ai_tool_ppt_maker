## Why

状态模块（`state_identity.mjs`、`state_execution.mjs`、`state_evidence.mjs`）之间存在已验证的循环依赖：

```
state_identity.mjs ──→ state_execution.mjs (startPlaybook, createDefaultState)
       ↑                      │
       │ (4 个函数)           ↓ (2 个函数)
       └── state_evidence.mjs ←┘ (preserveReservedNodes)
```

当前靠"函数声明不产生顶层副作用"来规避 ESM 循环检测，但这是脆弱的——任何未来修改如果引入顶层副作用，会静默破坏。此外，`state.mjs` 已通过 `export { ... } from "./state_identity.mjs"` 重新导出环中部分函数，但定义仍在 `state_identity.mjs` 中，形成隐式耦合。

## What Changes

这是一个纯重构（pure refactor），不改变任何行为规范：

1. **打破循环依赖**：将环中 7 个跨模块调用的函数从 `state_identity.mjs` 和 `state_execution.mjs` 移到 `state.mjs` 中直接定义，使依赖图变为 DAG
2. **调整 state.mjs 的 re-export 块**：已移函数不再通过 `export { ... } from "./state_identity.mjs"` 重新导出，而是从 state.mjs 直接导出
3. **保持所有公共导出接口不变**：所有公共函数签名、行为、路径不变，消费者无需修改代码（因为 state.mjs 已是公共入口）

## Capabilities

### New Capabilities
- 无（纯重构，不引入新能力）

### Modified Capabilities
- 无（纯重构，不改变行为规范）

## Impact

| 范围 | 影响 |
|------|------|
| `ppt_maker_harness/scripts/shared/state/state.mjs` | 新增 7 个函数定义，调整 re-export 块 |
| `ppt_maker_harness/scripts/shared/state/state_identity.mjs` | 删除已移函数定义和导出 |
| `ppt_maker_harness/scripts/shared/state/state_execution.mjs` | 删除已移函数定义和导出 |
| `ppt_maker_harness/scripts/shared/state/state_evidence.mjs` | 调整 import（指向 state.mjs 而非 state_identity/state_execution） |
| 所有现有消费者 | 无影响——state.mjs 已是公共入口，导出接口不变 |
| 测试 | 无影响——所有测试应继续通过 |
| 外部依赖 | 无变化 |