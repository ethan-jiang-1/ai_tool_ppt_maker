# Fixed Bugs Index — 已修复 bug 归档

> 最后更新: 2026-08-20 | `_backlog/_done/_fixed_bugs/` — 已修复 bug 的归档目录。
> 接收来自 [`../../bugs/`](../../bugs/) 的 bug。`_` 前缀 = coding agent 默认忽略。
>
> **本目录是 bug 编号的归档索引；新 bug 使用所有已分配 BUG 编号后的下一个值，避免与活跃条目冲突。**

## 接收一个修完的 bug

bug 修完后从 `_backlog/bugs/` 通过 `git mv` 移入本目录：
1. 在本文件表格加一行（ID + Date + Title）
2. 更新下面的 "Next available bug ID"
3. 更新 `../../bugs/README.md`（删掉该 bug）
4. 更新 `../README.md`（计数 +1）

---

| ID | Date | Title |
|----|------|-------|
| [BUG-001](BUG-001-main-specs-stored-in-delta-format.md) | 2026-07-11 | 15/16 主 spec 存成 delta 格式，`openspec validate --specs` 系统性失败 |
| [BUG-002](BUG-002-framework-docs-still-say-run-bundle-state.md) | 2026-07-11 | 框架方法论文档仍写 `run-bundle-state.yaml`，与 `_state/` 代码/spec 漂移 |
| [BUG-003](BUG-003-ppt-flow-frozen-style-presets-sort.md) | 2026-07-11 | `ppt_flow.mjs` 对冻结 `STYLE_PRESETS` 原地 `.sort()`，启动即崩 |
| [BUG-004](BUG-004-ppt-flow-state-command-registered-outside-main.md) | 2026-07-11 | `state` 在 `main()` 外注册，`program is not defined` |
| [BUG-005](BUG-005-state-dir-invisible-no-hints.md) | 2026-07-11 | `_state/` 在 run bundle 中隐形——无 README/注释/面包屑 |
| [BUG-006](BUG-006-env-check-deps-no-parent-walkup.md) | 2026-07-11 | env-check 依赖检测只查 cwd 不向上找（`.env` 却向上找） |
| [BUG-007](BUG-007-state-yaml-no-array-playbook-stack-roundtrip.md) | 2026-07-11 | state.mjs YAML 无数组往返 → playbook_stack 崩 |
| [BUG-008](BUG-008-image-api-client-submit-parse-array.md) | 2026-07-11 | Image API submit 未解析 `data:[{task_id}]` 响应，阻断 Image2 出图 |
| [BUG-009](BUG-009-stage3-loadimage-sync-decode-blank-passthrough.md) | 2026-07-12 | Stage 3 同步解码失败导致 full-page 输出白图 |
| [BUG-010](BUG-010-stage3-invalid-svg-passthrough.md) | 2026-07-13 | Stage 3 passthrough 对部分 vendor 图像误报 Invalid SVG |
| [BUG-011](BUG-011-image2-vendor-experience.md) | 2026-07-13 | Image2 vendor 切换、凭据和 fallback 体验不可用 |
| [BUG-012](BUG-012-header-review-stale-fingerprint.md) | 2026-07-13 | Header review gate 在 full-page 与迭代场景中 stale 锁死 |
| [BUG-013](BUG-013-model-sheet-pollutes-style-master.md) | 2026-07-13 | 实验脚本占用 style_master.jpg 作为 style reference，框架层 generateOneImage 无 style ref 时静默接受 |
| [BUG-014](BUG-014-html-objects-unnavigable-sha256-filenames.md) | 2026-07-28 | HTML 审阅面缺少由 slide_id 驱动的直接定位入口 |
| [BUG-015](BUG-015-html-first-rendering-text-only-no-visual-expression.md) | 2026-08-05 | Page Authority visual-language registry 缺少关系型概念视觉的可验证语义 |
| [BUG-016](BUG-016-approve-rejects-valid-plan-hash.md) | 2026-07-21 | `ppt_flow approve` 拒绝有效 plan hash |
| [BUG-017](BUG-017-approve-deadlock-blocks-build-and-image2.md) | 2026-07-21 | HTML gate approval 死锁阻断 build 与 Phase 4 Image2 |
| [BUG-018](BUG-018-preview-plan-fingerprint-body-stripping.md) | 2026-07-21 | Preview 与 read-back body projection 导致 fingerprint 永久不匹配 |
| [BUG-019](BUG-019-visual-review-plan-requires-composition-data.md) | 2026-07-21 | Visual review 重建缺 composition evidence |
| [BUG-020](BUG-020-no-user-override-force-mechanism.md) | 2026-07-21 | 可逆质量 gate 缺少可审计 continuation |
| [BUG-021](BUG-021-image2-transport-not-cli-accessible.md) | 2026-07-21 | Modern Image2 transport 无法由 CLI 构造 |
| [BUG-022](BUG-022-color-palette-legacy-to-html-first-no-migration.md) | 2026-07-21 | Legacy palette 无确定性 HTML-first migration projection |
| [BUG-023](BUG-023-speaker-notes-blockquote-blank-line-breaks-stage5.md) | 2026-07-21 | Speaker note blockquote 空行导致 Stage 5 失败 |
| [BUG-024](BUG-024-versionrecord-key-inconsistency.md) | 2026-07-21 | Version record key 缺少明确校验诊断 |
| [BUG-025](BUG-025-ds-store-not-in-gitignore-breaks-bundle-check.md) | 2026-07-21 | `.DS_Store` 打破 HTML 与 migration topology check |
| [BUG-026](BUG-026-slide-heading-parser-overmatches-section-headers.md) | 2026-07-21 | Slide heading parser 误匹配 preamble section 标题 |
| [BUG-027](BUG-027-delivery-evidence-assembly-15-fields-undocumented.md) | 2026-07-21 | Delivery evidence 必填字段无公开诊断 |
| [BUG-028](BUG-028-markerless-to-html-first-migration-tooling-gap.md) | 2026-07-21 | Markerless 到 HTML-first 缺少可发现迁移工作流 |
| [BUG-029](BUG-029-error-messages-no-expected-vs-actual.md) | 2026-07-21 | 严格校验缺少 bounded expected/actual/path |
| [BUG-030](BUG-030-pipeline-rejects-modified-source-silently.md) | 2026-07-21 | Source 修改导致 gate stale 且缺少归属诊断 |
| [BUG-031](BUG-031-no-state-yaml-validation-tool.md) | 2026-07-21 | State YAML 缺少只读完整性校验入口 |
| [BUG-032](BUG-032-migrate-html-preview-never-works-for-real-decks.md) | 2026-07-21 | `migrate-html` 无法处理真实 markerless deck |
| [BUG-033](BUG-033-legacy-image2-lightweight-iteration-blocked.md) | 2026-07-23 | markerless whole-page deck 的单页迭代被多重控制面诊断阻断；由 CLS-011 三项串行 change 修复 |
| [BUG-034](BUG-034-full-suite-runner-lacks-completable-observable-exit.md) | 2026-07-28 | 默认开发测试入口缺少受控范围、时间预算和可观察退出契约 |
| [BUG-035](BUG-035-target-provider-request-omits-visual-language-clauses.md) | 2026-08-05 | Plan-bound visual-language provider clauses are canonical-validated and serialized to the provider body |
| [BUG-036](BUG-036-concept-content-structure-stripped-from-api-prompt.md) | 2026-08-04 | CONCEPT 场景结构已收束为 VISUAL SCENE，并经真实 v7 provider/delivery 验收 |
| [BUG-037](BUG-037-image2-api-size-not-honored.md) | 2026-08-04 | 请求尺寸与 `2048x1136` native response contract 分离，无 resize 的真实 v7 验收 |
| [BUG-040](BUG-040-pptx-delivery-omits-page-number.md) | 2026-08-04 | 真实 v7 PPTX 25 页 `01`–`25` ordinal footer 交付验收 |
| [BUG-041](BUG-041-pure-raw-images-lack-display-text.md) | 2026-08-04 | Pure display/BODY/scene text contract 经真实 v7 final visual 验收 |
| [BUG-042](BUG-042-provider-prompts-not-surfaced-for-diagnosis.md) | 2026-08-04 | 25-item secret-safe provider request inspection projection 经真实 v7 验收 |
| [BUG-043](BUG-043-production-files-lack-NN-slideID-naming.md) | 2026-08-04 | 真实 v7 final 25/25 `NN_slideID.png` 文件验收 |
| [BUG-044](BUG-044-pure-slides-image-heavy-text-light.md) | 2026-08-04 | Pure BODY 通道和图文比例经真实 v7 final visual 验收 |
| [BUG-045](BUG-045-NN-slideID-naming-not-uniform-across-outputs.md) | 2026-08-04 | 真实 v7 raw/final 25/25 统一 `NN_slideID.png` 命名验收 |
| [BUG-046](BUG-046-style-master-fetch-timeout-causes-attempt-unknown.md) | 2026-08-05 | Style Master candidate dimension/prompt/provider 不兼容导致 `attempt_unknown` 且无重试路径 |
| [BUG-047](BUG-047-style-master-generate-requires-manual-env-loading.md) | 2026-08-05 | `ppt_flow style-master generate` 不自动加载 `.env` 凭证，doctor 却会 |
| [BUG-048](BUG-048-style-master-compiled-prompt-structurally-oversized.md) | 2026-08-05 | Style Master 编译 prompt 结构性过长（全 slide projection digest JSON）超 provider 上限 |
| [BUG-049](BUG-049-style-master-attempt-unknown-no-reconcile-burns-submissions.md) | 2026-08-05 | Style Master `attempt_unknown` 永久阻塞计划、无 reconcile，只能 abandon 烧提交 |
| [BUG-050](BUG-050-style-master-fetch-no-explicit-timeout-undici-300s.md) | 2026-08-05 | Style Master 与 page raw 的 provider fetch 无显式超时，慢 provider 撞 undici 300s |
| [BUG-051](BUG-051-doctor-smoke-false-positive-misses-size-and-prompt-failures.md) | 2026-08-05 | `doctor --smoke` 假阳性，测不出尺寸不符与 prompt 超限 |
| [BUG-052](BUG-052-provider-base-url-comma-list-not-supported-and-async-model.md) | 2026-08-05 | provider base_url 逗号列表不被支持；async task 模型不被 Style Master transport 支持 |
| [BUG-053](BUG-053-style-master-compat-jpeg-loadimage-rejects-cabx-png.md) | 2026-08-05 | Style Master 兼容 JPEG 投影失败：canvas `loadImage` 拒载带 `caBX` chunk 的 provider PNG |
| [BUG-054](BUG-054-page-raw-provider-native-size-mismatch.md) | 2026-08-05 | Page raw provider 返回非契约原生尺寸，pilot 提交全部 known_failure |
| [BUG-055](BUG-055-page-raw-invalid-json-no-response-visibility.md) | 2026-08-08 | Page Image `invalid_json` 以闭集 response shape 区分空响应、HTML 文档和其他非 JSON，且不泄露 provider 数据 |
| [BUG-056](BUG-056-artifacts-need-full-paths-for-user-viewing.md) | 2026-08-08 | 人工 Page Image 检查 handoff 由显式 reference view 逐项给出 locator、类型和目的 |
| [BUG-057](BUG-057-pure-pages-lack-visual-system-consistency.md) | 2026-08-09 | Pure deck-level visual-system binding 与代表性三页 Complete Page Review 共同确认跨页 typography、colour、zones、whitespace 与 layout family 一致 |
| [BUG-058](BUG-058-candidate-selection-prompt-unusable-no-path-long-ids.md) | 2026-08-08 | Style Master review 投影提供候选路径和可选的 `candidate_id` |
| [BUG-059](BUG-059-style-master-compat-jpeg-fails-16bit-png.md) | 2026-08-08 | Style Master 兼容 JPEG 投影支持 16-bit 和非 RGBA provider PNG，且不改变 selection authority |
| [BUG-060](BUG-060-framed-capture-row-stride-corrupts-alpha.md) | 2026-08-08 | Framed RGB Chromium capture 规范化后裁行，修复 alpha 污染和底边透明 |
| [BUG-061](BUG-061-stray-duplicate-run-bundle-deck-dark-factory-current.md) | 2026-08-08 | 重复的 `deck_dark_factory_current` run bundle 已清理 |
| [BUG-063](BUG-063-content-addressed-path-length-unusable.md) | 2026-08-08 | 可重建 logical reference view 解决人类导航，不迁移内容寻址物理目录 |
| [BUG-065](BUG-065-content-addressed-physical-paths-use-full-64-hex.md) | 2026-08-10 | 内容寻址物理路径固定为记录校验的 8-hex 短名，并提供 exact-run 迁移 |
| [BUG-066](BUG-066-build-on-inactive-run-pollutes-state-with-mismatch-keys.md) | 2026-08-10 | Inactive Page Image run 在任何 side effect 前 hard-stop，State 不再持久化 execution-mismatch 诊断键 |
| [BUG-067](BUG-067-style-master-masks-visual-language-errors.md) | 2026-08-16 | Style Master 对 source/config 失败发出 `source_validation`/`edit_source`，不再自循环 inspect（Change 1） |
| [BUG-068](BUG-068-image2-plan-masks-visual-language-errors.md) | 2026-08-16 | `image2 plan` 已知 source defect 不再降级 internal（Change 1） |
| [BUG-069](BUG-069-validate-conflates-source-and-state.md) | 2026-08-16 | `validate` 分离 source-valid/state-stale 投影（Change 3） |
| [BUG-070](BUG-070-doctor-ready-does-not-reach-image2-authorize.md) | 2026-08-16 | doctor READY 与 exact authorize/generate 共享受限 startup env（Change 2） |
| [BUG-071](BUG-071-pilot-review-masks-reconcile-after-store-lock.md) | 2026-08-19 | `pilot-review` store-lock 失败回执区分 live writer / unresolved attempt / 异常锁三分支（change: progressive-pilot-state-and-diagnostics） |
| [BUG-072](BUG-072-progressive-state-cursor-does-not-advance.md) | 2026-08-19 | progressive checkpoint CLI handoff 单调推进 durable cursor，state/status/task projection 一致（change: progressive-pilot-state-and-diagnostics） |
| [BUG-077](BUG-077-pure-visual-language-registry-rejects-org-transform.md) | 2026-08-20 | Visual-language linter 已拒非 ASCII / 不兼容 motif / 禁词 `text`；triage 关闭为 already implemented |
| [BUG-073](BUG-073-bundle-check-root-misdiagnoses-binding.md) | 2026-08-20 | `--check` 先认 `3_versions/vN`；Deck root 是 usage 不是 binding（change: restore-draft-and-cli-projections） |
| [BUG-074](BUG-074-initial-workflow-selection-current-protocol-invalid.md) | 2026-08-20 | 已选 framed/pure 且 identity 空仍是 declared fresh draft（change: restore-draft-and-cli-projections） |
| [BUG-078](BUG-078-style-master-inspect-json-flag-inconsistent.md) | 2026-08-20 | `style-master inspect --json` 注册为同一 owner result 的 JSON renderer（change: restore-draft-and-cli-projections） |
| [BUG-079](BUG-079-init-next-step-missing-upstream-and-self-contradictory.md) | 2026-08-20 | `ppt_flow init` 与 `bundle_layout --init` Next 同一句 `status <v1Path>`（change: restore-draft-and-cli-projections） |
| [BUG-085](BUG-085-delivery-no-review-hint-and-status-next-goes-silent.md) | 2026-08-20 | `status` Next 投影 `workflow_inspection.primary_action`（change: restore-draft-and-cli-projections） |
| [BUG-088](BUG-088-terminal-pilot-checkpoint-node-conflict.md) | 2026-08-20 | durable cursor 投影 owner checkpoint（可后退）；owner 已落盘 + 投影失败是 `partial-effect`（change: project-cursor-to-owner-checkpoint） |
| [BUG-081](BUG-081-no-reset-path-for-unproduced-materialized-v1.md) | 2026-08-20 | 未生产 unique v1 可通过 `reset-unproduced-v1 --confirm-abandon` 回到 init draft（change: reset-unproduced-v1） |

**Next available bug ID: BUG-093**

---

## Suspended (未修复，仍在排查)

悬挂 bug 放在 [`../_suspended_bugs/`](../_suspended_bugs/)，尚未确认修复：

- [BUG-038](../_suspended_bugs/BUG-038-text-frame-dark-overlay-conflicts-warm-editorial.md) — historical compositor path retired; current Framed theme no longer reproduces the report.
- [BUG-039](../_suspended_bugs/BUG-039-async-generate-naming-mismatch.md) — historical scratch-generator naming split is absent from the current raw owner.
- [BUG-075](../_suspended_bugs/BUG-075-onboarding-missing-upstream-material-first-step.md) — 2026-08-20 triage wontfix: Agent owns process.
- [BUG-076](../_suspended_bugs/BUG-076-missing-layer-boundary-1-2-3-charter.md) — 2026-08-20 triage wontfix: layer table is not a prose DAG.
- [BUG-080](../_suspended_bugs/BUG-080-onboarding-no-progress-map-and-no-plain-framed-pure.md) — 2026-08-20 triage wontfix: Agent translates framed/pure.
- [BUG-082](../_suspended_bugs/BUG-082-downstream-success-output-violates-success-handoff-contract.md) — 2026-08-20 triage wontfix: CLI JSON stays Agent-facing.
- [BUG-083](../_suspended_bugs/BUG-083-provider-spend-no-plain-cost-disclosure.md) — 2026-08-20 triage wontfix: no price list.
- [BUG-084](../_suspended_bugs/BUG-084-proceed-repair-redirect-gates-all-jargon.md) — 2026-08-20 triage wontfix: Gate enum stays machine contract.
- [BUG-086](../_suspended_bugs/BUG-086-downstream-terminology-all-jargon.md) — 2026-08-20 triage wontfix: glossary stays a path map.
- [BUG-087](../_suspended_bugs/BUG-087-image2-known-failure-has-no-item-recovery.md) — 2026-08-20 triage wontfix: known_failure exit 0 is successful recording; full-fail break is BUG-088.
- [BUG-089](../_suspended_bugs/BUG-089-image2-plan-exceeds-declared-provider-prompt-budget.md) — 2026-08-20 triage wontfix: measured the inspection request JSON, not compiled prompt.
- [BUG-091](../_suspended_bugs/BUG-091-special-page-class-accepts-forbidden-body-items.md) — 2026-08-20 triage wontfix: PAGE CLASS OVERRIDE stays deck-local.
- [BUG-092](../_suspended_bugs/BUG-092-approved-preview-images-have-no-legal-pptx-path.md) — 2026-08-20 triage wontfix: no scratch→PPTX bypass.
