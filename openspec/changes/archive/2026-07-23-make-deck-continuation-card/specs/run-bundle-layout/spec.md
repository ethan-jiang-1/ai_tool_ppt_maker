## MODIFIED Requirements

### Requirement: Run-bundle root admits an agent-agnostic generated entry control

The canonical strict deck root SHALL admit `RUN_BUNDLE.md` and `AGENTS.md` as named control
files alongside `CLAUDE.md` and `deck-guide.md`, without loosening any other root name.
`RUN_BUNDLE.md` SHALL be the static portable locator manifest. `deck-guide.md` SHALL remain the
detailed in-bundle operating guide; it SHALL NOT be re-roled into a locator manifest.
`AGENTS.md` and `CLAUDE.md` SHALL be short agent-agnostic pointers that direct an Agent first to
the locator and then to the guide, not a second workflow or directory ontology. `README.md` SHALL
tell a human that `RUN_BUNDLE.md` is the file to hand to an Agent. `bundle_layout.mjs` constants,
deck-root whitelist, module tree comment, and `renderTree()` SHALL agree on these controls.

`RUN_BUNDLE.md` SHALL contain only a closed static locator record and short handoff prose. It
SHALL NOT claim current run version, production mode, node, gate, digest, next action, or
approval. Legacy bundles without `RUN_BUNDLE.md` or `AGENTS.md` remain structurally valid;
validation SHALL not require either file merely because it is newly allowed. `bundle_layout.mjs` SHALL retain one
narrow root-control validator for both normal structure checking and locator verification; it
SHALL validate the strict root names and mandatory legacy controls, treat `RUN_BUNDLE.md` as
optional, and neither read state nor select a version.

#### Scenario: Canonical tree shows distinct Agent entry controls
- **WHEN** init creates a fresh bundle
- **THEN** the root contains a `RUN_BUNDLE.md` locator and a separate `deck-guide.md` guide
- **AND** its Agent pointers preserve both roles in that order

#### Scenario: Legacy deck remains valid
- **WHEN** an existing structurally valid bundle has no `RUN_BUNDLE.md` or `AGENTS.md`
- **THEN** structure validation does not report its absence
- **AND** no ordinary command adds or rewrites it
