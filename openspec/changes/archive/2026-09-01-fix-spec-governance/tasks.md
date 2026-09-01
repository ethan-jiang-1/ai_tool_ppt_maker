## 1. registry：新增 `delivery` capability

- [x] 1.1 在 `openspec/config.yaml` 的 harness-capability-registry 中新增 `delivery` capability（scope: final projection, PPTX assembly, notes injection, and delivery review；owner_paths: `ppt_maker_harness/scripts/05-delivery/index.mjs`、`ppt_maker_harness/scripts/05-delivery/internal/*.mjs`），位置按 id 排序插入
- [x] 1.2 移除 `notes-injection` 与 `pptx-assembly` 两个 capability 条目
- [x] 1.3 验证 `openspec validate fix-spec-governance` 通过

## 2. registry：移除废弃 capability

- [x] 2.1 移除 `image-production` capability 条目（requirements 已并入 image-generation delta）
- [x] 2.2 移除 `bootstrap-env-guidance` capability 条目（requirements 已并入 harness-charter delta）
- [x] 2.3 验证 `openspec validate fix-spec-governance` 通过

## 3. registry：修正 owner_paths

- [x] 3.1 `style-master-generation`：owner_paths 改为 `scripts/shared/image2/style_master_plan.mjs`、`style_master_schema.mjs`、`style_master_store.mjs`、`style_master_scope.mjs`
- [x] 3.2 `image-generation`：owner_paths 增加 `scripts/shared/image2/page_image_progressive_raw_owner.mjs`、`page_image_target_runtime.mjs`、`page_image_artifacts.mjs`
- [x] 3.3 `visual-asset-management`：owner_paths 改为 `scripts/02-visual-system/internal/page_image_reference_material.mjs`、`internal/page_image_visual_language.mjs`
- [x] 3.4 `node-specification`：owner_paths 增加 `scripts/shared/state/state_execution.mjs`（保留 state.mjs 核心 I/O）
- [x] 3.5 验证 `openspec validate fix-spec-governance` 通过

## 4. 重复认领解析（registry 层）

- [x] 4.1 `env-check.mjs`：删除 `bootstrap-env-guidance` 的认领（capability 已移除，自动完成）
- [x] 4.2 `BOOTSTRAP.md`：同上（自动完成）
- [x] 4.3 `05-delivery/index.mjs`：由新的 `delivery` 统一认领（自动完成）
- [x] 4.4 `02-visual-system/index.mjs`：`style-master-generation` 与 `visual-asset-management` 均改为指向实际实现文件（3.1/3.3 完成）
- [x] 4.5 `ppt_flow.mjs`：保留 `cli-surface` + `pipeline-orchestration` 双认领（合理特例，不改）
- [x] 4.6 验证 `openspec validate fix-spec-governance` 通过

## 5. 最终验证

- [x] 5.1 运行 `openspec validate --all --strict`，确认零告警
- [x] 5.2 运行 `node tests/contracts/run_development_verification.mjs`，确认 core verifier 仍 passed（无代码改动，应无回归）
- [x] 5.3 运行 `npx vitest run tests/contracts/test_production_schema_conformance.mjs`，确认仅剩既有的 numeric-v1 residue 失败（与本 change 无关）
- [x] 5.4 运行 `npx vitest run tests/contracts/test_harness_governance_ledger.mjs`，确认 governance ledger 通过（serialization-contracts.yaml 指针已在 Change 1 更新）
- [x] 5.5 `git diff --stat` 审计：确认无任何 `.mjs` 逻辑代码改动
- [x] 5.6 确认 archive 中 `header-lock` spec 的 covered-by 判定已记录（image-generation / visual-config 覆盖；删除留给 archive sweep）
