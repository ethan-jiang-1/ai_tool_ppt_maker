## MODIFIED Requirements

### Requirement: Legacy migration scratch is temporary and version-local

An explicit migration preview MAY use `_scratch/html-migration/` for a projected candidate overlay, comparison artifacts, the hash-bound plan, and exact transient `apply-journal.json`. Its exact renderer workspace SHALL be `_scratch/html-migration/projected-run/`. The projected root SHALL contain exactly proposed `slide-specifications.md`, sparse normal `overrides/`, `preparation.json`, `authoring-context.json`, `authoring-checklist.json`, and scratch `_generated/slide_plan.json` plus `_generated/html_production/` using normal private object/manifest shapes with `publication_scope: migration-preview`. Candidate source and sparse overrides are writable only inside this root; all unchanged source-version overrides and deck-root backbone controls are inherited read-only through the closed migration candidate resolver. The projected root is not a deck root and SHALL not contain or replace deck-root metadata/state. `preparation.json` is an idempotency/input record, `authoring-context.json` is Agent-only legacy reference, and `authoring-checklist.json` is advisory; none is runtime target authority.

The workspace SHALL be version-local, confined, deletable, excluded from normal source truth, and never accepted by normal preview/build/gates/state/assembly/notes/completion conditions. Direct renderer CLIs SHALL not accept it as `--run-dir`; only the closed migration validator/orchestrator may issue its opaque render context. Preview SHALL recompute readiness from candidate source/overrides rather than trusting support JSON. Apply SHALL construct a hidden clean target from the same inherited source-version/backbone inputs, copy only revalidated `slide-specifications.md` and `overrides/` from the candidate, rerender its hidden canonical target, and SHALL not copy the legacy source tree, support JSON, or scratch generated objects/manifests/locks/receipts into that target. While a valid/uncertain apply journal exists, no whole migration-scratch reset may delete it; the apply recovery matrix owns its resolution first.

#### Scenario: Migration preview is abandoned

- **WHEN** the user declines a migration comparison
- **THEN** deleting `_scratch/html-migration/` loses no source, version, gate, or production truth

#### Scenario: Projected candidate inherits backbone without rewriting it

- **WHEN** migration preparation creates a projected candidate with one sparse visual override
- **THEN** unchanged controls resolve from the source-version override or deck-root backbone by the candidate precedence
- **AND** no deck-root control or source-version override is rewritten

#### Scenario: Scratch manifest is placed under canonical HTML production

- **WHEN** a `publication_scope: migration-preview` manifest or receipt appears under a visible version's canonical `_generated/html_production/`
- **THEN** bundle validation reports an ownership violation
