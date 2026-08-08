## ADDED Requirements

### Requirement: Harness guidance names the current Page Image Workflow protocol

Active Charter, BOOTSTRAP, workflow, reference, and Agent guidance SHALL name
`page-image-workflow-v1` with matching `image2-page-workflow-v1` state as the
sole current page-production protocol. It SHALL require one version-level
workflow choice, `framed` or `pure`; `hybrid` describes Framed composition only
and is never a third workflow or per-slide choice. Active guidance SHALL name
`page-authority-image2-v2` only as unsupported historical input with no
converter, compatibility, adoption, or automatic migration route.

#### Scenario: An Agent reads active page-production guidance

- **WHEN** an Agent opens Charter or workflow documentation for a current
  version
- **THEN** it receives the replacement workflow identity and one selected
  policy
- **AND** it does not receive Page Authority v2 as a production option

### Requirement: Harness guidance defines the shared Page Image Core and Header Rendering Policy

Active guidance SHALL explain that Framed and Pure share one full-canvas Page
Image Core: canonical source owns meaning and required literals; the provider
composes the visual scene and provider-visible body, labels, metrics, diagram
text, quotes, callouts, and supporting copy. Pure has the provider render the
entire page including `kicker`, `title`, and `subtitle`. Framed adds a
transparent deterministic local overlay for only those three header fields and
sends their exact literals to the provider as context not to render. The
Framed protected zone is a composition constraint, not a blank band or a
text-free-page rule.

#### Scenario: Framed guidance does not assign callouts to a local frame

- **WHEN** an Agent reads active Framed composition guidance
- **THEN** it sees callouts and all non-header copy as provider-rendered
content
- **AND** it does not treat the local overlay as a general body renderer

### Requirement: Harness guidance routes changes by actual provider inputs

Active guidance SHALL classify Page Image changes from actual compiled
provider-input, protected-geometry, raw-contract, and profile bindings. A
Framed title/subtitle/kicker literal changes provider context and normally
requires raw rebuild. A local overlay refresh is available only after the
owner proves every provider input and relevant deterministic contract is
unchanged. Notes-only changes remain delivery-owned; structural and
whole-workflow changes use previewed exact-hash versioning.

#### Scenario: Header change does not use stale raw evidence

- **WHEN** a current Framed title literal changes
- **THEN** active guidance directs the Agent to raw rebuild
- **AND** it does not advertise an unconditional local text refresh

### Requirement: Harness guidance presents one complete page review and shared delivery

Active guidance SHALL present the method graph as
`03-framed-image XOR 04-pure-image -> 05-delivery -> 06-iteration`, with the
shared Page Image Core below the selected adapter boundary. Framed Complete
Page Review presents provider raw plus production-equivalent header composite;
Pure presents its complete provider page. One `proceed` or `repair` decision
governs that review. Shared delivery consumes only the common current final
manifest, then owns deck-level PPTX, notes, and final delivery review.

#### Scenario: Framed guidance does not add a composite gate

- **WHEN** an Agent follows current Framed review guidance
- **THEN** it receives one Complete Page Review decision containing both views
- **AND** it does not encounter a second header-composite approval

## REMOVED Requirements

### Requirement: Harness guidance names one current production protocol

**Reason**: It names `page-authority-image2-v2` as the sole current protocol.

**Migration**: Use the replacement Page Image Workflow pair.

### Requirement: Harness guidance routes changes by ownership and invalidation

**Reason**: It treats Framed Text Frame-only edits as broadly provider-free.

**Migration**: Classify only from actual compiled provider inputs and contracts.

### Requirement: Harness guidance presents sibling workflows and shared delivery

**Reason**: It lacks the shared Page Image Core and correct Complete Page
Review model.

**Migration**: Retain the sibling graph with the replacement core, review, and
final-manifest lineage.
