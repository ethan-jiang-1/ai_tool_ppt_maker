## MODIFIED Requirements

### Requirement: Stage 1 blocks identity and heading invariant violations

For a canonical run-directory source, Stage 1 SHALL fail before generation when an ID is empty, a current ID or spoken key is duplicated, a slide heading number is missing or repeated, or heading numbers do not equal the continuous physical positions `01..N`. The shared slide-document parser SHALL preserve arbitrary Markdown as preamble after leading frontmatter and before the first exact canonical slide heading, including unnumbered section prose such as `## Slide Specifications` or `## Slide Map`. A canonical slide heading remains the exact `## Slide <number>:` grammar with its required stable-ID form. Before the first valid heading, any slide-like heading that contains a decimal slide-number candidate but fails that grammar SHALL fail rather than become preamble. After the slide region begins, any level-2 heading that begins like a slide heading but does not match canonical slide grammar SHALL also fail rather than become epilogue. Its diagnostic SHALL identify the source slide or heading and direct heading-only drift to `ppt_flow slides normalize`. It SHALL NOT silently normalize production source.

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

#### Scenario: Slide-named preamble stays prose

- **WHEN** leading frontmatter is followed by `## Slide Specifications` and `## Slide Map` before the first exact slide heading
- **THEN** the parser preserves those lines as preamble
- **AND** the first exact slide heading starts position 1

#### Scenario: Numeric preamble typo fails closed

- **WHEN** preamble contains `## Slide 01` without the required canonical delimiter and ID
- **THEN** Stage 1 reports a malformed slide heading with its source line
- **AND** does not silently treat the numeric candidate as preamble

#### Scenario: Malformed slide-like heading is not epilogue

- **WHEN** the source contains `## Slide seven UXGap` after valid slide blocks
- **THEN** Stage 1 reports a malformed slide heading
- **AND** does not silently exclude the remaining text as an epilogue

#### Scenario: Multiple inputs restart local heading numbers

- **WHEN** Stage 1 receives two input files with two valid slide blocks each, numbered `01, 02` within each file
- **THEN** both inputs pass local heading validation
- **AND** the merged plan positions are `1, 2, 3, 4` in CLI input order
