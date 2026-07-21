## MODIFIED Requirements

### Requirement: COMMANDS documents explicit legacy migration without automatic conversion

COMMANDS SHALL route a user's explicit migration choice to `migrate-import`, where the Agent selects an existing preset from the user's authorized visual direction and runs `ppt_flow migrate-html <source-run-dir> prepare --preset <name>`.  It SHALL explain that prepare creates only the isolated projected candidate, deterministic control/asset scaffold, palette, and per-slide checklist; the Agent then authors every structured `SLIDE BODY` and other semantic fields before preview. COMMANDS SHALL not claim that prompt prose was automatically converted or that the user must hand-create deterministic palette/state/asset files.

COMMANDS SHALL describe `migrate-html preview` as a read-only guide when preparation or authoring is incomplete, followed by a complete proposed local HTML deck/contact sheet, exact `verified-current|degraded-missing|degraded-stale` old-side mode, exact mode/hash confirmation, and atomic apply when the candidate is complete. Only verified-current mode may show old pixels. It SHALL state that degraded modes show diagnosis/placeholder rather than stale bytes, never trigger migration provider calls or a parity claim, and offer separately authorized legacy maintenance when needed. It SHALL preserve the legacy version on decline, preserve authored candidate work during guide responses, and never direct a user to edit `_generated/`, state, a journal, or a lock manually.

#### Scenario: User asks to migrate an old deck

- **WHEN** a markerless deck user explicitly requests HTML migration
- **THEN** COMMANDS routes through prepare, Agent authoring, complete proposed output, and explicit current-old or degraded-old comparison confirmation before new-version publication
- **AND** preserves the old version as a valid fallback

#### Scenario: Candidate needs authoring after preparation

- **WHEN** preview reports `authoring_required`
- **THEN** COMMANDS directs the Agent to complete only the named structured candidate fields and rerun preview
- **AND** does not suggest copying IMAGE PROMPT prose into a body or deleting scratch files
