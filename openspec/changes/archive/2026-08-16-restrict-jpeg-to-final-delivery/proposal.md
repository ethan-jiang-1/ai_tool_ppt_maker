## Why

JPEG currently leaks into the Style Master lifecycle as a root-level
`style_master.jpg` presentation projection. That projection is neither source
authority nor Page Image raw authority, yet its failure can interrupt a valid
Style Master acceptance. It also contradicts the intended production boundary:
Page Image creation, review, and navigation are PNG-first; JPEG is needed only
as a final delivery derivative immediately before composition.

This change makes that boundary explicit at the existing final delivery seam,
where current final PNGs are converted to JPEG for PPTX assembly. The current
Harness has no PDF assembly command, and this change does not define one.

## What Changes

- Make every newly planned Style Master local candidate and current accepted
  selection PNG-only. Retire `style_master.jpg` and its post-selection
  presentation-JPEG projection/replay behavior; a current selection completes
  at its existing immutable selection CAS.
- Reserve `style_master.png` as the optional layout-resolved local PNG
  candidate. It is source input only, never proof of selection; review and
  human navigation expose the accepted immutable PNG candidate through their
  existing derived paths.
- State that shared delivery may newly derive JPEG only from an accepted final
  PNG for final assembly. That derivative must not be required, written, or
  treated as current authority in Style Master planning, raw planning, Pilot,
  Complete Page Review, artifact navigation, or final-PNG review. Immutable
  historical JPEG records remain readable only for audit and predecessor
  binding.
- Cut over the current run-bundle source path without rewriting history:
  `style_master.jpg` is neither a current input nor a current projection, but
  pre-existing immutable JPEG candidate/selection records remain readable as
  attribution-only history. Existing bundles need a new PNG selection before
  raw work can resume; no `deck_*` data is migrated by this
  repository-maintenance change.
- Remove the now-impossible Style Master JPEG-projection diagnostic/replay from
  the direct CLI surface and update focused tests, layout checks, controller
  guidance, and reference documentation.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `style-master-generation`: Style Master candidates and acceptance become
  PNG-only and no longer publish or repair a JPEG presentation projection.
- `run-bundle-layout`: The canonical optional local Style Master input becomes
  `style_master.png`; the retired JPEG layout path is not a current input or
  projection.
- `pptx-assembly`: JPEG is explicitly restricted to the rebuildable final
  delivery representation immediately consumed by final PPTX composition.
- `cli-surface`: Style Master acceptance and artifact navigation remove the
  retired JPEG-projection result and diagnostic path.
- `node-specification`: State readiness distinguishes an exact current PNG
  selection from retained historical JPEG evidence.

## Impact

- Harness code: Style Master planning/selection, bundle layout helpers,
  artifact-view routing, final delivery assembly, and related playbook and
  glossary guidance under `ppt_maker_harness/`.
- Tests: Style Master lifecycle/schema/raw-binding, layout, CLI, and delivery
  coverage under `tests/`.
- Run-bundle contract: **migration** for current local source/projection paths.
  `style_master.jpg` is retired in favor of a deck-owned `style_master.png`;
  immutable historical JPEG records remain auditable but cannot establish
  current readiness or raw authority. The Harness performs no automatic
  migration and does not touch production `deck_*` data as part of this change.
- Control owner: JS owns byte validation, immutable candidate selection,
  derived delivery conversion, and diagnostics. MD guidance consumes those
  owner-issued facts and directs the Agent; it does not create media authority.
- Control outcome: Per
  [`human-centered-gates.md`](../../policies/human-centered-gates.md), JPEG
  bytes at the current PNG source and a historical JPEG selection at a current
  raw gate are non-bypassable `hard-stop`s protecting attributable PNG
  selection identity. Per
  [`agent-assistance-and-control.md`](../../policies/agent-assistance-and-control.md)
  and [`simple-reliable-control.md`](../../policies/simple-reliable-control.md),
  the existing Style Master evaluator returns the one owner-issued source
  refresh or replacement-selection action; the change removes the projection
  replay branch and adds no state, override, or retry route.
