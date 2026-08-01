## MODIFIED Requirements

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
