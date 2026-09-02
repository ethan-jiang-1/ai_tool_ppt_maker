## 1. 准备：理解当前依赖结构

- [x] 1.1 再次确认设计文档中标注的 7 个跨模块调用的完整列表，确保没有遗漏
      → 完成标准：所有跨 state_identity ↔ state_execution ↔ state_evidence 的函数调用已穷举标注

## 2. 在 state.mjs 中创建接收函数

- [x] 2.1 在 state.mjs 中添加以下函数的定义（先作为普通 `function` 声明，暂不加入 export 列表）：
      - `probeSourceMarkerForVersion`（来自 state_identity.mjs）
      - `styleMasterSelectionRecord`（来自 state_identity.mjs）
      - `ensureProductionIdentityContainer`（来自 state_identity.mjs）
      - `inspectRunProductionIdentity`（来自 state_identity.mjs）
      → 完成标准：这些函数在 state.mjs 中以 `function` 声明存在
- [x] 2.2 在 state.mjs 中添加以下私有辅助函数：
      - `styleMasterSourceWorkflow`（来自 state_identity.mjs）
      - `styleMasterSelectionExpectedWorkflow`（来自 state_identity.mjs）
      - `RESERVED_NODE_IDS` 常量（来自 state_execution.mjs）
      - `isReservedNode`（来自 state_execution.mjs）
      - `reservedEntries`（来自 state_execution.mjs）
      - `deepClone`（private helper，`value == null ? value : structuredClone(value)`）
      - `preserveReservedNodes`（来自 state_execution.mjs）
      → 完成标准：这些函数在 state.mjs 中以 `function` 声明存在（除 preserveReservedNodes 外不导出）
- [x] 2.3 从 state.mjs 导出新添加的公共函数：
      - `probeSourceMarkerForVersion`
      - `styleMasterSelectionRecord`
      - `ensureProductionIdentityContainer`
      - `inspectRunProductionIdentity`
      - `preserveReservedNodes`
      - `resolveEffectiveStyleMasterSelection`
      → 这些函数通过 `export function` 直接导出，不从 `export { ... } from "./state_identity.mjs"` 重新导出
      → 完成标准：state.mjs 的 export 列表包含这些函数名，且不重复导出
- [x] 2.4 检查 state.mjs 是否缺少这些函数所需的 import，补全 import 语句
      - 需要新增的 import：`PAGE_IMAGE_WORKFLOWS`（来自 `../run-bundle/production_marker.mjs`）、`validateStyleMasterSelectionRecord`（来自 `../image2/style_master_schema.mjs`）
      - 已有的 import（无需变更）：`probeProductionMarker`、`PAGE_IMAGE_WORKFLOW_PIPELINE`、`canonicalVersionKey`、`normalizeRunVersion`、`inspectProductionIdentity`、`isProductionIdentityRecord`、`pipelineFromSourceMarker`
      - 已在 state.mjs 中定义的函数（无需 import）：`resolveExactExecution`、`readState`、`writeState`、`appendHistory`、`executionLeasePath`、`EXECUTION_LEASE_SCHEMA`、`statePath`
      → 完成标准：所有被移函数在 state.mjs 中能正常引用其依赖
- [x] 2.5 修改 state.mjs 中 `export { ... } from "./state_identity.mjs"` 的 re-export 块（L797-811）：
      - 移除 `inspectRunProductionIdentity` 和 `resolveEffectiveStyleMasterSelection`（它们已在 state.mjs 中直接定义并导出）
      - 保留其余 11 个函数：`PAGE_IMAGE_TASK_MANDATE_SCHEMA`、`PAGE_IMAGE_TASK_MANDATE_SCOPE`、`resolveRunProductionAdapter`、`recordEffectiveStyleMasterSelection`、`activateCleanPageImageTargetDraft`、`inspectCurrentPageImageTaskMandate`、`ensureCurrentPageImageTaskMandate`、`initializeTargetPageImageState`、`advanceTargetPageImageSourceEpoch`、`inspectTargetPageImageState`、`resolveCurrentTargetPageImageSourceState`
      → 完成标准：re-export 块不包含已移函数，不重复导出

## 3. 在 state_identity.mjs 中删除已移函数

- [x] 3.1 删除以下函数定义和其导出：
      - `probeSourceMarkerForVersion`
      - `styleMasterSelectionRecord`
      - `ensureProductionIdentityContainer`
      - `inspectRunProductionIdentity`
      - `resolveEffectiveStyleMasterSelection`
      - 私有辅助函数：`styleMasterSourceWorkflow`, `styleMasterSelectionExpectedWorkflow`
      → 完成标准：这些函数在 state_identity.mjs 中不再存在
- [x] 3.2 检查 state_identity.mjs 中是否有其他函数调用了这些已删函数，如有则改为从 state.mjs 导入
      → 完成标准：所有已移函数的调用改为从 state.mjs 导入
- [x] 3.3 检查 state_identity.mjs 的 export 列表，删除已移函数的导出
      → 完成标准：state_identity.mjs 的 `export { ... }` 中不包含已移函数

## 4. 在 state_execution.mjs 中删除已移函数

- [x] 4.1 删除以下函数定义：
      - `reservedEntries`
      - `isReservedNode`
      - `RESERVED_NODE_IDS` 常量
      - `preserveReservedNodes`
      → 完成标准：这些函数在 state_execution.mjs 中不再存在
- [x] 4.2 检查 state_execution.mjs 中是否有其他函数调用了这些已删函数，如有则改为从 state.mjs 导入
      → 完成标准：所有已移函数的调用改为从 state.mjs 导入
- [x] 4.3 检查 state_execution.mjs 的 export 列表，删除已移函数的导出
      → 完成标准：`export { preserveReservedNodes }` 从 state_execution.mjs 移除

## 5. 更新消费模块的 import

- [x] 5.1 更新 state_evidence.mjs 的 import：
      - `probeSourceMarkerForVersion`, `styleMasterSelectionRecord`, `ensureProductionIdentityContainer`, `inspectRunProductionIdentity` → 从 `./state.mjs` 导入（而非 `./state_identity.mjs`）
      - `preserveReservedNodes` → 从 `./state.mjs` 导入（而非 `./state_execution.mjs`）
      → 完成标准：state_evidence.mjs 不再导入 state_identity.mjs 或 state_execution.mjs 中已移的函数
- [x] 5.2 更新 state_execution.mjs 的 import：
      - `resolveEffectiveStyleMasterSelection` → 从 `./state.mjs` 导入（而非 `./state_identity.mjs`）
      → 完成标准：state_execution.mjs 不再从 state_identity.mjs 导入已移函数
- [x] 5.3 更新 state_identity.mjs 的 import：
      - `startPlaybook`, `createDefaultState` → 从 `./state_execution.mjs` 导入，保持不变（这些函数不在环中，也未移动）
      - 增加从 `./state.mjs` 导入 `probeSourceMarkerForVersion`、`inspectRunProductionIdentity`、`styleMasterSelectionRecord`、`styleMasterSourceWorkflow`、`styleMasterSelectionExpectedWorkflow`、`ensureProductionIdentityContainer`
      → 完成标准：state_identity.mjs 的 import 指向正确的源模块，不引用已移函数

## 6. 验证依赖图无环

- [x] 6.1 运行 `npm test` 确认现有测试全部通过
      → 完成标准：`npm test` 退出码 0
- [x] 6.2 运行 `npm run test:sweep` 确认全量测试通过
      → 完成标准：`npm run test:sweep` 退出码 0，84 test files, 709 tests passed
- [x] 6.3 用 ESM 导入图验证脚本确认模块间 import 图已无环
      → 完成标准：state_evidence 不再导入 state_identity/state_execution 中的已移函数，依赖图验证为 DAG

## 7. 清理和文档

- [x] 7.1 删除 state_identity.mjs 和 state_execution.mjs 中任何遗留的导入语句
      → 完成标准：两个文件不导入已无定义的函数
- [x] 7.2 更新 state_identity.mjs 顶部注释，删除"ESM circular imports are accepted here"说明
      → 完成标准：注释反映新的无环依赖结构
- [x] 7.3 更新 state_execution.mjs 顶部注释，删除"ESM circular imports are accepted here"说明
      → 完成标准：注释反映新的无环依赖结构