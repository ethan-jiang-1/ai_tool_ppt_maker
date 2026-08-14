## RENAMED Requirements

- FROM: `### Requirement: Current adapters preserve sibling locality and no legacy imports`
- TO: `### Requirement: Current adapters preserve sibling locality and declared imports`

## MODIFIED Requirements

### Requirement: Current adapters preserve sibling locality and declared imports

`03-framed-image` SHALL be the sole current owner of the deterministic local
header renderer and its private browser/font/capture seam. `04-pure-image`
SHALL be the sole owner of Pure final publication. Neither sibling SHALL import
the other or its private modules, and neither SHALL create a second renderer,
delivery route, prompt compiler, or recovery route.

Active adapter, shared-runtime, controller-observation, and process modules
SHALL NOT import or dispatch an undeclared adapter, marker decoder,
source/receipt initializer, evidence reader, converter, migration, or
compatibility implementation. A current architecture guard SHALL reject such
an import before it can become a production route.

#### Scenario: Shared seam does not create a sibling import

- **WHEN** architecture validation inspects a current Framed or Pure module
- **THEN** it permits only the explicit shared Page Image Core seam and owned
  private dependencies
- **AND** it rejects an import of the sibling adapter, undeclared
  implementation, or sibling private module
