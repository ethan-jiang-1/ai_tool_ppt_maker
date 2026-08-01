## ADDED Requirements

### Requirement: Style Master readiness consumes one canonical effective selection

Node Specification SHALL provide one current Page Authority condition, `style_master_accepted`, for a
Controller to determine whether its selected workflow may enter page raw planning. The condition SHALL
consult the Style Master owner's current effective-selection/acceptance evidence for the exact run,
workflow, scope, and style bytes; a candidate file, `style_master.jpg` path, Markdown task checkbox, or
generic node status alone SHALL NOT satisfy it.

The condition is a read-only projection. Candidate plans, grants, attempts, progress, human decisions,
and the candidate lifecycle head remain owned by the Style Master lifecycle. The only Style Master durable
fact in generic state is the capability-owned effective-selection/acceptance record described below; ordinary
Controller node records remain handoff projections rather than candidate truth. An absent record or a
structurally valid but stale selection SHALL make the Boolean condition false without state heal or mutation.
A present record with an invalid map key, field schema, run-version binding, or workflow binding SHALL also
never pass the condition, but state validation SHALL report that malformed current record as a non-writing
hard-stop rather than treating it as ordinary absence. The Controller SHALL obtain
the owner-issued repair path from the separate Style Master inspection/diagnostic interface, not from the
Boolean condition or file presence.

#### Scenario: File presence does not pass the Style Master gate

- **WHEN** a deck has `style_master.jpg` but lacks an exact current effective-style acceptance receipt
- **THEN** `style_master_accepted` is false for page raw Controller entry
- **AND** the Controller remains at the Style Master checkpoint rather than inferring readiness

#### Scenario: Current accepted selection passes for its workflow

- **WHEN** the Style Master owner exposes a current accepted selection whose bytes, scope, and workflow match the selected version
- **THEN** `style_master_accepted` passes the corresponding Controller handoff
- **AND** the condition does not duplicate or rewrite candidate lifecycle records

#### Scenario: Stale selection is read-only failure

- **WHEN** a style-intent, canonical style-context, candidate, profile, scope, or effective-selection identity no longer matches current facts
- **THEN** the condition reports unavailable readiness and the Controller separately consumes the one Style Master recovery action
- **AND** it does not heal state, advance source epoch, or create page raw work

### Requirement: Schema-v5 state carries optional Style Master acceptance evidence

Node Specification SHALL admit one optional
`page_authority_style_master.by_version["3_versions/vN"]` map in schema-v5 state. The state module SHALL own
its structural validation and atomic/CAS persistence while `style-master-generation` remains authoritative for
the record fields, currentness evaluator, promotion semantics, and diagnostic actions. No generic state setter,
second acceptance receipt, metadata mirror, or Controller-owned candidate record SHALL be introduced.

Structural validation SHALL require each present map key to be a canonical version key, each record's
`run_version` to match that key, and each record to satisfy the Style Master-owned exact field schema. When a
source/state workflow exists for that version, the record workflow SHALL match it; for an active unbound fresh
draft, currentness SHALL instead match the validated selected-workflow source. A malformed present record is
invalid state, not equivalent to an absent optional record, and observation SHALL not delete or normalize it.

An absent map or absent version record in an otherwise exact current schema-v5 bundle SHALL be valid state and
mean `style_master_accepted = false`. The Style Master writer MAY add the exact selected-workflow record to an
active fresh-v2 `create-deck` draft after validating its canonical source marker and run identity without
creating a production-mode, target-evidence, source-receipt, raw-plan, or source-epoch record. It MAY also CAS
replace the record for an exact current v2 source/state pair. Later selected-workflow source materialization
SHALL preserve and revalidate the Style Master record. Observation, invalid records, and CAS conflicts SHALL
remain non-writing.

On first exact-plan structural publication of vNext, the state writer SHALL retain source-version Style Master
records but SHALL NOT copy, rename, infer, or rebind one under the target version key, regardless of whether the
workflow stays the same or changes. The target SHALL begin with no accepted Style Master and its own readiness
condition false. An exact idempotent replay of that already-published structural plan SHALL instead revalidate
and preserve any target-owned Style Master record created after publication. The state-side replay path SHALL
be reached only after the structural owner has exact-matched the original source/target plan tuple; it SHALL
not treat the target's now-active Controller execution as a source-version execution mismatch or reset its
`playbook`, `run_version`, `current_node`, node records, or continuation pointer. It SHALL NOT erase later
target work, manufacture inheritance, create or restage a version, call a provider, or rewrite the
layout-resolved compatibility payload.

#### Scenario: Existing v2 state without Style Master remains supported

- **WHEN** schema-v5 state has an exact v2 source/state pair but no Style Master map or record
- **THEN** structural state validation passes and `style_master_accepted` is false
- **AND** observation does not seed the map, infer acceptance from `style_master.jpg`, or classify the state as historical

#### Scenario: Malformed present selection is not disguised as absence

- **WHEN** a schema-v5 state contains a Style Master record whose key, field set, run version, or bound workflow is invalid
- **THEN** state validation returns a non-writing malformed-record hard-stop and readiness does not pass
- **AND** it does not delete, normalize, or reinterpret the record as an ordinary missing selection

#### Scenario: Fresh draft promotion does not create page lineage

- **WHEN** an active fresh-v2 `create-deck` draft has a validated selected-workflow source and promotes a reviewed Style Master candidate
- **THEN** the state owner CAS-writes only the capability-owned Style Master acceptance record plus ordinary audit history
- **AND** production mode, target evidence, source receipt, raw plan, and source epoch remain absent until their existing owner materializes them

#### Scenario: Raw-plan materialization preserves accepted style

- **WHEN** selected-workflow raw planning later materializes the draft's first source receipt and target state
- **THEN** the state writer revalidates and preserves the exact current Style Master record
- **AND** it neither recreates the acceptance nor treats it as page raw authorization

#### Scenario: Structural vNext does not inherit source acceptance

- **WHEN** first structural publication creates a same-workflow or workflow-switch target from a source version with an accepted Style Master
- **THEN** the state writer preserves the source-version record and creates no target-version Style Master record
- **AND** target readiness remains false until that exact target scope completes its own promotion

#### Scenario: Structural replay preserves later target acceptance

- **WHEN** the exact structural plan is replayed after its target version acquired a valid target-owned Style Master record
- **THEN** the state writer revalidates and preserves that target record byte-for-byte
- **AND** it neither restores source acceptance under the target key nor changes either selection, active target Controller execution, or the layout-resolved payload
