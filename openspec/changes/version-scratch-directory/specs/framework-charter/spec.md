## ADDED Requirements

### Requirement: BOOTSTRAP directs GREP-before-invent for placement

`PPTMAKER_FRAMEWORK/BOOTSTRAP.md` directory-constitution section SHALL instruct: when unsure where to place a file, GREP canonical tokens and consult `reference/glossary.md` Where Map **before** creating ad-hoc directories or dumping files at the deck root. BOOTSTRAP SHALL mention at least `_scratch`, `_generated`, and `style_master` (or `contact_sheet` / `pilot`) as example search keys and SHALL point at the glossary Where Map. BOOTSTRAP SHALL still state structure gradient (上严下松) and that version temp/bak belongs under `3_versions/v{n}/_scratch/`. BOOTSTRAP SHALL NOT paste a second full Where Map table (Where Map SSOT lives under capability `run-bundle-layout` / glossary).

#### Scenario: BOOTSTRAP names the grep loop

- **WHEN** Agent reads BOOTSTRAP directory-constitution rules
- **THEN** the text directs GREP / Where Map lookup before inventing placement
- **AND** links or names `reference/glossary.md`

### Requirement: AGENTS Phase 0 tree lists _scratch with glossary-aligned labels

`PPTMAKER_FRAMEWORK/AGENTS.md` Phase 0 run-bundle tree SHALL include `3_versions/v{n}/_scratch/` and annotate it with English role language aligned with the glossary Where Map (temp/bak; not SSOT; not deck root). The tree SHALL remain consistent with `bundle_layout.mjs` `renderTree()` regarding `_scratch/`.

#### Scenario: Phase 0 tree shows _scratch

- **WHEN** Agent reads the Phase 0 run-bundle tree in AGENTS.md
- **THEN** `_scratch/` appears under the version directory with a temp/bak purpose note

### Requirement: Charter mirrors run-bundle-layout (does not own ontology)

`charter/CONSTITUTION.md` and `charter/AGENT_CONTRACT.md` SHALL mirror the run-bundle structure gradient and `_scratch/` outlet defined by capability `run-bundle-layout` / `bundle_layout.mjs`. CONSTITUTION tree SHALL include `3_versions/v{n}/_scratch/` with a short purpose note. AGENT_CONTRACT SHALL direct version-scoped bak into `_scratch/` and forbid deck-root litter. These documents SHALL NOT redefine soft-bundle (`PPTMAKER_FRAMEWORK/`) layout; that remains `framework-directory-layout`.

#### Scenario: Constitution states upper-strict lower-loose

- **WHEN** a developer or agent reads CONSTITUTION or AGENT_CONTRACT directory rules
- **THEN** the docs state that the deck root is the strictest layer and version `_scratch/` is the loose outlet for temp backups

#### Scenario: Constitution tree lists _scratch

- **WHEN** Agent reads the canonical tree in CONSTITUTION.md
- **THEN** `_scratch/` appears under the version directory
