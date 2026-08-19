## ADDED Requirements

### Requirement: Unproduced unique v1 can be owner-reseeded

The run-bundle owner SHALL expose one atomic unproduced-v1 reset. Admission
SHALL require that the target is exact `v1`, that no other `3_versions/vN`
exists, that current source/state identity inspects as a resolvable pair, and
that no irreversible record exists for that deck. Rebuildable local facts
(source receipt, source-bound target-evidence identity row, `_generated`
derived JSON without raw/final PNG or PPTX) SHALL NOT defeat admission.

On success the owner SHALL write the exact current deck-type initial seed to
`v1/slide-specifications.md`, replace State with the same unbound authoring
draft `init` writes, wipe rebuildable v1 `_generated` and `_scratch` contents
while retaining their README files, and remove only mutable v1 iteration scope
heads. It SHALL NOT delete append-mostly Style Master or progressive plan,
attempt, grant, or materialization history. It SHALL append one typed history
event. If admission fails, every byte SHALL remain unchanged.

#### Scenario: Unproduced materialized v1 returns to the init seed

- **WHEN** unique v1 has a resolvable identity, local source-bound evidence, and
  zero irreversible records
- **THEN** reset restores the exact deck-type seed, unbound authoring-draft
  State, and empty rebuildable generated/scratch trees
- **AND** append-mostly iteration plan files remain byte-identical

#### Scenario: A successor version blocks reset

- **WHEN** `3_versions/v2` or any other `vN` besides `v1` exists
- **THEN** reset refuses with zero writes
- **AND** v1 source, State, and derived trees remain byte-identical
