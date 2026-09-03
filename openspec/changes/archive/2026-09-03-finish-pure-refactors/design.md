## Context

两个纯重构工作，都是之前 plan 的尾巴。

### 工作 A：bundle_layout.mjs 校验器分离

`bundle_layout.mjs` 当前 2197 行，其中约 1300 行是校验器函数（`checkBundle`、`checkDeckRootControls`、`checkStyleMaster*`、`checkProgressive*`、`checkStagedVersion`、`selfCheck`、`normalizeCheckMode`）及其私有辅助函数（`_ignorable`、`_realDirectory`、`_crc32`、`_validStyleMasterPng` 等）。这些函数只使用 `_ALLOWED_IN_*` 常量从 bundle_layout 自身，不依赖其 SSOT 路径解析的核心逻辑。

当前 `bundle_validator.mjs` 只是一个 19 行的 re-export 壳。需要把校验器真正搬过去，bundle_layout 通过 `export { ... } from` 重新导出保持兼容。

### 工作 B：State 模块重复函数消除

`isPlainObject`（5 处）、`hasExactKeys`（4 处）、`validIsoTimestamp`（4 处）、`versionFromReservedKey`（3 处）、`deepFreeze`（2 处）在 state 模块间重复定义。`shared/util/state_helpers.mjs` 已存在，只需把函数加进去，更新所有消费者。

## Goals / Non-Goals

**Goals:**
- `bundle_layout.mjs` 从 2197 行降到 ~800 行
- 消除 5 个函数在 state 模块间的重复定义
- 保持所有公共导出接口不变

**Non-Goals:**
- 不处理 `style_master_plan.mjs` 或 `page_image_progressive_raw_owner.mjs`（已审计，保留）
- 不消除 `assertCurrentPlaybookStack` 等 state↔state_execution 间的重复（这些是执行逻辑，不是纯工具函数）
- 不改 `harness_architecture.mjs`

## Decisions

### 工作 A：校验器分离

**方案：** 先导出 `_ALLOWED_IN_*` 常量，再把校验器函数和私有辅助函数移到 `bundle_validator.mjs`，`bundle_layout.mjs` 通过 `export { ... } from` 重新导出。

**考虑过的备选：**
- 保持原状：2197 行不可接受，不做不行
- 只拆 CLI 不拆校验器：已做过，不够
- 单独 repo 模块：过度工程

### 工作 B：State 模块重复消除

**方案：** 把 `isPlainObject`、`hasExactKeys`、`validIsoTimestamp`、`versionFromReservedKey`、`deepFreeze` 加入 `shared/util/state_helpers.mjs`，各 state 模块删除本地定义改为导入。`deepFreeze` 和 `versionFromReservedKey` 需要额外导出因为它们在 state.mjs 中被其他模块使用。

## Risks / Trade-offs

| 风险 | 缓解 |
|------|------|
| 工作 A 搬移后循环依赖 | 上一轮已踩过坑——`bundle_validator.mjs` 从 `bundle_layout.mjs` 导入 `_ALLOWED_IN_*` 常量（它们是 `export const`，不是动态导入），bundle_layout 从 bundle_validator 导入校验器函数——这是合法的 ESM 重导出模式，不会形成运行时循环（因为 `export { ... } from` 只是重导出管道） |
| 函数名冲突 | `isPlainObject` 等是通用名称，但在 state 模块上下文中不会与其他导入冲突 |

## Migration Plan

### 工作 A 步骤
1. 导出 `_ALLOWED_IN_*` 常量（加 `export` 前缀）
2. 创建 `bundle_validator.mjs` 的真实现——复制所有校验器函数和私有辅助函数
3. `bundle_layout.mjs` 删除校验器函数，改为 `export { ... } from "./bundle_validator.mjs"`
4. 验证：`node --check` + `npm test`

### 工作 B 步骤
1. 向 `shared/util/state_helpers.mjs` 添加 5 个函数
2. 逐个更新 5 个 state 模块——删除本地定义，添加导入
3. 验证：`npm test` + `npm run test:sweep`

## Open Questions

无。