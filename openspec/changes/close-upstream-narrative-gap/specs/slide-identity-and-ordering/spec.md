## ADDED Requirements

### Requirement: Page-plan publication reuses exact structural source protections
When a confirmed narrative page plan creates, inserts, deletes, or reorders
canonical page source, its publication SHALL use the existing structural
preview and exact-plan path. The plan SHALL bind its Story Outline, Design
Constraints, Visual Language, source-byte, target-workflow, target-version, and
ordered slide identity facts before publication.

Publication SHALL revalidate those bindings and the current source grammar
before it creates a target source. Any stale input, changed source, invalid
mnemonic identity, target conflict, or plan-hash mismatch SHALL hard-stop before
source, state, derived-artifact, or provider mutation. A successful publication
creates no provider call and records `needs_render` only through the existing
render-debt path.

#### Scenario: Confirmed page plan creates a clean source target
- **WHEN** an exact confirmed page plan has current matching inputs and target
  bindings
- **THEN** publication creates the canonical target `slide-specifications.md`
  with valid current mnemonic identities and ordered source blocks
- **AND** it retains existing clean-target behavior with no raw, review, final,
  or delivery acceptance inheritance

#### Scenario: A page-plan input drifts before apply
- **WHEN** a Story Outline, Design Constraints, Visual Language, source byte,
  target version, or plan hash differs from the previewed binding
- **THEN** publication stops before creating or mutating a target
- **AND** it returns the nearest action to regenerate and confirm the current
  plan rather than falling back to a prior source or plan
