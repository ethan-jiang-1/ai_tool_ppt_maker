## MODIFIED Requirements

### Requirement: CLI success reports are structured owner results

Every current direct CLI success SHALL be produced by one command owner result
object that carries a schema/version, the operation identifier, a bounded
`state` classification (`success`, `partial-effect`, `no-op`, or `failure`),
and the command's business `effect` facts. Text and JSON are two renderers of
that one result; a renderer SHALL NOT own or re-derive business facts.

In JSON mode the command SHALL emit exactly one registered report document on
stdout — no progress text, prose, or unregistered fields. A mutating command
(`new-version`, `build`, `refresh`, `image2`, `style-master`) SHALL distinguish
success, partial-effect, no-op, and failure so a consumer can act on the exact
effect that occurred. A non-zero exit SHALL still place the single secret-safe
envelope on the last non-empty stderr line; the stdout report relationship is
defined per operation and SHALL NOT leak incidental JSON.

When an `image2` mutation has already persisted its owner effect and the
subsequent progressive-checkpoint cursor projection then fails, the command
SHALL report `partial-effect` with the persisted owner effect and the failed
projection as separate fields. It SHALL NOT classify that pair as `internal`,
SHALL NOT emit `report_internal`, and SHALL NOT imply the owner write rolled
back. Recovery SHALL name the owner-issued inspection action, not hand-edit of
`_state`. This requirement does not change Style Master handoff scope.

#### Scenario: A renderer never owns a business fact

- **WHEN** one command owner result feeds both the text and JSON renderers
- **THEN** changing a fact in the owner result changes both renderers
  consistently
- **AND** no renderer re-derives the operation, effect class, or diagnostic
  from its own prose

#### Scenario: JSON mode emits exactly one registered document

- **WHEN** a current command runs with `--json`
- **THEN** stdout contains exactly one schema-valid registered report document
- **AND** it does not mix in progress lines, incidental JSON, or human prose

#### Scenario: A partial mutation is distinguishable

- **WHEN** a mutating command completes its delivery but a subsequent effect
  (such as the current task-projection refresh) fails
- **THEN** the owner result records the delivery effect and the failed effect
  as separate fields
- **AND** the renderer reports `partial-effect`, not a bare failure or success

#### Scenario: Image2 owner success with failed cursor projection is partial-effect

- **WHEN** `image2 plan` or `image2 generate` has already persisted its owner
  records and `recordTargetProgressiveCheckpointCliHandoff` then fails
- **THEN** the command reports `partial-effect` with the persisted owner
  effect and the failed cursor projection as separate fields
- **AND** the envelope is not `internal` / `report_internal` and does not
  claim the owner write was rolled back
