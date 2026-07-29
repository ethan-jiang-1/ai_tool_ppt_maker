## Purpose

Define `PPTMAKER_FRAMEWORK/COMMANDS.md`, the human-facing command reference that maps natural-language user requests to intent routes and ownership-aware execution. It covers the full-deck creation path (BOOTSTRAP → Phases 0–3), the three artifact-refresh paths plus the outer Structural Versioning Path, the agent's request-classification logic, and common iteration-feedback patterns. This capability guarantees that a human can discover — in under 60 seconds — what to say and roughly how long each change takes, while detailed target and bounded CURRENT compatibility classifiers are not duplicated here.
## Requirements
### Requirement: COMMANDS resume guidance names the inspection control input

For a known exact run, COMMANDS.md SHALL direct resume and gate guidance to
state --json.workflow_inspection.primary_action and the owner-issued
continuation. It SHALL distinguish these read-only observation inputs from the
direct public CLI command that performs a mutation. It SHALL also describe
status as an observation-only status-card projection: neither status nor the
ordinary state projection may initialize a protocol receipt, state, metadata,
or generated artifact.

#### Scenario: Human resumes an existing deck
- **WHEN** a human or Agent follows COMMANDS guidance for an existing exact run
- **THEN** it obtains the current inspection action before selecting the owner mutation route
- **AND** it does not infer a route from a compatibility summary or rendered artifact

#### Scenario: Human distinguishes observation from validation

- **WHEN** a required source receipt is missing while a human follows COMMANDS
  resume or status guidance
- **THEN** the guidance treats the reported owner action as the route to
  validate or repair the receipt
- **AND** it does not imply that status or state observation will create it

### Requirement: COMMANDS.md exists at framework root

`PPTMAKER_FRAMEWORK/COMMANDS.md` SHALL exist as a human-readable command reference. It SHALL map natural-language user requests to the agent actions that fulfill them.

#### Scenario: Human opens COMMANDS.md to learn what to say

- **WHEN** a human opens `COMMANDS.md`
- **THEN** they see a table of common requests with corresponding agent actions
- **AND** each row includes estimated duration
### Requirement: COMMANDS routes Page Authority structural changes through clean targets
For a Page Authority run, COMMANDS.md SHALL route insert, delete, reorder, and page-authority changes
through the existing preview/hash-bound Structural Versioning Path. It SHALL explain that apply publishes
a clean target with only plan-bound, target-owned unreviewed raw materialization or
`needs_raw_generation` debt, makes no provider call, and requires target raw review before finalization.
It SHALL not direct an Agent to copy a final slide, raw approval, provider authorization, or delivery
decision across versions.

#### Scenario: Page Authority reorder creates a clean target
- **WHEN** a user reorders a Page Authority slide
- **THEN** COMMANDS routes to preview, exact plan confirmation, target raw materialization/debt, and
  target-local review rather than an in-place refresh
- **AND** it does not infer reuse from filenames or make a provider request during the structural apply

### Requirement: Commands route work by Page Authority ownership and invalidation
Active command guidance SHALL route Framed, Pure, notes-only, and structural requests through the v2 Page Authority ownership/invalidation model. A non-v2 input SHALL receive the generic unsupported-protocol/export hard-stop and SHALL NOT be presented as a production, inspection-continuation, or fallback route.

#### Scenario: A non-v2 protocol is not offered
- **WHEN** command guidance describes a visual or text change
- **THEN** it selects a v2 Page Authority refresh path without presenting another protocol as a choice

#### Scenario: A non-v2 bundle is encountered
- **WHEN** command guidance receives a non-v2 source/state identity
- **THEN** it reports the generic unsupported-protocol/export action
- **AND** it does not infer a workflow, decode history, or create a receipt

### Requirement: Commands route TARGET work by one version workflow and owner
For a target `page-authority-image2-v2` run, `COMMANDS.md` SHALL describe one Framed-or-Pure workflow choice at version start and thereafter route requests by the bound workflow and direct artifact ownership. It SHALL present the selected workflow's current fact, gate, and nearest action without exposing shared raw topology, sibling adapter internals, or a per-slide authority choice.

Command guidance SHALL route target Framed text-only work to its local refresh only when exact accepted raw evidence and frame preset remain current; route Framed underlay/preset and Pure display/visual work to raw rebuild; route notes-only work to shared delivery; and route structural or whole-workflow changes through previewed exact-hash vNext versioning. It SHALL name `06-iteration` as the target iteration owner.

#### Scenario: Human requests a target visual edit
- **WHEN** a human asks to change visible text or visual content in a target Pure version
- **THEN** COMMANDS guidance routes the request to the Pure raw rebuild path through the selected workflow
- **AND** it does not offer a Framed local refresh or ask the human to choose an authority for one slide

#### Scenario: Human requests a target workflow switch
- **WHEN** a human asks to change a target version from Framed to Pure
- **THEN** COMMANDS guidance routes to Structural Versioning Path preview and exact plan confirmation
- **AND** it does not describe an in-place workflow mutation or acceptance reuse

### Requirement: COMMANDS.md complements the target classifier
COMMANDS.md SHALL be the concise human-facing interface and SHALL link detailed current change classification only to `scripts/06-iteration/change-classifier.md`. It SHALL not link to a compatibility, v1, or archived classifier.

#### Scenario: Documentation links resolve only to current classification
- **WHEN** command-reference links are audited
- **THEN** every active classifier link resolves to the target iteration classifier
- **AND** no active link resolves to a v1 or compatibility path
