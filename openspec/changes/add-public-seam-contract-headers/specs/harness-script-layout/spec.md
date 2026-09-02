## ADDED Requirements

### Requirement: Registered public seams carry contract headers with authority pointers

Every script file registered as a public interface by the current architecture
guard — the `PUBLIC_SHARED_INTERFACES` list and the declared stage
`index.mjs` interface lists (`00-setup`…`06-iteration`) — SHALL carry its
contract header as the file's first block comment (the first `/** … */`
block, whether it sits above or below the import statements). The contract
header SHALL contain at least one authority pointer line of the form
`Authority: openspec/specs/<capability>/spec.md`, and each referenced path
SHALL be an existing capability spec. The contract header is
a pointer card — one-line purpose, authority pointer, and interface summary —
and SHALL NOT restate requirement prose from the referenced spec; the spec
remains the sole behavior authority.

The current architecture guard SHALL verify, as part of its existing snapshot
check and driven by the same registered interface lists it already owns:
(1) header presence at the top of each registered file; (2) at least one
well-formed authority pointer; and (3) that every referenced spec path exists
on disk. The guard SHALL NOT judge header prose semantics, SHALL NOT extend
the check to unregistered internal implementation files, and SHALL NOT treat
an executable entry's header as a command inventory. A guard failure is a
deterministic `guide` outcome: the one nearest legal action is to add or
repair the header through the owning file and rerun the same checkpoint; no
human decision is required.

#### Scenario: A registered public seam lacks its contract header

- **WHEN** architecture validation inspects a registered public interface
  file whose first block comment is missing or carries no authority pointer
- **THEN** the guard fails and names that file
- **AND** after the header carries a valid pointer, rerunning the same
  check passes without any other edit

#### Scenario: An authority pointer names a nonexistent spec

- **WHEN** a contract header references
  `openspec/specs/<capability>/spec.md` for a capability spec that does not
  exist on disk
- **THEN** the guard reports the stale pointer instead of silently passing
- **AND** repairing the pointer to an existing capability spec clears the
  failure

#### Scenario: The check stays scoped to registered seams

- **WHEN** architecture validation inspects an internal implementation file
  that is not on a registered interface list
- **THEN** the guard reports no header finding for it
- **AND** the executable inventory and command inventory authorities are
  unchanged

## MODIFIED Requirements

### Requirement: Unified entry names command authorities instead of re-declaring the inventory

The unified entry `ppt_maker_harness/scripts/ppt_flow.mjs` SHALL NOT enumerate
the command inventory in prose, including its header comment, module docblock,
or any comment that presents a current command list. Its header SHALL direct
readers to the owning authorities: the entry's own `program.command(...)`
registrations, `--help` output as runtime truth, and
`ppt_maker_harness/COMMANDS.md` as the novice-facing discovery reference owned
by the `commands-reference` capability. The command surface contract guard
SHALL report a prose command-inventory declaration in the unified entry
instead of passing silently. Runtime help examples and per-command contract
blocks remain governed by their existing requirements and are not command
inventories.

#### Scenario: A maintainer opens the entry file

- **WHEN** a maintainer or Agent reads the top of `ppt_flow.mjs`
- **THEN** the header names where the command inventory lives and how to obtain
  runtime truth
- **AND** it does not list command names as a current inventory

#### Scenario: A prose command inventory is re-introduced

- **WHEN** the command surface contract guard inspects the unified entry and
  finds a comment enumerating commands as the current inventory
- **THEN** the guard reports the offending lines as a command-inventory
  re-declaration
- **AND** the check fails until the enumeration is removed

#### Scenario: A new command is registered

- **WHEN** a maintainer adds a command through the entry's existing
  registrations
- **THEN** the entry header requires no edit to remain truthful
- **AND** any human-facing command documentation update happens through the
  commands-reference owner, not through the entry header
