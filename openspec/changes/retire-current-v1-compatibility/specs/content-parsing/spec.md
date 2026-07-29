## REMOVED Requirements

### Requirement: Page Authority source resolves one authority per slide
**Reason**: Per-slide authority is the retired v1 source grammar.
**Migration**: Convert only through the explicit preview-first migration contract; current sources select one version workflow.

## MODIFIED Requirements

### Requirement: Current source parsing is Page Authority-only
Current production source parsing SHALL accept only the v2 Page Authority grammar and bind every slide to the version's selected Framed or Pure workflow. A non-v2 source marker or shape SHALL fail before receipt compilation and return the owner-issued migration/export hard-stop; it SHALL NOT publish a plan, adapter, receipt, or inferred workflow.

#### Scenario: Retired source cannot produce a current plan
- **WHEN** a source carries a retired protocol marker or per-slide authority grammar
- **THEN** normal parsing returns the bounded migration/export action before producing a receipt or raw owner
- **AND** it does not rewrite source bytes

### Requirement: TARGET Page Authority source selects one version workflow
For `production.pipeline: page-authority-image2-v2`, the source parser SHALL require exactly one `production.workflow` value: `framed` or `pure`. It SHALL bind that value, the ordered stable slide IDs, and the canonical source digest into a `page-authority-image2-source-v2` receipt before raw or provider work. Every resolved target slide SHALL inherit the receipt workflow; the parser SHALL NOT infer a workflow from a slide, artifact, directory, or omitted field.

TARGET source SHALL reject `production.page_authority_default`, any per-slide `PAGE AUTHORITY` declaration, a missing workflow, an unsupported workflow, and any non-v2 source shape.

#### Scenario: Target workflow receipt is homogeneous
- **WHEN** a source has pipeline `page-authority-image2-v2`, workflow `framed`, and valid stable slides
- **THEN** parsing publishes one `page-authority-image2-source-v2` receipt with workflow `framed`
- **AND** every slide is resolved through the Framed workflow without a per-slide authority selection

#### Scenario: Retired grammar fails before provider work
- **WHEN** a v2 source contains `page_authority_default` or a slide `PAGE AUTHORITY` declaration
- **THEN** parsing rejects the source with the migration/export or target-shape repair action
- **AND** no provider payload or source receipt is created
