# COMMANDS - Public routing

`ppt_flow` 顶层命令固定为 11 个：`doctor`, `init`, `status`, `validate`,
`build`, `refresh`, `slides`, `new-version`, `test`, `state`, `image2`。本
change 不增加或改变任何直接 CLI grammar。

## New deck: one v2 workflow

未指定 existing run 时，唯一新-deck route 是
`page-authority-image2-v2` / `image2-page-authority-v2`。`ppt_flow init`
创建一个 authoring draft；人必须先在 canonical source 中显式写一次
`production.workflow: framed|pure`，再验证并进入 provider-facing work。
不要从 deck type、生成物或某个 slide 推断 workflow，也不要在 init 前索要
provider credential。

```bash
node PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs doctor
node PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs init deck_NAME --deck-type keynote --style dark-executive
node PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs validate deck_NAME/3_versions/v1
node PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs state deck_NAME/3_versions/v1 --json
```

unbound doctor 独立显示 `framed-runtime` 与 `image2-raw` readiness，不把
deferred raw provider 事实说成 source-ready。init 不选择 Framed、Pure 或
mixed default，且不创建 raw/final/generated artifacts、PPTX、notes、style
master 或 provider attempt。

## Version workflow and current action

先读取 exact source/state pair 和 owner-issued inspection。对于 target v2，
向人展示已绑定的 `framed` 或 `pure` workflow、当前直接事实、gate 和一个
nearest action；不要让人选择 slide-level authority，也不要展示 shared raw
implementation topology。

| Bound workflow / request | Owner-valid route |
| --- | --- |
| `framed`, exact accepted raw evidence + current frame preset, Text Frame-only | Header Text & Style Refresh; provider-free local composition, then delivery. |
| `framed`, preset/underlay/visual change | Generated Image Rebuild, then delivery. |
| `pure`, visible display or visual change | Generated Image Rebuild, then delivery. |
| Either workflow, speaker notes only | Notes-Only Refresh through shared delivery. |
| Insert, delete, reorder, or Framed/Pure switch | `06-iteration` Structural Versioning Path. |

Framed uses a local deterministic Text Frame; Pure gives Image2 all final
pixels. Those are version-level workflow semantics, not a per-slide menu.

## Receipt-bound lifecycle

The selected workflow owns its semantic rules and publishes a common final-slide
manifest. Shared delivery owns final projection, PPTX assembly, notes injection,
and delivery review. Existing commands remain:

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

`plan` is offline and receipt-bound. Before every nonzero raw submission,
disclose the exact operation, stable IDs, generation profile, and maximum
submission count, then record `authorize` with that exact plan hash. Provider
readiness, init, doctor, a live probe, raw review, and a prior batch never grant
authorization. A proven zero-submit operation remains mechanical and
provider-free.

Complete current evidence with no `proceed|repair|redirect` decision is a
`confirm` gate. Source/state identity failure, invalid workflow owner,
missing/partial/stale evidence, invalid provider scope, or invalid delivery
lineage is a hard-stop: consume the one producer-issued recovery action; never
hand-edit state or derived output.

## Refresh and versioning

For an exact Framed text-only route, these existing commands remain the local
refresh path:

```bash
node PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs doctor --run-dir <run-dir> --operation framed-local-refresh
node PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs refresh <run-dir> --kind title --only <stable-id>
node PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs refresh <run-dir> --kind notes
```

Notes-only work refreshes delivery lineage without changing pixels. Any Pure
visible change or Framed preset/underlay/visual drift returns to the selected
workflow's receipt-bound rebuild route. A workflow switch is never an in-place
mutation.

Insert, delete, reorder, and workflow changes use Structural Versioning Path.
Preview first, show position, stable ID, title, before/after, target workflow,
and exact `plan_sha256`; apply only the confirmed hash:

```bash
node PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs slides move <run-dir> <selector> --after <selector>
node PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs slides move <run-dir> <selector> --after <selector> --apply --plan-sha256 <hash>
```

The clean vNext receives only plan-bound, target-owned `unreviewed` provenance
or `needs_raw_generation` debt. It never inherits raw review, provider
authorization, final/PPTX/notes evidence, or delivery decisions, and
structural apply makes no provider request. `needs_render` is a cost/debt
report, never permission.

## Existing runs only

An exact existing `page-authority-image2-v1` / `image2-page-authority` pair is
a bounded mixed compatibility route. It is never a fresh-init choice and is
never silently converted to v2. Its detailed change classifier is
[`workflow/compatibility/current-v1-page-authority/change-classifier.md`](workflow/compatibility/current-v1-page-authority/change-classifier.md);
target structural classification remains
[`scripts/06-iteration/change-classifier.md`](scripts/06-iteration/change-classifier.md).
Partial v1/v2 pairs repair their exact source or state facts before any
lifecycle selection.

For an explicitly targeted non-Page-Authority historical run, inspect its exact
canonical source/state pair first:

```bash
node PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs state <run-dir> --inspect-legacy-protocol
node PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs state <run-dir> --prepare-legacy-adoption
node PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs state <run-dir> --preview-legacy-adoption
node PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs state <run-dir> --confirm-legacy-adoption --plan-hash <hash>
node PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs state <run-dir> --apply-legacy-adoption --plan-hash <hash>
```

The historical observer alone recognizes exact historical pairs `html-first-v1` / `html-only|html-then-image2` or `whole-page-image2-v1` / `image2-only`.
The human selects one v2 target workflow in the confined candidate, then
confirms the exact preview and target intake. The candidate never derives new
source from legacy prompts, pixels, generated artifacts, reviews, approvals,
provider history, PPTX, or notes.

This is the state-owned `production-mode-transition` adoption transaction; it
is a structural vNext route, never a silent mixed-to-target coercion.

## Observation and control boundaries

For any exact run, `state <run-dir> --json` is the controller-facing resume
surface. Consume `workflow_inspection.primary_action` and its bounded
continuation; use the direct owner CLI only for the selected mutation. Do not
reconstruct review records, infer approval from rendered output, copy a reason
into state, or hand-edit durable state.

`status <run-dir>` and ordinary `state <run-dir> --json` are read-only
observation projections. They never initialize a state, metadata, generated
artifact, or protocol receipt; a missing receipt remains a repair or validation
action issued by its owner.

Gate handling starts with current changed evidence and the producer's recommended
repair. A complete current review awaiting `proceed|repair|redirect` is a human
`confirm`, not an integrity fault. Identity drift, active journal, corrupted
state, unsafe bytes/paths, incomplete evidence, and provider authorization
failures are hard-stops; they never become `--force` or a generic bypass.

## Optional Git note

Git history reader、自动 source replacement、`git checkout`/`git restore`
fallback 都不属于本框架。只有用户明确授权命名 Git 操作和用户给定范围时，Agent
才能协助。标题/小问题修当前版本；同一方向的大改发布 clean vNext。
