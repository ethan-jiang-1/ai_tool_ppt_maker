## ADDED Requirements

### Requirement: Create-deck authoring starts with narrative source before page source
The create-deck Controller SHALL guide a Deck Author through Story Outline and
Design Constraints before it asks the Agent to materialize canonical
`slide-specifications.md`. It SHALL obtain the selected workflow and Visual
Language through their existing owners, then present the provenance-carrying
page plan before the page source is published.

The Controller SHALL keep content meaning and conversational explanation with
the Deck Author and Agent. It SHALL delegate parsing, plan identity, source
publication, state, and diagnostic facts to their current runtime owners, and
it SHALL NOT add a second controller node state, page-plan ledger, or provider
authorization path.

#### Scenario: A new deck reaches page authoring
- **WHEN** a new-deck request has passed intake and has current narrative
  sources, a selected workflow, and selected Visual Language
- **THEN** the Controller presents the resulting page plan before canonical
  page source is materialized
- **AND** it does not skip from topical intake directly to provider-facing work

#### Scenario: The author changes the story during creation
- **WHEN** the Deck Author revises the argument or constraints before accepting
  the page plan
- **THEN** the Controller returns to the narrative planner and presents one
  updated plan
- **AND** it does not write a page source, create provider work, or ask for a
  redundant authorization

