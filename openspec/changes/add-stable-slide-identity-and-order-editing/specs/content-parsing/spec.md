## ADDED Requirements

### Requirement: Stage 1 emits stable identity and derived position

Stage 1 SHALL parse slide blocks through the shared structured slide-document contract. Every `slide_plan.json` slide and `_prompts.json` entry SHALL retain the formal `slide_id` and include its derived 1-based `position`. Array order SHALL remain current assembly order. For newly written prompt records, the logical raw-image output SHALL be the position-independent `<slide_id>.png`; a cheap human-readable prompt twin MAY include current position in its filename. New template/init sources SHALL declare `identity.scheme: mnemonic-v1` in leading frontmatter; Stage 1 SHALL preserve and project that supported identity scheme without creating a second order source.

#### Scenario: Plan exposes both concepts

- **WHEN** source block `UXGap` is physically the seventh slide
- **THEN** its plan and prompt records contain formal ID `UXGap` and `position: 7`
- **AND** its logical raw-image output does not contain `07`

#### Scenario: Reorder changes projection only

- **WHEN** unchanged slide `UXGap` moves from physical position 7 to position 3
- **THEN** Stage 1 emits `position: 3` and the same formal ID and logical output filename

### Requirement: Stage 1 blocks identity and heading invariant violations

For a canonical run-directory source, Stage 1 SHALL fail before generation when an ID is empty, a current ID or spoken key is duplicated, a slide heading number is missing or repeated, or heading numbers do not equal the continuous physical positions `01..N`. Any level-2 heading that begins like a slide heading but does not match canonical slide grammar SHALL also fail rather than become epilogue. Its diagnostic SHALL identify the source slide or heading and direct heading-only drift to `ppt_flow slides normalize`. It SHALL NOT silently normalize production source.

When the reserved top-level `identity` key is present, it SHALL be a mapping whose only allowed key is `scheme`, and `scheme` SHALL equal `mnemonic-v1`; malformed type, duplicate/unknown nested key, missing/empty scheme, or unsupported scheme SHALL fail loudly. Under `mnemonic-v1`, every current ID SHALL satisfy the 5–8 ASCII-letter, exactly-two-block BlockCase syntax owned by `slide-identity-and-ordering`. Without the marker, unique legacy ID shapes SHALL remain accepted. Strict mnemonic validation SHALL still apply to every ID supplied by a new template/authoring or insertion path, not retroactively reject retained IDs in a legacy deck or automatically add the all-ID marker to a mixed-ID target. In standalone multi-input mode, heading continuity SHALL be validated independently as `01..N` within each input before globally deriving positions from input order and block order.

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

#### Scenario: Mnemonic-native source validates every current ID

- **WHEN** source frontmatter declares `identity.scheme: mnemonic-v1`
- **AND** one current ID violates the mnemonic syntax contract
- **THEN** Stage 1 fails with that ID and source location before publishing usable outputs

#### Scenario: Unsupported identity scheme fails loudly

- **WHEN** source frontmatter declares an identity scheme other than a supported value
- **THEN** Stage 1 fails with the scheme and source location
- **AND** does not reinterpret the source as markerless legacy input

#### Scenario: Malformed slide-like heading is not epilogue

- **WHEN** the source contains `## Slide seven UXGap` after valid slide blocks
- **THEN** Stage 1 reports a malformed slide heading
- **AND** does not silently exclude the remaining text as an epilogue

#### Scenario: Multiple inputs restart local heading numbers

- **WHEN** Stage 1 receives two input files with two valid slide blocks each, numbered `01, 02` within each file
- **THEN** both inputs pass local heading validation
- **AND** the merged plan positions are `1, 2, 3, 4` in CLI input order

### Requirement: Stage 1 preserves stable-ID inputs across ordering-only changes

Stage 1 SHALL exclude physical position, heading number, source block order, and any position-bearing prompt-twin filename from expensive generation inputs. Reordering alone SHALL leave the final assembled image prompt and other semantic generation inputs byte-equivalent for every retained slide.

#### Scenario: Reorder preserves image-generation inputs

- **WHEN** only the order and normalized heading numbers of existing slide blocks change
- **THEN** each retained ID has the same final assembled image prompt and semantic generator inputs as before
- **AND** only order-dependent cheap projections are rebuilt
