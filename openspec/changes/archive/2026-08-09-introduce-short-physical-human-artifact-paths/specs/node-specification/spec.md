## MODIFIED Requirements

### Requirement: Runtime Agents discover the consumer contract from generated run-bundle controls

An Agent entering a newly initialized run bundle SHALL encounter generated root
`AGENTS.md`/`CLAUDE.md` directions to read `RUN_BUNDLE.md` first for local location and then
`deck-guide.md` for operating rules. The guide SHALL explain the consumer essentials without
referencing repo-only OpenSpec paths: parse the final failure envelope, use supported structured
`diagnostic.next`, preserve invocation argument boundaries, stop when `requires_human` is true,
do not guess omitted lineage, and never hand-edit `_generated/`. Before asking a person to inspect
current Page Image artifacts, the guide SHALL direct the Agent to rebuild the explicit Human
Navigation Path tree and cite only its short physical locators as read targets rather than control
or edit authority. The locator contains no consumer protocol, current execution fact, command
menu, or full SHA-256 storage path.

Repository-maintenance discovery for MD implementation SHALL also be present in root `AGENTS.md` and short headers of `scripts/shared/state/md_controller_reader.mjs` and `state.mjs`, pointing to `node-specification` and active deltas without duplicating field schema.

#### Scenario: New run bundle receives a CLI failure

- **WHEN** its runtime Agent follows generated entry guidance
- **THEN** it locates the bundle before reading the guide's consumer contract
- **AND** it can act on a supported diagnostic without reading repository OpenSpec files
- **AND** it stops for human-owned decisions and preserves source/generated ownership

#### Scenario: Agent asks a person to inspect Page Image artifacts

- **WHEN** the generated guidance leads an Agent to request Style Master, page-review, final, or delivery inspection
- **THEN** the Agent rebuilds the current explicit Human Navigation Path tree and cites the
  relevant short physical locators
- **AND** it does not treat a locator, display reference, or edited navigation copy as a selector,
  approval, or generated-artifact edit permission

#### Scenario: Coding Agent changes MD consumption

- **WHEN** a repository-maintenance Agent edits MD-controller/state consumption behavior
- **THEN** root and code-adjacent instructions route it to `node-specification` plus active deltas
