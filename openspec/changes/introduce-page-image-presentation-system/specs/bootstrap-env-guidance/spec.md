## MODIFIED Requirements

### Requirement: Bootstrap exposes current Page Image Workflow readiness without false local-refresh claims

Bootstrap guidance SHALL describe only V2 Page Image readiness for
`page-authority-image2-v2` and its selected `framed|pure` workflow. It SHALL
distinguish provider-free local Framed composition from provider-backed raw
generation, state that workflow selection is required before provider work, and
name no other protocol as a readiness, repair, or authoring route.

#### Scenario: A new V2 authoring run is prepared

- **WHEN** an operator follows active bootstrap guidance for a new Page Image
  run
- **THEN** guidance directs it to record one V2 workflow selection before
  provider work
- **AND** it does not offer a second protocol or protocol-conversion path

#### Scenario: Framed local readiness is scoped correctly

- **WHEN** an operator follows BOOTSTRAP for a V2 Framed operation
- **THEN** it identifies browser/font readiness for the deterministic local
  header overlay
- **AND** it does not claim that provider-visible content or changed header
  context can skip its raw-page lifecycle

#### Scenario: Fresh onboarding selects a current policy later

- **WHEN** an Agent follows onboarding for a new V2 deck
- **THEN** it establishes foundation and follows the current Controller for
  content and workflow selection
- **AND** it does not infer `framed`, `pure`, or provider authorization from
  environment readiness
