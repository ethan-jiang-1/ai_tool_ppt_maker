## ADDED Requirements

### Requirement: State owns inactive continuation target version

The durable state owner SHALL retain `run_version` exclusively as active-execution identity.
It SHALL retain normalized `continuation_target_version` as the non-execution exact-run
selector after a verified `RUN_BUNDLE.md` locator has identified a deck. The selector SHALL name
one existing canonical `3_versions/vN` target and SHALL be written only by existing init, exact
version-publication, and terminal-handoff owners through their atomic/CAS boundary. Plain
observation SHALL neither initialize, heal, replace, nor choose this selector. No generic state
setter or new CLI is introduced.

#### Scenario: Active execution takes precedence
- **WHEN** state has a normalized active `run_version` and a different continuation target
- **THEN** entry selects the active run
- **AND** the inactive selector cannot override execution identity

#### Scenario: Terminal bundle retains an exact target
- **WHEN** execution clears after visible vN becomes terminal
- **THEN** durable state retains `continuation_target_version: vN`
- **AND** verified locator entry can inspect that exact run without a latest-version guess

#### Scenario: Invalid target is a non-writing guide
- **WHEN** the target is missing, malformed, or no longer visible
- **THEN** entry requests an explicit run path after root verification
- **AND** state/status observation does not repair or choose another version

## MODIFIED Requirements

### Requirement: Runtime Agents discover the consumer contract from generated run-bundle controls

An Agent entering a newly initialized run bundle SHALL encounter generated root
`AGENTS.md`/`CLAUDE.md` directions to read `RUN_BUNDLE.md` first for local location and then
`deck-guide.md` for operating rules. The guide SHALL explain the consumer essentials without
referencing repo-only OpenSpec paths: parse the final failure envelope, use supported structured
`diagnostic.next`, preserve invocation argument boundaries, stop when `requires_human` is true,
do not guess omitted lineage, and never hand-edit `_generated/`. The locator contains no consumer
protocol, current execution fact, or command menu.

Repository-maintenance discovery for MD implementation SHALL also be present in root `AGENTS.md`
and short headers of `scripts/shared/state/md_controller_reader.mjs` and `state.mjs`, pointing to
`node-specification` and active deltas without duplicating field schema.

#### Scenario: New run bundle receives a CLI failure

- **WHEN** its runtime Agent follows generated entry guidance
- **THEN** it locates the bundle before reading the guide's consumer contract
- **AND** it can act on a supported diagnostic without reading repository OpenSpec files
- **AND** it stops for human-owned decisions and preserves source/generated ownership

#### Scenario: Coding Agent changes MD consumption

- **WHEN** a repository-maintenance Agent edits MD-controller/state consumption behavior
- **THEN** root and code-adjacent instructions route it to `node-specification` plus active deltas
