## REMOVED Requirements

### Requirement: Historical adoption controller has literal ownership
**Reason**: The historical adoption controller is a second active controller path.
**Migration**: The generic unsupported-protocol/export action is outside playbook routing. A named bundle conversion requires separately authorized deck-scoped work and is not a current controller path.

## MODIFIED Requirements

### Requirement: New decks enter the Page Authority production controller
For a fresh TARGET version, the registered create-deck controller SHALL obtain one human semantic choice, `framed` or `pure`, before it enters provider-facing work. It SHALL write or consume the canonical v2 source/receipt through the owning interface and then expose only the selected workflow's path, prerequisites, gate, and nearest action. The controller SHALL NOT ask for a per-slide authority choice or infer a workflow from deck type, content, or a generated artifact.

The human owns workflow/content/visual decisions. JS owns parsing, readiness, state, evidence, and recovery. A missing or invalid workflow is a resolver hard-stop; a provider authorization or raw/visual review remains a bounded human confirm recorded by its owning runtime interface.

#### Scenario: Framed selection creates a straight controller route
- **WHEN** a human selects `framed` for a fresh target version and the canonical source receipt is valid
- **THEN** the controller enters the Framed path and later shared delivery without presenting Pure as a slide-level option
- **AND** provider work still waits for the owner-issued scoped authorization

#### Scenario: Non-v2 source is not a controller route
- **WHEN** an existing source/state pair is non-v2
- **THEN** the Controller presents the owner-issued unsupported-protocol hard-stop
- **AND** it does not register, select, rewrite, or resume a compatibility controller

### Requirement: Active controllers route only Page Authority work
Registered active playbooks SHALL describe v2 Page Authority creation and Pure/Framed/notes/structural refreshes. They SHALL NOT register another-protocol, compatibility, adoption, or migration nodes.

#### Scenario: Controller manifest is validated
- **WHEN** the controller manifest and playbooks are loaded
- **THEN** no active node, gate, or resume card names another-protocol or compatibility route
