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
into a `standard-v1` Text Frame receipt. Pure slides SHALL reject a frame preset. Identity selection,
subject count, subject restrictions, and the typed visual brief SHALL be validated before compilation.

#### Scenario: Contradictory frame or identity selection is rejected
- **WHEN** a Pure slide selects a frame preset or an identity selects `no-identity-subject`
- **THEN** parsing returns the field-level repair diagnostic
- **AND** no raw contract is emitted

