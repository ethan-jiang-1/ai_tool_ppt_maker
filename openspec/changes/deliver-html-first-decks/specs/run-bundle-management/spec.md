## MODIFIED Requirements

### Requirement: Init creates assets directory skeleton with stub manifest

`initBundle()` SHALL create `2_backbone/visual-style/assets/` with `svg/`, `reference/`, and `icons/` directories, README, and an empty HTML-first v2 `asset-manifest.yaml` containing exactly `version: 2` and `assets: {}`. The README SHALL explain v2 ID/SHA registration and binding through structured `primary_visual.fallback` or typed-block icon IDs; it SHALL NOT direct new decks to legacy `VISUAL ASSETS` fields. The directory remains optional for old decks, and a markerless legacy deck with no assets directory or a present v1 manifest SHALL remain valid under legacy semantics.

#### Scenario: Fresh init creates v2 catalog skeleton

- **WHEN** `initBundle()` scaffolds a new deck
- **THEN** the assets directories and empty version-2 manifest exist
- **AND** the README describes structured asset-ID binding

#### Scenario: Old deck without assets remains valid

- **WHEN** a legacy deck predates the asset directory
- **THEN** structure validation does not require one

#### Scenario: Legacy v1 manifest is not silently upgraded

- **WHEN** an existing markerless deck has a v1 manifest
- **THEN** init/check/heal preserves its legacy meaning
- **AND** does not rewrite it without an explicit migration transaction

## ADDED Requirements

### Requirement: Fresh init defaults to a locally deliverable HTML-first source

Both `bundle_layout --init` and `ppt_flow init` SHALL seed canonical `3_versions/v1/slide-specifications.md` authoring controls with `production.pipeline: html-first-v1`, `identity.scheme: mnemonic-v1`, the exact structured-body/family guidance owned by `html-slide-contract`, and no legacy top-level `render`, `RENDER MODE`, `IMAGE PROMPT`, or `VISUAL ASSETS`. The seeded visual configuration SHALL include a valid `html_first` projection. Init SHALL not create style master, page prompts, legacy image/header outputs, HTML production outputs, or Image2 refinement paths/state.

#### Scenario: Fresh init selects HTML without asking for renderer

- **WHEN** a user initializes a new run bundle
- **THEN** its canonical source explicitly selects `html-first-v1`
- **AND** subsequent intake does not need to choose a render engine

#### Scenario: Init remains write-bounded

- **WHEN** init completes
- **THEN** it has written only canonical source/control/state/lesson scaffolding
- **AND** no generated production or provider artifact exists

### Requirement: Bundle checks are pipeline-aware without mutating existing decks

`checkBundle()` SHALL inspect the canonical source marker before applying pipeline-specific required/forbidden generated and control rules. Structure-only checks SHALL remain tolerant of absent state/assets on historical decks as already specified. Check/heal SHALL never insert a marker, rewrite legacy source, create generated directories, or migrate a deck merely to make validation pass.

#### Scenario: Existing markerless deck is checked

- **WHEN** a legacy deck is validated after the default switch
- **THEN** legacy-compatible structure rules apply
- **AND** no HTML marker or directory is created

### Requirement: Explicit legacy-to-HTML migration publishes a clean version atomically

Run-bundle management SHALL expose a preview/apply transaction that accepts a complete version-local candidate source/control delta, validates and renders it locally, produces a source diff/full comparison/exact plan hash, and on confirmed apply copies it into a hidden vNext, revalidates/rerenders that real target, then atomically publishes the visible version. It SHALL not modify the legacy version, infer structured bodies from prompts, copy legacy generated artifacts, or inherit provider authorization.

#### Scenario: User accepts the complete comparison

- **WHEN** preview produced a current exact plan and the user confirms its hash
- **THEN** apply publishes one clean HTML-first vNext with current local delivery artifacts
- **AND** leaves the legacy version unchanged

#### Scenario: Candidate or control drifts after preview

- **WHEN** any candidate/source/control/asset receipt changes before apply
- **THEN** apply fails without a visible new version
- **AND** requires a new preview and human comparison
