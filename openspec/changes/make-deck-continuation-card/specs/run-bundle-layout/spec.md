## MODIFIED Requirements

### Requirement: Run-bundle root admits portable locator and operating controls

The strict deck root SHALL admit `RUN_BUNDLE.md`, `deck-guide.md`, `README.md`, `AGENTS.md`,
and `CLAUDE.md` without loosening any other root name. `RUN_BUNDLE.md` SHALL be the static
portable locator manifest. `deck-guide.md` SHALL remain the detailed in-bundle operating guide;
it SHALL NOT be re-roled into a locator manifest. `AGENTS.md` and `CLAUDE.md` SHALL direct an
Agent first to the locator and then to the guide; `README.md` SHALL tell a human that
`RUN_BUNDLE.md` is the file to hand to an Agent.

`RUN_BUNDLE.md` SHALL contain only a closed static locator record and short handoff prose. It
SHALL NOT claim current run version, production mode, node, gate, digest, next action, or
approval. Legacy bundles without `RUN_BUNDLE.md` remain structurally valid; validation shall
not require the file merely because it is newly allowed.

#### Scenario: Fresh root has distinct locator and guide roles
- **WHEN** init creates a fresh bundle
- **THEN** the root contains a `RUN_BUNDLE.md` locator and a separate `deck-guide.md` guide
- **AND** its Agent pointers preserve both roles in that order

#### Scenario: Legacy root remains valid
- **WHEN** an existing structurally valid bundle has no `RUN_BUNDLE.md`
- **THEN** structure validation does not report its absence
- **AND** no ordinary command adds or rewrites it
