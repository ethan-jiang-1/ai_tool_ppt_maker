## MODIFIED Requirements

### Requirement: Structure gradient upper-strict lower-loose

Run-bundle layout SHALL follow **stricter toward the root, looser toward the leaves** (上严下松 / structure gradient): deck root admits only constitutionally named control files and first-class directories including required `_lab/`; mid-tier dirs remain whitelist-bound; a version dir admits source + `overrides/` + `_generated/` + `_scratch/` + an optional `_polish/`; `_scratch/`, `_polish/`, and `_lab/` internals are not filename-whitelisted. Temporary files SHALL sink down into `_scratch/` and SHALL NOT be placed at the deck root or in invented dirs named `_tmp/`, `backup/`, or `_bak/`. `_lab/` SHALL NOT become a version-leaf outlet or a substitute for `_scratch/`.

#### Scenario: Gradient names root strictest and scratch loosest

- **WHEN** Agent reads the structure-gradient / 上严下松 definition under this capability or its Where Map
- **THEN** the text states the deck root is the strictest layer
- **AND** version `_scratch/` is the official loose temp outlet

#### Scenario: Polish directory is admitted but not a loosening precedent

- **WHEN** an Agent reads the structure-gradient definition after this change
- **THEN** the text names `_polish/` as an optional version-leaf entry alongside `_scratch/`
- **AND** it does not admit any further invented version-root directory name

#### Scenario: Lab workspace is a required deck-root directory

- **WHEN** an Agent reads the structure-gradient definition after this change
- **THEN** the text names `_lab/` as a required deck-root first-class directory
- **AND** it does not admit `_lab/` as a version-root or `_scratch/` substitute

## ADDED Requirements

### Requirement: Lab workspace is a required non-production deck-root directory

Run-Bundle Layout SHALL require `_lab/` at the deck root as the Image2 Lab
workspace. It SHALL be present after `init` and after a missing-scaffold heal.
An empty scaffold (README, nested `.gitignore`, `fixtures/`, `runs/` with no
trials) SHALL remain valid. Layout validation SHALL NOT inspect or whitelist
filenames inside `_lab/`. No generator, validator, plan, receipt, selection,
state, delivery, probe, or generate owner SHALL read `_lab/` internals as
source, state, evidence, or production input.

Trials SHALL be partitioned under `_lab/runs/vN/trials/`. `new-version` SHALL
neither copy nor delete those trials and SHALL NOT mark them proven for the
successor. Nested `.gitignore` SHALL default-ignore prompt, PNG, and other
large trial artifacts so they do not enter Git by default.

#### Scenario: Init seeds an empty lab workspace

- **WHEN** `--init` creates a new Run Bundle
- **THEN** `deck_root/_lab/README.md`, `_lab/.gitignore`, `_lab/fixtures/`, and
  `_lab/runs/` exist
- **AND** there are no trials and generate does not require any

#### Scenario: Empty lab does not fail structure check

- **WHEN** a structure check examines a deck whose `_lab/` contains only the
  scaffold and no trials
- **THEN** it reports no violation for that empty workspace
- **AND** it does not require a proven trial before PPT flow

#### Scenario: Missing lab is repairable rather than optional forever

- **WHEN** `--check` examines an otherwise valid existing bundle whose deck
  root has no `_lab/`
- **THEN** it reports a repairable layout finding naming the required scaffold
- **AND** it does not treat absence as a permanently valid optional gap

#### Scenario: Production owners do not read lab internals

- **WHEN** files exist under `_lab/runs/vN/trials/` and generate or probe runs
- **THEN** those owners do not read the trial files
- **AND** deleting the trials leaves confirmed profile, State, and receipts
  unchanged

#### Scenario: New version does not copy trials

- **WHEN** `--new-version` copies a version whose deck `_lab/runs/vN/` has
  sealed trials
- **THEN** those trial bytes remain under the source version partition
- **AND** the successor is not given copied trials marked as its proven set
