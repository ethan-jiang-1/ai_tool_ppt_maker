## Context

See proposal.md — Why. `refactor-harness-core`（已归档）把 God Index 拆成细粒度文件，capability registry 的 `owner_paths` 仍指向旧 entry；4 个旧 capability 与活跃 spec 重叠。本 change 只动 `openspec/`（config registry、main specs、delta specs、archive 标注），不修改任何 `.mjs`。

## Goals / Non-Goals

**Goals:**
- `openspec/config.yaml` 的 capability registry 精确到文件级（owner_paths 指向实际实现）
- 每个文件至多一个 primary owner（除 `ppt_flow.mjs` 双认领为合理特例）
- 4 个重叠/被替代 capability 从 registry 移除，requirements 并入目标 capability
- `openspec validate --all --strict` 零告警

**Non-Goals:**
- 不修改任何 `.mjs`、测试代码或 run-bundle 行为
- 不实现 `Compact compiler cutover`（决策为删除，见 Decisions）
- 不删除 archive 历史（header-lock 仅确认覆盖关系并记录，删除留给 archive sweep）

## Decisions

### 决策 1：owner_paths 修复目标（config.yaml registry）

| Capability | 新 owner_paths |
|---|---|
| `style-master-generation` | `ppt_maker_harness/scripts/shared/image2/style_master_plan.mjs`、`style_master_schema.mjs`、`style_master_store.mjs`、`style_master_scope.mjs` |
| `image-generation` | 保留 `03-framed-image/index.mjs`、`04-pure-image/index.mjs`，增加 `shared/image2/page_image_progressive_raw_owner.mjs`、`page_image_target_runtime.mjs`、`page_image_artifacts.mjs` |
| `visual-asset-management` | `02-visual-system/internal/page_image_reference_material.mjs`、`internal/page_image_visual_language.mjs` |
| `node-specification` | 保留 `state.mjs`（拆分后仍为核心 I/O owner）+ `state_execution.mjs` |

**理由**：拆分为细粒度文件后，owner_paths 才可能精确到实现文件。owner_paths 是 registry 导航数据，不是 requirement，无需 delta spec。

**备选**：不修 owner_paths。被否决——95 个脚本无 spec 认领正是本 plan 要解决的漂移源。

### 决策 2：废弃 spec 的迁移方式（merge + retire）

- `image-production`（7 req）→ ADDED 进 `image-generation`，delta 中全部 REMOVED（Reason/Migration 指向合并目标），archive 时主 spec 删除
- `bootstrap-env-guidance`（8 req）→ ADDED 进 `harness-charter`，同上
- `notes-injection`（4 req）+ `pptx-assembly`（3 req）→ 合并为新的 `delivery` capability（7 req）

**理由**：OpenSpec 的 REMOVED 语义保留可审计的迁移记录；requirement 文本原样搬移（零改写），archive 时自动同步。

### 决策 3：`Compact compiler cutover` requirement 删除

`image-generation` spec 中 "Compact compiler cutover preserves old Page Image evidence" 无任何代码实现（已验证：代码库零匹配）。compact compiler 已在历史迁移中退役，当前 pipeline 无该迁移路径。**决策：REMOVED**（Reason: retired migration contract; Migration: 无当前行为依赖）。

**备选**：排入新 change 实现。被否决——不存在该编译器，实现无意义；证据保留契约已由现存 image-generation requirements 覆盖。

### 决策 4：header-lock archive spec 仅确认覆盖

`openspec/changes/archive/2026-07-10-python-to-nodejs-migration/specs/header-lock/spec.md`（及其余 7 处 archive 实例）是历史 change 的残留 spec，不在主 registry。已确认其内容被 `image-generation`（Framed header-overlay 契约）与 `visual-config`（header policy 输入）覆盖。**处理**：在 archive 中不删不改（历史记录），在 tasks 中记录 covered-by 判定，交给后续 archive sweep 清理。

**备选**：立即删除。被否决——archive 是历史快照，plan 明确"archive 是历史记录，不要求活跃 spec 覆盖"。

### 决策 5：registry 删除顺序

config.yaml 中先 ADD `delivery` capability 条目，再 REMOVE 4 个废弃 capability 条目，最后修正 owner_paths——避免中间状态出现 dangling owner_path 指向已删除 spec。

## Risks / Trade-offs

| 风险 | 缓解 |
|------|------|
| owner_paths 指向的文件在 Change 1 中不存在 | 已归档 Change 1 落地新文件路径，本 change 只引用现存文件 |
| 废弃 spec 后 archive 中旧 change 引用断裂 | archive 不要求活跃覆盖；registry 中移除引用即可 |
| 合并后 requirement 文本漂移 | 文本原样搬移，零改写；archive 时用 delta 与主 spec 对账 |
| 删除 Compact compiler requirement 丢失历史意图 | REMOVED 带 Reason/Migration 保留审计线索 |

## Migration Plan

1. 写 delta specs（已完成 7 个：delivery ADDED 7、image-generation ADDED 7 + REMOVED 1、harness-charter ADDED 8、四个 REMOVED）
2. 修改 `openspec/config.yaml` registry：ADD `delivery` → REMOVE 4 个废弃 → 修正 4 处 owner_paths
3. `openspec validate --all --strict` 零告警
4. 全量验证：`npm test` 不受影响（无代码改动）+ vitest sweep 与归档前一致

## Open Questions

无。`Compact compiler cutover` 已定删除；header-lock 已定覆盖标注。
