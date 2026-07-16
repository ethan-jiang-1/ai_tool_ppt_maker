## ADDED Requirements

### Requirement: Stage 1 emits stable identity and derived position

Stage 1 SHALL parse slide blocks through the shared structured slide-document contract. Every `slide_plan.json` slide and `_prompts.json` entry SHALL retain the formal `slide_id` and include its derived 1-based `position`. Array order SHALL remain current assembly order. For newly written prompt records, the logical raw-image output SHALL be the position-independent `<slide_id>.png`; a cheap human-readable prompt twin MAY include current position in its filename.

#### Scenario: Plan exposes both concepts

- **WHEN** source block `UXGap` is physically the seventh slide
- **THEN** its plan and prompt records contain formal ID `UXGap` and `position: 7`
- **AND** its logical raw-image output does not contain `07`

#### Scenario: Reorder changes projection only

- **WHEN** unchanged slide `UXGap` moves from physical position 7 to position 3
- **THEN** Stage 1 emits `position: 3` and the same formal ID and logical output filename

### Requirement: Stage 1 blocks identity and heading invariant violations

For a canonical run-directory source, Stage 1 SHALL fail before generation when an ID is empty, a current ID or spoken key is duplicated, a slide heading number is missing or repeated, or heading numbers do not equal the continuous physical positions `01..N`. Its diagnostic SHALL identify the source slide or heading and direct heading-only drift to `ppt_flow slides normalize`. It SHALL NOT silently normalize production source.

Unique legacy ID shapes SHALL remain accepted. Strict BlockCase mnemonic validation SHALL apply when a new template/authoring or insertion path marks an ID as newly created, not retroactively reject a legacy deck. In standalone multi-input mode, heading continuity SHALL be validated independently within each input before globally deriving positions.

#### Scenario: Duplicate ID is blocking

- **WHEN** two current slide blocks declare `UXGap`
- **THEN** Stage 1 reports an error rather than a warning
- **AND** does not publish a usable plan or prompt manifest

#### Scenario: Heading drift points to normalize

- **WHEN** the fourth physical block is headed `Slide 07`
- **THEN** Stage 1 fails with the expected and observed positions
- **AND** identifies `ppt_flow slides normalize` as the deterministic repair path

#### Scenario: Legacy shape remains readable

- **WHEN** a current source contains unique legacy ID `s07_problem` at a different current position
- **THEN** Stage 1 accepts the ID as identity
- **AND** derives position solely from physical block order

### Requirement: Stage 1 preserves stable-ID inputs across ordering-only changes

Stage 1 SHALL exclude physical position, heading number, source block order, and any position-bearing prompt-twin filename from expensive generation inputs. Reordering alone SHALL leave the final assembled image prompt and other semantic generation inputs byte-equivalent for every retained slide.

#### Scenario: Reorder preserves image-generation inputs

- **WHEN** only the order and normalized heading numbers of existing slide blocks change
- **THEN** each retained ID has the same final assembled image prompt and semantic generator inputs as before
- **AND** only order-dependent cheap projections are rebuilt
