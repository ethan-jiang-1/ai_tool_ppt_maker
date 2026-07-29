## MODIFIED Requirements

### Requirement: New decks enter the Page Authority production controller

For a fresh TARGET version, the registered create-deck controller SHALL obtain
one human semantic choice, `framed` or `pure`, before it enters provider-facing
work. It SHALL write or consume the canonical v2 source/receipt through the
owning interface and then expose only the selected workflow's path,
prerequisites, gate, and nearest action. The controller SHALL NOT ask for a
per-slide authority choice or infer a workflow from deck type, content, or a
generated artifact. Fresh initialization SHALL NOT create a v1
`image2-page-authority` run after target activation.

The human owns workflow/content/visual decisions. JS owns parsing, readiness,
state, evidence, and recovery. A missing or invalid workflow is a resolver
hard-stop; a provider authorization or raw/visual review remains a bounded
human confirm recorded by its owning runtime interface.

#### Scenario: Framed selection creates a straight controller route

- **WHEN** a human selects `framed` for a fresh target version and the canonical source receipt is valid
- **THEN** the controller enters the Framed path and later shared delivery without presenting Pure as a slide-level option
- **AND** provider work still waits for the owner-issued scoped authorization

#### Scenario: Missing selection cannot become a default workflow

- **WHEN** a fresh target source has no valid workflow selection
- **THEN** the controller presents the source-selection repair action before provider work
- **AND** it does not default to Framed, Pure, or a mixed route

#### Scenario: CURRENT runs remain compatibility inputs rather than fresh routes

- **WHEN** an existing exact v1 mixed source/state pair is resumed after target activation
- **THEN** the controller projects its bounded compatibility route
- **AND** it does not register that v1 pair as a fresh-deck controller choice or rewrite it to v2

#### Scenario: Fresh run uses Page Authority nodes

- **WHEN** a fresh initialized run has the exact TARGET source/state pair and selected workflow
- **THEN** the active controller set contains the selected Page Authority lifecycle and excludes retired nodes
- **AND** provider work requires the displayed scoped authorization

#### Scenario: Recognized legacy run enters adoption intake

- **WHEN** an explicitly targeted existing run resolves to `recognized-legacy`
- **THEN** the Controller shows the provider-free adoption prepare/preview route and explicit per-slide matrix
- **AND** it does not run the old legacy controller, infer a Page Authority source, or create an adoption record before exact confirmation

#### Scenario: Adoption target resumes with clean Page Authority debt

- **WHEN** the state-owned adoption handoff publishes its TARGET version
- **THEN** the Controller enters the target Page Authority raw-authorization node with every target slide needing raw generation
- **AND** it does not treat a source approval, raw review, final review, or delivery decision as target evidence

#### Scenario: Current pair corruption remains outside adoption

- **WHEN** an existing run has a partial or mismatched Page Authority source/state pair
- **THEN** the Controller names the Page Authority repair owner
- **AND** it does not fall back to legacy nodes or adoption candidate authoring

## ADDED Requirements

### Requirement: TARGET controller gates reuse direct workflow evidence

TARGET controller nodes SHALL classify source/state/receipt identity mismatch,
wrong workflow owner, invalid or stale raw evidence, invalid provider scope,
and final/delivery lineage mismatch as non-waivable hard-stops. They SHALL
reuse the owning parser, state, evidence, or delivery evaluator and return its
one nearest legal action. Complete workflow evidence awaiting workflow choice,
provider authorization, raw review, or visual review SHALL remain a `confirm`
gate with a bounded human reason where the owning contract requires one.

#### Scenario: Target raw evidence failure returns to its owner

- **WHEN** a selected target workflow reaches final publication with missing or stale accepted raw evidence
- **THEN** the controller returns the shared raw evidence/review action for that exact receipt
- **AND** it does not create a final, PPTX, notes, or delivery result
