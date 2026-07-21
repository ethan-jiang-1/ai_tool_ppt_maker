## ADDED Requirements

### Requirement: Migration preparation confines its projected candidate

Run-bundle management SHALL recognize `_scratch/html-migration/projected-run/` as the only location written by migration preparation. Its non-derived entries SHALL be exactly `slide-specifications.md`, `overrides/`, `preparation.json`, `authoring-context.json`, and `authoring-checklist.json`; `_generated/` is its only derived owner. The candidate inherits source-version overrides and deck-root backbone controls read-only through the candidate resolver. Preparation SHALL not create a loose candidate source, write the markerless source version, modify deck-root state/metadata, or reserve/publish a visible target. The existing migration preview/apply authority SHALL consume the candidate only through its confined resolver and receipt set.

When an old loose scratch candidate is present, only an explicit prepare may read it for compatibility and may copy it into an empty projected candidate. Preview/check SHALL not silently adopt, move, or delete it. Preview SHALL recompute readiness from candidate source/overrides rather than treat support JSON as proof. Target staging SHALL copy only revalidated candidate `slide-specifications.md` and `overrides/`. A projected candidate with conflicting authored inputs, an unconfined path, a symlink escape, or an active migration apply journal SHALL fail closed before candidate replacement or target staging. Candidate support JSON and derived `_generated/` output remain rebuildable or advisory and cannot satisfy canonical target approvals, state, or delivery facts.

#### Scenario: First preparation leaves the source version untouched

- **WHEN** a valid markerless run is prepared for HTML migration
- **THEN** all created candidate source/override files are descendants of `_scratch/html-migration/projected-run/`
- **AND** the source specifications, source controls, deck-root state/metadata, and visible `3_versions/vN` set are unchanged

#### Scenario: Preview does not adopt a loose legacy candidate

- **WHEN** `_scratch/html-migration/slide-specifications.md` exists but no projected candidate exists
- **THEN** preview returns preparation guidance without moving or modifying the loose file
- **AND** only explicit prepare may offer compatible import into an empty projected candidate

#### Scenario: Candidate symlink escape fails before staging

- **WHEN** a projected candidate source/control/asset path resolves outside the candidate root
- **THEN** validation fails without source mutation, hidden target creation, or visible publication

### Requirement: Topology ignores only an explicit macOS system artifact

HTML-production and migration-scratch topology walks in `bundle_layout.mjs` SHALL ignore only an entry whose basename is exactly `.DS_Store`. They SHALL not use a generic dotfile predicate or ignore `__pycache__`, unknown hidden children, journals, locks, reservations, or staging paths. A known lock/journal/reservation is accepted only through its owning transaction allowlist and remains visible to that owner's recovery checks; all other unexpected entries, including names beginning with `.`, SHALL be reported by the applicable HTML/migration topology validator. This requirement SHALL not broaden unrelated run-bundle owner behavior.

#### Scenario: Finder metadata does not break HTML topology

- **WHEN** `.DS_Store` appears in an otherwise valid checked HTML generated or migration directory
- **THEN** bundle checking ignores that exact entry
- **AND** all non-system topology rules still run

#### Scenario: Unknown dotfile is not hidden

- **WHEN** an HTML generated owner contains `.foreign-cache`
- **THEN** bundle checking reports the unexpected hidden entry
- **AND** it does not classify it as macOS metadata

#### Scenario: Transaction owner files remain observable

- **WHEN** a migration journal or publication lock appears in a location not owned by its expected transaction
- **THEN** topology/recovery reports the ownership conflict
- **AND** it does not silently skip the file because its name begins with `.`

## MODIFIED Requirements

### Requirement: Explicit legacy-to-HTML migration publishes a clean version atomically

Run-bundle management SHALL expose a preview/apply transaction that resolves a
complete confined projected candidate. The candidate source plus sparse
`overrides/` are authored inputs; all unchanged controls are effective only
through the closed precedence `candidate override > source-version override >
deck-root backbone`. Preview SHALL validate the same Stage-1 plan and render
the complete proposed HTML deck locally through a framework-issued
`migration-preview` context. It SHALL produce a source diff/proposed contact
sheet/exact plan hash plus `old_side_mode:
verified-current|degraded-missing|degraded-stale`. `verified-current` requires
a complete current common-adaptable legacy final-slide set and a locally built
comparison sheet; a Stage-2 raw sheet alone is insufficient. Missing/stale
final-slide evidence SHALL produce a diagnosis/placeholder with no old pixels,
provider calls, or parity claim and MAY point to separately authorized legacy
maintenance. Scratch publication SHALL not mutate or satisfy legacy/canonical
current manifests, gates, state, assembly, notes, or completion.

The plan SHALL bind the existing canonical sorted `base_receipts` and
`candidate_receipts` arrays for candidate source/overrides and all selected
source-version/backbone inputs, anticipated target version, old-side
mode/evidence, and ordered proposed
composition/final-PNG/contact-sheet SHAs. Before normal apply, the state owner
must have atomically recorded the human's exact confirmation on the same active
source-version `migrate-import` execution and made `apply-html-migration` its
sole active node. Only that node's exact execution-bound
`migration_plan_hash`/`old_side_mode`/`migration_source_version` fields may
authorize apply; all three must match the source run and current plan.
Missing, unrelated, root-level, aliased, or mismatched declarations fail before
the apply journal. Confirmation and apply SHALL re-resolve all bound inputs and
old-side evidence before reservation or staging; any
source/candidate/inherited receipt drift or old-side mode/evidence drift
requires a new preview and confirmation.

It SHALL use the existing run-bundle target-reservation/no-replace same-parent
publication authority. Before any reservation/staging creation it SHALL
generate a cryptographically random 64-lowercase-hex owner token, derive exact
confined reservation/staging basenames from the anticipated target plus that
token, and atomically create complete `_scratch/html-migration/apply-journal.json`
containing exactly `schema: pptmaker-html-migration-apply-journal-v1`,
`owner_token`, normalized host, positive PID, exact `created_at_epoch_ms`,
source execution ID, source/anticipated-target versions, plan hash, old-side
mode, and those basenames. The journal SHALL not require a later
field-population rewrite. Only that owner may create/clean the exact hidden
paths. Apply SHALL recheck unchanged journal bytes and ownership immediately
before reservation creation, staging creation, each staged publication
transaction, success-receipt write, and final rename.

Apply SHALL construct the hidden target from the same inherited
source-version/backbone inputs, copy only the revalidated candidate
`slide-specifications.md` and sparse `overrides/`, construct a fresh
`canonical-run` context with target reset ID null by absence regardless of any
source-version reset history, and revalidate/rerender the real target without
copying the legacy source tree or migration-preview generated bytes. It SHALL write
exact target `_generated/qa/html_migration.json` with
`schema: pptmaker-html-migration-success-v1`, pipeline/publication scope,
source execution ID/version, target version, plan hash/mode, the same canonical
base/candidate receipt arrays, ordered composition fingerprints/final PNG SHAs, contact-sheet
SHA, and timestamp. That receipt SHALL prove only migration
publication/handoff and SHALL NOT satisfy reset, content/visual gates,
assembly, notes, delivery review, or completion. Apply SHALL require exact
proposed-output equality, then publish through one same-parent visible-directory
rename that cannot replace a target. Target collision or any
input/evidence/output drift SHALL publish no visible version. It SHALL not
modify the legacy version, infer structured bodies from prompts, copy legacy or
migration-preview generated artifacts/manifests/receipts, inherit
reset/provider/gate/delivery-review authorization, or invoke legacy generation.
The visible target MAY contain its newly rerendered canonical
HTML/final/contact-sheet artifacts, but Stage 4/completion SHALL remain blocked
until its own content/visual reviews are recorded.

The apply journal SHALL be an exclusive fence for that migration transaction. A
second preview/apply or migration-scratch reset SHALL return `CONFLICT` while
it exists. Normal success SHALL remove the owned reservation then journal only
after visible target/receipt verification. Recovery without a token SHALL
require the exact host, proven-dead PID, and age at least
`MIGRATION_APPLY_AUTO_RECOVERY_MIN_AGE_MS = 60000`. Cross-host/otherwise
uncertain recovery SHALL require prior human confirmation that no migration
apply is active, the exact journal token, and age at least
`MIGRATION_APPLY_EXPLICIT_RECOVERY_MIN_AGE_MS = 300000`; a proven-active
same-host PID remains non-overridable. Token/age/journal/path drift or an
unconfined/foreign reservation/staging fails closed. Recovery SHALL use actual
filesystem state rather than journal phase as truth. If the visible target is
absent, it may remove only the exact token-owned hidden staging/reservation and
journal, then restart apply from current plan/preconditions and rerender fully;
it SHALL never continue from partial generated bytes. If the visible target
exists, recovery SHALL remove nothing from it and succeed idempotently only
when exact `_generated/qa/html_migration.json`, complete receipts, canonical
output SHAs, target version, plan hash, mode, and source execution ID all match
the journal; it may then remove only the owned reservation/journal. Any
existing target mismatch, target without exact receipt, foreign hidden path, or
third state returns `CONFLICT` for inspection. Recovery never creates
approval/review evidence.

#### Scenario: User accepts the complete comparison

- **WHEN** preview produced a current exact plan, the user confirms its
  hash/mode, and the state-owned confirmation transition succeeds
- **THEN** apply publishes one clean HTML-first vNext with newly rerendered
  canonical HTML/final/contact-sheet artifacts and pending target-version reviews
- **AND** leaves the legacy version unchanged

#### Scenario: Candidate or inherited input drifts after preview

- **WHEN** any candidate, source-version override, or backbone receipt changes
  before confirmation or apply
- **THEN** confirmation or apply fails without a visible new version
- **AND** requires a new preview and human comparison

#### Scenario: Comparison mode drifts after preview

- **WHEN** old-side evidence changes such that its current mode differs from
  the mode shown in the preview plan
- **THEN** confirmation and apply do not publish a target
- **AND** the Controller obtains a fresh comparison and exact confirmation

#### Scenario: Apply crashes before visible publication

- **WHEN** the owner is proven dead and the visible target is absent
- **THEN** recovery removes only its exact journal-bound staging/reservation,
  reruns from current preconditions, and never reuses partial generated bytes

#### Scenario: Journal changes before final rename

- **WHEN** apply-journal bytes or ownership no longer match after staging succeeds
- **THEN** final publication aborts without exposing the target or cleaning
  foreign paths

#### Scenario: Apply crashes after visible publication

- **WHEN** the target exists with the exact in-target success receipt and
  outputs but journal cleanup did not finish
- **THEN** recovery verifies it and returns idempotent success without
  replacing or rerendering the target
