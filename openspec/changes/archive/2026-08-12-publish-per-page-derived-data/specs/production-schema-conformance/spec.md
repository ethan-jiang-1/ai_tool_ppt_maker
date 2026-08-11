## ADDED Requirements

### Requirement: Published page-derived data conforms to declared stage ownership

The active serialization inventory and stage definitions SHALL declare the C5
published forms of `page-source-receipt`, `page-layout`, `page-render-model`,
`page-generation-spec`, `image2-request`, `framed-header-html`, and
`page-artifact-index`, including their exact producer, derived scope,
provenance, and current materialization status. `page-render-model` and
`page-artifact-index` SHALL no longer retain a planned-only producer status
after this change is applied.

The opt-in conformance sweep SHALL verify that a C5 publisher emits only the
declared current stage/role values and that each page artifact supplies the
required identity, producer, provenance, invalidation bindings, and
workflow-specific absence/presence rules. The static evaluator remains
non-runtime; runtime planning continues to use its existing owning validators
rather than the conformance sweep.

#### Scenario: A published Framed chain matches its declared stages

- **WHEN** conformance inspects a synthetic valid Framed C5 publication
- **THEN** it finds one declared artifact for every required stage, one HTML
  header artifact, and no duplicate header-controller JSON
- **AND** every artifact binds the same stable page identity and current plan lineage

#### Scenario: A materialized artifact drifts from its schema declaration

- **WHEN** a C5 writer emits an undeclared role, omits required provenance, or
  gives a Pure page a Framed-only artifact
- **THEN** the opt-in conformance test reports the direct schema mismatch
- **AND** it does not become a runtime gate, provider call, or compatibility path
