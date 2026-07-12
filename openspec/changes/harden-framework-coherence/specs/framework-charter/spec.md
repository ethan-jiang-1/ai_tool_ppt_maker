## ADDED Requirements

### Requirement: Framework hierarchy terminology is canonical

Active framework documents and `openspec/config.yaml` SHALL distinguish four hierarchy terms: Lifecycle Phase 0–4, Method Module 00–05, Pipeline Stage 1–5, and Playbook Node. Documents SHALL NOT describe workflow directory numbers as a second lifecycle Phase sequence or use incompatible phase counts for the same end-to-end process.

#### Scenario: Reader compares entry and workflow documents

- **WHEN** a reader opens BOOTSTRAP, AGENT_CONTRACT, WORKFLOW, workflow/README, and openspec/config.yaml
- **THEN** the same four hierarchy terms and meanings are used
- **AND** the reader can distinguish lifecycle order from methodology folder order and production stages

### Requirement: Active constitutional guidance matches current runtime behavior

All active root, charter, workflow, reference, playbook, scripts README, template guidance, and `openspec/config.yaml` context SHALL agree that Stage 2 is implemented inside `PPTMAKER_FRAMEWORK/scripts/`, new decks default to the current render policy, title edits branch by resolved render mode, and versions copy downstream source deltas rather than generated artifacts. Historical descriptions MAY remain only in explicitly historical documents.

#### Scenario: External skill path appears in active guidance

- **WHEN** the coherence test scans active framework guidance
- **THEN** no active document prescribes `image2-ppt`, `.claude/skills`, or `.agents/skills` as the production Stage 2 path

#### Scenario: Edit-chain summary is render-aware

- **WHEN** an active summary table describes title/kicker/subtitle changes
- **THEN** it distinguishes `body+header-lock` Chain A from `full-page` Chain B

#### Scenario: Version semantics are consistent

- **WHEN** an active document describes `--new-version`
- **THEN** it states that downstream source delta is copied and `_generated/` is clean
- **AND** it does not call the operation a complete deck-directory copy
