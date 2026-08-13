## ADDED Requirements

### Requirement: Framed guidance distinguishes local header space from provider avoidance

Active Framed guidance SHALL call the local-header-renderer-owned spatial area
the Reserved Header Region and call the provider-facing derived composition
instruction the Provider Avoidance Constraint. It SHALL state that the latter
does not prove provider compliance or create a blank band. Serialized and
implementation identifiers such as `header_region`, `protected_composition`,
`reserved_header`, and `body_safe` remain their existing exact contracts and
are not renamed by terminology guidance.

#### Scenario: An Agent explains Framed composition

- **WHEN** an Agent reads active Framed composition guidance
- **THEN** it can distinguish local header ownership from the provider-facing
  avoidance instruction and the existing review boundary
- **AND** it does not infer an alternate serialized geometry shape or a second
  local renderer
