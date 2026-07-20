# COMMANDS — Public routing

`ppt_flow` 顶层命令固定为 15 个：`doctor`, `init`, `status`, `approve`, `style-master`, `validate`, `pilot`, `build`, `refresh`, `new-version`, `test`, `state`, `slides`, `migrate-html`, `image2`。

## Pipeline-first rule

先读取 canonical `slide-specifications.md` 的 `production.pipeline`，再处理 branch-specific flags/readiness/writes。

- `html-first-v1`: local HTML Stage 1-5；header/body/KPI/card/chart/callout 均由 HTML renderer/compositor 拥有；不查看 render mode、style master 或 Image2 配置。
- markerless `legacy-image2-first`: 保持 legacy pilot/header/build/provider controls；详情只在 legacy maintenance reference。

## Common commands

```bash
node PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs doctor
node PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs init deck_NAME --deck-type keynote --style dark-executive
node PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs validate deck_NAME/3_versions/v1
node PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs pilot deck_NAME/3_versions/v1
node PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs build deck_NAME/3_versions/v1
node PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs state deck_NAME/3_versions/v1 --json
```

HTML build/pilot/refresh 不接受 provider/model/resolution/style-master/force/reuse image flags。`pilot` 只发布 production-equivalent review artifacts，不发布 PPTX，也不 waive gates。`approve ... content|visual --plan-hash <hash>` 只接受当前 reset-bound approvable plan。

Gate response always starts with the recommended repair: show the changed bounded evidence, rebuild or review the current artifact, then publish the exact current decision. A reversible evidence/process risk may expose a reasoned, version-scoped waiver; it remains `waived`, not `approved`, and evidence completeness is reported separately. Plan/reset identity drift, active journals, corrupted state, unsafe paths/bytes, and provider authorization are hard stops: use the producer-owned recovery action rather than editing state or forcing through.

Final delivery review 唯一 publisher（closed state subcommand syntax）：

<!-- coherence:pseudocode reason="state evidence subcommand is parsed by ppt_flow state, not a top-level option" -->

```bash
node PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs state <run-dir> --record-delivery-review proceed
```

The same closed form accepts `repair --reason "..."` or `redirect --reason "..."`.

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

## Structural and migration

`slides` preview 必须绑定 position · stable ID · title、before/after 与 exact `plan_sha256`；apply 只发布 source/control vNext。`migrate-html preview/apply` 绑定 candidate/base receipts、old-side mode/hash、active source execution、journal token 与 hidden-target output equality；preview/apply/recovery 全部 zero-provider。

Git history reader、自动 source replacement、`git checkout`/`git restore` fallback 都不属于本框架。只有用户明确授权命名 Git 操作和用户给定范围时，Agent 才能协助。
