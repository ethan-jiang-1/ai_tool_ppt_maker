# Style Master Generation Specification (delta)

## ADDED Requirements

### Requirement: Style Master binds one nearest legal next for source/config preconditions

Before or during provider-free `style-master inspect` / `style-master plan`
scope resolution, when the canonical Page Source, Visual Language, or
Presentation source fails its precondition, the Style Master owner SHALL
report the producer-issued source/config problem fact (per `diagnostic-facts`)
with one nearest legal next action: repair the failing source through its
owner, then rerun the same command. The owner SHALL NOT return a next that
re-enters the same command with the same failed precondition, SHALL NOT
classify a known source/config defect as a lifecycle artifact or internal
defect, and SHALL NOT invent a Style Master recovery story for a fact it does
not own. The Style Master owner SHALL consume the producer fact; it SHALL NOT
rewrite the source fact or claim source ownership.

#### Scenario: Inspect fails on an invalid registry without a self-loop

- **WHEN** `style-master inspect` fails on an invalid selected Visual
  Language registry record
- **THEN** its next names the registry repair and rerun of inspect
- **AND** it does not return an `artifact`/`inspect` action that has the same
  failed precondition

#### Scenario: Plan fails on a presentation package defect

- **WHEN** `style-master plan` fails because a presentation package file is
  missing or malformed
- **THEN** its next names the exact package source repair
- **AND** it does not call the defect internal or create a Style Master
  lifecycle story
