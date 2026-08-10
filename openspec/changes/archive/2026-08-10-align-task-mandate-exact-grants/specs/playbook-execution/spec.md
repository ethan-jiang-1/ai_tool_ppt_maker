## MODIFIED Requirements

### Requirement: Page Image Workflow gates have one direct recovery and review path

Controller nodes SHALL treat source/state/receipt identity mismatch, closed
content-schema failure, invalid Style Master selection, stale compiled input,
invalid provider scope, stale/invalid Page Image Task Mandate, stale/invalid
page evidence, and final/delivery lineage mismatch as non-waivable hard-stops.
Each gate SHALL reuse the owning evaluator and present its one nearest legal
action. An active Task Mandate covers routine provider-free Pilot scope
selection, exact batch grant creation, and ordinary in-scope provider cost, so
those actions are Agent-run guides rather than repeated human confirmations.
Partial Pilot and Complete Page Review remain their own bounded human visual
decisions; neither is a substitute for an identity, mandate, grant, or
lifecycle fact.

When an in-scope source refinement or owner-issued successor creates a later
current exact grant at the same stable Framed/Pure authorize node, its typed
`cli` evidence supersedes only an earlier typed CLI grant projection at that
node. The immutable raw lineage remains historical evidence; a user decision,
malformed node record, unmatched node, or failed current grant fact SHALL NOT
be reset or superseded.

Complete Page Review SHALL use one `proceed` or `repair` decision. A Framed
node presents the exact raw provider page beside the production-equivalent
local-header composite; a Pure node presents its complete provider page. It
SHALL not add a second composite approval gate, let Pilot approval stand in for
complete-page acceptance, or expose sibling adapter controls.

#### Scenario: Routine exact grant remains Agent-run

- **WHEN** Workflow Inspection exposes a current mandate-covered Pilot or
  Expansion batch
- **THEN** the Controller carries the owner-issued exact scope through the
  registered grant and one-item generation operations without asking the human
  to re-authorize ordinary cost
- **AND** it records only owner/CLI evidence for that mechanical step

#### Scenario: A changed goal or explicit limit asks one real question

- **WHEN** the requested work targets a different Deck or goal, exceeds an
  explicit human limit, or needs a genuinely new consequential content or
  design direction
- **THEN** the Controller pauses normal mandate continuation and presents the
  smallest precise human decision before a replacement scope is established
- **AND** it does not use a prior Task Mandate to submit the changed work

#### Scenario: Framed review does not split its decision

- **WHEN** all current Framed page evidence is ready
- **THEN** the Controller presents raw and composite evidence under one
  Complete Page Review decision
- **AND** it does not require a later local-overlay approval

#### Scenario: Stale provider input returns to its owner

- **WHEN** a selected workflow reaches finalization with a stale compiled
  provider-input binding
- **THEN** the Controller routes to the owning rebuild action
- **AND** it does not publish a final slide, PPTX, notes, or delivery receipt

### Requirement: Current Controller refresh and Pilot paths preserve the Page Image model

Pilot remains a provider-free sample stage. Its `pilot` command creates only an
exact batch projection; an Agent acting under the active Task Mandate selects
the owner-allowed risk-representative formal IDs, then the same exact batch
receives its mandate-bound grant before `generate` is invoked. A partial Pilot
may present the same policy-specific page representation that Complete Page
Review will use, but it does not publish acceptance or add a duplicate review
gate. `pilot-review` and `pilot-accept` apply only to partial Pilot evidence;
complete current coverage goes directly to Complete Page Review. The Controller
SHALL use direct owner facts to determine any remaining paid work, not task-card
state or file presence.

A Framed provider-free local overlay refresh is permitted only when its owner
proves the compiled provider input, protected geometry, raw contract, and local
profile are unchanged. A changed header literal normally changes provider
context and routes to raw rebuild. Notes-only work remains delivery-owned;
structural or whole-workflow changes use previewed exact-hash versioning.

#### Scenario: Mandate-covered Pilot does not create a budget gate

- **WHEN** a current Framed or Pure plan has a valid Task Mandate and the
  Controller selects its risk-representative Pilot IDs
- **THEN** it records the exact Pilot batch and exact grant as Agent/owner work
  before one-item generation
- **AND** it asks the human only for the later Pilot visual decision, not a
  duplicate cost decision

#### Scenario: A Framed title change avoids false local refresh

- **WHEN** a Framed title literal changes
- **THEN** the Controller presents the owner-issued raw rebuild path
- **AND** it does not place the change on a provider-free Pilot or local
  overlay path

#### Scenario: Pilot remains non-accepting

- **WHEN** a mandate-bound Framed Pilot sample is available
- **THEN** the Controller presents its raw and composite sample representation
- **AND** it does not record final-page acceptance or open a second review
