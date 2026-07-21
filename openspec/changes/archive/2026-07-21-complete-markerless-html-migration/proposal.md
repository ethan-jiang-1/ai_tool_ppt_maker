## Why

The documented markerless-to-HTML migration path currently starts after its
hardest prerequisite has already been completed: an Agent must manually create
an HTML-first source candidate and version-local visual override/asset
scaffolding before `migrate-html preview` can do anything useful.  A bare
markerless run therefore fails at the first command, while hand-authored
palette/schema and heading errors require repeated source-code archaeology.

This change closes that workflow gap for BUG-022, BUG-025, BUG-026, BUG-028,
and BUG-032.  It makes the mechanical preparation discoverable and recoverable
without pretending that an IMAGE PROMPT can be converted into a trustworthy
structured `SLIDE BODY` without Agent judgment.

This is framework maintenance, not production work on a particular deck.
Fixtures will be synthetic; no `deck_*`, `dpt_*`, or generated production
output is a source or test fixture.

## What Changes

- Add the closed operation
  `ppt_flow migrate-html <run-dir> prepare --preset <name>`.  It creates or
  verifies an isolated, version-local candidate only under
  `_scratch/html-migration/projected-run/`; it never rewrites the markerless
  source, publishes a visible vNext, changes source state, or invokes a
  provider.
- Make preparation create a deterministic HTML-first source candidate plus
  version-local visual override/asset scaffolding, a preset- and
  legacy-token-derived palette, and a bounded
  per-slide authoring checklist.  The Agent authors the actual structured
  bodies and content decisions; JS may scaffold, validate, and report missing
  fields but may not infer a family or body from prompt prose.
- Make `migrate-html preview` a non-writing guide for an unprepared or
  incomplete markerless candidate.  It returns the exact prepare syntax,
  candidate location, valid preset choices, and bounded missing authoring
  work; it must never quietly run `prepare` or overwrite authored candidate
  files.  A completed candidate retains the existing complete local
  preview/hash workflow.
- Move migration candidate authority from a loose scratch source file to a
  projected-run virtual version overlay: candidate source and overrides shadow
  the unchanged source-version override/backbone controls through one closed
  resolver. Preview and apply bind that resolved input set by receipts and
  preserve the existing exact-hash, hidden rerender, no-replace-publication,
  journal, and zero-provider invariants. Scratch rendered bytes remain
  comparison evidence and are never copied as canonical target output.
- Seed HTML visual configuration deterministically from the selected shipped
  preset and compatible legacy visual tokens.  Validation reports bounded
  field-level expected/actual differences instead of stopping at the first
  opaque schema mismatch.
- Refine shared slide-document parsing so arbitrary preamble, including prose
  such as `## Slide Specifications`, is allowed before the first valid slide.
  Once slide parsing is implicated, only exact numeric `## Slide <number>:`
  grammar is accepted; numeric-looking malformed headings remain errors rather
  than disappearing into preamble prose.
- Narrow HTML-production and migration-scratch topology tolerance to the
  explicit `.DS_Store` system artifact. Unknown dotfiles, journals, locks,
  and other hidden entries in those owners stay visible to their owning
  validators and are never silently ignored.
- Update migration routing and playbook handoff so the MD Controller selects a
  migration path and the Agent performs authorized mechanical preparation,
  then returns to semantic authoring and the existing human hash/mode
  confirmation before publication.

`human-centered-gates.md` applies to the observable migration outcomes:
unprepared/incomplete candidates are `guide` results; source identity,
candidate overwrite, journal/CAS ownership, exact hash/mode, path confinement,
and no-replace publication remain non-bypassable `hard-stop` boundaries.  No
new waiver or force path is introduced.  `agent-assistance-and-control.md`
applies to the direct candidate source, shared validation, bounded checklist,
and same-check recovery path: the Agent does routine preparation and authoring
work after a legal route is known, while the human retains the semantic
migration decision and exact preview confirmation.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `cli-surface`: extend the closed `migrate-html` operation set with
  `prepare`, guide responses for unprepared/incomplete preview, a
  controller-only migration-confirmation state operation, and matching
  return-audit coverage while preserving the existing exact apply contract.
- `commands-reference`: route explicit legacy migration through preparation,
  Agent authoring, preview, confirmation, and apply without promising
  automatic prompt conversion.
- `content-parsing`: distinguish preamble prose from exact slide headings and
  retain numeric-heading typo diagnostics.
- `html-slide-contract`: resolve a migration candidate's closed source and
  visual-input overlay, including its receipt set, without widening normal
  HTML validation paths.
- `html-slide-rendering`: issue an opaque migration-preview context from the
  resolved candidate overlay and preserve equivalent canonical rerendering.
- `visual-config`: provide deterministic migration palette seeding and
  field-level HTML-first contract diagnostics.
- `visual-asset-management`: resolve candidate asset manifests/bytes as the
  final sparse overlay above source-version overrides and backbone assets.
- `pipeline-orchestration`: treat the isolated projected run as the complete
  migration candidate authority and preserve local preview/apply transaction
  invariants.
- `playbook-execution`: add the preparation and Agent-authoring handoff to the
  `migrate-import` controller before preview and make exact confirmation bind
  the active apply node before publication.
- `node-specification`: give the state owner one atomic, receipt-checked
  migration-confirmation transition; hash/mode are not free-form controller
  state fields.
- `run-bundle-management`: enforce the precise migration-scratch topology and
  explicit `.DS_Store`-only ignore behavior.
- `run-bundle-layout`: define the projected-run virtual-version overlay and
  its source/control/derived ownership without treating it as a deck root.

## Impact

Primary implementation surfaces are `ppt_flow.mjs`, the migration adapter,
the HTML contract/renderer and asset-catalog seams, shared slide-document and
visual-config modules, `bundle_layout.mjs`, `migrate-import.md`, `COMMANDS.md`,
and focused unit/integration/E2E fixtures.
The public top-level CLI inventory remains unchanged; the closed
`migrate-html` subcommand contract grows and `state` gains one
controller-only confirmation operation.  Existing prepared migration
transactions need a compatibility/readiness path or an explicit bounded
re-prepare diagnostic, but no source version is migrated in place and no
legacy approval, state, or generated byte becomes HTML authority.
