# COMMANDS — Public routing

`ppt_flow` 顶层命令固定为 15 个：`doctor`, `init`, `status`, `approve`, `style-master`, `validate`, `pilot`, `build`, `refresh`, `new-version`, `test`, `state`, `slides`, `migrate-html`, `image2`。

## Pipeline-first rule

先读取每个 canonical run version 的权威 `production_mode.by_version["3_versions/vN"].mode`（state SSOT），再用 canonical `slide-specifications.md` 的 `production.pipeline` 作为该 version 的实际 renderer 合同，最后处理 branch-specific flags/readiness/writes。`project-metadata.yaml` 的 `production_mode` 只是非权威镜像。

封闭三模式（`scripts/shared/run-bundle/production_mode.mjs` 单一拥有映射）：

- `html-only` → `html-first-v1` / html / refinement disabled / reserved HTML style-master seam。本地完成，零 provider。
- `html-then-image2` → `html-first-v1` / html / refinement required（经 `image2-refine` 生命周期）/ reserved HTML seam。
- `image2-only` → `legacy-image2-first`（markerless whole-page 规范名，不写 frontmatter）/ image2 / refinement not-applicable / current in-framework style master。

`html-only <-> html-then-image2` 同管道原子切换；`html-* <-> image2-only` 跨管道返回 `transition_required`（留给 versioned transition）。新 deck 省略 `--mode` 默认 `image2-only`。

- `html-first-v1`: local HTML Stage 1-5；header/body/KPI/card/chart/callout 均由 HTML renderer/compositor 拥有；不查看 render mode、style master 或 Image2 配置。
- markerless `legacy-image2-first`: 保持 legacy pilot/header/build/provider controls；详情只在 legacy maintenance reference。

## Common commands

```bash
node PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs doctor                       # common+HTML；--mode image2-only 跳过 HTML runtime
node PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs init deck_NAME --deck-type keynote --style dark-executive [--mode html-only|html-then-image2|image2-only]
node PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs validate deck_NAME/3_versions/v1
node PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs pilot deck_NAME/3_versions/v1
node PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs build deck_NAME/3_versions/v1
node PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs state deck_NAME/3_versions/v1 --json
# production-mode authority (same-pipeline transition / mirror repair / version registration / image2 final review)
node PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs state <run-dir> --set-production-mode html-only|html-then-image2
node PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs state <run-dir> --repair-production-mode-mirror
node PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs state <target-run-dir> --register-production-mode-from <source-run-dir>
node PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs state <run-dir> --record-image2-delivery-review proceed|repair|redirect [--reason "<text>"]
```

HTML `pilot` / `refresh` 不接受 provider/model/resolution/style-master/force/reuse image flags；HTML `build` accepts only its explicit local `--force --reason` continuation and never provider controls. `pilot` 只发布 production-equivalent review artifacts，不发布 PPTX，也不 waive gates。`approve ... content|visual --plan-hash <hash>` 只接受当前 reset-bound approvable plan。

Gate response always starts with the recommended repair: show the changed bounded evidence, rebuild or review the current artifact, then publish the exact current decision. A reversible evidence/process risk may expose a reasoned, version-scoped waiver; it remains `waived`, not `approved`, and evidence completeness is reported separately. Plan/reset identity drift, active journals, corrupted state, unsafe paths/bytes, and provider authorization are hard stops: use the producer-owned recovery action rather than editing state or forcing through.

For an HTML run, `state <run-dir> --json` is the controller-facing resume surface. Its bounded `html_resume_guidance` names the outcome (`guide|confirm|hard-stop`), one recommended command, an optional reasoned continuation, the protected invariant for a hard stop, and independent `evidence_complete`. Run the displayed command verbatim; do not reconstruct a review record, infer approval from render output, or copy a reason into state yourself.

## HTML Continuations And State

Normal content/visual approval consumes the exact current plan hash. An explicit waiver is a separate user-owned decision and never upgrades to approval:

```bash
node PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs approve <run-dir> content --plan-hash <current-hash>
node PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs approve <run-dir> visual --waive --reason "<human reason>"
node PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs build <run-dir> --force --reason "<human reason>"
```

`build --force` publishes only any still-needed content/visual waivers, rechecks both gates, and then performs local assembly. It never starts an Image2 provider call. A successful force output may say `force_not_needed`; that means the current normal evidence already sufficed and no waiver was written.

The version-scoped HTML records live only under canonical keys such as
`nodes.html-content-review.by_version["3_versions/vN"]`,
`nodes.html-visual-review.by_version["3_versions/vN"]`, and
`nodes.html-delivery-review.by_version["3_versions/vN"]`. New gate records use
`pptmaker-html-gate-review-v2`; their closed fields bind pipeline, gate, run/reset identity,
status, plan/audit evidence, `evidence_complete`, canonical `waived_checks`, and the decision time.
New delivery records use `pptmaker-html-delivery-review-v2`; they bind current delivery/PPTX/contact-sheet
identity plus the required lineage receipt references, typed decision/reason, `evidence_complete`,
canonical `waived_checks`, and decision time. These are implementation-owned records: users inspect
them through state output but never construct or patch them manually.

```bash
node PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs state <run-dir> --validate-state
```

Validation is read-only. It reports bounded field paths, expected/actual summaries, closed-key or
canonical-version-key violations, confined paths, and SHA mismatches; it does not heal, seed, rewrite,
or choose a repair. Follow the producer's recommended public repair command.

Final delivery review 唯一 publisher（closed state subcommand syntax）：

```bash
node PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs state <run-dir> --record-delivery-review proceed
```

```bash
node PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs state <run-dir> --record-delivery-review repair --reason "<human reason>"
```

```bash
node PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs state <run-dir> --record-delivery-review proceed --force --reason "<human reason>"
```

Normal `proceed` requires complete current evidence and carries no reason. `repair` / `redirect` require a reason. Forced `proceed` is only available when current reviewable PPTX and contact-sheet bytes exist; it records an evidence waiver for incomplete lineage, remains visibly distinct from complete evidence, and does not invent missing paths or hashes.

Reset 唯一入口：

```bash
node PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs refresh <run-dir> \
  --kind reset-html-production --confirm-run-version vN
```

它拥有完整 canonical generated owner recovery；不接受 selectors/dry-run/provider/style/force/reuse overrides，不手删路径，不继承旧 approval。journal recovery 只走 `state --recover-gate-journal <owner-token>`。

## Refresh classification

HTML-first 的 Local Slide Rebuild、Local Deck Rebuild、Notes-Only Refresh 与 Structural Versioning Path 是正式路径。Legacy deck 的 Header Text & Style Refresh、Generated Image Rebuild、Notes-Only Refresh 与 Structural Versioning Path 保持兼容。标题/小问题修当前版本；同一方向的大改发布 clean vNext；结构 apply 本身零远端。

HTML structural output 报 `needs_local_materialization`；legacy output 报 `needs_render`。`needs_render` 只报告成本，不能自动扩大远端授权。用户若要专业 Image2 visual-slot refinement，必须在当前 HTML delivery review 为 `proceed` 后显式使用封闭的 `image2 plan|authorize|generate|accept|use-html|cleanup|unknown-submit` 路由；它不是 renderer 选择，也不会自动开始远端工作。

```bash
node PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs image2 plan deck_NAME/3_versions/v1
node PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs image2 authorize deck_NAME/3_versions/v1 --plan-hash <sha256>
node PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs image2 generate deck_NAME/3_versions/v1 --attempt-id <id>
```

`image2 plan` is optional and offline. When complete delivery evidence is unavailable but current
final-slide/slot identity is safe, `image2 plan <run-dir> --force --reason "<human reason>"` records
only a prerequisite waiver and still cannot submit, promote, or complete the deck. `authorize` remains
an exact plan-hash decision. Credentials and the modern transport are loaded only by `generate`, or by
`unknown-submit --decision retain` when remote reconciliation is requested; `unknown-submit --decision abandon`
stays provider-free. Reconciliation consumes the persisted provider request identity, not a rebuilt prompt/body.

## Structural and migration

`slides` preview 必须绑定 position · stable ID · title、before/after 与 exact `plan_sha256`；apply 只发布 source/control vNext。markerless migration 的唯一顺序是：

```bash
node PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs migrate-html <source-run-dir> prepare --preset <shipped-preset>
# Agent 完成 projected candidate 的 structured fields 后：
node PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs migrate-html <source-run-dir> preview
node PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs state <source-run-dir> --confirm-migration-apply --plan-hash <sha> --old-side-mode <mode>
node PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs migrate-html <source-run-dir> apply --plan-hash <sha> --old-side-mode <mode>
```

`prepare` 只写 version-local `projected-run/` scaffold、palette 和 authoring checklist；不会读取 provider credential 或改写 source/state/visible version。bare `preview` 返回 `preparation_required` guide，未完成 candidate 返回 `authoring_required` guide，二者都不是 comparison evidence 且不会写入。complete preview/apply/recovery 绑定 candidate/base receipts、old-side mode/hash、active source execution、journal token 与 hidden-target output equality，且全程 zero-provider。`verified-current` 才能显示旧侧像素；degraded mode 只给诊断/placeholder。不要手改 `_generated/`、state、journal 或 lock。

Git history reader、自动 source replacement、`git checkout`/`git restore` fallback 都不属于本框架。只有用户明确授权命名 Git 操作和用户给定范围时，Agent 才能协助。
