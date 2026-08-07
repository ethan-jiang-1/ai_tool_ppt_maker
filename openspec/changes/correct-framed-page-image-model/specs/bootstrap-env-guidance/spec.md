## ADDED Requirements

### Requirement: Bootstrap exposes current Page Image Workflow readiness without false local-refresh claims

Active BOOTSTRAP and top-level onboarding SHALL describe local foundation and
operation-scoped readiness for `page-image-workflow-v1` only. They SHALL state
that ordinary foundation checks are offline, credentials are needed only when
the selected operation submits to Image2, and a live probe requires disclosed
submission count plus explicit human confirmation. They SHALL describe
Framed local browser/font prerequisites for its deterministic header overlay,
but SHALL not imply that a complete Framed page, a header literal change, or
provider-visible content can be produced without current provider-page work.

For a new deck, onboarding SHALL retain the durable handoff `local foundation
-> init -> user content and necessary choices -> create-deck Controller/current
owner action`. It SHALL not prescribe a fixed provider command sequence,
promise compatibility, or present v2 Page Authority data as a current route.

#### Scenario: Framed local readiness is scoped correctly

- **WHEN** an operator follows BOOTSTRAP for a Framed operation
- **THEN** it identifies browser/font readiness for the local header overlay
- **AND** it does not claim that provider-visible page content or changed
  header context can skip its raw-page lifecycle

#### Scenario: Fresh onboarding selects a current policy later

- **WHEN** an Agent follows onboarding for a new deck
- **THEN** it establishes foundation and follows the current Controller for
  content and workflow selection
- **AND** it does not infer `framed`, `pure`, or provider authorization from
  environment readiness

## REMOVED Requirements

### Requirement: Bootstrap and top-level onboarding expose current operation-scoped readiness

**Reason**: It names v2 Page Authority as current and implies a broad local
Framed refresh route.

**Migration**: Describe only replacement protocol readiness and the narrow
deterministic header-overlay prerequisite.
