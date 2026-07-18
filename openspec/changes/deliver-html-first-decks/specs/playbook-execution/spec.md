## MODIFIED Requirements

### Requirement: playbook/ directory contains the registered MD controllers

`PPTMAKER_FRAMEWORK/playbook/` SHALL contain ten active ordered MD Controllers—`create-deck.md`, `edit-text.md`, `edit-visual.md`, `edit-notes.md`, `restructure-slides.md`, `iterate-style.md`, `quick-preview.md`, `migrate-import.md`, `probe-image-channels.md`, and `legacy-image2-maintenance.md`—plus shared node `classify-change.md`. `legacy-image2-maintenance` SHALL serve only markerless decks and SHALL use lifecycle Phase 5/module `05-iteration`; `probe-image-channels` remains an off-path Phase-0 diagnostic switch. Change 3 SHALL NOT register `image2-refine` or any modern Phase-4 controller/node.

#### Scenario: Agent lists available controllers

- **WHEN** the playbook index is built
- **THEN** it contains the ten ordered controllers and one shared classifier
- **AND** includes legacy maintenance and provider probing but no modern refinement controller

#### Scenario: HTML deck selects legacy controller

- **WHEN** an HTML-first run attempts to enter `legacy-image2-maintenance`
- **THEN** entry validation fails with a pipeline-ownership diagnostic

### Requirement: create-deck playbook covers complete deck creation

`create-deck.md` SHALL define a complete HTML-first workflow from init/intake through structured content, local visual-system preview, content/visual human gates, production, final review, readiness, and completion. Its production node SHALL publish current HTML pages/final slides/contact sheet/PPTX/notes without Image2 prerequisites. The playbook SHALL complete after delivery and SHALL not leave an optional/unavailable Phase-4 node pending. Repair/rerun decisions SHALL return to the owning content, visual-system, or production node rather than a prompt/style-master stage.

#### Scenario: User says "帮我做一个PPT"

- **WHEN** COMMANDS routes a fresh request to `create-deck`
- **THEN** execution begins at instantiation and follows the HTML-complete path
- **AND** can reach completed with no provider credentials or style master

#### Scenario: User finishes after delivery

- **WHEN** final review accepts current PPTX/notes
- **THEN** the create execution completes with no pending Image2 node, plan, or authorization

### Requirement: Iteration playbooks resolve semantic paths

`edit-text`, `edit-visual`, `edit-notes`, and `restructure-slides` SHALL begin with shared pipeline-first classification and end with intent-specific verification. For HTML-first runs, visible copy/body/family/fallback edits SHALL use Local Slide Rebuild; visual-config changes SHALL use Local Deck Rebuild with representative preview; notes-only changes SHALL use Stage 5; structure changes SHALL use preview/hash-bound clean vNext and target-local rebuild. These paths SHALL not use render mode, style master, provider adapters, or remote authorization.

For markerless runs, compatible controllers SHALL switch to `legacy-image2-maintenance` or retain existing legacy refresh semantics. Structural Versioning Path remains outer to both branches and SHALL not be presented as a fourth peer refresh.

#### Scenario: HTML title or body edit

- **WHEN** one HTML-first slide's visible content changes
- **THEN** the controller invokes local slide rebuild and verifies current pixels/delivery

#### Scenario: HTML visual-system edit

- **WHEN** global renderer-neutral visual config changes
- **THEN** the controller shows representative production-compositor output before local deck rebuild

#### Scenario: Notes-only edit

- **WHEN** only speaker notes change and assembly lineage is current
- **THEN** the controller runs Notes-Only Refresh without recomposition

#### Scenario: Markerless visual rebuild

- **WHEN** a legacy deck needs whole-page regeneration
- **THEN** the controller switches to legacy maintenance with existing force/review/prerequisite behavior

### Requirement: Playbook lifecycle and methodology metadata are explicit

Every registered node SHALL declare lifecycle Phase `0|1|2|3|4|5` and one exact final method module `00-setup|01-content|02-visual-system|03-html-production|04-image2-refinement|05-iteration`. Phase 3 nodes own complete HTML delivery. Change 3's active index SHALL contain no lifecycle-4 or module-`04-image2-refinement` executable node. Legacy whole-page maintenance SHALL be Phase 5/module `05-iteration`, and provider channel probing SHALL remain Phase 0/module `00-setup`.

#### Scenario: HTML production node is unambiguous

- **WHEN** Agent inspects the create-deck production node
- **THEN** it declares lifecycle Phase 3 and method module `03-html-production`

#### Scenario: Unavailable Phase 4 is registered accidentally

- **WHEN** a Change-3 active node declares lifecycle 4 or module `04-image2-refinement`
- **THEN** playbook validation fails

### Requirement: Existing-deck sessions start with whole-workflow resume ritual

Existing-deck sessions SHALL still run `ppt_flow state` and `ppt_flow status`, inspect pointer/wait/artifact/gate evidence, explain whole-workflow position, load the resolved controller/current node, check entry, and confirm continuation before replacing incomplete work. State heal SHALL first classify the source pipeline and migrate known old controller/node/module references to the new HTML or legacy ownership. Conversation context SHALL not override state. If mapping is ambiguous, the resume card SHALL require a human choice of replacement/restart and SHALL preserve the original state until that choice is recorded.

#### Scenario: Old markerless execution resumes after directory migration

- **WHEN** a legacy state points to an old create/production node
- **THEN** heal maps it to the declared legacy-maintenance continuation with preserved evidence/wait
- **AND** the Agent does not restart greenfield HTML intake

#### Scenario: HTML-marked execution resumes locally

- **WHEN** an HTML-first deck has an old but unambiguous controller pointer
- **THEN** heal maps it to the corresponding final Phase/module node and continues locally

#### Scenario: In-progress replacement remains human-owned

- **WHEN** the old topology has no one-to-one semantic mapping
- **THEN** no state is cleared or guessed
- **AND** the user must confirm a replacement/restart action

### Requirement: Registered playbooks pass machine validation

Every active controller/shared node SHALL pass the canonical node-specification validator. A checked-in normative manifest SHALL bind the expected controller/shared-node inventory, globally unique IDs, exact order, pipeline ownership, lifecycle/module values, includes/requires, conditions, decisions, and absence of Phase-4 execution. Validation SHALL not rely on a stale hard-coded count alone.

#### Scenario: Final controller set validates

- **WHEN** the framework indexes all active playbooks
- **THEN** the normalized graph matches the checked-in manifest with no duplicates, missing references, cycles, unknown conditions, impossible gates, or ownership conflicts

## ADDED Requirements

### Requirement: HTML visual review is a human gate over exact compositor evidence

The MD Controller SHALL show the hash-bound representative or affected-page preview artifacts before invoking visual approval. It SHALL force fallback composition for a page-local fallback review even when a selected asset is current, report which family/geometry/assets were reviewed, and never infer approval from successful rendering. JS SHALL reject stale plan hashes or bytes.

#### Scenario: Preview changed before approval

- **WHEN** source/config/renderer/asset evidence changes after the user viewed a preview
- **THEN** approval fails as stale and the Controller shows a new current preview

### Requirement: Legacy migration is a separate human-confirmed controller path

`migrate-import` or its explicit migration branch SHALL require Agent-authored structured candidate controls, run local full-deck comparison, present old and proposed contact sheets/source implications, and obtain exact-plan confirmation before publish. Decline SHALL leave the legacy version/controller usable.

#### Scenario: User declines migrated comparison

- **WHEN** the user is not satisfied with the proposed HTML deck
- **THEN** no new version becomes visible
- **AND** legacy maintenance remains available
