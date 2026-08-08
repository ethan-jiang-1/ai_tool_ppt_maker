## ADDED Requirements

### Requirement: Run-Bundle Layout owns the Pure visual-system source location

Run-Bundle Layout SHALL reserve
`2_backbone/visual-style/pure-deck-visual-system.yaml`, with the existing version
`overrides/visual-style/` precedence, as the version-resolved deck-authored source of the current
Pure deck visual system. New Run Bundles SHALL receive a valid seed record at that canonical
location. The record is source input: it SHALL not be stored in `_generated/`, Style Master
immutable history, Page Image lifecycle storage, receipts, grants, State, or delivery artifacts.

Removing or changing the record SHALL not mutate existing lifecycle authority. A subsequent Pure
owner operation re-evaluates it from the resolved source location; it does not recover a value from
a prior plan, inspection projection, or accepted image.

#### Scenario: A new bundle receives a Pure visual-system source seed

- **WHEN** a new Run Bundle is initialized
- **THEN** its backbone visual-style directory contains the canonical valid Pure visual-system
  source record
- **AND** the seed is a source asset rather than derived Page Image state or media

#### Scenario: A version override changes only that version's Pure source input

- **WHEN** a version provides a valid visual-style override of the Pure visual-system record
- **THEN** current Pure planning uses that version-resolved record and its digest
- **AND** sibling versions and immutable artifacts remain unchanged
