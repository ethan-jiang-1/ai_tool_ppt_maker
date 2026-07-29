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

### Requirement: Commands name the bounded CURRENT compatibility surface

COMMANDS.md SHALL present an exact
page-authority-image2-v1 / image2-page-authority pair only as an existing-run
compatibility route. It SHALL link detailed v1 change classification to
workflow/compatibility/current-v1-page-authority/change-classifier.md and
shall direct new authoring only to the selected v2 Framed-or-Pure graph. It
SHALL NOT offer the compatibility route as a fresh-init choice, a target
fallback, or a per-slide authority menu.

#### Scenario: Human opens exact CURRENT compatibility guidance

- **WHEN** a human or Agent follows COMMANDS.md for an exact CURRENT v1 run
- **THEN** it reaches the declared compatibility classifier and existing-run
  boundary guidance
- **AND** it does not see a numbered target method-module or new-deck route for v1

### Requirement: COMMANDS.md complements target and CURRENT compatibility classifiers

COMMANDS.md SHALL be the human-facing interface. The detailed target decision
tree SHALL remain in scripts/06-iteration/change-classifier.md, while the
detailed exact CURRENT v1 classifier SHALL live in
workflow/compatibility/current-v1-page-authority/change-classifier.md.
COMMANDS.md SHALL be concise (no nested decision trees), use natural language
examples, and be scannable in under 60 seconds. It SHALL NOT link to the
deleted scripts/05-iteration/change-classifier.md path.

#### Scenario: Human scans COMMANDS.md quickly

- **WHEN** a human scans COMMANDS.md for 30 seconds
- **THEN** they can identify which type of change their request falls under
- **AND** they know roughly how long it will take

#### Scenario: Documentation links resolve to active classifiers

- **WHEN** command-reference links are audited after the compatibility move
- **THEN** target guidance resolves to the 06-iteration classifier and exact
  CURRENT guidance resolves to the compatibility classifier
- **AND** no link resolves to scripts/05-iteration/change-classifier.md

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
Active command guidance SHALL route Pure, Framed, notes-only, and structural requests through the
Page Authority ownership/invalidation model. Historical runs SHALL be routed only to inspection and
explicit provider-free adoption.

#### Scenario: A retired mode is not offered
- **WHEN** command guidance describes a visual or text change
- **THEN** it selects a Page Authority refresh path without presenting a retired route as a choice

### Requirement: Commands route TARGET work by one version workflow and owner

For a target `page-authority-image2-v2` run, `COMMANDS.md` SHALL describe one
Framed-or-Pure workflow choice at version start and thereafter route requests by
the bound workflow and direct artifact ownership. It SHALL present the selected
workflow's current fact, gate, and nearest action without exposing shared raw
topology, sibling adapter internals, or a per-slide authority choice.

Command guidance SHALL route target Framed text-only work to its local refresh
only when exact accepted raw evidence and frame preset remain current; route
Framed underlay/preset and Pure display/visual work to raw rebuild; route
notes-only work to shared delivery; and route structural or whole-workflow
changes through previewed exact-hash vNext versioning. It SHALL name
`06-iteration` as the target iteration owner and SHALL keep CURRENT v1 mixed
guidance explicitly bounded.

#### Scenario: Human requests a target visual edit

- **WHEN** a human asks to change visible text or visual content in a target Pure version
- **THEN** COMMANDS guidance routes the request to the Pure raw rebuild path through the selected workflow
- **AND** it does not offer a Framed local refresh or ask the human to choose an authority for one slide

#### Scenario: Human requests a target workflow switch

- **WHEN** a human asks to change a target version from Framed to Pure
- **THEN** COMMANDS guidance routes to Structural Versioning Path preview and exact plan confirmation
- **AND** it does not describe an in-place workflow mutation or acceptance reuse
