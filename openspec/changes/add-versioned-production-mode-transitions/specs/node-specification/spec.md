## ADDED Requirements

### Requirement: Cross-pipeline production-mode transitions are versioned state transactions

The state owner SHALL expose one CAS-bound transition transaction for an exact source run whose
authoritative mode/pipeline differs from a requested target mode/pipeline.  The transaction SHALL bind
the source execution/version/mode/pipeline, anticipated clean target version, target mode/pipeline,
confined candidate receipts, exact plan hash, explicitly authored target-intake object, and explicit human
confirmation.  It SHALL use the active
controller execution and existing atomic state writer; it SHALL NOT create a deck-global transition
authority, a second mode map, or a new reserved evidence node.

Prepare/preview SHALL not write state or replace the source execution.  Only exact confirmation SHALL
CAS-capture the complete source controller context into the existing `playbook_stack` and activate its
bounded `migrate-import` transaction.  A cross-pipeline suspension frame SHALL be the sole active stack
entry while the transaction runs and SHALL contain the active source execution plus its complete ordered
pre-existing ordinary parent stack, exact `source_run_version`, source mode/pipeline, anticipated target
version, exact plan hash, and a closed `transition-suspended` disposition.  Those copied values are receipt
bindings only: the source and target `production_mode.by_version` records remain the sole routing
authority.  A suspension frame SHALL not be selected by generic `resumePlaybook()` or treated as a pending
parent execution.  On a verified target registration, state SHALL append an exact receipt-linked source
execution archive to reference-only history, remove the temporary suspension frame, and start a fresh
target `create-deck` execution through a closed target-baseline handoff.  That handoff SHALL derive only
the mode-specific baseline records required by the existing dependency graph: `instantiation`,
`checkpoint-intake`, and `author-structured-content` plus `configure-visual-system` for an HTML target;
or `instantiation`, `checkpoint-intake`, and `author-whole-page-content` plus
`configure-whole-page-visual-system` for an Image2 target.  Each record SHALL be newly written for the
target execution and bind the exact confirmed plan hash, target receipt, and revalidated target
source/control inputs.  The target-intake object SHALL contain exactly the normal intake facts (topic,
audience, duration, language, takeaway, content constraints, visual DNA, and success criteria); its
digest is plan-bound, and confirmation writes a new target `checkpoint-intake` `proceed` decision plus
`intake-confirmed` user evidence with that digest.  `instantiation` completes only after target
run-bundle/guide checks; the selected target author and configuration nodes complete only after their
existing target source/control exit conditions and newly recorded target evidence pass.  Each completed
baseline record SHALL carry a closed `transition_baseline` binding of target execution/version, plan hash,
success-receipt SHA, source/control fingerprint, and target-intake digest where applicable.  It SHALL then set the active node to `preview-content` for HTML or
`authorize-image2-style-master` for Image2.  The handoff SHALL not invoke init, copy any source controller
record, or create a target gate, review, delivery decision, provider authorization, refinement record, or
final completion.  If owned recovery proves no target became visible, state SHALL remove only its active
transition execution and restore the complete captured source controller context before requiring a fresh
preview.

The only transition active-node record SHALL be `migrate-import/apply-production-mode-transition`.  Its
schema-closed fields SHALL bind the exact plan hash, source execution ID/version, source mode/pipeline,
target version/mode/pipeline, and transition-candidate receipt digest.  Confirmation SHALL atomically
create that record and make it current only after it revalidates the preview.  Apply, recovery, and
registration/handoff SHALL consume only that record plus the exact transition plan/receipt.  It SHALL not
reuse or write the historical legacy-migration node, `migration_plan_hash`, `old_side_mode`,
`migration_source_version`, or `apply-html-migration` authority.

The source version's mode, source, generated work, approvals, delivery review, refinement work, and
existing history events SHALL remain unchanged through prepare, preview, decline, stale confirmation,
collision, and failed apply.  Confirmation, recovery, and successful handoff MAY append only new bounded
transition audit/archive events to reference-only history; they SHALL not modify or repurpose a source
event as target authority.  A visible target receives its authoritative mode only after the state owner
verifies the target marker and exact transition success receipt.  Target records SHALL not inherit source
review, provider authorization, reset, completion, or generated evidence.

The node condition catalog and `CONDITIONS` registry SHALL add exactly two transition-owned deterministic
conditions. `transition_apply_current` is entry-only and passes only when the exact caller run version
equals the active transition execution's source version, the active node is
`migrate-import/apply-production-mode-transition`, and the closed plan/confirmation/source-execution/
candidate-receipt bindings are current. `transition_publish_or_recovery_recorded` is exit-only and passes
only inside the transition state owner's atomic terminal finalization: it requires either a matching target
success receipt plus completed selected-mode registration and target-baseline handoff, or a verified
no-visible-target recovery that has removed the transition execution and restored the captured source
context.  A publication receipt alone, recoverable hard-stop, journal ownership/age conflict, absent
uncertain-owner confirmation, ambiguous target, stale input, or failed registration SHALL keep the active
apply record `in_progress` and make this condition false with producer-owned recovery guidance.  Generic
node completion SHALL never consume the condition: terminal finalization itself atomically archives and
replaces the source context with target work, or restores the source context, rather than marking
`apply-production-mode-transition` completed or advancing it. Ordinary CLI prose, a legacy migration
record, or a visible target without the exact receipt and completed handoff does not pass. Neither
condition accepts caller-supplied paths, hashes, modes, or decisions, and neither applies to the historical
migration branch.

Every active execution SHALL have one normalized `run_version`; every current controller record and
ordinary parent stack frame SHALL repeat it.  The state owner SHALL reject an active/stack record whose
version differs from its execution or a caller's exact `<run-dir>`.  `state <run-dir>`, controller resume,
node/gate/decision writes, entry/exit evaluation, and transition preparation/confirmation/apply/recovery
SHALL return typed `execution_run_version_mismatch` before projecting, advancing, or writing an execution
bound to another version.  The sole exception is the closed transition handoff, which atomically archives
the source-bound context and starts the target-bound context.  Version-scoped system records retain their
own existing contracts but must still be read only against the caller's exact run version.

For an old-enough cross-host or owner-uncertain journal, the state owner SHALL accept a recovery takeover
only after a separate closed confirmation operation has verified the exact opaque token and journal bytes,
then CAS-written a `transition_recovery_confirmation` within the active transition record.  Its closed
fields are `kind: user`, `decision: no-active-apply`, source execution/version, target version, plan hash,
journal SHA-256, and timestamp; it SHALL not store or emit the raw token.  Recovery requires all fields
and current journal bytes to match, and invalidates the confirmation on any journal owner/bytes, plan,
source execution, source/target version, or state-CAS drift.  A human conversation, stale confirmation,
or token alone SHALL not authorize takeover.

#### Scenario: Transition preparation preserves the source

- **WHEN** an `html-only` or `html-then-image2` source prepares an `image2-only` target
- **THEN** transition scratch records only candidate work and state/source nodes/generated tree remain unchanged

#### Scenario: Stale confirmation is rejected

- **WHEN** a source mode, candidate receipt, anticipated target, or expected state identity changes after preview
- **THEN** confirmation or apply fails before target reservation/publication and directs the Controller to a fresh preview

#### Scenario: Visible target receives distinct authority

- **WHEN** a confirmed transaction publishes a verified target with its matching marker and receipt
- **THEN** state registers only the target version's selected mode and declared controller handoff
- **AND** source approvals, provider authority, and completion remain source-version history

#### Scenario: Recovery sees an ambiguous target

- **WHEN** recovery finds a visible target without the exact transition receipt or with a conflicting target mode
- **THEN** it hard-stops without deleting or rewriting either version and names the state-owned inspection/recovery action

#### Scenario: Transition-active state retains a source execution without resuming it

- **WHEN** a confirmed cross-pipeline transaction is applying or awaiting recovery
- **THEN** the source controller-node snapshot remains in a run-bound `transition-suspended` stack frame
- **AND** generic resume cannot select it

#### Scenario: Completed handoff archives the source before target work

- **WHEN** a confirmed cross-pipeline transaction publishes, registers, and hands off its target
- **THEN** state creates only receipt-bound target baseline records and starts `preview-content` for HTML or `authorize-image2-style-master` for Image2
- **AND** no baseline record is byte-copied from the source execution or contains source execution authority
- **AND** state archives and removes the temporary suspension before later generic target completion/resume

#### Scenario: A caller targets a different execution version

- **WHEN** active state is bound to `v2` and `state`, resume, or a node writer is invoked for `v1`
- **THEN** it reports `execution_run_version_mismatch` without exposing v2's controller progress or changing state

#### Scenario: Uncertain recovery confirmation cannot be replayed

- **WHEN** an uncertain-owner confirmation was recorded and the journal bytes, plan, source execution, or target identity changes
- **THEN** recovery rejects it before takeover and requires a new exact inspection and human confirmation

#### Scenario: Transition apply entry cannot be forged

- **WHEN** an ordinary or legacy `migrate-import` execution reaches `apply-production-mode-transition`
- **THEN** `transition_apply_current` fails unless the exact state-owned production-mode confirmation is active for the selected source version

#### Scenario: Transition apply exit requires durable outcome

- **WHEN** an apply command prints success but no matching transition success receipt, completed selected-mode registration, and target handoff were atomically persisted
- **THEN** `transition_publish_or_recovery_recorded` fails and the active apply node remains in progress

#### Scenario: Recoverable transition failures do not exit apply

- **WHEN** a journal is live/too young/owner-uncertain, a required recovery confirmation is absent, a target is ambiguous, or a visible target awaits registration
- **THEN** the active `apply-production-mode-transition` record remains in progress and the exit condition is false
- **AND** only its producer-owned recovery guidance may advance the transaction; generic completion cannot mark the node complete

#### Scenario: Terminal finalization replaces rather than completes apply

- **WHEN** state atomically completes verified target registration and baseline handoff, or proves no target and restores the captured source
- **THEN** it respectively starts the target execution or restores the source execution without a completed transition apply node
- **AND** the terminal outcome cannot be replayed as generic controller completion

#### Scenario: Source begins within nested controller work

- **WHEN** a cross-pipeline transition is confirmed while the source has ordinary parent entries in `playbook_stack`
- **THEN** the transition replaces the resumable stack with one suspension entry that captures the active source execution and complete ordered parent stack
- **AND** a no-target recovery restores that complete source controller context without losing or reordering a parent frame

## MODIFIED Requirements

### Requirement: Playbook stack preserves position during switching

`_state/state.yaml` SHALL include a `playbook_stack` YAML array for deep parent-execution snapshots.
Ordinary resumable entries SHALL use `{playbook, current_node, execution_id, execution_started_at,
run_version, controller_nodes}`, where `controller_nodes` is a deep snapshot of the parent execution's
non-reserved node records and every contained controller record equals that `run_version`.
`writeState`/`readState` SHALL round-trip this field without changing its type. `switchPlaybook()` SHALL
push the six-field snapshot, preserve top-level reserved system records, clear active controller records,
and create a new execution context for the nested playbook with the same exact run version.
`resumePlaybook()` SHALL discard nested controller records, restore all six parent fields, and retain the
latest reserved system records. A cross-pipeline transaction MAY add only the
schema-closed `transition-suspended` extension described above; it SHALL include exact source/target run
versions, source mode/pipeline, plan hash, and the complete ordered pre-transition ordinary stack, all
tied to the retained source snapshot.  State validation SHALL reject unknown suspension keys, invalid
canonical versions/modes/pipelines/hashes, a suspension whose source mode disagrees with authoritative
state, a malformed embedded parent frame, more than one active suspension frame, an ordinary frame next
to a suspension frame, or a resumable operation that targets such an entry.

`switchPlaybook()` and `resumePlaybook()` retain their ordinary nested-workflow behavior only for the same
exact run version. The state owner SHALL provide the closed cross-pipeline handoff helper that archives the complete source
execution in reference-only history, removes the temporary suspended frame, and starts the fresh top-level
target execution; `startPlaybook()` SHALL never silently pop, replace, or resume such a frame.  Legacy
stack entries without execution fields, snapshots, or provable run version SHALL be normalized only to a
safe blocking snapshot/replacement action rather than guessed from ambiguous flat records; migration never
fabricates a suspension frame.

#### Scenario: Ordinary nested work remains resumable

- **WHEN** an ordinary iteration controller switches and completes
- **THEN** its existing six-field parent stack entry resumes unchanged
- **AND** no transition-only run identity or disposition is inferred

#### Scenario: Agent switches playbooks and returns

- **WHEN** an Agent is in a `create-deck` execution, switches to an ordinary iteration controller, finishes, and resumes
- **THEN** `resumePlaybook()` restores the original playbook, current node, execution ID, execution start time, run version, and controller-node snapshot
- **AND** nested execution evidence does not replace parent execution evidence
- **AND** the popped stack entry is removed

#### Scenario: Empty playbook stack survives write/read

- **WHEN** a state with `playbook_stack: []` is written and read
- **THEN** it remains an empty array
- **AND** ordinary switch can push a six-field entry with an object snapshot

#### Scenario: Non-empty ordinary stack survives write/read

- **WHEN** a stack contains `{playbook: "create-deck", current_node: "setup", execution_id: "exec-parent", execution_started_at: "2026-07-12T00:00:00Z", run_version: "v1", controller_nodes: {...}}`
- **THEN** write/read preserves all five strings, the deep controller snapshot, and array order
- **AND** resume restores that exact execution context

#### Scenario: Legacy stack entry remains safe

- **WHEN** a pre-v5 stack entry lacks execution fields, snapshot, or provable run version
- **THEN** migration keeps only a safe blocking snapshot or returns the explicit repair/replacement action with a diagnostic
- **AND** resume never attributes one legacy shared-node record to multiple executions or versions

#### Scenario: Nested shared node does not overwrite parent

- **WHEN** a parent execution completed shared node `classify-change` and a same-version child executes that ID
- **THEN** the child record exists only in the child working set
- **AND** resume restores the parent's original status, evidence, decision, execution ID, and run version

#### Scenario: Failed apply restores the exact source execution

- **WHEN** confirmed transition recovery proves the owned target was never visible
- **THEN** state removes the transition execution and restores the captured active source playbook, node, execution ID, node snapshot, and ordinary parent stack
- **AND** it does not alter the source mode/source/evidence or create a target mode record

#### Scenario: Target baseline does not create delivery authority

- **WHEN** a verified transition handoff initializes an HTML or Image2 target controller
- **THEN** only target-owned baseline records whose original entry/exit conditions revalidate against the target are recorded
- **AND** its intake decision/evidence is the exact target-intake confirmation rather than a copied source decision
- **AND** content/visual/header gates, delivery review, provider authorization, refinement evidence, PPTX/notes, and final completion remain absent or pending for the target

#### Scenario: Transition branch does not reuse legacy-migration authority

- **WHEN** a production-mode transition is confirmed from a durable source execution
- **THEN** state records only the closed `apply-production-mode-transition` fields for the new active transition execution
- **AND** a legacy migration apply record or field cannot authorize, recover, or register that transition

### Requirement: Same-pipeline production-mode transitions preserve work

The state owner SHALL continue to expose one atomic in-place transition for
`html-only <-> html-then-image2` because both modes retain `html-first-v1`.  That write SHALL use
expected-state identity, append bounded audit history, re-evaluate required refinement, and retain all
existing refinement plans, attempts, candidates, accepted source assets, provenance, reviews, and
generated evidence when the mode changes.

Any `html-* <-> image2-only` request through the in-place mode setter SHALL remain a typed
`transition_required` result with no current-version mutation.  The only cross-pipeline route SHALL be
the versioned transaction above: explicit target candidate, exact preview/confirmation, clean vNext,
verified target-mode registration, and declared handoff.  No `--force`, waiver, metadata mirror, source
marker, generated artifact, or history record may turn an in-place request into a conversion.

#### Scenario: Same-pipeline required refinement is enabled

- **WHEN** the exact current HTML version changes from `html-only` to `html-then-image2`
- **THEN** status revalidates retained refinement evidence without making a provider request

#### Scenario: Same-pipeline required refinement is disabled

- **WHEN** the exact current HTML version changes from `html-then-image2` to `html-only`
- **THEN** refinement completion debt is removed while every attributable refinement record remains intact

#### Scenario: In-place cross-pipeline setter is refused

- **WHEN** a caller uses the same-version mode setter to request `image2-only` from an HTML mode
- **THEN** it returns transition guidance with zero state/source/generated mutation

#### Scenario: Cross-pipeline transition completes through vNext

- **WHEN** the Controller confirms the exact transition plan for an HTML source and an Image2 target
- **THEN** the original version retains its mode and a separate visible target receives `image2-only` only after receipt verification

### Requirement: Published versions receive mode through an explicit state handoff

Every same-pipeline version publication SHALL invoke a state-owned idempotent registration after its target
is visible and before the publication operation reports complete. Registration SHALL accept an exact
source run and target run, read the source's authoritative mode, require the target marker-probe pipeline
to match that mode and the publication's expected target identity, and create only the target `by_version`
record through expected-state CAS. It SHALL never copy metadata, controller completion, gates, refinement
candidates, or generated evidence as mode authority. If a same-pipeline process stops after target
publication but before registration, ordinary target production SHALL hard-stop with typed
`mode_registration_required` and the same state-owned registration action. The repair is mechanical and
shall not ask the human to choose a mode. A conflicting target record, changed source mode, pipeline
mismatch, wrong source/target relationship, or state CAS drift SHALL fail without changing either version.

The general cross-pipeline transition is the sole additional registration exception: after its exact
confirmed plan publishes a visible clean target, the state owner SHALL verify the target-local
`_generated/qa/production_mode_transition.json` success receipt, source/target relationship, confirmed
source execution, target marker/pipeline, selected target mode, exact target identity, and current
expected state before CAS-writing only that target mode record and its display mirror. It SHALL then
perform the closed target-baseline handoff defined above. If this registration stops, ordinary target
production SHALL report transition-owned `mode_registration_required` recovery rather than invoke
same-pipeline registration, infer a mode from its marker, or ask a human to select a replacement mode.
Recovery may complete only exact visible-target registration/handoff or restore source after proving no
target became visible; it SHALL fail closed on a receipt, source execution, target mode/pipeline, state
CAS, or relationship conflict. Historical legacy-to-HTML migration remains its bounded exception and may
register `html-only` only after its exact target success receipt; no other cross-pipeline registration is
permitted.

#### Scenario: Transition target registration is exact and idempotent

- **WHEN** an exact confirmed transition has already published a matching target but its registration CAS was interrupted
- **THEN** recovery verifies the exact receipt/source execution/marker/mode relationship and registers only the selected target mode or reports already-current
- **AND** it does not call the same-pipeline registration command or copy source evidence

#### Scenario: A generic cross-pipeline registration is rejected

- **WHEN** a caller supplies a cross-pipeline source/target pair outside a verified transition receipt and active transition checkpoint
- **THEN** state fails before modifying either mode record, metadata, source, target, or controller pointer

### Requirement: State schema is explicitly versioned and migrated

`state.yaml` SHALL use schema version 5 while preserving whole-workflow timing, execution identities,
controller working sets, stack semantics, typed records, atomic writes, and reserved system records.
Read/heal SHALL retain the ordered idempotent v1/v2-to-v3-to-v4 chain, including its normalization of
lifecycle/module names, aliases, pipeline-specific controller binding, stack frames, gates, times, and
reserved records plus its marker-probe population of canonical `production_mode.by_version`; it SHALL then
apply a v4-to-v5 execution binding step. The v4-to-v5 step SHALL set active `run_version`, every active controller record's
`run_version`, and every ordinary stack-frame/contained-record `run_version` only when one exact persisted
version identity or one visible-version topology proves it.  A historical active
`migrate-import/apply-html-migration` record is an additional exact persisted identity only when its
current execution ID, `migration_source_version`, plan hash, and old-side mode are valid and agree; its
`migration_source_version` binds the source execution even if multiple versions are visible.  An older
active `confirm-html-migration` checkpoint that has not yet created that apply record remains non-writing
until the closed legacy confirmation command re-inspects its selected source/preview/hash/mode; that one
atomic confirmation MAY establish the same v5 source binding and advance to the exact apply record.  No
ordinary heal, status read, or caller-selected run directory may use this exception.  The step SHALL
preserve a valid v4 mode map and never infer a replacement from metadata, generated artifacts, invocation
order, or source preference.  Ambiguous/missing execution version binding SHALL return the existing
explicit replacement/repair action without rewriting or clearing state. A valid v5 record shall never be
reinferred from source or derived artifacts.

Known one-to-one migrations retain completed/skipped evidence, in-progress/failed status, typed decisions,
human waits, execution identity, stack position, gates, reset/refinement evidence, and capability
freshness; they add only matching version identity. Markerless gate values/evidence retain whole-page
semantics. For HTML-marked old state, scalar content/visual values remain audit/mirror status only and
shall not fabricate authoritative HTML review records; state predating reset support treats absence as
nullable reset ID null and shall not fabricate a reset record. A historical in-progress markerless
controller may remain bound to declared compatibility maintenance while its exact version mode becomes
`image2-only`; this does not route a fresh first-class Image2 execution through maintenance. HTML-marked
old state becomes `html-only` regardless of refinement history. Missing/conflicting source markers,
one-to-many semantic mappings, or ambiguous execution version binding return the explicit replacement
action without rewriting or clearing state. Starting a new top-level execution still requires explicit
replacement authorization when the current execution is incomplete and preserves reserved records.

The bounded legacy-to-HTML post-publication exception remains non-writing during observation: an exact
current migration success receipt bound to the active source execution may yield
`migration_handoff_pending`, never generic execution rebinding. Resume completes the source migration
execution, registers the verified target as `html-only` through the state-owned registration boundary, and
starts target `migration-target-review` with reset absent/null, target reviews pending, and exact target
`run_version`. It copies no reset, approval, waiver, delivery review, node completion, or production mode
from an unverified source. Receipt/state/source/target mismatch stays non-writing
`replacement_required|CONFLICT`; post-v5 same-pipeline versions use their explicit registration
checkpoint rather than schema migration.

The historical migration exception is completion-only.  After a source receives durable authoritative
mode state, `migrate-html prepare` and `preview` SHALL not create or refresh a legacy candidate.  The only
remaining legacy writes are the exact closed confirmation described above, exact active
`apply-html-migration` publication or owner-scoped journal recovery, and the exact receipt-bound legacy
handoff.  A new mode-governed cross-pipeline request, a mismatched execution/source/plan/mode, or a
missing checkpoint SHALL fail closed with general production-mode-transition guidance; it SHALL not create
legacy state, alter the active execution, or become a substitute for the new transition transaction.

#### Scenario: A v4 execution has one visible version

- **WHEN** schema-v4 state has an active execution and the deck has only visible `v1`
- **THEN** heal writes schema 5 with active records and ordinary stack frames bound to `v1`
- **AND** a second heal is byte-stable apart from its diagnostic policy

#### Scenario: A v4 execution has ambiguous versions

- **WHEN** schema-v4 state has active controller work but no persisted run version and multiple visible versions
- **THEN** read returns the explicit replacement/repair action without changing bytes or guessing a binding

#### Scenario: Historical HTML state retains final metadata semantics

- **WHEN** valid schema-v2 HTML-first state has a one-to-one node mapping and approved scalar content/visual values but no exact HTML review records
- **THEN** migration preserves completed/skipped evidence, waits, and scalar audit/mirror values while leaving authoritative HTML reviews pending
- **AND** Stage 4 remains blocked until current review evidence is recorded

#### Scenario: Historical markerless execution remains compatible

- **WHEN** an in-progress markerless deck points to an old whole-page production node
- **THEN** migration records `image2-only` for the proven exact version and rebinds it only to declared compatibility maintenance
- **AND** a fresh first-class Image2 execution is not redirected through maintenance

#### Scenario: Legacy migration published before handoff

- **WHEN** an exact legacy migration target receipt exists but active source migration has not recorded handoff or target mode
- **THEN** state/status reports the bounded handoff/registration action without rewriting state
- **AND** resume may atomically complete the source execution, register target `html-only`, and start `migration-target-review` bound to the target version

#### Scenario: Schema upgrade preserves an exact legacy apply recovery

- **WHEN** schema-v4 markerless state has an active `apply-html-migration` record with a matching execution ID, `migration_source_version: v1`, plan hash, and old-side mode while multiple versions are visible
- **THEN** v5 binds that legacy source execution and permits only its exact apply, owner-scoped journal recovery, or receipt-bound handoff
- **AND** it does not permit a fresh legacy prepare/preview or a general transition to reuse the legacy record

#### Scenario: Schema upgrade finishes an exact legacy confirmation

- **WHEN** schema-v4 markerless state is at `confirm-html-migration` with a matching completed preview and the closed confirmation re-inspects selected `v1`, hash, and mode
- **THEN** that confirmation atomically creates the v5-bound `apply-html-migration` record for `v1`
- **AND** a status read, a different selected version, or an incomplete/mismatched preview remains non-writing and replacement-required

### Requirement: Playbook executions do not reuse prior node completion

`startPlaybook` SHALL create a new execution ID and clean controller-node working set only under the
replacement preconditions in the state-schema requirement, bound to its exact selected run version.
`setNodeStatus`, `setNodeEvidence`, and decision writes SHALL tag controller records with both active
execution ID and active `run_version`. Conditions such as `node_done`, `node_completed`, `node_status`,
`evidence:`, `user_evidence:`, `decision_recorded`, `user_decision_recorded`, `node_evidence:`, and
`node_decision:` SHALL fail closed on execution- or run-version-mismatched controller records. Starting
the same playbook again therefore begins with its nodes pending. Nested same-version
`switchPlaybook`/`resumePlaybook` isolate child records by snapshotting and restoring the parent working
set. Reserved system evidence remains excluded and uses its own freshness contract.

#### Scenario: Repeated same-version run reclassifies

- **WHEN** one `edit-text` execution completed `classify-change` and a new `edit-text` execution starts for the same run
- **THEN** the old classification record does not satisfy the new execution's `requires`
- **AND** classification runs again

#### Scenario: Prior execution evidence cannot satisfy exit

- **WHEN** a previous same-version visual-review execution recorded user evidence and a new execution reaches that node ID
- **THEN** prior evidence does not satisfy the new node exit

#### Scenario: Starting a new execution preserves system evidence only

- **WHEN** a completed controller execution and current `header-review` record exist for one run version
- **AND** `startPlaybook` begins another execution for that version
- **THEN** prior controller records are removed from the active working set
- **AND** `header-review` remains available through its independent freshness contract
