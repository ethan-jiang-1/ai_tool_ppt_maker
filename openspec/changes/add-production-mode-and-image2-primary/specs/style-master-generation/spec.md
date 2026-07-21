## ADDED Requirements

### Requirement: Style-master routing preserves a future HTML adapter seam

The public `style-master` route SHALL consume the canonical production policy before invoking an
implementation. For `image2-only`, it SHALL delegate to the current in-framework Image2 style-master
generator with its existing credential, trace, and deck-system behavior. For either HTML mode, the
policy SHALL expose a reserved HTML adapter seam; until an HTML adapter exists, the command SHALL
return typed `capability_not_available` guidance with a local next action and SHALL create no
`style_master.jpg`, provider request, or legacy control artifact.

The mode contract SHALL NOT specify style master as permanently forbidden for HTML and SHALL NOT
require a future HTML adapter to reuse the Image2 image artifact, prompt shape, or provider semantics.
Unknown mode/pipeline identity or missing Image2 provider authorization SHALL remain hard-stop outcomes
owned by state/CLI readiness rather than being downgraded to capability guidance.

#### Scenario: Image2-primary style master runs

- **WHEN** `style-master` targets a consistent authorized `image2-only` run
- **THEN** it invokes the current Image2 implementation and records its existing output/trace

#### Scenario: HTML style master is not implemented yet

- **WHEN** `style-master` targets a consistent HTML mode
- **THEN** it returns typed reserved-adapter guidance without provider work or legacy artifact writes
- **AND** the result does not declare HTML visual-system support permanently impossible

#### Scenario: Mode identity is invalid

- **WHEN** state mode and source pipeline disagree
- **THEN** style-master hard-stops at identity recovery before capability guidance or provider readiness
