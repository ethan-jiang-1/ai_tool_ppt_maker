## ADDED Requirements

### Requirement: Generation profile separates provider execution from source authority
Style Master Generation SHALL contribute effective provider style-master bytes and provider/model/output
facts to `raw_generation_profile_digest`. It SHALL not place those facts in the raw image contract or
treat their drift as a source-epoch mutation.

#### Scenario: Style profile changes invalidate reuse without advancing epoch
- **WHEN** effective style-master bytes change for an otherwise unchanged slide
- **THEN** the generation-profile digest changes and raw reuse/review is invalidated
- **AND** the raw-source epoch remains unchanged

