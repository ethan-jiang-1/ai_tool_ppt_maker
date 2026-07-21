# Fixed Bugs Index — 已修复 bug 归档

> 最后更新: 2026-07-21 | `_backlog/_done/_fixed_bugs/` — 已修复 bug 的归档目录。
> 接收来自 [`../../bugs/`](../../bugs/) 的 bug。`_` 前缀 = coding agent 默认忽略。
>
> **本目录是 bug 编号的唯一权威来源——新 bug 的编号 = 本目录最大编号 + 1。**

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

**Next available bug ID: BUG-033**

---

## Suspended (未修复，仍在排查)

悬挂 bug 放在 [`../_suspened_bugs/`](../_suspened_bugs/)，尚未确认修复。此处不列。
