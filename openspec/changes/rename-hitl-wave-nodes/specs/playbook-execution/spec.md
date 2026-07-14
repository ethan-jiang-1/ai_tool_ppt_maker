## MODIFIED Requirements

### Requirement: create-deck playbook covers complete deck creation

`create-deck.md` SHALL define the complete workflow for creating a new PPT from scratch. It SHALL use 11 nodes: instantiation, checkpoint-intake, setup, seed-topics, authoring-slides, composing-prompts, producing-deck, checkpoint-final-review, readiness, rerun, final. Node order SHALL be: instantiation → checkpoint-intake → setup → seed-topics → authoring-slides → composing-prompts → producing-deck → checkpoint-final-review → (rerun → seed-topics | readiness → final).

#### Scenario: User says "帮我做一个PPT"

- **WHEN** user requests a new PPT
- **THEN** COMMANDS.md routes to playbook `create-deck`
- **AND** Agent starts executing from node `instantiation`
