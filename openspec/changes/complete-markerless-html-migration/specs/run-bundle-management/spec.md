## ADDED Requirements

### Requirement: Migration preparation confines its projected candidate

Run-bundle management SHALL recognize `_scratch/html-migration/projected-run/` as the only location written by migration preparation. The candidate tree SHALL have explicit source/control/asset, preparation/checklist, and rebuildable derived-output owners; preparation SHALL not create a loose candidate source, write the markerless source version, modify deck-root state/metadata, or reserve/publish a visible target. The existing migration preview/apply authority SHALL consume the candidate only through its confined resolver and receipt set.

When an old loose scratch candidate is present, only an explicit prepare may read it for compatibility and may copy it into an empty projected candidate. Preview/check SHALL not silently adopt, move, or delete it. A projected candidate with conflicting authored inputs, an unconfined path, a symlink escape, or an active migration apply journal SHALL fail closed before candidate replacement or target staging. Candidate-derived `_generated/` output remains rebuildable and cannot satisfy canonical target approvals, state, or delivery facts.

#### Scenario: First preparation leaves the source version untouched

- **WHEN** a valid markerless run is prepared for HTML migration
- **THEN** all created candidate source/control/asset files are descendants of `_scratch/html-migration/projected-run/`
- **AND** the source specifications, source controls, deck-root state/metadata, and visible `3_versions/vN` set are unchanged

#### Scenario: Preview does not adopt a loose legacy candidate

- **WHEN** `_scratch/html-migration/slide-specifications.md` exists but no projected candidate exists
- **THEN** preview returns preparation guidance without moving or modifying the loose file
- **AND** only explicit prepare may offer compatible import into an empty projected candidate

#### Scenario: Candidate symlink escape fails before staging

- **WHEN** a projected candidate source/control/asset path resolves outside the candidate root
- **THEN** validation fails without source mutation, hidden target creation, or visible publication

### Requirement: Topology ignores only an explicit macOS system artifact

Every `bundle_layout.mjs` topology walk that permits a system-created entry SHALL ignore only an entry whose basename is exactly `.DS_Store`. It SHALL not use a generic dotfile predicate or ignore `__pycache__`, unknown hidden children, journals, locks, reservations, or staging paths. A known lock/journal/reservation is accepted only through its owning transaction allowlist and remains visible to that owner's recovery checks; all other unexpected entries, including names beginning with `.`, SHALL be reported by the applicable topology validator.

#### Scenario: Finder metadata does not break HTML topology

- **WHEN** `.DS_Store` appears in an otherwise valid checked HTML generated or migration directory
- **THEN** bundle checking ignores that exact entry
- **AND** all non-system topology rules still run

#### Scenario: Unknown dotfile is not hidden

- **WHEN** an HTML generated owner contains `.foreign-cache`
- **THEN** bundle checking reports the unexpected hidden entry
- **AND** it does not classify it as macOS metadata

#### Scenario: Transaction owner files remain observable

- **WHEN** a migration journal or publication lock appears in a location not owned by its expected transaction
- **THEN** topology/recovery reports the ownership conflict
- **AND** it does not silently skip the file because its name begins with `.`
