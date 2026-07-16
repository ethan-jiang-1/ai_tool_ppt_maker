## ADDED Requirements

### Requirement: Active framework guidance separates slide identity from order

Active root, charter, workflow, reference, scripts README, slide-template, and authoring guidance SHALL consistently define formal `slide_id` as stable page identity and physical slide-block order as the source of derived 1-based `position`. Human-facing examples SHALL display `position + slide_id + title` and SHALL explain that current position remains convenient for conversation while formal ID remains valid across insert, delete, reorder, title edit, and render-engine changes. No active guidance SHALL describe a compound value such as `07_UXGap`, a PowerPoint XML ID, or a position-prefixed filename as the source identity.

New-page guidance SHALL require an Agent-authored `SUBJECT + MOVE` BlockCase mnemonic containing only ASCII letters: five letters preferred and six accepted when clearer, with examples such as `UXGap` and `AICost`. It SHALL reject one-word page categories, embedded page numbers, random tokens, and forced consonant compression as authoring strategies. Existing unique legacy IDs SHALL be described as stable compatibility identities that ordinary structural editing does not silently migrate.

Guidance SHALL state that expensive render identity is keyed by stable slide ID, engine, and generation fingerprint rather than position; `_generated/` remains framework-owned and any cross-version reuse is verified materialization, never manual copying or editing.

#### Scenario: Agent authors a new deck

- **WHEN** active template or authoring guidance asks the Agent to choose slide IDs
- **THEN** it requests a durable two-block mnemonic independent of current position and title wording
- **AND** prefers a clear six-letter form over an unreadable five-letter compression

#### Scenario: Existing deck still has numbered IDs

- **WHEN** guidance discusses a legacy ID such as `s07_problem` after it moves
- **THEN** it displays the current position separately and treats the old ID as stable compatibility text
- **AND** does not instruct ordinary reorder to rename every legacy ID

#### Scenario: Structural path documentation agrees on reuse

- **WHEN** active workflow or charter guidance describes reorder/delete-only work
- **THEN** it says verified expensive artifacts may be materialized into the clean next version while order-dependent outputs are rebuilt
- **AND** it preserves the prohibitions on hand-editing or manually copying `_generated/`

#### Scenario: Dual-render guidance consumes one identity model

- **WHEN** active guidance mentions future multiple render engines
- **THEN** it uses `(slide_id, render_engine, generation_fingerprint)` as logical artifact identity
- **AND** does not define an engine-specific slide ID or ordering model
