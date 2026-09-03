## Why

两个纯重构遗留工作：`bundle_layout.mjs` 的校验器部分（~1300 行）和 state 模块间的 5 个重复工具函数（`isPlainObject`、`hasExactKeys`、`validIsoTimestamp`、`versionFromReservedKey`、`deepFreeze`）尚未收敛。这些是之前 plan 阶段 1 和阶段 3 的尾巴，最简单安全的收尾工作。

## What Changes

1. **导出 `_ALLOWED_IN_*` 常量**，将 `bundle_layout.mjs` 的校验器函数（`checkBundle`、`checkDeckRootControls`、`checkStyleMaster*`、`checkProgressive*`、`checkStagedVersion`、`normalizeCheckMode`、`selfCheck`）及其所有私有辅助函数移到 `bundle_validator.mjs`，`bundle_layout.mjs` 通过 `export { ... } from "./bundle_validator.mjs"` 重新导出保持兼容
2. **将 `isPlainObject`、`hasExactKeys`、`validIsoTimestamp`、`versionFromReservedKey`、`deepFreeze` 提取到 `shared/util/state_helpers.mjs`**，消除 state 模块间的重复定义，所有消费者使用统一导入

## Capabilities

### New Capabilities
- 无（纯重构）

### Modified Capabilities
- 无（纯重构，不改变行为规范）

## Impact

| 范围 | 影响 |
|------|------|
| `ppt_maker_harness/scripts/shared/run-bundle/bundle_layout.mjs` | 删除校验器函数（~1300 行），保留 `export { ... } from` 兼容层 |
| `ppt_maker_harness/scripts/shared/run-bundle/bundle_validator.mjs` | 从 19 行重导出壳改为真正的校验器实现 |
| `ppt_maker_harness/scripts/shared/util/state_helpers.mjs` | 新增 5 个函数导出 |
| 5 个 `state_*.mjs` 模块 | 删除重复定义，改为从 `state_helpers.mjs` 导入 |
| 测试 | 无影响，所有测试应继续通过 |
| 外部依赖 | 无变化 |