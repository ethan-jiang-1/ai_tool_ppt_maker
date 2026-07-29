## RENAMED Requirements

- FROM: `### Requirement: COMMANDS.md complements but does not duplicate scripts/05-iteration/change-classifier.md`
- TO: `### Requirement: COMMANDS.md complements target and CURRENT compatibility classifiers`

## ADDED Requirements

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

## MODIFIED Requirements

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
