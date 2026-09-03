## 1. 工作 A：bundle_layout.mjs 校验器分离

- [x] 1.1 导出 `_ALLOWED_IN_*` 常量（在 `bundle_layout.mjs` 中给 4 个 `const` 加 `export` 前缀）
      → 完成标准：`_ALLOWED_IN_BACKBONE`、`_ALLOWED_IN_VISUAL_STYLE`、`_ALLOWED_IN_ASSETS`、`_ALLOWED_IN_PAGE_IMAGE_PRESENTATION` 均为 `export const`
- [x] 1.2 创建 `bundle_validator.mjs` 真实现——从 `bundle_layout.mjs` 复制所有校验器函数和私有辅助函数（`_ignorable` 到 `selfCheck`），import 从 `bundle_layout.mjs` 获取 `_ALLOWED_IN_*` 等常量
      → 完成标准：`bundle_validator.mjs` 包含所有校验器函数，每个函数可正常引用 `_ALLOWED_IN_*` 常量
- [ ] 1.3 从 `bundle_layout.mjs` 删除校验器函数和私有辅助函数，改为 `export { ... } from "./bundle_validator.mjs"`
      → 完成标准：`bundle_layout.mjs` 减少 ~1300 行，`node --check` 通过
      → **推迟**：校验器与非校验器函数（`renderTree`、`initBundle`、`createVersion` 等）交错排列，手术式分离风险高且该文件的 CLI 模式已被 `bundle_cli.mjs` 承接，当前状态已足够
- [x] 1.4 验证：`npm test` 通过
      → 完成标准：核心验证通过

## 2. 工作 B：State 模块重复函数消除

- [x] 2.1 向 `shared/util/state_helpers.mjs` 添加 `isPlainObject`、`hasExactKeys`、`validIsoTimestamp`、`versionFromReservedKey`、`deepFreeze` 并导出
      → 完成标准：5 个函数在 `state_helpers.mjs` 中定义并导出
- [x] 2.2 更新 `state.mjs`：删除本地 `isPlainObject`、`deepFreeze`、`hasExactKeys`、`validIsoTimestamp`、`versionFromReservedKey` 定义，改为从 `state_helpers.mjs` 导入
      → 完成标准：`state.mjs` 不再定义这些函数，`npm test` 通过
- [x] 2.3 更新 `state_identity.mjs`：删除本地 `isPlainObject`、`hasExactKeys`、`validIsoTimestamp`、`versionFromReservedKey`、`deepFreeze` 定义，改为从 `state_helpers.mjs` 导入
      → 完成标准：`state_identity.mjs` 不再定义这些函数
- [x] 2.4 更新 `state_execution.mjs`：删除本地 `isPlainObject` 定义，改为从 `state_helpers.mjs` 导入
      → 完成标准：`state_execution.mjs` 不再定义 `isPlainObject`
- [x] 2.5 更新 `state_evidence.mjs`：删除本地 `isPlainObject`、`hasExactKeys`、`validIsoTimestamp`、`versionFromReservedKey` 定义，改为从 `state_helpers.mjs` 导入
      → 完成标准：`state_evidence.mjs` 不再定义这些函数
- [x] 2.6 更新 `state_progressive.mjs`：删除本地 `isPlainObject`、`hasExactKeys`、`validIsoTimestamp` 定义，改为从 `state_helpers.mjs` 导入
      → 完成标准：`state_progressive.mjs` 不再定义这些函数

## 3. 最终验证

- [x] 3.1 运行 `npm test` 确认核心验证通过
      → 完成标准：`npm test` 退出码 0
- [x] 3.2 运行 `npm run test:sweep` 确认全量测试通过
      → 完成标准：`npm run test:sweep` 退出码 0，709/709 通过