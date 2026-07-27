## Purpose

Define `PPTMAKER_FRAMEWORK/COMMANDS.md`, the human-facing command reference that maps natural-language user requests to intent routes and ownership-aware execution. It covers the full-deck creation path (BOOTSTRAP → Phases 0–3), the three artifact-refresh paths plus the outer Structural Versioning Path, the agent's request-classification logic, and common iteration-feedback patterns. This capability guarantees that a human can discover — in under 60 seconds — what to say and roughly how long each change takes, while the detailed decision tree stays in `scripts/05-iteration/change-classifier.md` and is not duplicated here.
## Requirements
### Requirement: COMMANDS resume guidance names the inspection control input

For a known exact run, `COMMANDS.md` SHALL direct resume and gate guidance to `state --json.workflow_inspection.primary_action` and the owner-issued `continuation`. It SHALL distinguish these read-only observation inputs from the direct public CLI command that performs a mutation.

#### Scenario: Human resumes an existing deck
- **WHEN** a human or Agent follows COMMANDS guidance for an existing exact run
- **THEN** it obtains the current inspection action before selecting the owner mutation route
- **AND** it does not infer a route from a compatibility summary or rendered artifact

### Requirement: COMMANDS.md exists at framework root

`PPTMAKER_FRAMEWORK/COMMANDS.md` SHALL exist as a human-readable command reference. It SHALL map natural-language user requests to the agent actions that fulfill them.

#### Scenario: Human opens COMMANDS.md to learn what to say

- **WHEN** a human opens `COMMANDS.md`
- **THEN** they see a table of common requests with corresponding agent actions
- **AND** each row includes estimated duration

### Requirement: COMMANDS.md complements but does not duplicate scripts/05-iteration/change-classifier.md

COMMANDS.md SHALL be the human-facing interface. `scripts/05-iteration/change-classifier.md` SHALL remain as the agent's detailed decision tree. COMMANDS.md SHALL be concise (no nested decision trees), use natural language examples, and be scannable in under 60 seconds.

#### Scenario: Human scans COMMANDS.md quickly

- **WHEN** a human scans COMMANDS.md for 30 seconds
- **THEN** they can identify which type of change their request falls under
- **AND** they know roughly how long it will take

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
