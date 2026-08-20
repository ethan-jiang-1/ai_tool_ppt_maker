## MODIFIED Requirements

### Requirement: Authority-carrying run operations require a current Harness binding

A missing, malformed, conflicting, or retired-root-named locator is a
`hard-stop` protecting the exact Deck-to-Harness identity invariant. Its direct
source of record is the locator itself and the diagnostic SHALL return the
nearest safe action: explicitly reconstruct a new current Bundle rather than
converting the old one. Every run-scoped operation that reads or mutates source,
state, or production authority SHALL verify the card at its derived Deck root
through the shared declared-current locator evaluator before its owner logic runs. It SHALL
not write a locator, state, receipt, generated artifact, migration record,
fallback root, or alternate projection.

Complete absence of deck-root `_lab/` SHALL NOT by itself make that identity
unverified. The locator evaluator SHALL remain read-only and SHALL NOT create
`_lab/`. When `_lab` exists as a file, symlink, or other non-ordinary
directory, binding SHALL remain a hard-stop protecting an unverifiable deck
root. Layout `--check` still reports complete `_lab/` absence as a repairable
layout finding under `run-bundle-layout` / the Lab-heal owner; that finding is
not an identity hard-stop.

`bundle_layout --check --structure-only` SHALL remain a layout-only,
non-authoritative observation. It MAY report an old or locatorless tree, but it
SHALL not select a run, read state, inspect production readiness, authorize
work, or write.

#### Scenario: An undeclared Bundle is used by a run operation

- **WHEN** a run-scoped command derives a Deck root whose card uses a retired
  undeclared schema or retired root fields
- **THEN** it returns the bounded unsupported-binding hard-stop before
  production, provider, generated-artifact, or state work
- **AND** it offers neither waiver nor automatic migration

#### Scenario: A structure-only check observes an undeclared tree

- **WHEN** `bundle_layout --check --structure-only` is given a locatorless or
  undeclared Bundle
- **THEN** it may report only the Bundle's filesystem layout without mutation
- **AND** it does not establish a current binding or continuation authority

#### Scenario: Complete Lab absence is not identity unverified

- **WHEN** a Deck card otherwise verifies the local PPT Maker Harness identity
  and deck-root `_lab/` is completely absent
- **THEN** Harness binding resolves
- **AND** it does not treat that absence alone as an unverifiable deck root

#### Scenario: Unsafe Lab path remains identity unverified

- **WHEN** deck-root `_lab` exists as a file, a symlink, or another
  non-ordinary directory
- **THEN** Harness binding hard-stops as an unverifiable deck root
- **AND** it does not classify that shape as complete absence

### Requirement: Mutating exact-run owners heal a missing Lab workspace scaffold

When an existing Run Bundle is missing `_lab/`, the shared run-bundle layout
owner SHALL mechanically create the same empty scaffold that `init` writes
(README, nested `.gitignore`, `fixtures/`, `runs/`) as a guide-class heal.
The heal SHALL be invoked from `initBundleForDraft`'s existing deck-root
directory seed (the mkdir + `_DIR_READMES` loop that already creates `_state/`
and `_lessons/`) and from the Lab CLI after a resolved Harness binding and
before Lab writes a plan or trial. It SHALL NOT be owned by
`ensureStateDirHints` or by generate, probe, or authorize. Generate, probe, and
authorize SHALL NOT become Lab-scaffold writers. The heal SHALL NOT invent
trials, copy `_scratch/`, write profile or State, or block generate. `--check`
SHALL report missing `_lab/` as repairable layout rather than a
forever-optional absence or a non-bypassable identity hard-stop.

#### Scenario: Init seed or Lab CLI creates the empty scaffold

- **WHEN** an otherwise valid existing bundle lacks `_lab/` and init's
  deck-root seed loop or Lab CLI runs
- **THEN** that owner writes the empty Lab scaffold before continuing
- **AND** generate still does not read or create `_lab/` and still uses the
  confirmed Call Shape

#### Scenario: Check names missing lab as repairable

- **WHEN** `--check` inspects an exact run whose deck root has no `_lab/`
- **THEN** it reports a repairable layout finding
- **AND** it does not treat the bundle as permanently optional-without-lab or
  as a foreign protocol

#### Scenario: Lab CLI heal is reachable after resolved binding

- **WHEN** an otherwise valid existing bundle lacks `_lab/` and Lab is invoked
  on an exact current run
- **THEN** Harness binding resolves and Lab writes the empty scaffold before
  any plan or trial write
- **AND** generate, probe, and authorize still neither read nor create `_lab/`
