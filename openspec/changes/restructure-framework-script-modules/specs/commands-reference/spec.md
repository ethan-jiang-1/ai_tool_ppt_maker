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

#### Scenario: User asks to move slide five to slide two

- **WHEN** the Agent classifies the request using the Phase 5 classifier
- **THEN** it resolves position 5 to the current stable `slide_id`
- **AND** previews an exact hash-bound transaction before apply

#### Scenario: Path migration does not alter the public command

- **WHEN** the classifier moves under `05-iteration/`
- **THEN** the public structural invocation remains `ppt_flow slides`
- **AND** no old direct executable path is presented to the user
