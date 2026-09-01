## Why

`refactor-harness-core` 把 God Index 拆成了细粒度文件，但 `openspec/config.yaml` 的 capability registry 仍把 `owner_paths` 指向旧的 re-export entry 文件；同时 4 个旧 capability（`image-production`、`bootstrap-env-guidance`、`notes-injection`、`pptx-assembly`）与活跃 spec 高度重叠或已被替代，造成所有权二义性与维护漂移。本 change 只改规格所有权与 registry，**不修改任何 `.mjs` 逻辑代码**。

## What Changes

- **修复 3 处 owner_paths 错误指向**：
  - `style-master-generation`：从 `02-visual-system/index.mjs`（49 行 re-export）改为 `shared/image2/style_master_plan.mjs` + `style_master_schema.mjs` + `style_master_store.mjs` + `style_master_scope.mjs`
  - `image-generation`：增加 `shared/image2/page_image_progressive_raw_owner.mjs`、`page_image_target_runtime.mjs`、`page_image_artifacts.mjs` 等实际实现文件
  - `visual-asset-management`：改为 `02-visual-system/internal/page_image_reference_material.mjs` + `internal/page_image_visual_language.mjs`
- **解析 5 处重复认领**（env-check、BOOTSTRAP.md、05-delivery/index.mjs、02-visual-system/index.mjs、ppt_flow.mjs——最后者保留双认领，合理）
- **废弃 4 个重叠 spec**（registry 删除、archive 保留历史）：
  - `image-production`（7 requirements → 并入 `image-generation`）
  - `bootstrap-env-guidance`（8 requirements → 并入 `harness-charter`）
  - `notes-injection`（4 requirements）与 `pptx-assembly`（3 requirements）→ 合并为新的 `delivery` capability
- **新增 `delivery` capability**：覆盖 `05-delivery/index.mjs` 及 `05-delivery/internal/*.mjs`（final projection、PPTX assembly、notes injection、delivery review）
- **处理 spec 残留**：`image-generation` 中的 `Compact compiler cutover` 幽灵 requirement（代码零实现，随旧迁移退役）删除；archive 中的 `header-lock` spec 确认已被覆盖

## Capabilities

**New Capabilities:**
- `delivery` — 新 capability，整合 notes-injection（4 req）+ pptx-assembly（3 req）共 7 个 requirement

**Modified Capabilities:**
- `image-generation` — ADDED 7 requirements（自 image-production 迁移）
- `harness-charter` — ADDED 8 requirements（自 bootstrap-env-guidance 迁移）
- `image-production` — REMOVED 7 requirements（废弃）
- `bootstrap-env-guidance` — REMOVED 8 requirements（废弃）
- `notes-injection` — REMOVED 4 requirements（并入 delivery）
- `pptx-assembly` — REMOVED 3 requirements（并入 delivery）
- `style-master-generation`、`visual-asset-management`、`node-specification` — owner_paths 修正（config registry 层，无 requirement 变化，无 delta spec）

## Impact

| 维度 | 影响 |
|------|------|
| 源码范围 | **无 `.mjs` 逻辑代码改动**。只改 `openspec/config.yaml`（capability registry）、`openspec/specs/`（delta specs + 废弃 spec）、`openspec/changes/fix-spec-governance/` |
| 测试范围 | `openspec validate --all --strict` 零告警；既有 `npm test` / vitest 不受影响（无代码改动） |
| 行为变化 | 无运行时行为变化；仅 spec 所有权归属与 registry 导航更新 |
| Run-bundle contract | `none` |
| Control owner | 文档/规格——JS 与 MD Controller 行为均不变 |
