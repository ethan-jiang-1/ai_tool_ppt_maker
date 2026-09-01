## ADDED Requirements

### Requirement: Repository agent-facing knowledge follows the one-fact-one-home principle

The repository SHALL maintain exactly one authoritative home for every fact about
the project's standing rules, technology choices, and directory layout. Every
other occurrence of that fact SHALL be a link or symlink to the home, never a
duplicate copy.

At the repository root specifically:
- `CLAUDE.md` SHALL be a symlink pointing to `AGENTS.md` when both exist at the
  root. A standalone `CLAUDE.md` that repeats content from `AGENTS.md` violates
  the one-home principle.
- Subtree `CLAUDE.md` files (such as `ppt_maker_harness/CLAUDE.md`) are not
  covered by this requirement — they may serve other roles (e.g., redirect to a
  different entry file) and follow their own owning capability.

#### Scenario: Root CLAUDE.md is a symlink

- **WHEN** a maintainer runs `ls -l /repo-root/CLAUDE.md`
- **THEN** it reports `/repo-root/CLAUDE.md -> /repo-root/AGENTS.md`
- **AND** the file contains no original content beyond the symlink target reference

#### Scenario: Root AGENTS.md content is not duplicated

- **WHEN** a maintainer or Agent searches for a standing rule or tech-stack fact
- **THEN** that fact appears in exactly one home (`AGENTS.md`, a subtree
  `AGENTS.md`, or an owner file linked from `AGENTS.md`)
- **AND** grepping `CLAUDE.md` for the same fact does not return a duplicate

#### Scenario: Agent accesses repo standing rules

- **WHEN** an Agent loads the repo for any task
- **THEN** it resolves `CLAUDE.md` through the symlink to `AGENTS.md`
- **AND** it reads the complete set of standing rules from `AGENTS.md` alone

### Requirement: Decision records have a readable lifecycle status

Every entry in `docs/adr/` SHALL carry a `## Status:` line using exactly one of the
following controlled values: `Proposed`, `Accepted`, `Superseded`, `Rejected`,
`Archived`. The status SHALL appear within the file's first 5 lines, preceded by
`## ` (for example, `## Status: Accepted`).

The meaning of each status:
- `Proposed`: under consideration, not yet agreed
- `Accepted`: current active decision
- `Superseded`: replaced by a later ADR
- `Rejected`: considered and declined; negative knowledge
- `Archived`: historical, no longer relevant

An Agent reading a decision record SHALL rely on this status line to distinguish
current from historical or rejected decisions.

#### Scenario: ADR status is machine-readable

- **WHEN** an Agent reads any file under `docs/adr/`
- **THEN** it finds a `## Status:` line within the first 5 lines
- **AND** the value is exactly one of the five controlled terms

#### Scenario: Rejected decision is not treated as current

- **WHEN** an Agent encounters a decision record with `## Status: Rejected`
- **THEN** it treats it as negative knowledge (why a path was not taken)
- **AND** it does not propose implementing that rejected approach unless new
  evidence explicitly reopens the question

### Requirement: Negative knowledge has a documented home

The repository SHALL maintain one file that records known limitations and
rejected design paths. This file SHALL live at `docs/known-limitations.md` and
serve as the home for all negative knowledge — decisions actively rejected,
capabilities explicitly out of scope, and infrastructure paths that were
considered and declined.

Each entry SHALL specify:
- What was considered or requested
- Why it was rejected or is a known limitation
- The date or context of the decision

This requirement SHALL NOT block the addition of negative knowledge at other
homes (such as in code comments or inline ADR notes). It establishes one
guaranteed home for discovery.

#### Scenario: Agent discovers rejected paths

- **WHEN** an Agent encounters a user suggestion that matches a known rejected
  approach
- **THEN** it can find that rejection in `docs/known-limitations.md`
- **AND** it explains why the path was declined rather than silently revisiting it

#### Scenario: New negative knowledge is recorded

- **WHEN** a maintainer rejects a design path during an OpenSpec change
- **THEN** they add an entry to `docs/known-limitations.md`
- **AND** the entry includes what was considered and why it was rejected