## ADDED Requirements

### Requirement: Current state contains one Page Authority evidence graph
Current state SHALL record Page Authority source epochs, raw authorization/review, final delivery, and
bounded legacy observation/adoption facts only. It SHALL NOT validate or publish HTML review,
Header-Lock, whole-page, or visual-slot completion state.

#### Scenario: A current state is inspected
- **WHEN** state is read for a current Page Authority run
- **THEN** its next action derives from Page Authority evidence without a retired gate or mode branch

### Requirement: Legacy observations remain non-authoritative
The state owner SHALL retain the read-only legacy observer and adoption transaction. Neither outcome
shall revive a legacy production adapter, evidence record, or completion state.

#### Scenario: A recognized historical pair is read
- **WHEN** state/inspection encounters an intact legacy source/state pair
- **THEN** it returns only the adoption action and makes no production-state mutation


## REMOVED Requirements

### Requirement: Generic workflow control retires only with ledger proof
**Reason**: The legacy contract is replaced by the current owner state owner.
**Migration**: Use the current contract owned by state owner.

### Requirement: Production mode is authoritative per run version
**Reason**: The legacy contract is replaced by the current owner state owner.
**Migration**: Use the current contract owned by state owner.

### Requirement: Same-pipeline production-mode transitions preserve work
**Reason**: The legacy contract is replaced by the current owner structural versioning.
**Migration**: Use the current contract owned by structural versioning.

### Requirement: Published versions receive mode through an explicit state handoff
**Reason**: The legacy contract is replaced by the current owner state transition.
**Migration**: Use the current contract owned by state transition.

### Requirement: Production mode filters controller working sets without status forgery
**Reason**: The legacy contract is replaced by the current owner state + playbook.
**Migration**: Use the current contract owned by state + playbook.

### Requirement: Image2-primary final review binds current delivery evidence
**Reason**: The legacy contract is replaced by the current owner Page Authority review.
**Migration**: Use the current contract owned by Page Authority review.

### Requirement: Image2-primary provider authorization is current and scoped
**Reason**: The legacy contract is replaced by the current owner Page Authority authorization.
**Migration**: Use the current contract owned by Page Authority authorization.

### Requirement: Node frontmatter defines entry and exit gates
**Reason**: The legacy contract is replaced by the current owner node specification + playbook.
**Migration**: Use the current contract owned by node specification + playbook.

### Requirement: State file is YAML at run bundle root
**Reason**: The legacy contract is replaced by the current owner state owner.
**Migration**: Use the current contract owned by state owner.

### Requirement: Gate Conditions Catalog is defined in NODE-SPEC.md
**Reason**: The legacy contract is replaced by the current owner node specification.
**Migration**: Use the current contract owned by node specification.

### Requirement: Playbook index validates references and impossible gates
**Reason**: The legacy contract is replaced by the current owner node specification + playbook.
**Migration**: Use the current contract owned by node specification + playbook.

### Requirement: Playbook executions do not reuse prior node completion
**Reason**: The legacy contract is replaced by the current owner state + inspection.
**Migration**: Use the current contract owned by state + inspection.

### Requirement: HTML review readiness has one deep module interface
**Reason**: The legacy production contract is retired; no current production route retains it.
**Migration**: Use the Page Authority lifecycle for new work; use the read-only observer/adoption boundary for recognized historical runs.

### Requirement: Canonical HTML production reset is a version-scoped idempotent transaction
**Reason**: The legacy production contract is retired; no current production route retains it.
**Migration**: Use the Page Authority lifecycle for new work; use the read-only observer/adoption boundary for recognized historical runs.

### Requirement: HTML content and visual gate evidence is versioned and pipeline-specific
**Reason**: The legacy production contract is retired; no current production route retains it.
**Migration**: Use the Page Authority lifecycle for new work; use the read-only observer/adoption boundary for recognized historical runs.

### Requirement: State and status expose mode-aware complete delivery
**Reason**: The legacy contract is replaced by the current owner state + inspection.
**Migration**: Use the current contract owned by state + inspection.

### Requirement: Playbook index reserves final system evidence and enforces pipeline ownership
**Reason**: The legacy contract is replaced by the current owner state + playbook.
**Migration**: Use the current contract owned by state + playbook.

### Requirement: Cross-pipeline production-mode transitions are versioned state transactions
**Reason**: The legacy contract is replaced by the current owner adoption transaction.
**Migration**: Use the current contract owned by adoption transaction.

### Requirement: Raw state observation nests workflow inspection without replacement
**Reason**: The legacy contract is replaced by the current owner state + inspection.
**Migration**: Use the current contract owned by state + inspection.

### Requirement: State recovery returns one direct owner action
**Reason**: The legacy contract is replaced by the current owner state owner.
**Migration**: Use the current contract owned by state owner.

### Requirement: Transition execution uses current Controller identity
**Reason**: The legacy contract is replaced by the current owner adoption transaction.
**Migration**: Use the current contract owned by adoption transaction.
