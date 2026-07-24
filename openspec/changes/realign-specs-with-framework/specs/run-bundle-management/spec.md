## MODIFIED Requirements

### Requirement: Fresh init seeds an explicit production mode and matching source
Both `bundle_layout --init` and `ppt_flow init`, including generic init and every active deck-type template (`keynote`, `pitch`, `report`, and `training`), SHALL accept one exact mode `html-only|html-then-image2|image2-only` and SHALL default an omitted mode to `image2-only`. They SHALL seed canonical `3_versions/v1/slide-specifications.md` with a direct source marker that matches the selected mode: `html-only` and `html-then-image2` use `production.pipeline: html-first-v1`, while `image2-only` uses `production.pipeline: whole-page-image2-v1`. Every new source SHALL use `identity.scheme: mnemonic-v1`.

HTML seeds SHALL retain the exact structured-body/family guidance owned by `html-slide-contract`, no legacy top-level `render`, `RENDER MODE`, `IMAGE PROMPT`, or `VISUAL ASSETS`, and a valid `html_first` visual projection. The Image2-primary seed SHALL contain the current whole-page Image2 authoring and render-mode controls needed by Stage 1 while presenting them as a first-class production source rather than a compatibility downgrade.

Deck-root state SHALL seed authoritative `production_mode.by_version["3_versions/v1"].mode`; metadata SHALL seed only the human-readable mode/v1 mirror. Mode-owned gate mirrors SHALL begin pending and SHALL not authorize delivery. Init SHALL not create style-master output, page images, headers, HTML output, PPTX/notes output, provider attempts, or modern refinement state.

#### Scenario: Fresh init uses the release default
- **WHEN** a user initializes a new run bundle without `--mode`
- **THEN** v1 state records `image2-only` and source declares `production.pipeline: whole-page-image2-v1`
- **AND** the result reports mode, pipeline, and Image2-primary next action

#### Scenario: User explicitly selects html-only
- **WHEN** init receives `--mode html-only`
- **THEN** it seeds the local HTML-first source and an authoritative `html-only` v1 mode
- **AND** it creates no refinement completion obligation

#### Scenario: Fresh init selects HTML without asking for renderer
- **WHEN** init receives the already selected `--mode html-only`
- **THEN** its source explicitly selects `html-first-v1` and intake does not ask for another renderer choice

#### Scenario: User explicitly selects html-then-image2
- **WHEN** init receives `--mode html-then-image2`
- **THEN** it seeds the same HTML-first source contract with a required-refinement mode record
- **AND** no provider plan or authorization is created during init

#### Scenario: Fresh init separates gate mirrors
- **WHEN** any mode initializes v1
- **THEN** state contains the routing authority and metadata contains only the v1 display mirror
- **AND** no mirror or pending gate authorizes production

#### Scenario: Init remains write-bounded
- **WHEN** init completes
- **THEN** it has written only canonical source/control/state/lesson scaffolding
- **AND** no generated production or provider artifact exists

## REMOVED Requirements

### Requirement: Explicit legacy-to-HTML migration publishes a clean version atomically
**Reason**: The historical migration transaction, old-side modes, and receipt handoff are removed.

**Migration**: Use the current cross-pipeline production-mode transition for a valid explicit run.

### Requirement: Migration preparation confines its projected candidate
**Reason**: The `_scratch/html-migration/projected-run/` candidate is no longer supported.

**Migration**: Current candidate confinement remains owned by `_scratch/production-mode-transition/`.
