## ADDED Requirements

### Requirement: Page-plan publication reuses exact structural source protections
When a confirmed narrative page plan creates, inserts, deletes, or reorders
canonical page source, its publication SHALL use the existing structural
preview and exact-plan path. The plan SHALL bind its Agent-authored
page-grouping candidate bytes and confined scratch-relative locator, Story
Outline, Design Constraints, Visual Language registry, source-byte, target-workflow,
target-version, and ordered slide identity facts before publication.

Publication SHALL revalidate those bindings and the current source grammar
before it creates a target source. Any stale input, changed source, invalid
mnemonic identity, target conflict, or plan-hash mismatch SHALL hard-stop before
source, state, derived-artifact, or provider mutation. A successful publication
creates no provider call and records `needs_render` only through the existing
render-debt path.

After source publication, it SHALL invoke the existing Page Image source-state
owner with the plan's validated source receipt. That owner records the current
source-bound evidence; publication reports existing render debt for every target
slide. C3 SHALL not introduce another State shape, receipt store, or evidence
record. If the initial in-place source write completed but that State binding
did not, retrying the same exact plan MAY finish only that binding when the
current source exactly matches the plan's target bytes and no target-evidence
record exists. Any other source or State combination SHALL hard-stop before
mutation.

The initialized `v1` page-source draft MAY be materialized in place only when
its canonical bytes still match the exact current deck-type initial seed and no
source receipt, source-bound Page Image target-evidence record, derived
artifact, provider record, review, final, or delivery fact exists. The generic
Controller State and a selected pre-source workflow do not satisfy or defeat
this source-evidence absence test. Every other version SHALL use the existing
clean vNext structural publication path. The initial-draft exception uses the
same source-byte and exact-plan checks; it is not a general in-place structural
edit path.

#### Scenario: Confirmed page plan creates a clean source target
- **WHEN** an exact confirmed page plan has current matching inputs and target
  bindings
- **THEN** publication creates the canonical target `slide-specifications.md`
  with valid current mnemonic identities and ordered source blocks
- **AND** it retains existing clean-target behavior with no raw, review, final,
  or delivery acceptance inheritance

#### Scenario: An untouched initial draft receives its first page source
- **WHEN** the exact plan binds the exact current `v1` deck-type seed and the
  initial draft has no source receipt, source-bound target-evidence record,
  derived artifact, provider, review, final, or delivery fact
- **THEN** publication may materialize the first canonical page source in that
  draft with the same exact-plan checks, current source-State binding, and zero
  provider calls
- **AND** a later structural publication cannot use this initial-draft path

#### Scenario: Initial State binding is interrupted after source publication
- **WHEN** an initial exact apply has already written its exact target source
  but has not created its source-bound target-evidence record
- **THEN** retrying that same exact plan may finish only the existing State
  binding and return its ordinary render debt with zero provider calls
- **AND** any different source bytes, target evidence, or plan hard-stops rather
  than treating the current version as a fresh draft

#### Scenario: A page-plan input drifts before apply
- **WHEN** a Story Outline, Design Constraints, Visual Language registry, page-grouping
  candidate locator or bytes, source byte, target version, or plan hash differs
  from the previewed binding
- **THEN** publication stops before creating or mutating a target
- **AND** it returns the nearest action to regenerate and confirm the current
  plan rather than falling back to a prior source or plan
