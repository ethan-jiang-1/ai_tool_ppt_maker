## ADDED Requirements

### Requirement: Page Authority source resolves one authority per slide
For `production.pipeline: page-authority-image2-v1`, content parsing SHALL accept only
`production.pipeline`, `production.page_authority_default`, and a per-slide `PAGE AUTHORITY` override
of `pure-image2` or `framed-image2`. The resolved receipt SHALL record one authority for every stable
slide ID. Duplicate keys, aliases, tags, unknown production keys, legacy `render`/`RENDER MODE`, and
free `IMAGE PROMPT` input SHALL hard-stop before derived-artifact or provider work.

#### Scenario: Source default and slide override resolve
- **WHEN** a valid source defaults to `framed-image2` and one slide overrides it with `pure-image2`
- **THEN** the receipt records the correct authority for each stable slide ID
- **AND** metadata, filenames, and generated artifacts do not affect resolution

### Requirement: Framed display fields remain local receipt data
For Framed slides, `TITLE` SHALL be required and optional kicker, subtitle, and callout SHALL normalize
into a `standard-v1` Text Frame receipt. An omitted Framed `FRAME PRESET` SHALL normalize to
`standard-v1`; when present it SHALL equal exactly `standard-v1`. Pure slides SHALL reject a frame
preset. Identity selection, subject count, subject restrictions, and the typed visual brief SHALL be
validated before compilation.

#### Scenario: Contradictory frame or identity selection is rejected
- **WHEN** a Pure slide selects a frame preset or an identity selects `no-identity-subject`
- **THEN** parsing returns the field-level repair diagnostic
- **AND** no raw contract is emitted

### Requirement: Page Authority source admits only a closed visual-brief selection
Every Page Authority slide SHALL contain exactly one `VISUAL BRIEF` mapping with exactly these keys in
semantic order: `recipe`, `composition`, `motifs`, and `negative_constraints`. `recipe` and
`composition` SHALL be unquoted registered lower-kebab IDs. `motifs` SHALL be an ordered,
duplicate-free sequence of zero to six unquoted registered lower-kebab IDs. `negative_constraints` SHALL
be an ordered, duplicate-free sequence selected only from `no-readable-text`, `no-labels`, `no-logo`, and
`no-watermark`. Free prose, quoted literals, nested mappings, aliases, anchors, tags, unknown keys, and
unregistered IDs SHALL fail at the source span before a receipt or raw contract is emitted.

For Framed slides, `negative_constraints` SHALL include both `no-readable-text` and `no-labels`. For a
Pure slide with any structured display field, those two constraints SHALL be rejected as contradictory;
Pure slides with no structured display field MAY select any subset of the four constraints. An absent
`IDENTITY SUBJECT COUNT` or `SUBJECT RESTRICTIONS` SHALL normalize to `none`; their only explicit v1
values are respectively `none|one` and `none|no-generic-metal-robot|no-identity-subject`.
`VISUAL IDENTITY`, when present, SHALL be one unquoted `<profile>/<role>` pair of registered
lower-kebab IDs. An absent identity requires the normalized count `none`; a selected identity requires
`one`. The last subject restriction SHALL reject a selected identity. No v1 source form represents
multiple identities.

#### Scenario: Free visual prose cannot enter a Page Authority request
- **WHEN** a Page Authority slide supplies a prose scalar, quoted literal, unknown visual-brief key, or
  unregistered ID instead of the closed selection
- **THEN** parsing returns the field-level repair diagnostic before registry compilation
- **AND** no provider payload, authorization scope, or raw contract is created

#### Scenario: Authority-aware constraints retain text ownership
- **WHEN** a Framed slide omits `no-labels` or a Pure slide with a title selects `no-readable-text`
- **THEN** parsing rejects the contradictory constraint selection at `VISUAL BRIEF`
- **AND** it does not silently add, remove, or rewrite any selected constraint
