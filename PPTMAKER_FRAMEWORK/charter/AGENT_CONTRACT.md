# Agent Contract

## Authority

New Page Authority authoring uses `page-authority-image2-v2`. A version records
exactly one `production.workflow: framed|pure` before provider work; state then
binds the same workflow in `image2-page-authority-v2`. The target method graph
is `03-framed-image XOR 04-pure-image -> 05-delivery -> 06-iteration`.

| Target concern | Sole owner | Refresh consequence |
| --- | --- | --- |
| `framed` semantics, text-free underlay, Text Frame, composition | `03-framed-image` | Exact-evidence Text Frame-only work may compose locally; preset/underlay drift rebuilds raw. |
| `pure` display/raw contract and raw-to-final publication | `04-pure-image` | Any visible display or visual change rebuilds raw. |
| Final projection, PPTX, notes, delivery | `05-delivery` | Notes-only work refreshes delivery lineage without pixel work. |
| Refresh classification and structural routing | `06-iteration` | Workflow switches and structural edits create a previewed vNext. |

Any non-v2 source/state pair is an unsupported-protocol hard-stop. It is not a
workflow choice and is never silently rewritten or interpreted as current.

## Invalidation

Use the smallest owner-valid path:

- Header Text & Style Refresh for v2 Framed Text Frame-only work with exact
  accepted raw evidence and a current preset.
- Generated Image Rebuild for v2 Pure visible display work and every Framed
  preset, underlay, or visual-contract change.
- Notes-Only Refresh for speaker notes through `05-delivery`.
- Structural Versioning Path for additions, removals, reordering, or a whole
  Framed/Pure workflow switch.

Structural work is preview-first. The exact plan hash binds apply; target
materialization makes no remote call. A missing raw item is reported as
`needs_render`, never silently generated.

## Evidence

Target production is a receipt chain: v2 source receipt, adapter-owned typed raw
plan, shared authorization and accepted raw evidence, selected-adapter final
manifest, then `05-delivery` projection, PPTX, notes, and delivery review. A
later receipt cannot repair a missing earlier receipt. Generated files are
rebuildable output and never replace the receipt chain.

## Unsupported boundary

Non-v2, corrupt, hybrid, or ambiguous source/state pairs stop at the generic
unsupported-protocol/export action. Observation creates no receipt, state,
adapter, provider request, or generated-artifact read.

## RUN_BUNDLE locator entry

When no exact local run directory is known, a user may provide `RUN_BUNDLE.md`
bytes. Resolve them through
`scripts/shared/run-bundle/run_bundle_locator.mjs`; it accepts only the card,
an optional original-card path, or a human-supplied deck/framework root. It
does not infer a deck from the current directory, names, or timestamps.

After resolution, use the state owner only to obtain the active run version or
`resolveContinuationTargetVersion`; 不得用第二个 YAML parser. Validate
the exact result with `bundle_layout --check <run-dir> --structure-only`, then
use `ppt_flow state <run-dir> --json` and `status` for the current action.
When the resolver reports a conflict, request the current card or repair the
named root; 不得拿另一条路径覆盖. A terminal deck may be inspected read-only.
generic remote-chat attachment integration is not a framework capability.

## Git boundary

Visible `vN` versions remain the deck's working authority. Git is optional and
user-owned; `_generated/` 始终是可重建派生品. 一个连续 source-work episode 内最多
给出一次非阻塞 checkpoint 建议。
A suggestion does not authorize inspection. Without explicit authorization for
a named operation and exact scope（命名操作和精确范围）, do not inspect or
change Git state. 普通 checkpoint 授权不包含任何 inspection.

## Agent behavior

- Humans own content and approval; the Agent owns bounded process execution.
- Do not hand-edit `_generated/`, state, receipts, or journals.
- Keep stable mnemonic `slide_id` values; position is snapshot-local.
- Do not request provider credentials for local Framed composition.
- Do not infer a current route from historical source, state, or output bytes.
