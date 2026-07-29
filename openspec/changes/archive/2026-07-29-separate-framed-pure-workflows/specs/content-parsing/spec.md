## ADDED Requirements

### Requirement: TARGET Page Authority source selects one version workflow

For `production.pipeline: page-authority-image2-v2`, the source parser SHALL
require exactly one `production.workflow` value: `framed` or `pure`. It SHALL
bind that value, the ordered stable slide IDs, and the canonical source digest
into a `page-authority-image2-source-v2` receipt before raw or provider work.
Every resolved target slide SHALL inherit the receipt workflow; the parser
SHALL NOT infer a workflow from a slide, artifact, directory, or omitted field.

TARGET source SHALL reject `production.page_authority_default`, any per-slide
`PAGE AUTHORITY` declaration, a missing workflow, an unsupported workflow, and
any hybrid v1/v2 source shape. `page-authority-image2-v1` parsing remains the
sole owner of the CURRENT default and per-slide authority grammar.

#### Scenario: Target workflow receipt is homogeneous

- **WHEN** a source has pipeline `page-authority-image2-v2`, workflow `framed`, and valid stable slides
- **THEN** parsing publishes one `page-authority-image2-source-v2` receipt with workflow `framed`
- **AND** every slide is resolved through the Framed workflow without a per-slide authority selection

#### Scenario: Hybrid source fails before provider work

- **WHEN** a v2 source contains `page_authority_default` or a slide `PAGE AUTHORITY` declaration
- **THEN** parsing rejects the source as an invalid target workflow shape
- **AND** it does not publish a receipt, raw plan, authorization scope, or provider request
