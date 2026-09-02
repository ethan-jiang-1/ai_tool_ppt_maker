## Context

状态模块之间存在已验证的循环依赖（见 proposal.md 的发现 B）。当前靠"函数声明不产生顶层副作用"规避 ESM 循环检测，这是脆弱的。

### 当前依赖图（简化）

```
state_identity.mjs ──→ state_execution.mjs (startPlaybook, createDefaultState)
       ↑                      │
       │ (4 个函数)           ↓ (2 个函数)
       └── state_evidence.mjs ←┘ (preserveReservedNodes)
```

另有平行边：
- `state_execution.mjs → state_identity.mjs` (resolveEffectiveStyleMasterSelection)
- `state_identity.mjs → state_evidence.mjs` (9 个函数)

### state.mjs 已是 re-export hub

state.mjs 当前通过 `export { ... } from` 重新导出所有 state 子模块的公共函数：

| 源模块 | state.mjs 中 re-export 行 |
|--------|--------------------------|
| `state_execution.mjs` | L770-795 |
| `state_identity.mjs` | L797-811 |
| `state_evidence.mjs` | L813-826 |
| `state_progressive.mjs` | L828-843 |

这意味着 `inspectRunProductionIdentity` 和 `resolveEffectiveStyleMasterSelection` 已经可以从 state.mjs 访问（通过 re-export），但**定义仍在 state_identity.mjs 中**。本 change 将定义移到 state.mjs 中，并将 re-export 改为直接导出。

### 涉及文件

- `ppt_maker_harness/scripts/shared/state/state.mjs` (842 行，核心 I/O + re-export hub)
- `ppt_maker_harness/scripts/shared/state/state_identity.mjs` (744 行)
- `ppt_maker_harness/scripts/shared/state/state_execution.mjs` (634 行)
- `ppt_maker_harness/scripts/shared/state/state_evidence.mjs` (841 行)
- 不修改：`state_progressive.mjs`、`md_controller_reader.mjs`、`target_authoring_draft_route.mjs`

## Goals / Non-Goals

**Goals:**
- 打破 3 模块间的循环依赖，使依赖图变为 DAG
- 保持所有公共导出接口不变——消费者无需修改代码
- 保持所有行为不变——纯重构

**Non-Goals:**
- 不消除所有模块间的循环（state.mjs ↔ state_identity.mjs 的预存循环是独立问题，不在此 change 处理）
- 不提取公共工具函数到 `shared/util/`（这是 plan 的另一个阶段，后续通过 `_backlog/todos/` 处理）
- 不改变模块的公共 API 签名

## Decisions

### 方案：将最小集合的函数从环中模块移到 state.mjs

**核心思路：** 要打破 3 模块循环，需要消除至少 3 条边（因为每条边消除后产生的新 2 模块循环也需要消除）。

**要消除的边：**

| # | 边 | 消除方式 | 函数 |
|---|-----|---------|------|
| 1 | `state_evidence → state_identity` | 将 4 个函数移到 state.mjs | `probeSourceMarkerForVersion`, `styleMasterSelectionRecord`, `ensureProductionIdentityContainer`, `inspectRunProductionIdentity` |
| 2 | `state_evidence → state_execution` | 将 `preserveReservedNodes` (+ 辅助函数) 移到 state.mjs | `preserveReservedNodes`, `reservedEntries`, `isReservedNode`, `RESERVED_NODE_IDS` |
| 3 | `state_execution → state_identity` | 将 `resolveEffectiveStyleMasterSelection` (+ 私有辅助函数) 移到 state.mjs | `resolveEffectiveStyleMasterSelection`, `styleMasterSourceWorkflow`, `styleMasterSelectionExpectedWorkflow` |

**为什么选 state.mjs 而不是新模块：** state.mjs 已经是所有 state 模块导入的核心模块，且已通过 `export { ... } from "./state_identity.mjs"` 重新导出这些函数。将定义移到 state.mjs 后，只需将 re-export 改为直接导出，外部消费者完全不受影响。创建一个新模块会增加文件数量而不带来额外收益。

**对 state.mjs re-export 块的影响：** state.mjs 当前通过 `export { ... } from "./state_identity.mjs"` (L797-811) 重新导出 13 个函数，其中 `inspectRunProductionIdentity` 和 `resolveEffectiveStyleMasterSelection` 是本次被移函数。变更后：
- 这 2 个函数在 state.mjs 中直接定义并导出（从 re-export 块中移除）
- 其余 11 个函数（如 `resolveRunProductionAdapter`、`recordEffectiveStyleMasterSelection` 等）继续保持 `export { ... } from "./state_identity.mjs"` 重新导出
- `preserveReservedNodes` 当前未通过 state.mjs 重新导出，本次新增为 state.mjs 的直接导出

**为什么选这三条边：** 最小切割集。这三条边是环的直接组成部分，消除后其余边（state_identity → state_execution、state_identity → state_evidence、state_execution → state_evidence）形成严格分层 DAG。

### 目标依赖图

```
Layer 3 (top):   state_identity ──→ state_execution
                     │                  │
                     └──→ state_evidence ←┘
Layer 2:         (state_identity → state_evidence)
Layer 1:         (state_execution → state_evidence)
Layer 0 (base):  state.mjs ← 所有三个模块都从 state.mjs 导入
```

依赖只向下流动（分层 DAG）：
- `state_identity` → `state_execution`（startPlaybook, createDefaultState）——保持
- `state_identity` → `state_evidence`（9 个函数）——保持
- `state_execution` → `state_evidence`（validTargetEvidenceRecord, targetEvidenceRecord）——保持
- 三个模块都从 `state.mjs` 导入——新增

无环。

### 备选方案

| 方案 | 问题 |
|------|------|
| 合并 state_identity 和 state_evidence | 两个模块职责不同（identity vs evidence），合并后 1585 行，更差 |
| 创建 `state_core.mjs` 新模块 | 新文件增加复杂度，state.mjs 本就是核心模块 |
| 只消除 1 条边（不消除衍生 2 模块环） | 仍然有环，未解决问题 |
| 重构函数调用以消除依赖 | 需要理解 7 个跨模块调用的语义，风险更高 |

## Risks / Trade-offs

| 风险 | 缓解 |
|------|------|
| 移动函数到 state.mjs 可能引入新的 import 依赖 | 每个被移函数已逐行检查，它们只依赖 node:fs/node:path/production_marker.mjs/production_identity.mjs/style_master_schema.mjs——这些 state.mjs 要么已导入，要么可以安全添加 |
| 私有辅助函数（`styleMasterSourceWorkflow` 等）被多个函数调用 | 移动时一起移动，保持内部可见性；在 state.mjs 中保持 `function` 声明不导出 |
| state.mjs 行数增加约 130 行 | 可接受（从 842 到约 972 行），后续大文件分解阶段会处理 |
| 测试覆盖率可能因为移动而遗漏 | 所有公共函数导出接口不变，消费者不受影响；`npm test` + `npm run test:sweep` 是硬性完成标准 |
| 并行开发冲突 | 这些文件改动频率低，冲突风险小 |

## Migration Plan

### 步骤

1. **在 state.mjs 中创建新函数**（先复制再删除原位置，保持原子性）
2. **更新 state_identity.mjs 的导出**（删除已移函数，添加 re-export 兼容层）
3. **更新 state_execution.mjs 的导出**（删除已移函数，添加 re-export 兼容层）
4. **更新 state_evidence.mjs 的 import**（指向 state.mjs 而非 state_identity/state_execution）
5. **更新 state_identity.mjs 的 import**（如果从 state_execution 导入的函数已移走）
6. **更新 state_execution.mjs 的 import**（如果从 state_identity 导入的函数已移走）
7. **验证：** `npm test` + `npm run test:sweep`

### 回退策略

任何一步如果测试失败，立即 revert 该 commit。由于是纯重构，不涉及数据迁移，回退完全安全。

## Open Questions

无。所有技术决策在本设计中已明确。