# Plan: 代码可理解性重构 — 大文件拆分与 Spec 所有权对齐

> 类型: 设计/分析 | 更新: 2026-09-01

## 背景 / 现状

上一轮评估（2026-09-01）发现项目存在显著的大文件问题。`scripts/` 目录 111 个 `.mjs` 文件合计 45,399 行，其中 **8 个文件占了 43%**（19,741 行）。进一步分析发现更大问题：

1. **God Index 模式**：`03-framed-image/index.mjs`（2021 行）和 `04-pure-image/index.mjs`（1510 行）把所有逻辑塞在 index 里，而项目其他所有 index.mjs 都是薄 re-export 层（01-content: 60 行，02-visual: 49 行）。
2. **Utility 垃圾桶**：`command_support.mjs`（2493 行，98 exports）混合了 7 个独立关切；`state.mjs`（3583 行，95 exports）混合了 6 个独立关切。
3. **Spec 所有权大面积错位**：`openspec/config.yaml` 中 28 个 capability 的 `owner_paths` 普遍指向 re-export entry 文件而非实际实现。95/111 个脚本文件未被任何 spec 认领。
4. **Spec 间重叠与可能过期的 spec**：`image-production`（172 行）与 `image-generation`（1834 行）scope 高度重叠；`bootstrap-env-guidance`（177 行）与 `harness-charter`（562 行）重叠。
5. **Archive 中残留未注册 capability**：`archive/.../header-lock/spec.md` 不在主 registry 中；`Compact compiler cutover` requirement 在 spec 中但无对应代码。

## 诊断数据

### 一、大文件总览（>1500 行）

| 文件 | 行数 | Export | 内部函数 | 问题类型 | 措施 |
|------|------|--------|---------|---------|------|
| `shared/state/state.mjs` | 3583 | 95 | ~30 | 6 个独立关切 | ✅ 拆分 |
| `shared/cli/command_support.mjs` | 2493 | 98 | ~2 | 7 个独立关切 | ✅ 拆分 |
| `shared/image2/style_master_plan.mjs` | 2324 | 4 | ~60 | 对外接口极窄 | ❌ 不动 |
| `shared/run-bundle/bundle_layout.mjs` | 2195 | 90 | ~30 | 宪法单真相源 | ❌ 不动 |
| `shared/image2/page_image_progressive_raw_owner.mjs` | 2189 | 17 | ~30 | 完整有界能力 | ❌ 不动 |
| `03-framed-image/index.mjs` | 2021 | 42 | ~20 | God Index | ✅ 拆分 |
| `contracts/harness_architecture.mjs` | 1576 | 33 | 0 | 架构清单 | ❌ 不动 |
| `shared/image2/page_image_target_runtime.mjs` | 1556 | 41 | ~15 | 编排 glue | ⚠️ 观察 |
| `04-pure-image/index.mjs` | 1510 | 38 | ~15 | God Index（Framed 镜像） | ✅ 拆分 |

### 二、Spec 所有权映射（28 个 capability 的 owner_paths 逐条审计）

#### 2a. 重复认领（5 处）

| 文件 | 被哪些 spec 认领 | 冲突说明 | 解决方案 |
|------|-----------------|---------|---------|
| `env-check.mjs` | `bootstrap-env-guidance` + `environment-check` | 两 spec scope 都覆盖环境检查 | 归 `environment-check` |
| `BOOTSTRAP.md` | `bootstrap-env-guidance` + `harness-charter` | Bootstrap 是 charter 的子集 | 归 `harness-charter` |
| `05-delivery/index.mjs` | `notes-injection` + `pptx-assembly` | 同一文件含两个子能力 | 新增 `delivery` capability 统一覆盖 |
| `02-visual-system/index.mjs` | `style-master-generation` + `visual-asset-management` | 49 行 re-export，指向错了 | 取消认领，改用实际 internal/ 文件 |
| `ppt_flow.mjs` | `cli-surface` + `pipeline-orchestration` | CLI 入口自然被两个 spec 覆盖 | ✅ 保留双认领（合理） |

#### 2b. 错误指向（4 处关键的）

| Capability | 当前 owner_path | 实际问题 | 应指向 |
|-----------|----------------|---------|--------|
| `style-master-generation` | `02-visual-system/index.mjs`（49 行 re-export） | 认领了错误的文件。Style Master 实现在 `shared/image2/style_master_plan.mjs`（2324 行）+ 3 个配套文件 | `shared/image2/style_master_plan.mjs` + `.../style_master_schema.mjs` + `.../style_master_store.mjs` + `.../style_master_scope.mjs` |
| `image-generation` | `03-framed-image/index.mjs` + `04-pure-image/index.mjs` | scope 是 "receipt-bound raw generation"，但这两个文件含 6 个 delivery/refresh export | 增加 `shared/image2/` 下的实际实现文件; delivery 部分移出 scope |
| `node-specification` | `state.mjs` | scope 是 "Controller node and state contract"，但 state.mjs 含 evidence/progressive/Style Master 代码 | 拆分后，只指向 `state.mjs`（核心 I/O）和 `state_execution.mjs` |
| `visual-asset-management` | `02-visual-system/index.mjs` | 指向 re-export 层而非实际实现 | `internal/page_image_reference_material.mjs` + `internal/page_image_visual_language.mjs` |

#### 2c. 未被任何 spec 认领的关键实现文件（95 个中的高价值）

未被认领意味着修改这些文件时没有 spec 约束，容易造成 drift：

```
commands/                        ← 18 个文件：所有命令实现都无 spec 认领
  ❌ doctor.mjs, init.mjs, image2.mjs, state.mjs, status.mjs
  ❌ build.mjs, refresh.mjs, slides.mjs, paginate.mjs
  ❌ new-version.mjs, reset-unproduced-v1.mjs, preflight.mjs
  ❌ probe.mjs, validate.mjs, test.mjs, style-master.mjs
  ❌ artifacts.mjs

shared/image2/                    ← 核心生成管线
  ❌ page_image_artifacts.mjs      ← raw plan/evidence 的 schema 验证
  ❌ page_image_progressive_raw_owner.mjs  ← 2189 行但完全无 spec
  ❌ page_image_target_runtime.mjs         ← 1556 行编排 glue 无 spec
  ❌ provider_executor.mjs, provider_profile.mjs, call_shape.mjs
  ❌ credentials.mjs, startup_env.mjs, runtime_profile_id.mjs
  ❌ page_image_progressive_schema.mjs, page_image_progressive_store.mjs
  ❌ page_image_final_manifest.mjs, page_image_complete_page_review.mjs
  ❌ style_master_plan.mjs (2324 行!), style_master_schema.mjs
  ❌ style_master_store.mjs, style_master_scope.mjs
  ❌ content_address_store.mjs, page_image_media_contract.mjs
  ❌ png_raster_projection.mjs, page_image_human_artifact_reference.mjs
  ❌ page_image_provider_request_binding.mjs, page_image_raw_mechanics.mjs
  ❌ page_derived_data.mjs, lab_cli.mjs

shared/page-image/                ← shared 核心模型
  ❌ page_image_core.mjs, page_image_invalidation.mjs
  ❌ page_image_source_receipt.mjs, page_image_presentation_envelope.mjs

shared/run-bundle/                ← run bundle 核心
  ❌ production_identity.mjs, production_marker.mjs
  ❌ run_bundle_locator.mjs, page_image_paths.mjs
  ❌ style_master_media.mjs, reset_unproduced_v1.mjs

shared/cli/                       ← CLI 支撑
  ❌ command_support.mjs (2493 行!), cli_bootstrap.mjs, command_result.mjs
  ❌ 以及 commands/ 下的所有 18 个文件

shared/identity/                  ← 基础工具
  ❌ canonical_json.mjs, byte_hash.mjs

shared/workflow/                  ← workflow 检查
  ❌ inspect_workflow.mjs (当前已有一个 workflow-inspection spec 认领它)
  ❌ page_production_display_references.mjs
  ❌ page_production_task_projection.mjs
  ❌ progressive_controller_task_projection_eligibility.mjs
  ❌ current_protocol_invalid.mjs

shared/state/                     ← state 子模块
  ❌ target_authoring_draft_route.mjs

contracts/                        ← 架构/审计
  ❌ harness_coherence.mjs, executable_inventory.mjs
  ❌ canonical_json.mjs, cli_return_audit.mjs
  ❌ harness_document_command_audit.mjs

internal/ 下所有 .mjs 文件         ← 实现细节（不单独认领合理）
```

### 三、Spec 间重叠分析

| Spec | 行数 | Scope | 与谁重叠 | 建议 |
|------|------|-------|---------|------|
| `image-production` | 172 | "active whole-page Page Image production family" | `image-generation`（1834 行） | 🔴 **废弃**：7 个 requirement 可并入 image-generation。独立存在只会造成二义性 |
| `bootstrap-env-guidance` | 177 | "Bootstrap startup and environment remediation" | `harness-charter`（562 行） | 🔴 **废弃**：8 个 requirement 可并入 harness-charter |
| `notes-injection` | 118 | "receipt-bound speaker-note delivery" | 同属 delivery 管线 | ⚠️ 合并为 `delivery` capability |
| `pptx-assembly` | 126 | "final-manifest PPTX assembly" | 同上 | ⚠️ 合并为 `delivery` capability |
| `environment-check` | 501 | "local Harness readiness checks" | 与 `bootstrap-env-guidance` 的 env-check 部分重叠 | ✅ 保留 environment-check，废弃 bootstrap-env-guidance |

### 四、Spec-Code 不一致

| 发现 | 严重程度 | 说明 |
|------|---------|------|
| `image-generation` spec 有 `Requirement: Compact compiler cutover preserves old Page Image evidence`，但代码中**无对应实现** | 🟡 中 | Spec 定义了一个 "compact→page-image-workflow" 迁移保留的要求，但代码未见迁移或兼容逻辑。需要确认这是 backlog 还是已废弃的 requirement |
| `header-lock` spec 存在于 archive 但不在主 capability registry 中 | 🟢 低 | `archive/2026-07-10-python-to-nodejs-migration/specs/header-lock/spec.md` — 可能是一次性 change 的残留 spec，不再活跃。可在归档后从主树删除 |
| `image-generation` spec 的 `Progressive terminal siblings preserve verified success` requirement 涉及渐进式 raw 工作，但不认领 `page_image_progressive_raw_owner.mjs` | 🟡 中 | 这是 owner_path 不完整导致的，修复所有权后解决 |

## 决策 / 方案

本 plan 的实施分为 **两个阶段**：先拆代码让模块变细，再修 spec ownership 让所有权精确到文件级。**代码拆分必须在 spec 修复之前**，因为文件路径变化后 owner_paths 才能指向正确的目标。

### 第一阶段：代码拆分（P0）

#### 步骤 1：拆分 God Index（03-framed-image 和 04-pure-image）

**目标**：将 2021 行和 1510 行的 index.mjs 改为纯 re-export 层，逻辑移到 `internal/` 子模块。

**分解方案（以 03-framed 为例，04-pure 镜像）**：

```
03-framed-image/
├── index.mjs                          ← 纯 re-export（~60 行）
├── internal/
│   ├── framed_raw_plan.mjs            ← NEW: compileFramedTargetRawPlanCandidate
│   │                                    createFramedCoreFacts, framedRawContract
│   │                                    compileFramedProviderInput, etc.
│   ├── framed_raw_contract.mjs        ← NEW: validateFramedRawContractAgainstProfile
│   │                                    validateFramedRawContract, etc.
│   ├── framed_review.mjs              ← NEW: framedCompletePageReviewInputs
│   │                                    publishFramedCompletePageReview
│   │                                    validateFramedCompletePageReview, etc.
│   ├── framed_final_manifest.mjs      ← NEW: composeFramedFinalSlideManifest
│   │                                    publishFramedFinalSlideManifest
│   ├── framed_progressive.mjs         ← NEW: publishFramedProgressivePilot
│   │                                    validateFramedProgressivePilot
│   │                                    publishFramedProgressiveCompletePageReview
│   ├── framed_refresh.mjs             ← NEW: classifyFramedRefresh
│   │                                    refreshFramedTargetText, refreshFramedTargetNotes
│   ├── framed_orchestration.mjs       ← NEW: buildFramedTargetRawPlan
│   │                                    authorizeFramedTargetRawPlan
│   │                                    generateFramedTargetRawPlan
│   │                                    buildFramedTargetDelivery, etc.
│   ├── framed_progressive_orch.mjs    ← NEW: buildFramedProgressiveTargetRawPlan
│   │                                    planFramedTargetPilot
│   │                                    authorizeFramedProgressiveRawBatch
│   │                                    generateFramedProgressiveRawItem
│   │                                    buildFramedProgressiveTargetDelivery, etc.
│   ├── framed_identity.mjs            ← NEW: resolveFramedTargetSource
│   │                                    resolveFramedTargetCandidateSource
│   │                                    resolveFramedStyleMasterScope
│   ├── capture_runtime.mjs            ← 已有
│   ├── framed_render_contract.mjs     ← 已有
│   ├── framed_render_profile.mjs      ← 已有
│   ├── framed_provider_input_contract.mjs ← 已有
│   └── header_overlay.mjs            ← 已有
```

**关键约束**：
- `compileFramedTargetRawPlanCandidate` 被 6 个出口调用，必须进共享的 `framed_raw_plan.mjs`，不能埋入某个特定出口模块
- index.mjs 变纯 re-export 后，所有外部调用者 import 路径不变
- 04-pure-image 采用完全相同的结构，前缀从 `Framed` 换成 `Pure`

#### 步骤 2：拆分 command_support.mjs

**目标**：将 2493 行、98 exports 的 utility 仓库拆分为 7 个有界模块。

```
shared/cli/
├── command_support.mjs              ← 缩至 ~400 行：只保留 adapter 解析 + glue
│    preflightAdapterSource, resolveRunAdapter, resolveRunHarnessBinding
│
├── cli_image2_response.mjs         ← NEW: provider 响应解析（~500 行）
│    imageDataUrl, pageImageProviderResponseRecord, targetPageImageSubmitFactory
│    resolveImage2ProviderTask, etc.
│
├── cli_style_master.mjs            ← NEW: Style Master CLI glue（~200 行）
│    styleMasterNextInvocation, styleMasterSubmitFactory, etc.
│
├── cli_status.mjs                  ← NEW: 状态显示（~300 行）
│    collectStatus, enrichStatusWithState, printStatus
│
├── cli_artifact_view.mjs           ← NEW: artifact 引用（~200 行）
│    artifactReferenceEntry, rebuildTargetPageImageArtifactView
│
├── cli_diagnostics.mjs             ← NEW: 诊断发送（~300 行）
│    emitFailed, emitUsage, exitUsage, emitCurrentProtocolError
│    targetPageImageFailure, etc.
│
├── cli_deadline.mjs                ← NEW: 纯 timing 工具（~80 行）
│    IMAGE2_PROVIDER_OPERATION_TIMEOUT_MS, createImage2ProviderDeadline, etc.
│
└── commands/                       ← 不变（但 import 路径需更新）
```

#### 步骤 3：拆分 state.mjs

**目标**：将 3583 行、95 exports 的 state 模块拆分为 5 个有界模块。

```
shared/state/
├── state.mjs                    ← 缩至 ~800 行：核心 I/O + 基础访问器
│    readState, writeState, parseStateYaml, stringifyStateYaml
│    statePath, historyPath, executionLeasePath
│    prepareStateWrite, healState, ensureStateDirHints
│    appendHistory, readHistory
│    resolveExactExecution, requireExactExecutionForRun
│    repairKnownExecutionMismatch
│    validateState, validateStateReadOnly
│
├── state_execution.mjs          ← NEW: playbook 生命周期（~500 行）
│    startPlaybook, switchPlaybook, resumePlaybook, createDefaultState
│    setNodeStatus, resetNode, skipNode, setGate, setNodeEvidence
│    setNodeDecision, getNodeStatus, getCurrentNode, getCompletedNodes
│    getPendingNodes, isNodeCompleted, isNodeDone, isPlaybookComplete
│    getGateStatus, isGateApproved
│    buildResumeCard, projectProductionIdentityCompletion
│    checkEntry, checkExit, getMissingConditions, getEligibleNextNodes
│    resolveContinuationTargetVersion, ensureStateDirHints
│    NODE_STATUSES, GATE_STATUSES, RESERVED_NODE_IDS
│
├── state_identity.mjs           ← NEW: 版本身份/适配器（~400 行）
│    inspectRunProductionIdentity, resolveRunProductionAdapter
│    resolveEffectiveStyleMasterSelection, recordEffectiveStyleMasterSelection
│    activateCleanPageImageTargetDraft
│    inspectCurrentPageImageTaskMandate, ensureCurrentPageImageTaskMandate
│    initializeTargetPageImageState, advanceTargetPageImageSourceEpoch
│    inspectTargetPageImageState, resolveCurrentTargetPageImageSourceState
│    PAGE_IMAGE_TASK_MANDATE_SCHEMA, PAGE_IMAGE_TASK_MANDATE_SCOPE
│
├── state_evidence.mjs           ← NEW: evidence 记录（~500 行）
│    recordTargetAcceptedRawEvidence, recordTargetFinalManifest
│    recordTargetDeliveryReceipt, recordPageImageRawProviderAuthorization
│    inspectPageImageRawProviderAuthorization
│    validateTargetAcceptedRawEvidenceLocalComposeRebind
│    rebindTargetAcceptedRawEvidenceForLocalCompose
│    rebindTargetProgressiveRawEvidenceForLocalCompose
│    registerTargetPageImageStructuralPublication
│    revalidateTargetPageImageStructuralReplay
│    PAGE_IMAGE_RAW_PROVIDER_AUTHORIZATION_SCHEMA
│    PAGE_IMAGE_TARGET_STATE_SCHEMA
│
├── state_progressive.mjs        ← NEW: 渐进式 handoff（~500 行）
│    recordTargetProgressiveRawPlan, recordTargetProgressivePilotDecision
│    recordTargetProgressiveCompleteRawReview
│    recordTargetProgressiveAcceptedRawEvidence
│    recordTargetProgressiveFinalManifest
│    recordTargetProgressiveDeliveryReceipt
│    readTargetProgressiveHandoff
│    recordTargetProgressiveAuthorizeCliHandoff
│    recordTargetProgressiveCheckpointCliHandoff
│    recordStyleMasterAuthorizeCliHandoff
│    readTargetProgressiveControllerDecision
│    PAGE_IMAGE_PROGRESSIVE_HANDOFF_SCHEMA
│    PAGE_IMAGE_PROGRESSIVE_AUTHORIZE_CLI_EVIDENCE_KEY
│    STYLE_MASTER_AUTHORIZE_CLI_EVIDENCE_KEY
│
├── md_controller_reader.mjs     ← 已有
└── target_authoring_draft_route.mjs ← 已有
```

**关键约束**：
- `state.mjs`（核心）不能 import 任何子模块，防止循环依赖
- 子模块 import `state.mjs` 的 `writeState`/`readState`
- 没有循环依赖

### 第二阶段：Spec 所有权修复与整理（P1）

#### 步骤 4：修复 owner_paths（在代码拆分之后）

代码拆分后，每个文件的粒度小到可以精确映射到单个 capability。具体变更：

**（4a）修正错误指向**

| Capability | 旧 owner_paths | 新 owner_paths |
|-----------|---------------|---------------|
| `style-master-generation` | `02-visual-system/index.mjs` | `shared/image2/style_master_plan.mjs`, `shared/image2/style_master_schema.mjs`, `shared/image2/style_master_store.mjs`, `shared/image2/style_master_scope.mjs` |
| `image-generation` | `03-framed-image/index.mjs`, `04-pure-image/index.mjs` | 增加 `shared/image2/page_image_progressive_raw_owner.mjs`, `shared/image2/page_image_target_runtime.mjs`, `shared/image2/page_image_artifacts.mjs` |
| `visual-asset-management` | `02-visual-system/index.mjs` | `02-visual-system/internal/page_image_reference_material.mjs`, `02-visual-system/internal/page_image_visual_language.mjs`（通过 index.mjs re-export） |

**（4b）解析重复认领**

| 冲突 | 裁决 |
|------|------|
| `env-check.mjs` 被 `bootstrap-env-guidance` + `environment-check` 认领 | 删除 `bootstrap-env-guidance` 的认领。`bootstrap-env-guidance` 将被废弃 |
| `BOOTSTRAP.md` 被 `bootstrap-env-guidance` + `harness-charter` 认领 | 删除 `bootstrap-env-guidance` 的认领 |
| `05-delivery/index.mjs` 被 `notes-injection` + `pptx-assembly` 认领 | 新增 `delivery` capability，统一认领 `05-delivery/index.mjs` 及 `05-delivery/internal/*.mjs`；保留但废弃 `notes-injection` 和 `pptx-assembly` |
| `02-visual-system/index.mjs` 被 `style-master-generation` + `visual-asset-management` 认领 | 两者都不再认领，改为指向实际实现文件 |
| `ppt_flow.mjs` 被 `cli-surface` + `pipeline-orchestration` 认领 | **保留双认领**，这是合理的（入口文件自然被多个 spec 覆盖） |

**（4c）废弃重叠 spec**

| Spec | 废弃理由 | requirement 迁移目标 |
|------|---------|-------------------|
| `image-production`（172 行/7 req） | 与 `image-generation`（1834 行/32 req）完全重叠 | 7 个 requirement 增加为 `image-generation` 的 requirement；删除 spec 文件 |
| `bootstrap-env-guidance`（177 行/8 req） | 与 `harness-charter`（562 行/14 req）重叠 | 8 个 requirement 增加为 `harness-charter` 的 requirement；删除 spec 文件 |

**（4d）新增 capability**

| 新 Capability | scope | owner_paths |
|-------------|-------|-------------|
| `delivery` | final projection, PP TX assembly, notes injection, and delivery review | `05-delivery/index.mjs`, `05-delivery/internal/*.mjs` |

**（4e）处理 Archive 中的 header-lock**

`archive/2026-07-10-python-to-nodejs-migration/specs/header-lock/spec.md` 存在于 archive 中但不在主 registry。这不是个活跃 capability，不需要修复。但需确认是否已被 `image-generation` 或 `visual-config` 完全覆盖。如是，可标记为 "covered-by" 并在下个 archive sweep 中清理。

#### 步骤 5：验证与清理

- 给每个 spec 运行 `openspec strict validation`，确保没有断裂的 `owner_path`
- 确认 `Compact compiler cutover` requirement 在 `image-generation` spec 中的状态（删除或实现）
- 检查 archive 中所有 spec 文件是否已被主 spec 覆盖

## 风险 / 取舍

| 风险 | 缓解 |
|------|------|
| 拆 state.mjs 时 CAS 写入（`writeState`）被破坏 | `state.mjs` 核心 I/O 层不变，子模块只 import 它 |
| 拆 index.mjs 时 `compileFramedTargetRawPlanCandidate` 调用链断裂 | 已画调用图——被 6 个出口调用，进独立 `framed_raw_plan.mjs` 模块 |
| 拆 command_support 时 18 个命令文件 import 路径需更新 | 保留 `command_support_compat.mjs` 过渡层，逐文件迁移 |
| 拆 state.mjs 时 31 个测试文件 import 路径需更新 | state.mjs 保留为 re-export 过渡层，外部 import 不变 |
| Spec 所有权修复后 `openspec status` 输出变化 | 单独提交，不混入代码拆分 PR |
| `Compact compiler cutover` 可能已无代码对账 | 这是一个设计决策，需要在 change 中讨论是删除 requirement 还是实现它 |
| 废弃 spec 后 archive 中的旧 change 引用断裂 | archive 是历史记录，不要求活跃 spec 覆盖；清理时只需在主 registry 中移除引用 |

## 保留不动（低收益/高风险）

| 文件 | 行数 | 原因 |
|------|------|------|
| `bundle_layout.mjs` | 2195 | 宪法单真相源——"改目录结构只改这一个文件" |
| `style_master_plan.mjs` | 2324 | 只有 4 个 export，内部 60 函数高度内聚；对外接口极窄 |
| `harness_architecture.mjs` | 1576 | 架构清单，非逻辑代码 |
| `page_image_progressive_raw_owner.mjs` | 2189 | 完整有界渐进式 raw owner，内部内聚 |

## 落地关联

### Change 规划（最小化数量）

本 plan 分 **2 个 OpenSpec change** 实施。核心原则：**每个 change 独立可测试，且相互不重叠文件。** OpenSpec 每个 change 都要走 proposal→specs→design→tasks→apply→validate→archive 完整周期，3 个以上 change 的编排成本会显著超过代码拆分本身的收益。

```
                                                  最终状态
                                               ┌─────────────┐
Change 1: refactor-harness-core (P0)            │ 细粒度文件  │
┌─────────────────────────────────────────┐    │ owner_path  │
│ 步骤 1: 拆分 03-framed-image +          │    │ 精确可设    │
│         04-pure-image 的 God Index      │    └──────┬──────┘
│                                          │          │
│ 步骤 2: 拆分 command_support.mjs          │          │
│                                          │          │
│ 步骤 3: 拆分 state.mjs                   │          │
│                                          │          ▼
│ 关键：不改变 export 签名                  │    ┌─────────────┐
│ state.mjs 保留 re-export 过渡层           │    │ 新文件路径  │
│ command_support.mjs 保留 compat 过渡层    │    │ 就绪        │
└─────────────────────────────────────────┘    └─────────────┘
         │                                              │
         │ Change 1 → npm test 全绿即可合并               │ 依赖
         │                                              ▼
         │                                    ┌─────────────────────┐
         │                                    │ Change 2:           │
         │                                    │ fix-spec-governance │
         │                                    │ (P1)                │
         │                                    │                     │
         │                                    │ 步骤 4a-4e:         │
         │                                    │ · 修复 owner_paths  │
         │                                    │ · 废弃重叠 spec     │
         │                                    │ · 新增 delivery     │
         │                                    · 解析重复认领        │
         │                                    │                     │
         │                                    │ 步骤 5:             │
         │                                    │ · compact compiler  │
         │                                    │ · header-lock       │
         │                                    │ · strict validation │
         │                                    └─────────────────────┘
```

**Change 1（refactor-harness-core）** 把 3 个代码拆分合并到一个 change 里。这是安全的——3 个拆分操作涉及完全不同的文件集：
- `03-framed-image/` + `04-pure-image/` = 文件 A 组
- `shared/cli/` + `shared/cli/commands/` = 文件 B 组
- `shared/state/` + 外部引用文件 = 文件 C 组

没有任何两个拆分修改同一个文件。测试套件（928 cases）是唯一的全局验证门。

**Change 2（fix-spec-governance）** 把 Step 4+5 合并，在 Change 1 完成后才能设置精确的 owner_path。它不修改任何 `.mjs` 逻辑代码。

### 推进跟踪（Checkitems）

每个 Change 内的细化步骤，直接作为 `openspec/changes/<change-name>/tasks.md` 的输入。

#### Change 1: refactor-harness-core

| # | 任务 | 涉及文件 | 完成标志 |
|---|------|---------|---------|
| **1.1** 画出 03-framed-index 内部调用图 | `03-framed-image/index.mjs` | `compileFramedTargetRawPlanCandidate` 被 6 个出口调用的事实已确认 |
| **1.2** 新建 `internal/framed_raw_plan.mjs` | `03-framed-image/internal/framed_raw_plan.mjs` | 核心规划器函数移入，index.mjs 能 import |
| **1.3** 新建 `internal/framed_raw_contract.mjs` | `03-framed-image/internal/framed_raw_contract.mjs` | 验证函数移入 |
| **1.4** 新建 `internal/framed_review.mjs` | `03-framed-image/internal/framed_review.mjs` | review 函数移入 |
| **1.5** 新建 `internal/framed_final_manifest.mjs` | `03-framed-image/internal/framed_final_manifest.mjs` | final 函数移入 |
| **1.6** 新建 `internal/framed_progressive.mjs` | `03-framed-image/internal/framed_progressive.mjs` | progressive 函数移入 |
| **1.7** 新建 `internal/framed_refresh.mjs` | `03-framed-image/internal/framed_refresh.mjs` | refresh 函数移入 |
| **1.8** 新建 `internal/framed_orchestration.mjs` | `03-framed-image/internal/framed_orchestration.mjs` | 编排函数移入 |
| **1.9** 新建 `internal/framed_progressive_orch.mjs` | `03-framed-image/internal/framed_progressive_orch.mjs` | 渐进式编排移入 |
| **1.10** 新建 `internal/framed_identity.mjs` | `03-framed-image/internal/framed_identity.mjs` | 身份解析移入 |
| **1.11** 03-framed-image/index.mjs 变纯 re-export | `03-framed-image/index.mjs` | `npm test` 全绿 |
| **1.12** 04-pure-image 重复 1.1-1.11（前缀换 Pure） | `04-pure-image/**/*.mjs` | `npm test` 全绿 |
| **1.13** 画出 command_support.mjs 的 concern 边界 | `shared/cli/command_support.mjs` | 7 个 concern 边界确认 |
| **1.14** 新建 `cli_diagnostics.mjs` | `shared/cli/cli_diagnostics.mjs` | emitFailed/emitUsage 等移入 |
| **1.15** 新建 `cli_image2_response.mjs` | `shared/cli/cli_image2_response.mjs` | provider 解析函数移入 |
| **1.16** 新建 `cli_style_master.mjs` | `shared/cli/cli_style_master.mjs` | Style Master glue 移入 |
| **1.17** 新建 `cli_status.mjs` | `shared/cli/cli_status.mjs` | collectStatus/printStatus 移入 |
| **1.18** 新建 `cli_artifact_view.mjs` | `shared/cli/cli_artifact_view.mjs` | artifact 引用移入 |
| **1.19** 新建 `cli_deadline.mjs` | `shared/cli/cli_deadline.mjs` | 计时工具移入 |
| **1.20** command_support 缩至核心，设 compat re-export | `shared/cli/command_support.mjs` | `npm test` 全绿 |
| **1.21** 更新 18 个 `commands/*.mjs` 的 import 路径 | `shared/cli/commands/*.mjs` | 逐文件迁移，每迁移一个跑一次测试 |
| **1.22** 更新 6 个测试文件的 import 路径 | `tests/` 中引用 command_support 的文件 | `npm test` 全绿 |
| **1.23** 画出 state.mjs 的 concern 边界 | `shared/state/state.mjs` | 6 个 concern 边界确认 |
| **1.24** 新建 `state_execution.mjs` | `shared/state/state_execution.mjs` | playbook 生命周期移入 |
| **1.25** 新建 `state_identity.mjs` | `shared/state/state_identity.mjs` | 身份/适配器移入 |
| **1.26** 新建 `state_evidence.mjs` | `shared/state/state_evidence.mjs` | evidence 记录移入 |
| **1.27** 新建 `state_progressive.mjs` | `shared/state/state_progressive.mjs` | 渐进式 handoff 移入 |
| **1.28** state.mjs 缩至核心 I/O，设 re-export 过渡层 | `shared/state/state.mjs` | `npm test` 全绿 |
| **1.29** 更新 9 个脚本的 import 路径 | 引用 state.mjs 的非测试文件 | 逐文件更新 |
| **1.30** 更新 31 个测试文件的 import 路径 | 引用 state.mjs 的测试文件 | `npm test` 全绿 |

#### Change 2: fix-spec-governance

| # | 任务 | 涉及文件 | 完成标志 |
|---|------|---------|---------|
| **2.1** 修复 `style-master-generation` 的 owner_path | `openspec/config.yaml` | 指向 4 个实际实现文件 |
| **2.2** 修复 `image-generation` 的 owner_path（增加实际文件） | `openspec/config.yaml` | 指向所有相关实现 |
| **2.3** 修复 `visual-asset-management` 的 owner_path | `openspec/config.yaml` | 指向实际 internal/ 文件 |
| **2.4** 解析 5 处重复认领（裁决见"诊断数据§2a"） | `openspec/config.yaml` | 每个文件只有 1 个 primary owner |
| **2.5** 废弃 `image-production` spec（7 req → image-generation） | `openspec/specs/image-production/spec.md` | registry 删除，archive 保留 |
| **2.6** 废弃 `bootstrap-env-guidance` spec（8 req → harness-charter） | `openspec/specs/bootstrap-env-guidance/spec.md` | registry 删除，archive 保留 |
| **2.7** 新增 `delivery` capability + spec | `openspec/specs/delivery/spec.md` + config.yaml | 覆盖 05-delivery/* |
| **2.8** 废弃 `notes-injection`、`pptx-assembly`（由 delivery 替代） | 两个旧 spec 文件 | registry 删除，archive 保留 |
| **2.9** 处理 `Compact compiler cutover` requirement | `openspec/specs/image-generation/spec.md` | 决策：删除或排入新 change |
| **2.10** 清理 `header-lock` archive spec | `archive/.../header-lock/spec.md` | 确认已覆盖后标记/删除 |
| **2.11** `openspec strict validation` 全绿 | 所有 specs + config.yaml | `openspec strict-validate` 零告警 |

### 执行纲领

```
顺序: Change 1 → Change 2（严格串行）
依赖: Change 2 的 owner_path 修复依赖 Change 1 的新文件路径

每个 Change 的完整生命周期（不可跳过，不可并行）：
                                                         ┌── 如果 not ready ──→ 返回 polish 继续
                                                         │
  propose → design → specs → tasks → /polish-openspec-change → ready? ──→ apply → validate → archive → 下一个 Change
                                     ↑                             │
                                     └── 打磨循环 ──────────────────┘
                                     （至少 2 轮，直到 ready for apply）

  · /polish-openspec-change 是强制门槛，不跳过
  · polish 打磨到 apply-ready 后，一路 apply 到底，再 archive
  · 一个 Change 没有走完完整生命周期，不开始下一个 Change
  · 整个 Plan 在所有 Change 都完成 archive 后才算结束
```

#### Change 1: refactor-harness-core

**约束**：
- 不修改 `openspec/config.yaml`
- 不修改任何 spec 文件
- 不改动宪法文件（`charter/*.md`、`CONSTITUTION.md`）
- 保留 backward compat import 路径（re-export 过渡层）
- **关闭条件**：`npm test` 全绿 + `/polish-openspec-change ready for apply` → apply → archive

#### Change 2: fix-spec-governance

**约束**：
- 不修改任何 `.mjs` 逻辑代码
- 只改 `openspec/` 和 `archive/`
- **关闭条件**：`openspec strict-validate` 零告警 + `/polish-openspec-change ready for apply` → apply → archive

#### 推进总表

| 阶段 | 变更 | 状态 |
|------|------|------|
| `openspec propose refactor-harness-core` | 生成 proposal + design + specs + tasks | ✅ 2026-09-01 |
| `/polish-openspec-change refactor-harness-core` | 打磨到 apply-ready | ✅（自检通过后 apply）|
| `openspec apply refactor-harness-core` | 实施代码拆分 | ✅ |
| `openspec archive refactor-harness-core` | 关闭 change | ✅ archive/2026-09-01-refactor-harness-core |
| | | |
| `openspec propose fix-spec-governance` | 生成 proposal + design + specs + tasks | ✅ 2026-09-01 |
| `/polish-openspec-change fix-spec-governance` | 打磨到 apply-ready | ✅（自检通过后 apply）|
| `openspec apply fix-spec-governance` | 修复 spec 所有权 | ✅ |
| `openspec archive fix-spec-governance` | 关闭 change | ✅ archive/2026-09-01-fix-spec-governance |
| | | |
| **Plan 关闭** | 两个 Change 均已 archive，plan 移入 `_done/_closed_plans/` | ✅ |