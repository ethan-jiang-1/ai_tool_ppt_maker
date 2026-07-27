# COMMANDS - Public routing

`ppt_flow` 顶层命令固定为 11 个：`doctor`, `init`, `status`, `validate`, `build`, `refresh`, `slides`, `new-version`, `test`, `state`, `image2`。

## New deck: Page Authority only

未指定一个 historical run 时，唯一新-deck route 是 `image2-page-authority` / `page-authority-image2-v1`。`ppt_flow init` 只创建这个 current route。不要要求用户选择 retired production route，也不要在 init 前索要 provider credential。

```bash
node PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs doctor
node PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs init deck_NAME --deck-type keynote --style dark-executive
node PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs validate deck_NAME/3_versions/v1
node PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs state deck_NAME/3_versions/v1 --json
```

unbound doctor 独立显示 `framed-runtime` 与 `image2-raw` readiness，不把 deferred raw provider 事实说成当前 source-ready。`framed-image2` 是 source default；init 创建 canonical source/state/control scaffolding，且不创建 raw/final/generated artifacts、PPTX、notes、style master 或 provider attempt。

## Pixel authority

| Authority | Final-pixel owner | Choose it when |
| --- | --- | --- |
| `pure-image2` | Image2 owns the complete page. | Readable body labels, values, quotations, captions, timeline dates, or diagram text carry meaning. |
| `framed-image2` | Image2 owns a text-free full-canvas underlay; the fixed local `standard-v1` Text Frame owns optional kicker/subtitle/callout and required title pixels. | The visual body is text-free beneath that deterministic frame. |

Pure does not create a local body renderer. Framed does not send Text Frame literals to Image2 and accepts no slide-owned markup, CSS, geometry, font, color, retired prompt fields, or provider prompt/style/output override. Use the closed `VISUAL BRIEF` and registered identity inputs only.

## Receipt-bound Page Authority lifecycle

```bash
node PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs image2 plan <run-dir> --json
node PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs image2 authorize <run-dir> --plan-hash <hash>
node PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs doctor --run-dir <run-dir> --operation raw-generation
node PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs image2 generate <run-dir> --plan-hash <hash>
node PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs image2 review <run-dir> --json
node PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs image2 accept <run-dir> --decision proceed
node PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs build <run-dir>
node PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs state <run-dir> --record-page-authority-delivery-review proceed
```

`plan` is offline and receipt-bound. Before every nonzero raw submission, disclose the exact operation, stable IDs, generation profile, and maximum submission count, then record `authorize` with that exact plan hash. Provider readiness, init, doctor, a live probe, raw review, and a prior batch never grant that authorization. A proven zero-submit operation remains mechanical and provider-free.

`review` creates a non-publishing raw projection. Complete current raw evidence with no decision is a `confirm` gate, so record `proceed`, `repair`, or `redirect`; missing, partial, stale, or mismatched raw evidence is a hard-stop and returns to its owner. `build` reaches the single `finalizePage(...)` interface, final manifest/projection, PPTX assembly, and notes receipt. Complete delivery evidence without a delivery decision is another `confirm` gate; use `--record-page-authority-delivery-review proceed|repair|redirect` (repair/redirect require a bounded reason). Source/state identity failures, invalid evidence, invalid provider scope, unknown submission, and attempted unauthorized submit are hard-stops with one producer-issued recovery action.

## Refresh and versioning

Framed Text Frame-only changes are local and provider-free when accepted raw evidence remains exact:

```bash
node PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs doctor --run-dir <run-dir> --operation framed-local-refresh
node PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs refresh <run-dir> --kind title --only <stable-id>
node PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs refresh <run-dir> --kind notes
```

After a Framed refresh, rebuild the current final/assembly/notes lineage as required and record a new current delivery decision. Pure display edits and all raw visual/source-contract changes require new raw evidence and review; use the lifecycle above rather than a local refresh.

Insert, delete, reorder, and other structural changes use Structural Versioning Path. Preview first, show position, stable ID, title, before/after, and exact `plan_sha256`; apply only the confirmed hash:

```bash
node PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs slides move <run-dir> <selector> --after <selector>
node PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs slides move <run-dir> <selector> --after <selector> --apply --plan-sha256 <hash>
```

The clean vNext receives only plan-bound, target-owned `unreviewed` raw materialization or `needs_raw_generation` debt. It never inherits raw review, provider authorization, final/PPTX/notes evidence, or delivery decisions, and structural apply makes no provider request. `needs_render` is a cost/debt report, never permission.

## Existing runs only

For an explicitly targeted existing run, first inspect its exact canonical source/state pair. `project-metadata.yaml` is only a mirror:

```bash
node PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs state <run-dir> --inspect-legacy-protocol
node PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs state <run-dir> --prepare-legacy-adoption
node PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs state <run-dir> --preview-legacy-adoption
node PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs state <run-dir> --confirm-legacy-adoption --plan-hash <hash>
node PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs state <run-dir> --apply-legacy-adoption --plan-hash <hash>
```

Only the read-only historical observer recognizes an exact `html-first-v1` / `html-only|html-then-image2` pair or an exact `whole-page-image2-v1` / `image2-only` pair. It is historical evidence, not an ordinary build, refresh, review, or provider route. The Agent prepares the confined candidate;
the human authors every target slide's `pure-image2|framed-image2` choice and its adoption-matrix row,
then confirms the exact preview and target intake. The candidate never derives new source from legacy
prompts, pixels, generated artifacts, reviews, approvals, provider history, PPTX, or notes.
These are not fresh-init choices and cannot reinterpret a Page Authority source.

Adoption itself makes no Image2 request. It publishes a clean Page Authority vNext at `source_epoch: 1`;
every target slide starts as `needs_raw_generation`, and later raw generation, human raw review, pilot,
and delivery work follow the normal Page Authority lifecycle independently. Missing, unsupported, or
partially Page Authority facts are repair/export or Page Authority-pair repair paths, never inferred
adoption. Page Authority never substitutes retired evidence or historical generated artifacts for its
direct prerequisites.

The state-owned `production-mode-transition` transaction is the bounded adoption transaction. It has
no caller-selected production target, preserves the source version, and does not copy approvals or
generated evidence.

## Observation and control boundaries

For any exact run, `state <run-dir> --json` is the controller-facing resume surface. Consume `workflow_inspection.primary_action` and its bounded `continuation`; use the direct owner CLI only for the selected mutation. Do not reconstruct review records, infer approval from rendered output, copy a reason into state, or hand-edit durable state.

Gate handling starts with the current changed evidence and the producer's recommended repair. A complete current review awaiting `proceed|repair|redirect` is a human `confirm`, not a repairable integrity fault. Identity drift, active journal, corrupted state, unsafe bytes/paths, incomplete evidence, and provider authorization failures are hard-stops; they never become `--force` or a generic bypass.

## Optional Git note

Git history reader、自动 source replacement、`git checkout`/`git restore` fallback 都不属于本框架。只有用户明确授权命名 Git 操作和用户给定范围时，Agent 才能协助。标题/小问题修当前版本；同一方向的大改发布 clean vNext。
