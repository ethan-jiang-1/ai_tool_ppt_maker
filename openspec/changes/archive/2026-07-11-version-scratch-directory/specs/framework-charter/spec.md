## ADDED Requirements

### Requirement: Directory strictness increases toward the deck root

Run-bundle layout SHALL follow the constitutional gradient **stricter toward the root, looser toward the leaves** (上严下松): the deck root admits only constitutionally named control files and first-class directories; mid-tier dirs (`1_upstream_raw_material/`, `2_backbone/`) remain whitelist-bound; a version dir admits source + `overrides/` + `_generated/` + `_scratch/`; `_scratch/` internals are not filename-whitelisted. Agents SHALL NOT invent sibling temp dirs (`_tmp/`, `backup/`, `_bak/`) or place version-scoped backups at the deck root. This gradient SHALL be stated in `charter/CONSTITUTION.md` and `charter/AGENT_CONTRACT.md`.

#### Scenario: Constitution states upper-strict lower-loose

- **WHEN** a developer or agent reads CONSTITUTION or AGENT_CONTRACT directory rules
- **THEN** the docs state that the deck root is the strictest layer and version `_scratch/` is the loose outlet for temp backups

#### Scenario: Contract forbids deck-root litter

- **WHEN** Agent needs to backup `slide-specifications.md` before a rewrite
- **THEN** AGENT_CONTRACT directs the backup into `3_versions/v{n}/_scratch/`
- **AND** forbids leaving the bak at the deck root

### Requirement: CONSTITUTION tree includes version _scratch

`charter/CONSTITUTION.md` run-bundle tree SHALL include `3_versions/v{n}/_scratch/` with a short purpose note (temp/bak for this version; not SSOT; deletable).

#### Scenario: Constitution tree lists _scratch

- **WHEN** Agent reads the canonical tree in CONSTITUTION.md
- **THEN** `_scratch/` appears under the version directory
