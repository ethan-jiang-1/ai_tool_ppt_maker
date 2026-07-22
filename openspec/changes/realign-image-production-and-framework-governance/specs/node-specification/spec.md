## MODIFIED Requirements

### Requirement: Node frontmatter defines entry and exit gates
Every registered node SHALL declare globally unique kebab-case `node`, `lifecycle_phase` in exact set
`0|1|2|3|4|5`, `method_module` in exact set
`00-setup|01-content|02-visual-system|03-html-production|04-image-production|05-iteration`, ordered
`requires`, deterministic `entry`, and `exit`; routing gates SHALL declare unique allowed decisions.
Fenced controller YAML and standalone shared-node frontmatter remain the only forms. Legacy single
`phase` and removed module names `01-visual|02-content|03-prompts|04-production|04-image2-refinement`
SHALL fail validation with migration guidance. `lifecycle_phase` and `method_module` classify owned
methodology only; they SHALL NOT infer adapter scheduling or legal dependencies. Nodes owned by Image
Production SHALL use `04-image-production`; visual-slot entry additionally requires `html-then-image2`
and current HTML inputs, while whole-page entry requires `image2-only` and its own direct evidence.

#### Scenario: Whole-page module is classified
- **WHEN** a controller index inspects a first-class `image2-only` whole-page node
- **THEN** it declares method module `04-image-production`
- **AND** validation does not require HTML delivery merely because the node is in module 04

#### Scenario: HTML production node retains its metadata
- **WHEN** the HTML production node is indexed
- **THEN** it resolves to lifecycle 3/module `03-html-production`

#### Scenario: Retired module remains in active frontmatter
- **WHEN** a node declares `method_module: 04-image2-refinement`
- **THEN** validation fails and names `04-image-production` as the current module

#### Scenario: Unowned Image Production node is registered
- **WHEN** a node declares module `04-image-production` without a declared Image Production adapter role
- **THEN** validation fails with an ownership diagnostic

#### Scenario: Visual-slot plan starts from an explicit prerequisite waiver
- **WHEN** visual-slot work has a current prerequisite waiver and valid HTML final-slide/slot inputs
- **THEN** entry validation permits only the offline planning node
- **AND** authorization and provider generation remain separate exit requirements

### Requirement: Playbook index reserves final system evidence and enforces pipeline ownership
The canonical index/state reserved-ID registry SHALL retain the six final-system IDs with
`image-production` replacing `image2-refinement`, validate controller pipeline plus closed
production-mode declarations, reject incompatible mode/pipeline entry conditions, and ensure no
reserved ID is declared as a controller node. Only Image Production nodes may declare module
`04-image-production`. Visual-slot entry requires `html-then-image2` with identifiable current HTML
final-slide/slot inputs and existing delivery or prerequisite-waiver evidence. First-class
`image2-only` whole-page nodes use the whole-page adapter and may be active under `create-deck` or
ordinary iteration, while `legacy-image2-maintenance` remains compatibility-only and rejects both HTML
modes and fresh first-class Image2 ownership. Module number SHALL NOT create any additional gate.

#### Scenario: Controller declares reserved Image Production evidence
- **WHEN** a playbook declares `node: image-production`
- **THEN** validation fails because the ID is system evidence

#### Scenario: First-class Image2 uses whole-page adapter
- **WHEN** the index resolves a consistent `image2-only` create execution
- **THEN** it activates declared whole-page Image Production nodes without entering compatibility maintenance
- **AND** it does not require current HTML delivery

### Requirement: State file is YAML at run bundle root
Every new or actively executing run bundle SHALL contain deck-root `_state/` with durable `state.yaml`,
the single truth source for the execution pointer, authoritative production mode, and pipeline-owned
review evidence. Historical markerless decks MAY lack `_state/` during structure-only check/status
compatibility; observation SHALL not create it. Entering an explicit historical controller/resume SHALL
use the state initialization/migration authority to create valid schema v4 and mode records before
execution. `state.yaml` SHALL retain active playbook/current node, per-node status, gate
decisions/evidence, stack, waits/notes, deck metadata, and exact version-scoped
`production_mode.by_version`. Append-only `history.jsonl` remains reference-only and SHALL not
participate in routing or recovery.

Reserved system evidence SHALL retain six active IDs: `header-review`, `html-content-review`,
`html-visual-review`, `html-delivery-review`, `html-production-reset`, and `image-production`.
Each active record SHALL live only at `nodes[reserved_id].by_version["3_versions/<vN>"]`; its internal
`run_version` and all state/metadata mirror companions SHALL use normalized `<vN>`. The historical
`image2-refinement` container is accepted only as the visual-slot compatibility read defined by the
Image Production migration requirement; it is never a new-write target. The state owner SHALL expose
separate active and legacy-reserved ID sets: active writes/validation use the six active IDs, while every
decoder, controller-entry filter, validation projection, and state-shape validator treats
`image2-refinement` as a read-only legacy-reserved ID rather than an ordinary controller node. Production
mode SHALL use its dedicated top-level state-owned map rather than masquerading as a reserved node. The
Image Production visual-slot record remains the sole authority for its plan, attempts, candidate
reviews, promotions, and safe human decisions; whole-page state and controller-node decisions SHALL not
duplicate it.

Existing gate-journal exclusivity, reset fences, reserved-record ownership, refinement promotion CAS,
read-only observation, and recovery rules remain unchanged. The only additional allowed transient file
SHALL remain `_state/gate-approval-journal.json`, with exact schema
`pptmaker-html-gate-approval-journal-v1`, 64-lowercase-hex `owner_token`, normalized host, positive
PID, `created_at_epoch_ms`, normalized run version, and exact old/new state/metadata SHA-256 fields.
While present it remains the exclusive state/metadata-gate write fence. Recovery SHALL retain the exact
existing SHA matrix: `(old_state,old_metadata)` removes an uncommitted journal;
`(new_state,old_metadata)` writes only the planned mirror after revalidation;
`(new_state,new_metadata)` removes the completed journal; the declared reset-only projection yields to
the reset; and `(old_state,new_metadata)` or any unbound third state fails closed. Production-mode
writes and Image Production record migration SHALL not bypass this fence or reuse the gate journal as a
mode or adapter transaction.

Automatic gate-journal recovery SHALL still require exact same host, proven-dead PID, and age at least
`GATE_JOURNAL_AUTO_RECOVERY_MIN_AGE_MS = 60000`. Cross-host or otherwise uncertain recovery SHALL
still require human confirmation, exact token, and age at least
`GATE_JOURNAL_EXPLICIT_RECOVERY_MIN_AGE_MS = 300000`; a proven-active same-host owner remains
non-overridable. Token, age, journal-byte, path, or SHA drift SHALL preserve state and fail closed.
Image Production promotion continues to reject active gate/reset fences and use expected-state CAS;
promotion stales prior HTML delivery review. Production-mode migration/transition/registration/mirror
repair use the state owner's ordinary expected-state boundary and SHALL not create another transaction
journal. Whole-workflow status MAY compose state with artifacts but SHALL not persist another mode,
phase, or completion authority.

#### Scenario: Historical markerless deck lacks state
- **WHEN** structure-only check/status inspects an old markerless deck without `_state/`
- **THEN** compatibility remains valid and no state file is created
- **AND** explicit controller entry creates schema v4 and an authoritative per-version mode before execution

#### Scenario: Agent resumes without a gate transaction
- **WHEN** no approval is in progress
- **THEN** `_state/state.yaml` and any on-demand `history.jsonl` retain their normal read/resume semantics
- **AND** the journal is absent

#### Scenario: Two gate approvals start concurrently
- **WHEN** a second approval observes an existing journal or changed precondition SHA
- **THEN** it recovers the first transaction or fails closed before writing its own evidence
- **AND** cannot overwrite a concurrent gate decision

#### Scenario: Plain status sees healable state plus journal
- **WHEN** observe-mode status sees a healable state defect while a journal exists
- **THEN** it reports both conditions without rewriting state
- **AND** recovery/repair occurs through the journal owner path first

#### Scenario: Invalid journal is present
- **WHEN** journal schema, version, path, or SHA evidence is invalid
- **THEN** state read/status reports deterministic repair-required evidence
- **AND** neither metadata nor the journal is treated as gate approval

#### Scenario: Cross-host journal requires human-confirmed token
- **WHEN** a journal owner is another host and remains older than 300000 ms
- **THEN** plain status reports `uncertain` plus its opaque owner token without writing
- **AND** only exact token recovery after human confirmation may apply the normal matrix

#### Scenario: Crash occurs before state publication
- **WHEN** recovery sees both stores at their journal-bound old SHAs
- **THEN** it removes the uncommitted journal and leaves the gate pending

#### Scenario: Metadata-first pair appears
- **WHEN** recovery sees old state SHA and new metadata SHA
- **THEN** it fails closed as a forbidden transition and does not infer state approval

#### Scenario: HTML delivery is complete without visual-slot work
- **WHEN** state/status reads current `html-only` delivery with no visual-slot record
- **THEN** it reports completion without Image Production debt

#### Scenario: Legacy visual-slot record remains observable
- **WHEN** a valid exact-version `nodes.image2-refinement` record exists with no active Image Production record
- **THEN** state observation obtains only the defined visual-slot compatibility projection
- **AND** it does not write the legacy record or treat it as a controller working-set node

#### Scenario: Legacy record is filtered before controller validation
- **WHEN** a legacy visual-slot record is present while an active controller execution is validated
- **THEN** controller-entry and execution-binding validation exclude the legacy-reserved ID
- **AND** it is validated only through the historical visual-slot record contract

#### Scenario: Node transition races gate approval
- **WHEN** an ordinary `writeState` or Image Production migration attempts a state mutation while a gate journal exists
- **THEN** it returns `CONFLICT` and does not create a third state SHA

#### Scenario: Refinement promotion races a gate journal
- **WHEN** an accept operation observes an active gate-approval journal
- **THEN** it returns conflict before source or state mutation

## ADDED Requirements

### Requirement: Visual-slot record migrates atomically to Image Production
State observation SHALL read a current `nodes.image-production.by_version` visual-slot record first and
otherwise read the historical `nodes.image2-refinement.by_version` record. A legacy v1 record SHALL
normalize its omitted `prerequisite_waiver` to `null`; legacy v1/v2 and current records SHALL compare
the canonical projection `{run_version, plan, authorization, attempts, reviews, prerequisite_waiver}`
using canonical structural equality. A current record SHALL also validate exact schema
`pptmaker-image-production-state-v1`, `adapter: visual-slot`, and no keys other than `schema`,
`adapter`, `run_version`, `plan`, `authorization`, `attempts`, `reviews`, and
`prerequisite_waiver`. A malformed record or disagreement between old and new projections SHALL fail
closed with protected invariant `attributable version-scoped visual-slot state integrity`, the existing
state-corruption/replacement protocol's one `repair_state` action, and no mutation or provider work.
That action SHALL preserve current bytes and rerun the state-owner validation/replacement checkpoint; it
SHALL NOT expose a generic record editor, conflict winner selector, force, or provider path. Observation
is non-mutating.

The first non-deletion state-owner visual-slot mutation SHALL atomically write the current record and
remove only the old exact-version record under the existing expected-state/CAS boundary, preserving
other versions. A terminal deletion SHALL remove both exact-version records in that same CAS write and
SHALL NOT create an empty current record. Promotion journal creation and recovery SHALL bind the complete
pre/post state bytes; recovery may finish only the already-bound mutation and SHALL NOT initiate a
compatibility migration. This record-level change SHALL retain top-level state schema version 5 and
SHALL NOT rewrite either record during observation/heal. A pre-change binary is unsupported after a
record migrates: operational rollback SHALL use a release retaining the dual reader or owner-scoped
forward recovery, never generic state restoration or hand editing. The state owner is the sole writer
of `adapter`; unified visual-slot projection, status/state, workflow inspection, and state validation
are its readers. It is fresh only for its exact `run_version`, invalidates the current record when it is
not `visual-slot`, and is removed only when terminal decline removes that exact-version record.

#### Scenario: Conflicting dual records
- **WHEN** old and new records disagree for an exact version
- **THEN** observation reports a state-owner hard-stop
- **AND** it performs no mutation or provider work

#### Scenario: Equal dual records are observed
- **WHEN** valid old and new visual-slot records normalize to the same exact-version projection
- **THEN** observation uses the new record without writing either record
- **AND** the next non-deletion state-owner mutation removes only the old exact-version record in its CAS write

#### Scenario: Current record has a wrong adapter
- **WHEN** `nodes.image-production` has a current exact-version record with an adapter other than `visual-slot`
- **THEN** state observation returns the state-owner repair hard-stop
- **AND** it does not fall back to or mutate the historical record

#### Scenario: Dual records conflict
- **WHEN** old and new records have different normalized exact-version payloads
- **THEN** inspection returns only the `repair_state` hard-stop for attributable visual-slot state integrity
- **AND** it preserves both records and performs no provider work or conflict-winner selection

#### Scenario: Legacy promotion journal is recovered
- **WHEN** a promotion journal binds pre/post state bytes across the record migration boundary
- **THEN** recovery verifies and completes only its bound post-state bytes
- **AND** it does not re-read compatibility records to synthesize a new transaction

#### Scenario: Migrated record needs operational rollback
- **WHEN** an exact-version record has migrated and a deployment rollback is required
- **THEN** the rollback release retains the dual state reader or the owner performs forward recovery
- **AND** the system does not run a pre-change binary or hand-edit the record
