## MODIFIED Requirements

### Requirement: COMMANDS.md complements but does not duplicate scripts/change-classifier.md

`COMMANDS.md` SHALL remain the concise human-facing interface. The Agent's detailed decision tree SHALL move to `PPTMAKER_FRAMEWORK/scripts/05-iteration/change-classifier.md`, where its physical path identifies the Phase 5 maintenance owner. `COMMANDS.md` SHALL link to that canonical path, SHALL not duplicate nested classification logic, and SHALL remain scannable in under 60 seconds.

#### Scenario: Human reads the short command guide

- **WHEN** a human opens `COMMANDS.md`
- **THEN** natural-language examples and stable `ppt_flow` commands are visible without a nested decision tree
- **AND** detailed classification links to the Phase 5 owner path

#### Scenario: Active reference uses the old classifier path

- **WHEN** documentation coherence finds `PPTMAKER_FRAMEWORK/scripts/change-classifier.md`
- **THEN** it fails with the stale path and the canonical `05-iteration/change-classifier.md` replacement

### Requirement: Structural command guidance is preview-first and identity-aware

`COMMANDS.md` and `05-iteration/change-classifier.md` SHALL retain the shared structural UX: resolve every position selector against one pre-edit snapshot; display `position + slide_id + title`; keep formal ID stable; preview before mutation; bind apply to canonical plan hash carried by the Agent; route list/resolve/normalize/move/delete/insert/multi-operation through `ppt_flow slides`; never hand-edit or copy `_generated/`; and retain the existing version/deck/Git escape-ladder constraints. The script relocation SHALL NOT change any structural command or transaction behavior.

Structural source publication SHALL be renderer-free for both pipelines. For HTML-first, its receipt SHALL report `needs_local_materialization`; a later explicit target-local materializer verifies/copies target-owned immutable objects or composes missing/stale IDs locally, then rebuilds review/delivery with zero provider calls. For markerless legacy, verified expensive raw renders MAY be materialized and missing/unproven IDs SHALL remain `needs_render` for a separately authorized Generated Image Rebuild. Guidance SHALL never label HTML-local work as remote render debt or copy a source-version manifest path into the target.

#### Scenario: HTML insert reports local materialization

- **WHEN** a confirmed HTML-first structural transaction inserts a valid slide
- **THEN** the new source version reports that ID under `needs_local_materialization`
- **AND** a later explicit local materializer owns composition/review/delivery without remote authorization

#### Scenario: Legacy insert reports remote render debt

- **WHEN** a confirmed markerless transaction inserts an ID without verified raw render evidence
- **THEN** the source version reports that ID under `needs_render`
- **AND** requests separate authorization before Generated Image Rebuild

#### Scenario: Reorder resolves one snapshot

- **WHEN** a user deletes or moves multiple current positions
- **THEN** every selector resolves before mutation and the exact before/after ID order is previewed

#### Scenario: Major reframing remains a deck decision

- **WHEN** audience, objective, or narrative materially changes
- **THEN** guidance may recommend a new deck rather than forcing the work into vNext

#### Scenario: Git remains outside structural authority

- **WHEN** Git is absent or a user separately asks about source history
- **THEN** normal source repair/version paths remain available and no generic Git mutation is chosen automatically

#### Scenario: Path migration does not alter the public command

- **WHEN** the classifier moves under `05-iteration/`
- **THEN** the public structural invocation remains `ppt_flow slides`
- **AND** no old direct executable path is presented to the user
