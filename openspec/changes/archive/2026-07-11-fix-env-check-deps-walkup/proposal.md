## Why

`env-check.mjs`（`ppt_flow doctor`）对 `.env` 从 cwd **向上遍历**，对 `node_modules` 却 **只查 cwd**。标准布局是「依赖在 repo 根、`.env` 在 `deck_*/`」——从 deck 跑则 deps 误报 ✗，从 repo 根跑则 api_key 找不到。BOOTSTRAP 把 doctor 当硬闸门，环境其实可用却永远进不了 Step 2（BUG-006）。

## What Changes

- `checkNpmPackages`：与 `.env` 相同从 `process.cwd()` **向上**；对每个硬依赖包找 `node_modules/<pkg>`（**不**停在第一个空/残缺 `node_modules`，对齐 Node）
- 抽出共享 `walkUpDirs`，`.env` 与 deps 共用，避免再漂移
- 报告 `detail` 可注明命中的 `node_modules` 目录（便于排障）
- 测试：deck cwd + 父级包桩 → ✓；空本地 nm + 父级完整包 → ✓；孤立目录 → ✗
- 归档 BUG-006

**非 BREAKING**：只消除 false negative；真缺依赖仍 ✗。

## Capabilities

### New Capabilities

_无。_

### Modified Capabilities

- `environment-check`：依赖检测按包 cwd 向上（与 `.env` / Node 对齐）；明确 deck 布局与空本地 nm 场景下的 READY 条件

## Impact

| 影响面 | 说明 |
|--------|------|
| `PPTMAKER_FRAMEWORK/scripts/00-setup/env-check.mjs` | `checkNpmPackages` + 共享 walk-up + export |
| `openspec/specs/environment-check` | archive 时 sync |
| `tests/test_env_check.mjs` | 增加 walk-up 回归 |
| `_backlog/bugs/BUG-006` | 归档 |

**Out of scope**：从 repo 根自动发现子 deck 的 `.env`；改 BOOTSTRAP 闸门策略；与 `style-iterate-and-quick-preview` playbook plan 合并；改 `createRequire` 为唯一策略（可作为实现备选，见 design）。
