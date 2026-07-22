## ADDED Requirements

### Requirement: Migrate-import owns cross-pipeline production-mode handoff

`migrate-import` SHALL own the mode-transition branch for both Image2-to-HTML and HTML-to-Image2
requests.  It SHALL inspect exact source mode/pipeline, invoke the closed prepare/preview operations,
show the source/target/version impact and exact plan hash, obtain the human mode confirmation, and invoke
apply only for that same checkpoint.  It SHALL not ask the user to reconstruct deterministic scaffolding,
infer target source, or treat a conversation decision as confirmation evidence.

The controller SHALL declare a distinct `apply-production-mode-transition` node for the state-owned
post-confirmation branch. Its declaration SHALL have no legacy `requires` edge and shall be enterable only
through a new closed `transition_apply_current` entry condition: the active execution must be the exact
source-run-bound transition execution with a valid state-owned transition plan/confirmation record. Its
exit SHALL be only `transition_publish_or_recovery_recorded`, the corresponding closed catalog condition.
That exit is a transition state-owner finalization guard, not a generic node-completion signal: only an
atomic completed target registration/baseline handoff or a no-target source restoration is terminal. It
SHALL not reuse `apply-html-migration` or any legacy migration field, and the legacy branch cannot satisfy
this entry or exit. The node's CLI step invokes only the exact closed state
apply/recovery-confirmation/recover forms; its recovery disclosure follows the producer's
same-host/cross-host ownership and age result, obtaining an explicit no-active-apply human confirmation
only for an old-enough uncertain journal through the closed confirmation form. A visible target receipt
routes directly to the state-owned registration/handoff recovery and never asks for journal takeover or
source reconstruction. A recoverable hard-stop, incomplete publication, or registration-pending receipt
keeps this node `in_progress`; generic controller advancement cannot complete it.

The retained `intake-migration` through `migration-target-review` legacy-to-HTML nodes remain a bounded
compatibility path, not a second production-mode-transition branch.  Once mode state is durable, they may
finish only an exact active legacy confirmation/apply/recovery/receipt-handoff checkpoint; they SHALL not
start or refresh legacy preparation/preview.  Controller guidance for any other cross-pipeline request
names the general transition node and retains the legacy checkpoint's source/version/hash/execution
bindings rather than repurposing them as transition authority.

On decline before confirmation, stale plan, or conflict, the source controller/current node remains
intact and the Controller follows the producer's nearest recovery action.  Confirmation alone captures
the source execution into the state-owned non-resumable transition suspension; a failed apply retains that
bounded checkpoint until recovery either restores the exact source (no visible target) or completes the
verified target handoff.  On verified target registration, state starts a new `create-deck` execution at
the first normal target node for the target mode: `preview-content` for HTML, or
`authorize-image2-style-master` for Image2. Before that entry it records only fresh target-owned,
receipt-bound baseline execution facts after each original prerequisite exit has revalidated: target
run-bundle/guide for instantiation; an explicit plan-hashed target intake and its newly persisted user
`proceed`/`intake-confirmed` record; then target source and visual-control validation for the selected
author/configuration nodes. It never invokes `init`, copies a source node record, marks a source node
skipped or complete, or copies source review/authorization. The baseline is limited to target
source/control acceptance and does not create target review, delivery, authorization, or completion
authority. HTML target progress uses the existing HTML workflow without a new visual-quality decision;
Image2 target progress uses the normal first-class Image2 review and authorization workflow.

#### Scenario: User changes from Image2 to HTML

- **WHEN** the user selects `html-only` or `html-then-image2` for a current Image2 version
- **THEN** the controller shows the exact clean-vNext transition plan and selected target mode before confirmation
- **AND** it does not route the source through an in-place state edit

#### Scenario: User changes from HTML to Image2

- **WHEN** the user selects `image2-only` for a current HTML version
- **THEN** the controller obtains explicit whole-page target authoring and later enters normal Image2 production after publication
- **AND** it does not require or infer an HTML-quality verdict during the transition

#### Scenario: Source execution is incomplete

- **WHEN** a source controller has incomplete work when a cross-pipeline request begins
- **THEN** transition preparation preserves that execution and applies no replacement until the declared target handoff succeeds

#### Scenario: Registered target starts clean controller work

- **WHEN** a transition target has a verified marker, receipt, and mode registration
- **THEN** Controller starts the target at `create-deck/preview-content` for HTML or `create-deck/authorize-image2-style-master` for Image2 without rerunning init
- **AND** its prerequisite baseline is newly bound to target source/control and receipt facts
- **AND** its completed intake node contains the target's new intake-confirmed user evidence rather than source evidence
- **AND** review, delivery, provider authorization, and final-completion nodes remain pending

#### Scenario: Legacy migration remains completion-only after mode upgrade

- **WHEN** an upgraded markerless source has an exact active legacy migration confirmation or apply checkpoint
- **THEN** the Controller presents only its matching confirmation, apply/recovery, or receipt-bound handoff action
- **AND** it routes a new candidate/preview request to the general versioned transition branch
