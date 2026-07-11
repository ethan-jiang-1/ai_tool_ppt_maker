## MODIFIED Requirements

### Requirement: Directory strictness increases toward the deck root

`charter/CONSTITUTION.md` and `charter/AGENT_CONTRACT.md` SHALL **mirror** the structure gradient defined by capability `run-bundle-layout` (上严下松): state that the deck root is the strictest layer, that version `_scratch/` is the loose outlet for temp backups, and that agents MUST NOT invent `_tmp/` / `backup/` / `_bak/` or litter the deck root. Charter documents SHALL NOT own the run-bundle folder ontology and SHALL NOT redefine soft-bundle layout (`framework-directory-layout`).

#### Scenario: Constitution states upper-strict lower-loose

- **WHEN** a developer or agent reads CONSTITUTION or AGENT_CONTRACT directory rules
- **THEN** the docs state that the deck root is the strictest layer and version `_scratch/` is the loose outlet for temp backups

#### Scenario: Contract forbids deck-root litter

- **WHEN** Agent needs to backup `slide-specifications.md` before a rewrite
- **THEN** AGENT_CONTRACT directs the backup into `3_versions/v{n}/_scratch/`
- **AND** forbids leaving the bak at the deck root

### Requirement: CONSTITUTION tree includes version _scratch

`charter/CONSTITUTION.md` run-bundle tree SHALL **mirror** `run-bundle-layout` by including `3_versions/v{n}/_scratch/` with a short purpose note (temp/bak for this version; not SSOT; deletable). The snapshot remains human-readable; `renderTree()` remains code authority.

#### Scenario: Constitution tree lists _scratch

- **WHEN** Agent reads the canonical tree in CONSTITUTION.md
- **THEN** `_scratch/` appears under the version directory

## ADDED Requirements

### Requirement: BOOTSTRAP directs GREP-before-invent for placement

`PPTMAKER_FRAMEWORK/BOOTSTRAP.md` directory-constitution section SHALL instruct: when unsure where to place a file, GREP canonical tokens and consult `reference/glossary.md` Where Map (owned by `run-bundle-layout`) **before** creating ad-hoc directories or dumping files at the deck root. BOOTSTRAP SHALL mention at least `_scratch`, `_generated`, and `style_master` (or `contact_sheet` / `pilot`) as example keys. BOOTSTRAP SHALL NOT paste a second full Where Map table.

#### Scenario: BOOTSTRAP names the grep loop

- **WHEN** Agent reads BOOTSTRAP directory-constitution rules
- **THEN** the text directs GREP / Where Map lookup before inventing placement
- **AND** links or names `reference/glossary.md`

### Requirement: AGENTS Phase 0 tree lists _scratch with glossary-aligned labels

`PPTMAKER_FRAMEWORK/AGENTS.md` Phase 0 run-bundle tree SHALL include `3_versions/v{n}/_scratch/` with English role labels aligned with the Where Map (temp/bak; not SSOT; not deck root), consistent with `renderTree()`.

#### Scenario: Phase 0 tree shows _scratch

- **WHEN** Agent reads the Phase 0 run-bundle tree in AGENTS.md
- **THEN** `_scratch/` appears under the version directory with a temp/bak purpose note
