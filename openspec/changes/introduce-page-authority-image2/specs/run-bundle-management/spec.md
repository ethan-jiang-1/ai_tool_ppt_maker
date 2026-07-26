## MODIFIED Requirements

### Requirement: Fresh init seeds an explicit production mode and matching source
Both `bundle_layout --init` and `ppt_flow init`, including generic init and every active deck-type
template (`keynote`, `pitch`, `report`, and `training`), SHALL create only the new production mode
`image2-page-authority`. They SHALL accept no mode selector or the exact explicit selector
`image2-page-authority`; a legacy init mode is rejected. They SHALL seed canonical
`3_versions/v1/slide-specifications.md` with `production.pipeline: page-authority-image2-v1`,
`production.page_authority_default: framed-image2`, and `identity.scheme: mnemonic-v1`.

The seed SHALL contain Page Authority authoring guidance and no whole-page-only top-level `render`,
`RENDER MODE`, `IMAGE PROMPT`, `VISUAL ASSETS`, or HTML-first source contract. Deck-root state SHALL
seed authoritative `production_mode.by_version["3_versions/v1"].mode: image2-page-authority`; metadata
shall seed only its human-readable v1 mirror. Init SHALL not create raw images, final slides, a style
master, a PPTX/notes output, provider attempts, review evidence, or legacy production state.

#### Scenario: Fresh init uses the Page Authority default
- **WHEN** a user initializes a new run bundle without a mode selector
- **THEN** v1 state records `image2-page-authority` and source declares `page-authority-image2-v1`
- **AND** the source default is `framed-image2`

#### Scenario: Legacy init selection is rejected
- **WHEN** init receives `html-only`, `html-then-image2`, or `image2-only` as its mode selector
- **THEN** it returns the typed new-production diagnostic before writing a run bundle
- **AND** it does not create a legacy source/state pair

#### Scenario: Init remains write-bounded
- **WHEN** init completes
- **THEN** it has written only canonical source/control/state/lesson scaffolding
- **AND** no generated production or provider artifact exists

### Requirement: Golden sample first-look READMEs match current seeds
Seed/first-look coherence SHALL be proven from checked-in framework test fixtures produced in temporary
directories, not production `deck_*` or `dpt_*` data. Tests SHALL compare current root/version README
and deck-guide seeds across generic init plus every active deck-type template (`keynote`, `pitch`,
`report`, and `training`) and SHALL cover `_scratch`, `_state`, the Page Authority default seed,
Pure/Framed ownership guidance, and current Where Maps. Legacy source/state pairs are tested only as
existing-run compatibility fixtures; init SHALL not create their seeds.

#### Scenario: Seed coherence suite runs without production decks
- **WHEN** the test workspace contains no `deck_*` or `dpt_*` production data
- **THEN** fresh generic and four deck-type fixtures prove coherent Page Authority first-look seeds
- **AND** legacy compatibility fixtures do not become init templates
