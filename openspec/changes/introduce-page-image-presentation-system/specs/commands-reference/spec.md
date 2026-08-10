## MODIFIED Requirements

### Requirement: Commands route current Page Image changes by compiled-input ownership

Active command guidance SHALL route Framed, Pure, notes-only, and structural
requests through one V2 Page Image ownership and invalidation model. A non-V2
input receives only `unsupported-protocol/export`; it SHALL not be presented as
production, inspection continuation, migration, or fallback work.

For a V2 run, guidance SHALL route a selected-presentation, Page Class, Deck
Baseline, or selected-profile change to raw rebuild; an unselected profile edit
does not stale unrelated pages. It shall retain existing owner-valid local
Framed refresh, notes-only refresh, and previewed exact-hash structural paths
only where their existing proof prerequisites remain satisfied.

#### Scenario: A V2 Page Class edit is routed to its true owner

- **WHEN** a person changes one V2 slide's Page Class
- **THEN** guidance routes the selected slide to raw rebuild and Complete Page
  Review through its selected workflow
- **AND** it does not offer a local geometry edit or alternate protocol

#### Scenario: Non-V2 input is not offered as a route

- **WHEN** command guidance encounters a non-V2 source/state pair
- **THEN** it reports the one generic export hard-stop
- **AND** it does not infer workflow, decode history, or create a receipt

#### Scenario: A user changes a Framed header literal

- **WHEN** a person changes a required V2 Framed kicker, title, or subtitle
- **THEN** guidance classifies the changed provider context and routes to raw
  rebuild unless the existing exact compiled-input-preservation proof holds
- **AND** it does not treat a local overlay as semantic authority

#### Scenario: A user requests a workflow switch

- **WHEN** a person requests V2 Framed-to-Pure or Pure-to-Framed change
- **THEN** guidance routes it through previewed exact-hash structural versioning
- **AND** it does not describe in-place State mutation or acceptance reuse
