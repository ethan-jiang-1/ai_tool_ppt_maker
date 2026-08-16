## MODIFIED Requirements

### Requirement: Structure gradient upper-strict lower-loose

Run-bundle layout SHALL follow **stricter toward the root, looser toward the leaves** (上严下松 / structure gradient): deck root admits only constitutionally named control files and first-class directories; mid-tier dirs remain whitelist-bound; a version dir admits source + `overrides/` + `_generated/` + `_scratch/` + an optional `_polish/`; `_scratch/` and `_polish/` internals are not filename-whitelisted. Temporary files SHALL sink down into `_scratch/` and SHALL NOT be placed at the deck root or in invented dirs named `_tmp/`, `backup/`, or `_bak/`.

#### Scenario: Gradient names root strictest and scratch loosest

- **WHEN** Agent reads the structure-gradient / 上严下松 definition under this capability or its Where Map
- **THEN** the text states the deck root is the strictest layer
- **AND** version `_scratch/` is the official loose temp outlet

#### Scenario: Polish directory is admitted but not a loosening precedent

- **WHEN** an Agent reads the structure-gradient definition after this change
- **THEN** the text names `_polish/` as an optional version-leaf entry alongside `_scratch/`
- **AND** it does not admit any further invented version-root directory name

## ADDED Requirements

### Requirement: Version-local polish directory is a human-readable non-pipeline record

Run-Bundle Layout SHALL admit an optional `_polish/` directory at the version root as the canonical
version-private, human-readable polish-trail directory. It SHALL be non-pipeline: no generator,
validator, plan, receipt, selection, state, or delivery owner SHALL read its internals as source,
state, evidence, or production input. Its contents SHALL be Markdown-first human narrative (what
was polished, why, what was decided, where the version stands); it SHALL NOT be a JSON/hash-only
record store. Its internals are not filename-whitelisted, and layout validation SHALL NOT inspect
them.

#### Scenario: A version with a polish directory passes structure check

- **WHEN** a structure check examines a version root containing `_polish/` with arbitrary `.md` files
- **THEN** it reports no violation for that entry
- **AND** it does not validate or require any filename inside `_polish/`

#### Scenario: Absence of the polish directory remains valid

- **WHEN** a version root contains no `_polish/`
- **THEN** structure check passes
- **AND** no layout operation creates or requires the directory for that existing version

#### Scenario: Polish contents carry no production authority

- **WHEN** files exist under `_polish/` and a later source edit, plan, or generation runs
- **THEN** no production owner reads those files
- **AND** editing or deleting them leaves source, state, and lifecycle evidence unchanged

#### Scenario: Non-canonical version-root names stay rejected

- **WHEN** a version root contains `_tmp/`, `backup/`, `_bak/`, or any other non-admitted entry
- **THEN** structure check still reports that entry as unexpected at version root
- **AND** its message names the complete current admitted set

### Requirement: Version-local polish directory is version-private across new-version

The `--new-version` operation SHALL neither copy `_polish/` nor create one in the successor. It
continues to copy only the canonical source delta (`slide-specifications*.md` plus `overrides/`),
so the polish trail stays with the version that produced it and the successor starts with no
polish record.

#### Scenario: A successor version starts without a polish trail

- **WHEN** `--new-version` copies a version whose root contains `_polish/`
- **THEN** the successor contains no `_polish/` entry
- **AND** the source version's `_polish/` bytes remain unchanged
- **AND** `_scratch/` and `_generated/` successor behavior is unchanged

### Requirement: A new bundle receives a version-local polish seed

Initialization of a new Run Bundle SHALL create `3_versions/v1/_polish/` containing a canonical
README that explains the directory's role and its boundary with `_scratch/` and `_lessons/`. The
seed SHALL be documentation only: it creates no state, receipt, plan, or production record.

#### Scenario: Init seeds a canonical polish directory

- **WHEN** `--init` creates a new Run Bundle
- **THEN** `3_versions/v1/_polish/README.md` exists
- **AND** it states that temp/bak goes to `_scratch/`, persistent human polish trail goes to
  `_polish/`, and reusable lessons go to `_lessons/`
- **AND** the directory contains nothing else and no lifecycle evidence

### Requirement: Polish directory boundary guidance names its distinct role

The Where Map in `reference/glossary.md` SHALL contain a `_polish/` row at the canonical path
`<run-dir>/_polish/` with the meaning "version-private human-readable polish trail; non-pipeline;
not copied across versions". Active run-bundle tree guidance SHALL name `_polish/` at the version
leaf, single-sourced from `renderTree()`. The `_scratch/` README SHALL direct persistent polish
trails to `_polish/` and keep temp/bak for itself.

#### Scenario: Boundary text separates scratch, polish, and lessons

- **WHEN** an Agent reads the `_scratch/` README, the `_polish/` README, or the Where Map
- **THEN** the READMEs together state the three-role boundary: temporary/bak → `_scratch/`,
  persistent human polish trail → `_polish/`, cross-version reusable lessons → `_lessons/`
- **AND** the Where Map names each of the three roles at its distinct canonical path
- **AND** no two of the three roles share one location
