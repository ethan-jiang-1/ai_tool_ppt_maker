## Why

The current Page Image flow begins with page-level `slide-specifications.md`.
Although the Run Bundle reserves `2_backbone/outline.md` and
`design-constraints.md`, the former has no defined source contract and the
latter mixes content boundaries with visual and layout preferences. An Agent
therefore has no canonical, inspectable argument to paginate, and a Deck Author
cannot correct the story before the work becomes a set of pages.

C1 made `story-outline` and `design-constraints` visible conceptual stages;
C2 established one current contract. The owner has now chosen C3 as the next
change: a Block-first narrative source, a provenance-carrying page plan, and
an exact-plan materialization path before C4 adds Page Class or layout policy.

## What Changes

- Introduce the `narrative-authoring` capability. It owns the canonical,
  deck-level Story Outline and Design Constraints source contracts plus
  deterministic pagination into a page plan. A Story Outline has one central
  claim and audience outcome followed by ordered Blocks; each Block records its
  audience question, argument function, supporting evidence or reasoning
  beats, and intended page range.
- Establish `2_backbone/story-outline.md` as the current Story Outline source.
  **BREAKING:** remove `2_backbone/outline.md` from the active Run Bundle
  layout, seeds, templates, guidance, tests, and source lookup. Do not add a
  legacy reader, conversion, migration, or dual-path behavior; historical Run
  Bundles remain outside this change's read/write scope.
- Refocus `design-constraints.md` on audience, language and tone, claim
  boundaries, and required terminology. Visual direction remains owned by
  `visual-language`; per-page layout and density policy remain C4 work.
- Paginate the Story Outline with Design Constraints and the selected Visual
  Language into a reviewable page plan. Each proposed page carries source
  digests and Block/beat lineage; the plan is a derived projection, not a
  second editable page-order source, lifecycle ledger, or acceptance state.
- The Agent presents the proposed page plan in the Deck Author's terms. The
  author confirms a consequential content/structure decision once; only the
  matching exact plan may materialize `slide-specifications.md`, reusing the
  existing structural versioning and source-validation protections. Planning,
  preview, and materialization make no provider call; `needs_render` remains a
  separately authorized downstream concern.
- Materialize C3's schema-stage producers and update the create-deck Controller
  route so narrative source precedes page authoring. Preserve the existing
  controller as the sole lifecycle authority: C3 adds no state machine,
  durable confirmation record, retry path, or parallel gate.

## Capabilities

### New Capabilities

- `narrative-authoring`: deck-level Story Outline and Design Constraints source
  contracts, deterministic provenance-carrying pagination, and the exact-plan
  handoff that produces canonical page source.

### Modified Capabilities

- `harness-directory-layout`: materialize C3's declared schema producers and
  preserve the schema-home producer/anchor contract.
- `playbook-execution`: make Block-first narrative authoring the create-deck
  path before page authoring without adding another controller.
- `run-bundle-layout`: reserve `story-outline.md` and the focused
  Design Constraints source as canonical backbone sources; remove active
  `outline.md` ownership.
- `run-bundle-management`: seed and validate the current narrative sources for
  new bundles without touching existing production data.
- `slide-identity-and-ordering`: bind page-plan materialization to the existing
  structural preview, exact-plan hash, source-byte, stable-ID, and clean-target
  protections.

## Impact

- **Harness source:** `ppt_maker_harness/schema/`, Run Bundle layout/init,
  content-authoring modules, Controller playbooks, and workflow/templates gain
  the upstream source and pagination behavior. `openspec/`, `tests/`, and
  `tests_e2e/` receive corresponding specifications and focused coverage.
- **Run Bundle contract:** `migration`. New/current source work uses
  `2_backbone/story-outline.md`; the prior active `outline.md` path is removed.
  This is a clean cutover in Harness source only: no `deck_*` or `dpt_*` path
  is read, altered, migrated, deleted, or used as a fixture.
- **Human control:** applying the page plan is a `confirm` only because it
  commits a new content and structural meaning selected by the Deck Author.
  The existing exact plan, source-byte, identity, and clean-target checks remain
  hard stops protecting integrity and recoverability. Ordinary deterministic
  planning, diagnostics, and validation remain Agent-owned work under the
  Task Mandate.
- **Control simplicity:** the path is direct source -> one deterministic page
  plan -> conversational review -> exact materialization -> existing source
  validation. It deliberately adds no persistent approval state, fallback,
  migration branch, or provider/CLI control path. The design follows
  `openspec/policies/human-centered-gates.md`,
  `openspec/policies/agent-assistance-and-control.md`, and
  `openspec/policies/simple-reliable-control.md`.
