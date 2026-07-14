## MODIFIED Requirements

### Requirement: WORKFLOW.md describes the complete agent process

`charter/WORKFLOW.md` SHALL document: the 5-Phase overview table (Phase name, purpose, gate, agent role); the three English canonical artifact-refresh paths with Stage mappings and estimated durations; the separate Structural Versioning Path which creates a clean version before affected slides use refresh paths; the agent entry sequence; and the gate checkpoint mechanism. It SHALL provide one compatibility mapping from Header Text & Style Refresh / Generated Image Rebuild / Notes-Only Refresh to their former Chain A/B/C aliases, and SHALL NOT present Structural Versioning Path as a fourth peer refresh chain.

#### Scenario: Agent reads workflow to understand process structure

- **WHEN** an agent reads `charter/WORKFLOW.md`
- **THEN** it understands the Phase order (00→01→02→03→04→05)
- **AND** it knows each Phase's purpose and which gate must pass
- **AND** it can distinguish structural version creation from the three downstream artifact-refresh paths

### Requirement: Active constitutional guidance matches current runtime behavior

All active root, charter, workflow, reference, playbook, scripts README, template guidance, and `openspec/config.yaml` context SHALL agree that Stage 2 is implemented inside `PPTMAKER_FRAMEWORK/scripts/`, new decks default to the current render policy, title edits branch by resolved render mode, generated-image rebuilding uses forced selected regeneration plus required review, structural changes create a clean version before affected-page refresh, and versions copy downstream source deltas rather than generated artifacts. Historical descriptions MAY remain only in explicitly historical documents.

#### Scenario: External skill path appears in active guidance

- **WHEN** the coherence test scans active framework guidance
- **THEN** no active document prescribes `image2-ppt`, `.claude/skills`, or `.agents/skills` as the production Stage 2 path

#### Scenario: Refresh-path summary is render-aware

- **WHEN** an active summary table describes title/kicker/subtitle changes
- **THEN** it distinguishes resolved `body+header-lock` Header Text & Style Refresh from resolved `full-page` Generated Image Rebuild
- **AND** it does not use a bare legacy alias as the execution explanation

#### Scenario: Version semantics are consistent

- **WHEN** an active document describes `--new-version`
- **THEN** it states that downstream source delta is copied and `_generated/` is clean
- **AND** it describes subsequent affected-slide work through the applicable refresh path
- **AND** it does not call the operation a complete deck-directory copy

#### Scenario: Generated image rebuild is force-aware

- **WHEN** active guidance documents rebuilding an existing selected image through raw `unified_pipeline`
- **THEN** it includes `--force-images` with `--only <ids>`
- **AND** it does not claim raw `--only` implies force

## ADDED Requirements

### Requirement: Editing-path terminology uses English canonical names and controlled legacy aliases

The English names Header Text & Style Refresh, Generated Image Rebuild, Notes-Only Refresh, and Structural Versioning Path SHALL be the only canonical editing-path names. Chinese guidance MAY provide a Chinese explanatory gloss when introducing an English term, but the gloss SHALL NOT be treated as a second formal name.

Active definitions SHALL explain that Header Text & Style Refresh changes resolved `body+header-lock` KICKER/TITLE/SUBTITLE text and Stage-3-owned overlay typography/layout only while the raw-image contract remains unchanged. Header safe-zone geometry, render-mode switches, generated body content, and other raw-image-contract changes SHALL be classified as Generated Image Rebuild.

Legacy Chain A/B/C/Structural aliases SHALL appear only in exact compatibility registries (`charter/WORKFLOW.md`, `reference/glossary.md`, `scripts/change-classifier.md`, `openspec/config.yaml`, and governing capability requirements) where every legacy occurrence is paired with the canonical English term in the same definition, sentence, or table row, or in historical records. Registry membership SHALL NOT permit legacy-only operational prose elsewhere in the same file. Other active operational guidance, playbooks, templates, tests, and code comments SHALL use canonical English terms or descriptive natural-language intent without bare legacy aliases.

#### Scenario: New maintainer learns the canonical vocabulary

- **WHEN** a new maintainer opens `charter/WORKFLOW.md` and its linked glossary or classifier
- **THEN** they see the three refresh-path names and Structural Versioning Path in English
- **AND** they can look up each former alias in one explicit compatibility mapping
- **AND** they understand that the letters are historical labels rather than acronyms

#### Scenario: Operational guidance has completed the migration

- **WHEN** coherence validation scans an active playbook, workflow example, template, test description, or code comment outside the compatibility registry
- **THEN** a bare editing-chain alias is reported as terminology drift
- **AND** an English canonical term is accepted

#### Scenario: Registry alias is paired locally

- **WHEN** a compatibility registry contains a former Chain A/B/C/Structural alias
- **THEN** the same definition, sentence, or table row contains the corresponding canonical English name
- **AND** a legacy-only operational example elsewhere in that registry file is rejected

#### Scenario: Unrelated A/B/C choices are not editing-chain aliases

- **WHEN** migrate/import guidance presents local strategy choices named A/B/C without the words Chain, 链, or an editing-path stage mapping
- **THEN** terminology validation does not flag those choices
