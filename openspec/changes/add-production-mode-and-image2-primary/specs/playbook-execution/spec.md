## ADDED Requirements

### Requirement: Controller routing follows production mode before pipeline behavior

Every fresh, resume, and iteration controller SHALL obtain the exact version-scoped production policy
before selecting mode-specific nodes. The MD Controller SHALL own semantic intent, presentation of real
review artifacts, and human decisions; it SHALL delegate deterministic mode/pipeline consistency,
readiness, state mutation, and completion evaluation to JS. A missing/invalid mode or mode/source drift
SHALL stop controller entry with the producer-owned recovery action rather than choosing a controller
from source prose, metadata, generated directories, or conversation context.

For `image2-only`, the ordinary create/iterate route SHALL use the whole-page Image2 production nodes
as a first-class flow and SHALL not describe the run as an HTML refinement. For both HTML modes, normal
production remains HTML-owned. Cross-pipeline mode requests SHALL route to versioned-transition guidance
without clearing the active controller or editing current-version source/state.

#### Scenario: Fresh Image2-primary request enters whole-page flow

- **WHEN** create-deck starts with a consistent `image2-only` v1
- **THEN** the Controller proceeds through Image2 authoring, style master, pilot/review, build, notes, and final review
- **AND** it never enters HTML production or modern refinement

#### Scenario: Resume sees mode drift

- **WHEN** durable state mode and source pipeline do not agree
- **THEN** resume stops at the typed state/transition recovery action
- **AND** it does not infer a replacement controller

## MODIFIED Requirements

### Requirement: playbook/ directory contains the registered MD controllers

`PPTMAKER_FRAMEWORK/playbook/` SHALL retain its registered ordered MD Controller inventory and shared
node `classify-change.md`. Historical compatibility remains available through
`legacy-image2-maintenance`; `probe-image-channels` remains Phase 0. The `create-deck` controller SHALL
declare mode-aware paths for both `html-first-v1` and `legacy-image2-first` rather than treating a new
Image2-primary run as legacy maintenance. `image2-refine` SHALL serve only a marked HTML-first run.

For `html-only`, entry to `image2-refine` remains an explicit optional human choice. For
`html-then-image2`, create-deck SHALL perform an explicit state-bound handoff to the same controller and
return to mode-aware completion after current refinement/final review. Normal refinement entry requires
current `html-delivery-review: proceed` with complete evidence; the existing explicit offline
`image2 plan --force --reason` prerequisite waiver MAY apply when current final-slide/slot identity is
valid. No prerequisite waiver authorizes provider generation.

#### Scenario: Agent lists available controllers

- **WHEN** the playbook index is built
- **THEN** it contains the registered controllers with Image2-primary create, optional/required modern refinement, and historical maintenance as distinct ownership paths

#### Scenario: Image2-primary selects legacy-only controller

- **WHEN** a new `image2-only` run attempts to enter compatibility-only maintenance instead of its create route
- **THEN** entry validation reports the first-class create/iteration owner

#### Scenario: HTML-then-Image2 reaches refinement

- **WHEN** current HTML delivery is reviewable under `html-then-image2`
- **THEN** create-deck hands off to `image2-refine` and cannot complete until the current refinement/final-review conditions pass

#### Scenario: User explicitly enters refinement before complete delivery evidence

- **WHEN** current HTML final-slide/slot inputs are identifiable and the user accepts the displayed prerequisite risk with a reason
- **THEN** the controller may create only the offline prerequisite-waived plan
- **AND** it still requires exact authorization before any provider operation

### Requirement: create-deck playbook covers complete deck creation

`create-deck.md` SHALL define a complete mode-aware workflow from init/intake through authored content,
visual direction, real-artifact gates, mode-owned production, evidence-bound final review, readiness,
and completion. `image2-only` SHALL complete through whole-page Image2 style master, pilot/content/
visual/header review, build, PPTX, notes, and final review without HTML or modern refinement.
`html-only` SHALL retain the complete local HTML workflow and finish without refinement. For
`html-then-image2`, current HTML delivery SHALL lead through the registered refinement handoff and a
new current final review before completion.

Before the mode-owned final-review node records `proceed|repair|redirect`, the Controller SHALL show
the current contact sheet plus PPTX/notes result and JS SHALL bind the decision to the exact version's
current evidence. Repair/rerun SHALL return to the owning content, visual-system, refinement, or
production node. Cross-pipeline redirection SHALL not mutate the current version or infer a transition
from free text.

#### Scenario: User starts with the default mode

- **WHEN** COMMANDS routes a fresh request with default `image2-only`
- **THEN** execution follows the complete first-class whole-page flow
- **AND** does not require HTML source or HTML delivery

#### Scenario: User selects html-only

- **WHEN** final review accepts current `html-only` PPTX/notes
- **THEN** the create execution completes with no pending Image2 node, plan, or authorization

#### Scenario: User selects html-then-image2

- **WHEN** HTML delivery is current but required refinement/final review is not
- **THEN** create execution remains incomplete and names the current refinement owner

#### Scenario: Delivery changes after final review

- **WHEN** mode-owned contact sheet, assembly, PPTX, notes, or required refinement evidence changes after `proceed`
- **THEN** the prior decision is stale and completion returns to current final review

### Requirement: Playbook lifecycle and methodology metadata are explicit

Every registered node SHALL declare lifecycle Phase `0|1|2|3|4|5` and one exact final method module
`00-setup|01-content|02-visual-system|03-html-production|04-image2-refinement|05-iteration`. Phase 3
owns complete HTML delivery; Phase 4 owns only `image2-refine`, optional for `html-only` and required by
the `html-then-image2` completion policy; Phase 5 retains whole-page Image2 implementation/maintenance
nodes and MAY be entered by the first-class `image2-only` create/iteration controller. Provider channel
probing remains Phase 0. No other controller/node may declare Phase 4 or import its private transport.

#### Scenario: HTML production node is unambiguous

- **WHEN** Agent inspects an HTML create-deck production node
- **THEN** it declares lifecycle Phase 3 and method module `03-html-production`

#### Scenario: Required refinement node is unambiguous

- **WHEN** the controller index inspects an `image2-refine` execution under `html-then-image2`
- **THEN** it declares lifecycle 4/module `04-image2-refinement` and remains the sole modern-refinement owner

#### Scenario: Whole-page primary route keeps implementation ownership

- **WHEN** the graph resolves `image2-only` create production
- **THEN** its whole-page nodes retain Phase 5 ownership without entering modern refinement

### Requirement: Resume cards use the active playbook model

When durable execution state exists, human and JSON resume cards SHALL use the canonical
mode-and-pipeline-compatible active playbook index to calculate pending nodes and eligible successors.
`waiting_for` remains highest priority; exactly one eligible successor is suggested; multiple eligible
branches remain explicit candidates. Artifact/review freshness SHALL be evaluated through the shared
mode policy before suggesting production/completion. A current complete `html-only` delivery SHALL not
gain a refinement successor; a current `html-then-image2` delivery SHALL expose required refinement;
an `image2-only` run SHALL expose only whole-page completion work. Historical markerless decks without
durable mode/state SHALL use the one-time migration/compatibility projection and SHALL not fabricate an
execution during observation.

#### Scenario: Unique current successor is suggested

- **WHEN** durable current-mode state has one eligible downstream node and no wait/freshness block
- **THEN** suggested-next names that node and later absent nodes remain pending

#### Scenario: Branch requires a decision

- **WHEN** two downstream branch nodes are eligible
- **THEN** both remain candidates and neither is auto-selected

#### Scenario: Required refinement is suggested

- **WHEN** current HTML delivery belongs to `html-then-image2` and refinement is missing
- **THEN** suggested-next names the owning refinement step before completion

#### Scenario: Historical markerless compatibility card has no active graph

- **WHEN** a historical markerless deck lacks durable state
- **THEN** its observation identifies migration/whole-page ownership without pending-node invention or disk write
