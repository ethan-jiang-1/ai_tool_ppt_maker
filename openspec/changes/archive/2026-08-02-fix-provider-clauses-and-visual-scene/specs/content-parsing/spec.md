## ADDED Requirements

### Requirement: VISUAL SCENE is an optional single-occurrence inline source field

The v2 Page Authority source grammar SHALL recognize `**VISUAL SCENE**` as an
optional, single-occurrence, inline bold field on any slide. Its value SHALL be
one non-empty inline text value and SHALL be carried into the slide receipt as
`visual_scene` (raw text). A slide without the field SHALL have `visual_scene`
`null`. A missing value or more than one occurrence SHALL be reported as a
source error.

The field SHALL NOT be interpreted as a display field (KICKER/TITLE/SUBTITLE/
CALLOUT), a visual-identity field, or a closed `VISUAL BRIEF` selection. The
source parser SHALL NOT apply the text guard to `visual_scene`; guard
validation is owned by the workflow adapter at raw-contract compilation.

#### Scenario: Scene present

- **WHEN** a Pure or Framed slide contains exactly one `**VISUAL SCENE**` field
  with a non-empty inline value
- **THEN** the receipt slide carries that raw text as `visual_scene`
- **AND** the source validates without a scene-related error

#### Scenario: Scene absent

- **WHEN** a slide has no `**VISUAL SCENE**` field
- **THEN** the receipt slide has `visual_scene` `null`
- **AND** the rest of the source validates exactly as before

#### Scenario: Empty scene

- **WHEN** a slide contains `**VISUAL SCENE**:` with no inline value
- **THEN** the source reports an empty-page-authority-field error
- **AND** no receipt is published for that source

#### Scenario: Duplicate scene

- **WHEN** a slide contains more than one `**VISUAL SCENE**` field
- **THEN** the source reports a duplicate-page-authority-field error for each
  occurrence after the first
- **AND** no receipt is published for that source
