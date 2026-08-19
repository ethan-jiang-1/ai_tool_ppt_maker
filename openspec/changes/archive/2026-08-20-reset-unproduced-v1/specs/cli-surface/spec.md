## ADDED Requirements

### Requirement: Unproduced unique v1 reset is a registered direct command

The closed `ppt_flow` inventory SHALL include `reset-unproduced-v1`. The
command SHALL bind one exact run-dir, require `--confirm-abandon`, and own
one mutation: abandon an unproduced unique `v1` page structure and restore the
initialized authoring draft. It SHALL NOT overlap `paginate`, `slides`,
`new-version`, or `image2`. Text and JSON SHALL be renderers of one
`commandResult`. Success SHALL report that no irreversible provider or
decision record was deleted. Missing `--confirm-abandon` or a run-dir that is
not exact `3_versions/v1` SHALL be `usage` with zero writes.

#### Scenario: Confirm flag is required

- **WHEN** Agent invokes `reset-unproduced-v1` on a v1 run-dir without
  `--confirm-abandon`
- **THEN** the command exits as `usage` before admission or mutation
- **AND** source, State, generated, scratch, and iteration stores are byte-identical

#### Scenario: Non-v1 run-dir is usage

- **WHEN** the bound run-dir is not exact `3_versions/v1`
- **THEN** the command exits as `usage` naming exact `v1`
- **AND** it writes nothing

#### Scenario: Irreversible evidence hard-stops without writes

- **WHEN** admission finds grant, submit, attempt, fee, unknown commit, Style
  Master grant or generated candidate media, raw/final PNG, PPTX, delivery, a
  successor version, or an unresolvable identity
- **THEN** the command exits `GATE_BLOCKED` with category `gate`, next
  `repair_prerequisite` naming the existing vNext publication path, and zero
  writes
- **AND** it SHALL NOT classify that refusal as `internal`

#### Scenario: Successful reset restores the init authoring draft

- **WHEN** admission passes on a unique unproduced v1 and `--confirm-abandon`
  is present
- **THEN** the command writes the exact current deck-type seed, the init
  authoring-draft State, and a success `commandResult` whose effect states
  irreversible records were retained
- **AND** later `paginate plan` of a new candidate against that v1 returns
  `publication: "initial-draft"` and `target_run_version: "v1"`
