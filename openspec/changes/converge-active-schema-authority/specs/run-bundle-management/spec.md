## MODIFIED Requirements

### Requirement: New versions begin with fresh replacement workflow evidence

When `ppt_flow new-version` copies an exact current Page Image Workflow
version with its selected workflow, the new version SHALL become a clean
authoring draft for that same explicit workflow. It may retain copied canonical
source and overrides, but it SHALL begin with no source receipt, Style Master
selection, raw plan/authorization/evidence, Complete Page Review, final-slide
manifest, assembly, notes, or delivery facts. The copy operation SHALL not call
a provider, infer evidence from its source version, or parse, convert, or
resume predecessor state.

#### Scenario: A current Framed version is copied cleanly

- **WHEN** `ppt_flow new-version` copies a current selected Framed version
- **THEN** the target is a Framed authoring draft with fresh workflow evidence
- **AND** it does not inherit the source version's raw page, header composite,
  review decision, final manifest, or state format marker

#### Scenario: Successor initialization ignores predecessor state

- **WHEN** a valid current source and overrides are copied to a successor
- **THEN** the state owner initializes fresh declared-current target state from
  those current source facts
- **AND** the operation does not parse, convert, or adopt an existing source
  state as successor input

## ADDED Requirements

### Requirement: Initialization emits only unversioned current source seeds

New Run Bundles SHALL seed the declared current Visual Language source and
optional asset manifest without numeric `revision` or `version` format markers.
The Visual Language source, asset manifest, and current presentation package
remain independently owned source/configuration files; their seed SHALL not
create receipt, raw, review, delivery, or provider evidence.

#### Scenario: A new Bundle receives current source seeds

- **WHEN** initialization creates a new Run Bundle
- **THEN** its Visual Language source and optional asset manifest have only
  their declared current fields and no Harness-owned numeric generation marker
- **AND** initialization creates no lifecycle or provider evidence
