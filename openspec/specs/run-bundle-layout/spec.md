## Purpose

Define the canonical **run bundle** (`deck_{NAME}/`) directory ontology: three-tier tree, per-directory roles, structure gradient (上严下松 / upper-strict lower-loose), and GREP-friendly placement index (Where Map in `reference/glossary.md`).

Counterpart to `harness-directory-layout` (soft bundle `ppt_maker_harness/` only). Do not merge the two.

Machine authority for tree text and path constants: `ppt_maker_harness/scripts/shared/run-bundle/bundle_layout.mjs` (`renderTree()`). CLI scaffold/validate behavior is owned by `run-bundle-management` on the same module.
## Requirements

### Requirement: Structure gradient upper-strict lower-loose

Run-bundle layout SHALL follow **stricter toward the root, looser toward the leaves** (上严下松 / structure gradient): deck root admits only constitutionally named control files and first-class directories; mid-tier dirs remain whitelist-bound; a version dir admits source + `overrides/` + `_generated/` + `_scratch/`; `_scratch/` internals are not filename-whitelisted. Temporary files SHALL sink down into `_scratch/` and SHALL NOT be placed at the deck root or in invented dirs named `_tmp/`, `backup/`, or `_bak/`.

#### Scenario: Gradient names root strictest and scratch loosest

- **WHEN** Agent reads the structure-gradient / 上严下松 definition under this capability or its Where Map
- **THEN** the text states the deck root is the strictest layer
- **AND** version `_scratch/` is the official loose temp outlet

### Requirement: Run-bundle root admits an agent-agnostic generated entry control
The canonical strict deck root SHALL admit RUN_BUNDLE.md and AGENTS.md alongside CLAUDE.md and deck-guide.md without loosening any other root name. RUN_BUNDLE.md is a static locator manifest; deck-guide.md is the operating guide; AGENTS.md and CLAUDE.md are short pointers to locator then guide. None claims current run version, mode, node, gate, digest, next action, or approval. The root-control validator is shared by structure checking and locator verification and neither reads state nor selects a version.

An older bundle may physically lack a newer locator or Agent card without failing structure-only validation. That tolerance is layout-only: it SHALL not establish current source/state identity, select a run, permit resume, or trigger a write. State-aware commands classify unsupported protocol separately and return one bounded owner-issued typed next action.

#### Scenario: Optional historical card is not execution authority
- **WHEN** an existing bundle lacks RUN_BUNDLE.md or AGENTS.md
- **THEN** structure validation may report its layout without mutation
- **AND** no state/resume command treats that absence or presence as current run authority

### Requirement: Run Bundle locator binds one exact local Harness

A current Run Bundle locator SHALL use schema `pptmaker-run-bundle-v2` and
contain exactly the scalar fields `schema`, `deck_root`, `harness_root`, and
`harness_relation`. `deck_root` and `harness_root` SHALL be canonical absolute
local paths to distinct roots, and `harness_relation` SHALL be the normalized
relative relation from the Deck root to that exact Harness root. The declared
root and relation SHALL resolve to the same verified Harness root; the locator
SHALL not carry `harness_id`, a release, a Git revision, a content hash, or a
portable cross-Harness identity.

#### Scenario: A new locator describes a local Harness binding

- **WHEN** a current Run Bundle locator is rendered
- **THEN** it contains only the four v2 binding fields and resolves both binding
  references to the same local `ppt_maker_harness/` root
- **AND** it contains no retired root field or portability identifier

### Requirement: Run Bundle placement remains external to its Harness

One Deck SHALL have one Run Bundle, which MAY be placed in any local directory
outside its Harness root. The Bundle SHALL bind only to the exact local Harness
root that created it. Relocating either root or presenting a different Harness
SHALL not silently rebind, select a fallback root, or establish portability.

#### Scenario: A different Harness is presented for a current Bundle

- **WHEN** a locator's declared and relation-derived Harness roots do not match
  the exact local Harness binding
- **THEN** the locator does not resolve a Harness for that Bundle
- **AND** it does not substitute a requested root or scan for another Harness

### Requirement: Run Bundle lessons remain bundle-local

`_lessons/` SHALL retain only non-secret operational knowledge for its one Run
Bundle. Locator validation and Harness operation SHALL not promote, merge, or
infer a global or cross-session memory from those files.

#### Scenario: A Bundle contains local lessons

- **WHEN** an Agent opens a current Bundle with `_lessons/`
- **THEN** it may read those lessons before guessing about that Deck
- **AND** it does not treat them as Harness-wide knowledge or workflow state

### Requirement: Page Authority artifacts have canonical rebuildable owners

Run-Bundle Layout SHALL declare canonical Page Authority ownership for the visual-language/reference
sources, Style Master candidate history, current effective-style payload/selection/acceptance, resolved
receipt, raw manifest, raw-review projection and coverage, final manifest, and final projection under the
existing deck/version topology. Raw, final, and review outputs SHALL remain rebuildable derived artifacts
under the version leaf; source/state ownership SHALL not be inferred from their paths, names, or presence.

Style Master candidate plans, grants, attempts, candidate bytes, provenance, and unknown-plan abandonment records SHALL be retained only by
the append-mostly `1_upstream_raw_material/style-master-iterations/` owner. Under that owner, immutable plans
SHALL live beneath `plans/<plan-sha256>/`, while exactly one small CAS-protected
`scopes/<run-version>/<workflow>/head.json` SHALL name the current plan generation, predecessor, and lifecycle
identity for each exact scope; progress/status SHALL be derived from the current plan's direct records rather
than persisted in the head. No directory order, timestamp, candidate filename, or compatibility payload SHALL
act as a current-plan pointer. The layout-resolved current style payload remains the confined, format-correct
JPEG compatibility asset: an existing `overrides/visual-style/style_master.jpg` takes precedence for that run,
otherwise the path is `2_backbone/visual-style/style_master.jpg`. Its effective selection and acceptance receipt
SHALL bind the exact bytes and explicit applicable version/workflow scope through their canonical state owner. A
candidate artifact or the payload file alone SHALL NOT be current acceptance. Promotion may update only that
resolved path and SHALL NOT create a version override or represent scope selection as a version-local file overwrite.

The immutable `plans/<plan-sha256>/candidate-grant.json` SHALL be a canonical
`page-authority-style-master-candidate-grant-v1` record whose external `candidate_grant_sha256` is the canonical
JSON digest. It binds that plan's run-version/workflow, exact ordered generated slots, their equal positive maximum
submission count, and candidate-generation profile; it is neither a mutable consumption ledger nor a page raw
authorization. Readers SHALL reject an absent, malformed, divergent, or cross-plan grant before treating an
attempt as cost-authorized, and an existing grant file may only exact-match rather than be replaced.

Each generated candidate's `attempt.json` and any plan `abandonment.json` SHALL likewise use their exact
Style Master canonical schemas and external canonical-JSON digests. An attempt binds its one plan/slot/grant and
permitted CAS status facts; abandonment binds the exact current head, terminal unknown attempt, provider request,
and normalized reason. Layout/lifecycle readers SHALL reject malformed, extra-field, cross-bound, or
digest-mismatched records before deriving grant consumption, plan terminality, or successor eligibility; no
filename, status projection, or compatibility payload may substitute for those direct records.

Only `style-master-iterations/_staging/plan-<unique>/` MAY hold an incomplete initial plan bundle. The owner
SHALL atomically rename a fully validated staged bundle into `plans/<plan-sha256>/` before head CAS. Layout and
lifecycle readers SHALL ignore `_staging/` and complete-but-unreferenced plans as current authority. Cleanup
SHALL be confined to `_staging/` and occur only in an explicit owner mutation, never layout inspection;
immutable plan directories SHALL not be deleted merely because no current
head names them.

Each canonical candidate slot SHALL keep its immutable image bytes and canonical `provenance.json` together.
A local provenance record SHALL use `page-authority-style-master-local-provenance-v1` without a plan digest;
a generated record SHALL use `page-authority-style-master-generated-provenance-v1` and bind the plan, slot,
compiled prompt, generation profile, provider request, bytes, media type, and dimensions. Local plan identity
and generated terminal attempts SHALL reference the corresponding canonical provenance digest. A provenance
file or image without the required plan/head/terminal-attempt chain SHALL not become selectable evidence.

Each head SHALL contain only `schema: page-authority-style-master-head-v1`, canonical `run_version`, exact
`workflow`, `plan_sha256`, positive `plan_generation`, and nullable `previous_plan_sha256`, cross-matched to the
referenced plan identity. Its CAS SHALL compare expected absent or exact prior canonical bytes and atomically
replace only that scope's head. The plan directory name SHALL equal SHA-256 of the owner-defined canonical
`page-authority-style-master-plan-identity-v1`, not the bytes of a self-referential plan file.

A raw-review projection SHALL be stored as its actual PNG bytes in that version's derived review
owner. Its coverage record SHALL reference the current source epoch, projection PNG SHA-256, the shared
projection/capture-profile digest, the selected workflow's typed review-contribution digest, and the
exact covered raw byte identities. A Framed contribution SHALL in turn bind its canonical render
profile and generic safe-zone guides. These identities SHALL NOT be collapsed into one ambiguous
renderer-profile field, inferred from a filename, copied into metadata mirrors, or replaced by a final
projection path.

Source state SHALL own only the version-scoped acceptance reference, not a duplicate provider payload,
page layout proof, workflow contribution artifact, or second evidence ledger.

Structural vNext publication SHALL preserve the source version's acceptance reference without creating a
target-version reference from it. The target's absent record is intentional fresh scope, not a layout defect.
Exact replay of an already-published structural plan SHALL preserve a later valid target-owned reference after
revalidation. The replay branch SHALL exact-match the published target source/receipt and state tuple without
restaging or recreating the target, and it SHALL preserve any active target Controller execution as well as the
target-owned reference. Neither first publication nor replay SHALL create a version override or use compatibility
bytes to infer either record.

#### Scenario: Derived Page Authority evidence can be rebuilt
- **WHEN** a current Page Authority derived raw, final, or review artifact is deleted
- **THEN** layout validation identifies its canonical rebuild owner
- **AND** no user edits the derived file or treats it as source authority

#### Scenario: Review profile identities remain distinct

- **WHEN** a Framed raw-review projection is materialized
- **THEN** coverage separately binds the shared projection/capture profile and the Framed workflow contribution that includes its render profile
- **AND** neither identity is inferred from the projection path or substituted for the provider generation profile

#### Scenario: Candidate history does not promote itself

- **WHEN** Style Master candidate bytes and provenance exist under `style-master-iterations/`
- **THEN** layout inspection identifies their candidate-history owner and the separate effective-style acceptance owner
- **AND** it does not treat the bytes, a copied file, or a version-local path as current style selection

#### Scenario: Partial plan staging is never candidate history authority

- **WHEN** plan compilation stops before staged bundle rename or after rename but before head CAS
- **THEN** layout inspection ignores `_staging/` and treats the complete unreferenced plan as immutable noncurrent history
- **AND** recovery deletes only confined staging entries, never a canonical plan directory or another scope's head

#### Scenario: Candidate head makes same-input recovery exact

- **WHEN** a scope's terminal plan is followed by another plan with unchanged authored style inputs
- **THEN** layout inspection resolves the successor through its CAS head and distinct generation/predecessor-bound plan hash
- **AND** it does not reopen the terminal plan or choose between history directories by timestamp

#### Scenario: Compatibility payload projection does not broaden promotion scope

- **WHEN** one exact version/workflow promotion rebuilds its layout-resolved compatibility payload
- **THEN** the canonical acceptance binding remains scoped only to that tuple and other version records remain unchanged solely because the payload moved
- **AND** it does not create a version override, select it for another version, or preserve stale evidence as current

#### Scenario: Structural publication keeps version selection ownership exact

- **WHEN** a source version with an accepted Style Master publishes vNext
- **THEN** layout/state inspection keeps the source reference, reports the new target reference absent, and requires target-scope Style Master work
- **AND** exact structural replay preserves any later target-owned reference without deriving it from the source record or layout-resolved compatibility payload

#### Scenario: Existing bundle needs explicit per-run migration

- **WHEN** an exact schema-v5 v2 bundle has a confined legacy style payload but no effective-style acceptance record
- **THEN** layout/state inspection preserves the bundle and identifies the normal zero-generated Style Master path for that selected run
- **AND** it does not bulk-scan decks, seed state during observation, or present legacy raw lineage as newly bound

### Requirement: Current generated ownership is Page Authority-only
Canonical run-bundle layout SHALL assign current raw, review, final, projection, PPTX, and notes artifacts to v2 Page Authority owners. Foreign generated trees SHALL not be selected as current artifacts or execution authority.

#### Scenario: A current path is resolved
- **WHEN** a Page Authority operation resolves generated paths
- **THEN** it receives v2 Page Authority owner paths and no foreign owner path

### Requirement: Progressive raw production records have one append-mostly owner

Run-Bundle Layout SHALL retain irreversible progressive raw-production records
only under the deck-scoped append-mostly
1_upstream_raw_material/page-production-iterations owner. Append-mostly
full-plan containers SHALL live beneath plans/<plan-sha256>/ and retain the
provider-free immutable full plan, immutable batch projections/grants, item
claims/attempts, materialization provenance, and canonical provider-produced
raw bytes. Exactly
one small CAS-protected
scopes/<run-version>/<workflow>/head.json SHALL name the current full-plan
lifecycle identity for each exact scope. Progress, paid debt, remaining scope,
and next action SHALL be derived from the referenced direct records, not
persisted in the head.

Each plan's immutable batches SHALL form one validator-selected predecessor /
generation lineage. A batch record SHALL bind a positive generation and nullable
predecessor batch digest; readers SHALL reject a conflicting live branch,
overlapping live paid scope, or a successor whose predecessor has a live claim
or nonterminal selected paid item. A materialization bundle is authoritative
only when its validated immutable bytes/provenance are referenced by the exact
terminal succeeded attempt; staging or orphaned files do not count as bytes,
provenance, progress, grant consumption, or evidence.

The owner SHALL stage a validated initial plan container beneath its confined
staging directory and atomically rename it before head CAS. Later direct
records SHALL be separately staged and published as immutable additions; the
container itself is never a mutable ledger. Immutable plan, batch, attempt,
provenance, and bytes records SHALL never be selected by directory order,
timestamps, filenames, task projections, or generated artifact presence.
Derived copies or projections beneath the version
_generated leaf remain rebuildable and SHALL not become authorization,
attempt, provenance, or current-plan authority.

#### Scenario: Raw bytes survive derived-artifact rebuilds

- **WHEN** a current progressive raw projection under a version _generated directory is removed
- **THEN** layout inspection identifies the page-production-iterations owner for its canonical raw bytes and provenance
- **AND** it does not treat deletion as permission to resubmit, hand-copy bytes, or recreate a provider attempt

#### Scenario: Staged plan is not current authority

- **WHEN** progressive plan compilation stops before head CAS
- **THEN** layout inspection ignores the staging bundle and any complete unreferenced plan as current scope
- **AND** recovery mutates only the confined staging entry through its owner

### Requirement: Progressive evidence and migration preserve ownership boundaries

Pilot projections, Pilot decisions, complete raw-review records, and accepted
raw evidence SHALL bind their referenced immutable plan/materialization facts
and remain under their respective raw/review owner paths. The state owner may
hold only references described by node-specification. Final/PPTX/notes/delivery
artifacts remain version-derived outputs and keep their existing owners.

An existing v2 raw plan or accepted evidence without the progressive canonical
plan and per-item provenance chain SHALL remain readable and byte-preserved but
shall not be current progressive production authority. Layout inspection SHALL
return its owner-issued replan/rebuild action without seeding a head, scanning
other decks, copying files, or silently migrating a production run.

#### Scenario: Existing raw evidence is not silently upgraded

- **WHEN** an explicitly selected run contains only pre-progressive raw plan or accepted-evidence records
- **THEN** layout inspection preserves those records and identifies the current raw owner migration/rebuild action
- **AND** it does not add grants, attempts, provenance, or a current head from their paths or bytes

#### Scenario: Pilot decision cannot become delivery evidence

- **WHEN** a partial Pilot decision record exists in the raw-production owner
- **THEN** layout inspection reports it only as Pilot evidence for its exact plan/batch
- **AND** it does not expose it as accepted raw, final, PPTX, notes, or delivery authority

### Requirement: Progressive task projection remains a rebuildable collaboration view

For a progressive Page Authority route, Run-Bundle Layout SHALL reserve
`_state/page-production-task-projection.md` for the Controller's run-scoped,
rebuildable collaboration card. The card SHALL contain only owner-issued
plan/batch/evidence references, bounded derived progress, the prescribed next
action, and the corresponding typed human decision plus its optional persisted
note. It SHALL remain distinct from the append-mostly raw-production owner
and version-derived `_generated/` projections.

The card SHALL not be an authorization, attempt, consumption, provenance,
materialization, current-plan, state, or evidence authority. Its absence,
deletion, manual edit, stale contents, or generated-artifact rebuild SHALL
not permit a provider submit, grant issuance, state advance, or acceptance;
the Controller and inspection owners instead regenerate it from their direct
records and typed handoffs.

#### Scenario: Task card has no lifecycle authority

- **WHEN** a selected progressive run has a removed or manually edited task projection
- **THEN** layout validation still identifies direct raw records and Controller handoffs as the relevant owners
- **AND** it does not infer progress, mint a grant, or publish evidence from the card
