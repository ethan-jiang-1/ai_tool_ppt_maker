## MODIFIED Requirements

### Requirement: Lab admission precedes fetch and trial writes

Before the first provider fetch, Lab SHALL, in order: confirm the argument is
an exact `3_versions/vN` after `realpath`; verify Harness binding; admit the
deck-root `_lab/` path (complete absence is allowed; every present path
component SHALL be a confined ordinary directory inside the deck, not a
symlink, file, FIFO, or device) before any scaffold write; heal or require the
empty `_lab/` scaffold; re-verify that the final `_lab/` directory is a
confined ordinary directory; require candidate, prompt, and reference inputs
to be confined regular files; reject symlink, FIFO, and device inputs; and
require schema, budget shape, fixture/credential presence, and a bounded work
record. Only after those checks MAY Lab write a plan or trial under `_lab/`.
Failure at any step SHALL hard-stop with a secret-safe owner-issued next
action and zero remote calls.

#### Scenario: Symlink fixture never reaches the network

- **WHEN** `--reference-file` points at a symlink or a path outside the deck
  root
- **THEN** Lab hard-stops before fetch and before creating a trial directory
- **AND** it does not follow the symlink or copy bytes from outside the bundle

#### Scenario: Unbound or foreign run is rejected first

- **WHEN** Lab is invoked with a path that is not exact `3_versions/vN` or that
  fails Harness binding
- **THEN** it hard-stops before reading `_lab/` as a discovery step
- **AND** it does not create a competing workspace outside the bound deck

#### Scenario: Missing scaffold is healed after binding

- **WHEN** Lab `plan` receives an exact current run whose deck otherwise binds
  and whose `_lab/` is completely absent
- **THEN** it writes the empty canonical scaffold and continues the plan
- **AND** it does not fail as unverifiable Harness identity

#### Scenario: Symlink workspace is refused before any scaffold write

- **WHEN** deck-root `_lab` is a symlink to an ordinary directory outside the
  deck and Lab `plan` is invoked on an exact run
- **THEN** the command hard-stops before creating README, `.gitignore`,
  `fixtures/`, `runs/`, a plan, or a trial
- **AND** the symlink target bytes remain unchanged
