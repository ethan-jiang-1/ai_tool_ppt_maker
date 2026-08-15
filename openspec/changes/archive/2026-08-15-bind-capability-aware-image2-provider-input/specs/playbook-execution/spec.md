## ADDED Requirements

### Requirement: Existing visual-system work obtains declared Image2 capability without a parallel Controller path

The existing `create-deck` visual-system source work SHALL be the Controller
location where the Agent obtains the Deck Author's one confirmed Image2
capability declaration when current provider-facing work needs it. The Agent
SHALL record that declaration only through the canonical provider-profile
source and the matching environment-owned runtime selector, then resume the
same owner checkpoint. It SHALL preserve the existing Style Master and Page
Image plan, authorization, generation, review, Task Mandate, and diagnostic
handoff owners.

The Controller SHALL not add a node, manifest entry, decision, gate, state
field, profile ledger, direct provider probe, approval, retry, fallback, or
parallel recovery route for this declaration. A pending/invalid source, runtime
mismatch, budget overflow, or stale plan remains the existing producer-owned
diagnostic/recovery boundary; the Controller consumes its one next action.

#### Scenario: Visual-system source work records the declaration once

- **WHEN** a current create-deck route needs Style Master or Page Image
  provider-facing planning and has no confirmed selected profile
- **THEN** the Agent obtains the Deck Author declaration during existing
  visual-system source work, records the source/runtime facts, and reruns the
  selected owner checkpoint
- **AND** it does not create a Controller node, change Task Mandate semantics,
  authorize provider work, or require a second cost confirmation

#### Scenario: Producer failure does not create a Controller branch

- **WHEN** a current profile, runtime, budget, or compiler/profile cutover
  failure reaches the Controller through a valid CLI diagnostic
- **THEN** the Controller follows the producer-issued action and retains the
  existing owner checkpoint after repair
- **AND** it does not infer profile facts, choose a replacement route, retry a
  request, or add state/controller recovery evidence
