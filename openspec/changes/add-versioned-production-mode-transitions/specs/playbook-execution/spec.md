## ADDED Requirements

### Requirement: Migrate-import owns cross-pipeline production-mode handoff

`migrate-import` SHALL own the mode-transition branch for both Image2-to-HTML and HTML-to-Image2
requests.  It SHALL inspect exact source mode/pipeline, invoke the closed prepare/preview operations,
show the source/target/version impact and exact plan hash, obtain the human mode confirmation, and invoke
apply only for that same checkpoint.  It SHALL not ask the user to reconstruct deterministic scaffolding,
infer target source, or treat a conversation decision as confirmation evidence.

On decline, stale plan, conflict, or failed apply, the source controller/current node remains intact and
the Controller follows the producer's nearest recovery action.  On verified target registration, state
performs the declared target controller handoff with pending target-owned work; no source node is marked
skipped or complete and no source review/authorization is copied.  HTML target progress uses the existing
HTML workflow without a new visual-quality decision; Image2 target progress uses the normal first-class
Image2 review and authorization workflow.

#### Scenario: User changes from Image2 to HTML

- **WHEN** the user selects `html-only` or `html-then-image2` for a current Image2 version
- **THEN** the controller shows the exact clean-vNext transition plan and selected target mode before confirmation
- **AND** it does not route the source through an in-place state edit

#### Scenario: User changes from HTML to Image2

- **WHEN** the user selects `image2-only` for a current HTML version
- **THEN** the controller obtains explicit whole-page target authoring and later enters normal Image2 production after publication
- **AND** it does not require or infer an HTML-quality verdict during the transition

#### Scenario: Source execution is incomplete

- **WHEN** a source controller has incomplete work when a cross-pipeline request begins
- **THEN** transition preparation preserves that execution and applies no replacement until the declared target handoff succeeds
