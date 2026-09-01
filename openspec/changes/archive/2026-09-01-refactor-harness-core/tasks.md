## 1. 03-framed-image 拆分

- [x] 1.1 画出 03-framed-index 内部调用图，确认 `compileFramedTargetRawPlanCandidate` 被 6 个出口调用、无跨文件循环依赖
- [x] 1.2 新建 `internal/framed_raw_plan.mjs`，移入核心规划器（compileFramedTargetRawPlanCandidate、createFramedCoreFacts、framedRawContract、compileFramedProviderInput 等）
- [x] 1.3 新建 `internal/framed_raw_contract.mjs`，移入验证函数（validateFramedRawContract、validateFramedRawContractAgainstProfile、hasExactKeys 等）
- [x] 1.4 新建 `internal/framed_review.mjs`，移入 review 函数（framedCompletePageReviewInputs、publishFramedCompletePageReview、validateFramedCompletePageReview、framedPilotReviewContribution 等）
- [x] 1.5 新建 `internal/framed_final_manifest.mjs`，移入 final 函数（composeFramedFinalSlideManifest、publishFramedFinalSlideManifest、assertFramedFinalMatchesReviewedComposite 等）
- [x] 1.6 新建 `internal/framed_progressive.mjs`，移入渐进式函数（publishFramedProgressivePilot、validateFramedProgressivePilot、publishFramedProgressiveCompletePageReview 等）
- [x] 1.7 新建 `internal/framed_refresh.mjs`，移入 refresh 函数（classifyFramedRefresh、changedFramedHeaderOverlaySlideIds、refreshFramedProgressiveTargetText、refreshFramedProgressiveTargetNotes 等）
- [x] 1.8 新建 `internal/framed_orchestration.mjs`，移入编排函数（buildFramedTargetRawPlan、authorizeFramedTargetRawPlan、generateFramedTargetRawPlan、prepareFramedTargetRawReview、buildFramedTargetDelivery 等）
- [x] 1.9 新建 `internal/framed_progressive_orch.mjs`，移入渐进式编排（buildFramedProgressiveTargetRawPlan、planFramedTargetPilot、authorizeFramedProgressiveRawBatch、generateFramedProgressiveRawItem、buildFramedProgressiveTargetDelivery 等）
- [x] 1.10 新建 `internal/framed_identity.mjs`，移入身份解析（resolveFramedTargetSource、resolveFramedTargetCandidateSource、resolveFramedStyleMasterScope、parseFramedTargetReceipt、coreStyleMasterSelection 等）
- [x] 1.11 将 `03-framed-image/index.mjs` 改为纯 re-export 层，验证 `npm test` 全绿

**验证方法**：每个任务步骤模式为「创建目标文件 → 移入函数 → 在 index.mjs 添加 re-export → 运行 `npm test`」。每一小步都应使 index.mjs 的 export 保持完整。1.11 完成后验证所有外部调用者（`from "../03-framed-image/index.mjs"`）import 正常。

## 2. 04-pure-image 拆分（镜像 03-framed）

- [x] 2.1 画出 04-pure-index 内部调用图，确认拆分边界
- [x] 2.2 新建 `internal/pure_raw_plan.mjs`，移入核心规划器
- [x] 2.3 新建 `internal/pure_raw_contract.mjs`，移入验证函数
- [x] 2.4 新建 `internal/pure_review.mjs`，移入 review 函数
- [x] 2.5 新建 `internal/pure_final_manifest.mjs`，移入 final 函数
- [x] 2.6 新建 `internal/pure_progressive.mjs`，移入渐进式函数
- [x] 2.7 新建 `internal/pure_refresh.mjs`，移入 refresh 函数
- [x] 2.8 新建 `internal/pure_orchestration.mjs`，移入编排函数
- [x] 2.9 新建 `internal/pure_progressive_orch.mjs`，移入渐进式编排
- [x] 2.10 新建 `internal/pure_identity.mjs`，移入身份解析
- [x] 2.11 将 `04-pure-image/index.mjs` 改为纯 re-export 层，验证 `npm test` 全绿

**验证方法**：同 1.x——创建文件 → 移入函数 → 添加 re-export → `npm test`。

## 3. command_support 拆分

- [x] 3.1 画出 `command_support.mjs` 的 7 个 concern 边界，确认无跨 concern 内部调用
- [x] 3.2 新建 `cli_diagnostics.mjs`，移入 emitFailed/emitUsage/exitUsage/emitCurrentProtocolError/emitExecutionRunVersionMismatch/emitUnsupportedHarnessBinding/createGateDiagnostic/targetPageImageFailure 等
- [x] 3.3 新建 `cli_image2_response.mjs`，移入 provider 响应解析（imageDataUrl/imageBytesDataUrl/pageImageProviderResponseRecord/imageBytesFromPageImageProvider/pageImageProviderTaskId/targetPageImageSubmitFactory/readImage2ProviderResponseJson/resolveImage2ProviderTask 等）
- [x] 3.4 新建 `cli_style_master.mjs`，移入 Style Master glue（styleMasterNextInvocation/styleMasterSubmitFactory/styleMasterProviderBytesFromPayload/initializeStyleMasterImage2Transport 等）
- [x] 3.5 新建 `cli_status.mjs`，移入状态显示（collectStatus/enrichStatusWithState/buildControllerGateContext/printStatus/projectInspectionNext）
- [x] 3.6 新建 `cli_artifact_view.mjs`，移入 artifact 引用（artifactReferenceEntry/artifactUnavailable/pageArtifactGroup/rebuildTargetPageImageArtifactView/refreshProgressiveControllerTaskProjection/advanceProgressiveControllerCheckpoint/targetImage2Operations）
- [x] 3.7 新建 `cli_deadline.mjs`，移入计时工具（IMAGE2_PROVIDER_OPERATION_TIMEOUT_MS/IMAGE2_PROVIDER_TASK_POLL_INTERVAL_MS/image2ProviderOperationTiming/createImage2ProviderDeadline/awaitWithinImage2ProviderDeadline 等）
- [x] 3.8 `command_support.mjs` 缩至核心功能（adapter 解析 + 基础 glue），设 compat re-export 过渡层，验证 `npm test` 全绿
- [x] 3.9 更新 `harness_architecture.mjs` 中硬编码的路径检查：`imageBytesFromPageImageProvider` 的独占位置从 `shared/cli/command_support.mjs` 改为新文件 `cli_image2_response.mjs`（line 1415-1416），验证 `npm test` 全绿
- [x] 3.10 逐文件迁移 18 个 `commands/*.mjs` 的 import 路径到精确新模块，每迁移一个跑一次 `npm test`
- [x] 3.11 更新 6 个测试文件的 import 路径，验证 `npm test` 全绿

**验证方法**：compat 过渡层保留期间，3.10 和 3.11 可以在任意顺序下完成且不破坏测试。

- [x] 3.12 更新架构契约：`imageBytesFromPageImageProvider` 的独占位置检查改为 `shared/cli/cli_image2_response.mjs`（`harness_architecture.mjs`）
- [x] 3.13 将 `cli_diagnostics.mjs`、`cli_deadline.mjs`、`cli_image2_response.mjs` 加入 `PUBLIC_SHARED_INTERFACES`，并在 `source-test-ownership.json` 的 `shared/cli` owner 中登记
- [x] 3.14 迁移 `shared/image2/provider_executor.mjs` 的 runtime seam（deadline/timing + response 解析）从 `command_support.mjs` 到 `cli_deadline.mjs` + `cli_image2_response.mjs`
- [x] 3.15 将 `validatePageImageProviderInputCompilation` 与 `validatePageImageCoreSeam` 改为 adapter-directory-aware（`03-framed-image/`、`04-pure-image/` 内部文件可声明 provider-input schema / 消费 Page Image Core seam），并更新对应 planted tests

## 4. state 拆分

- [x] 4.1 画出 `state.mjs` 的 6 个 concern 边界，确认 CAS writeState 是唯一写入口，无循环依赖
- [x] 4.2 新建 `state_execution.mjs`，移入 playbook 生命周期（startPlaybook/switchPlaybook/resumePlaybook/createDefaultState/createInitialState/createTargetAuthoringState/setNodeStatus/resetNode/skipNode/setGate/setNodeEvidence/setNodeDecision/getNodeStatus/getCurrentNode/getCompletedNodes/getPendingNodes/isNodeCompleted/isNodeDone/isPlaybookComplete/getGateStatus/isGateApproved/buildResumeCard/projectProductionIdentityCompletion/checkEntry/checkExit/getMissingConditions/getEligibleNextNodes/resolveContinuationTargetVersion）
- [x] 4.3 新建 `state_identity.mjs`，移入版本身份/适配器（inspectRunProductionIdentity/resolveRunProductionAdapter/resolveEffectiveStyleMasterSelection/recordEffectiveStyleMasterSelection/activateCleanPageImageTargetDraft/inspectCurrentPageImageTaskMandate/ensureCurrentPageImageTaskMandate/initializeTargetPageImageState/advanceTargetPageImageSourceEpoch/inspectTargetPageImageState/resolveCurrentTargetPageImageSourceState）
- [x] 4.4 新建 `state_evidence.mjs`，移入 evidence 记录（recordTargetAcceptedRawEvidence/recordTargetFinalManifest/recordTargetDeliveryReceipt/recordPageImageRawProviderAuthorization/inspectPageImageRawProviderAuthorization/validateTargetAcceptedRawEvidenceLocalComposeRebind/rebindTargetAcceptedRawEvidenceForLocalCompose/rebindTargetProgressiveRawEvidenceForLocalCompose/registerTargetPageImageStructuralPublication/revalidateTargetPageImageStructuralReplay）
- [x] 4.5 新建 `state_progressive.mjs`，移入渐进式 handoff（recordTargetProgressiveRawPlan/recordTargetProgressivePilotDecision/recordTargetProgressiveCompleteRawReview/recordTargetProgressiveAcceptedRawEvidence/recordTargetProgressiveFinalManifest/recordTargetProgressiveDeliveryReceipt/readTargetProgressiveHandoff/recordTargetProgressiveAuthorizeCliHandoff/recordTargetProgressiveCheckpointCliHandoff/recordStyleMasterAuthorizeCliHandoff/readTargetProgressiveControllerDecision）
- [x] 4.6 `state.mjs` 缩至核心 I/O（readState/writeState/parseStateYaml/stringifyStateYaml/statePath/historyPath/executionLeasePath/prepareStateWrite/healState/ensureStateDirHints/appendHistory/readHistory/resolveExactExecution/requireExactExecutionForRun/repairKnownExecutionMismatch/validateState/validateStateReadOnly），设 re-export 过渡层，验证 `npm test` 全绿
- [x] 4.7 更新 9 个非测试脚本文件的 import 路径，每更新一个跑一次 `npm test`
- [x] 4.8 验证 31 个测试文件 import 路径不变（因 re-export 层），确认 `npm test` 全绿

**验证方法**：re-export 过渡层使得 4.7 和 4.8 可以在任意顺序下完成。4.6 完成后应立即跑 `npm test` 确认 re-export 完整性。

## 5. 最终验证

- [x] 5.1 运行 `node tests/contracts/run_development_verification.mjs`（core 验证套件，2 文件 37 用例），确认 `result: passed`；再运行 `npx vitest run` 全量 sweep，确认除 2 个既有无关失败（`test_diagnostic_recovery_handoff.mjs`、`test_production_schema_conformance.mjs`，改动前即存在）外无新增失败
- [x] 5.2 运行 `vitest run tests/contracts/test_harness_architecture.mjs`，确认架构约束验证通过
- [x] 5.3 运行 `vitest run tests/contracts/test_harness_governance_ledger.mjs`，确认治理验证通过
- [x] 5.4 运行 `openspec validate refactor-harness-core --strict`，确认 change 合规
- [x] 5.5 检查 `git diff --stat`，确认无意外文件改动（不应修改 openspec/config.yaml、宪法文件、spec 文件）
- [x] 5.6 从 `03-framed-image/index.mjs` 随机选 3 个 export，确认外部调用者能正常 import 并使用