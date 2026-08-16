# Harness Charter Specification (delta)

## MODIFIED Requirements

### Requirement: Harness guidance defines the shared Page Image Core and Header Rendering Policy

Active guidance SHALL explain that Framed and Pure share one full-canvas Page
Image Core: canonical source owns meaning and required literals; the provider
composes the visual scene and provider-visible body, labels, metrics, diagram
text, quotes, callouts, and supporting copy. Pure has the provider render the
entire page including `kicker`, `title`, and `subtitle`. Framed adds a
transparent deterministic local overlay for only those three header fields and
sends their exact literals to the provider as context not to render. The
Framed Provider Avoidance Constraint is a composition constraint, not a blank
band or a text-free-page rule.

#### Scenario: Framed guidance does not assign callouts to a local frame

- **WHEN** an Agent reads active Framed composition guidance
- **THEN** it sees callouts and all non-header copy as provider-rendered
content
- **AND** it does not treat the local overlay as a general body renderer

### Requirement: Harness guidance routes changes by actual provider inputs

Active guidance SHALL classify Page Image changes from actual compiled
provider-input, protected-composition, raw-contract, and profile bindings. A
Framed title/subtitle/kicker literal changes provider context and normally
requires raw rebuild. A local overlay refresh is available only after the
owner proves every provider input and relevant deterministic contract is
unchanged. Notes-only changes remain delivery-owned; structural and
whole-workflow changes use previewed exact-hash versioning.

#### Scenario: Header change does not use stale raw evidence

- **WHEN** a current Framed title literal changes
- **THEN** active guidance directs the Agent to raw rebuild
- **AND** it does not advertise an unconditional local text refresh
