## MODIFIED Requirements

### Requirement: New decks enter the Page Authority production controller
The registered create-deck controller SHALL route a fresh `image2-page-authority` run through Page Authority source authoring, visual-language selection, scoped provider authorization, raw review, final projection, assembly, notes, and delivery review. The MD Controller SHALL own human visual decisions; JS SHALL own resolver, readiness, evidence, and state checks. Page Authority runs SHALL never enter legacy nodes. A recognized legacy run SHALL no longer enter its ordinary legacy controller route: the Controller SHALL present the direct provider-free adoption observer, candidate/matrix authoring, exact preview, target-intake confirmation, and post-publication Page Authority handoff. It SHALL keep all semantic slide choices human-owned and shall not infer them from legacy content or generated material.

#### Scenario: Fresh run uses Page Authority nodes
- **WHEN** a fresh initialized run has the exact Page Authority source/state pair
- **THEN** the active controller set contains the Page Authority lifecycle and excludes HTML/header-lock/visual-slot nodes
- **AND** provider work requires the displayed scoped authorization

#### Scenario: Recognized legacy run enters adoption intake
- **WHEN** an explicitly targeted existing run resolves to `recognized-legacy`
- **THEN** the Controller shows the provider-free adoption prepare/preview route and explicit per-slide matrix
- **AND** it does not run the old legacy controller, infer a Page Authority source, or create an adoption record before exact confirmation

#### Scenario: Adoption target resumes with clean Page Authority debt
- **WHEN** the state-owned adoption handoff publishes its target
- **THEN** the Controller enters the target Page Authority raw-authorization node with every target slide needing raw generation
- **AND** it does not treat a source approval, raw review, final review, or delivery decision as target evidence

#### Scenario: Current pair corruption remains outside adoption
- **WHEN** an existing run has a partial or mismatched Page Authority source/state pair
- **THEN** the Controller names the Page Authority repair owner
- **AND** it does not fall back to legacy nodes or adoption candidate authoring

### Requirement: Controller routing follows production mode before pipeline behavior
The MD Controller SHALL consume the direct legacy protocol observer before selecting ordinary HTML,
whole-page, or Page Authority workflow prerequisites for an explicitly targeted run. A `recognized-legacy`
result SHALL expose only the provider-free adoption observer, candidate/matrix authoring, exact preview,
target-intake confirmation, and clean target handoff. A `current` result SHALL retain Page Authority
lifecycle routing; `current-pair-corrupt` and `unsupported-or-corrupt` SHALL expose their single repair
owner. The Controller SHALL not let historical node state, generated artifacts, review records, provider
authorizations, or a requested legacy intent select a production route.

#### Scenario: Historical controller state cannot preempt adoption
- **WHEN** a recognized legacy run has a legacy node waiting, review, refinement, or delivery record
- **THEN** the Controller presents only the adoption checkpoint
- **AND** it does not resume or evaluate the historical node

### Requirement: create-deck playbook covers complete deck creation
`create-deck.md` SHALL present Page Authority as the complete fresh-deck workflow. An exact recognized
legacy source/state pair SHALL be historical input to explicit adoption only, not a current mode-owned
workflow. The playbook SHALL require human-authored Page Authority source, target intake, and exact
per-slide matrix before exact-plan confirmation; after publication it SHALL hand the clean target to
`authorize-page-authority-raw` with every target slide needing raw generation. It SHALL state that
adoption makes no provider request and that raw quality review or an authorized pilot happens later on
the target.

#### Scenario: Existing legacy run is not a normal create execution
- **WHEN** a Controller is given an exact recognized legacy run
- **THEN** it presents adoption preparation instead of HTML, whole-page, or refinement nodes
- **AND** it does not treat legacy delivery, review, or provider evidence as target evidence

### Requirement: Historical whole-page and transition Controllers have literal ownership
The historical whole-page implementation remains readable only for explicit protocol observation and
adoption provenance. A recognized legacy run SHALL be fenced before ordinary whole-page controller
nodes, Header-Lock, provider work, or delivery work. The single `production-mode-transition` Controller
continues to own the exact apply/recovery transaction; its `legacy-adoption` plan kind alone publishes
the fixed Page Authority target and never reuses historical production authority.

#### Scenario: Recognized Image2 source is fenced before its old controller
- **WHEN** an exact historical `image2-only` source/state pair is selected
- **THEN** the Controller offers only the provider-free adoption checkpoint
- **AND** it does not enter a whole-page production node or maintenance route

## RENAMED Requirements

- FROM: `### Requirement: Current whole-page and transition Controllers have literal ownership`
- TO: `### Requirement: Historical whole-page and transition Controllers have literal ownership`
