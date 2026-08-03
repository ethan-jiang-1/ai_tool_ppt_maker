## ADDED Requirements

### Requirement: Redundant terminal attempt history has one safe effective projection

Image Generation SHALL derive Page Authority progressive progress, grant
consumption, live claims, and the next owner action from direct immutable
attempt records. When one exact submitted attempt has exactly two direct
terminal children, one `known_failure` and one `unknown`, and both children
are otherwise valid, terminal, childless transitions for the same immutable
attempt identity, Image Generation SHALL retain both records unchanged while
using the `known_failure` child as that attempt's sole effective terminal
projection. The redundant `unknown` child SHALL not be treated as current,
live, materialized, reusable, or a reason to consume another submission.

Every other attempt branch, including a branch containing `succeeded`, a
nonterminal child, a foreign or malformed transition, a child with its own
descendant, a cycle, or more than the two defined terminal children, SHALL
remain an integrity hard-stop. It SHALL not be repaired by a CLI flag, a human
waiver, provider lookup, resubmission, attempt rewrite, or durable repair
record. The existing direct owner evaluator remains the single source for
inspection, generation preflight, reconciliation, and progress projections.

#### Scenario: A redundant unknown does not block a newer exact reconciliation

- **WHEN** historical direct records contain one valid submitted parent with
  childless `known_failure` and `unknown` terminal children, and a newer exact
  item attempt is submitted without a provable outcome
- **THEN** the owner derives the historical item as `known_failure` and exposes
  only the existing exact reconciliation action for the newer submitted attempt
- **AND** it creates no provider call, replacement grant, materialization,
  accepted evidence, or mutation of either historical terminal record

#### Scenario: Success-conflicting branch remains a hard-stop

- **WHEN** a submitted parent has a branch that contains `succeeded`, a
  nonterminal child, an additional child, a descendant, a foreign identity, or
  another malformed transition
- **THEN** the owner hard-stops on the attempt-history integrity failure before
  progress, authorization, reconciliation, or provider work can advance
- **AND** no continuation, force option, inferred terminal result, or record
  rewrite is available

#### Scenario: Existing single-terminal history remains unchanged

- **WHEN** every submitted attempt has one valid direct terminal child or one
  current unresolved submitted record
- **THEN** the owner preserves its existing terminal and reconciliation
  behavior
- **AND** it does not create an additional derived state or alternate recovery
  path
