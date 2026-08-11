## MODIFIED Requirements

### Requirement: Controllers create and resume only the current Page Image Workflow

The `create-deck` Controller SHALL obtain one human semantic choice, `framed`
or `pure`, for a new version before provider-facing work. It SHALL author the
schema-declared `page-image-workflow` source selection, configure common visual
semantics, and route to the selected Style Master lifecycle and Page Image
adapter. It SHALL not ask for per-slide authority or author a historical,
version-suffixed, migration, or compatibility selection.

#### Scenario: Controller authors a current workflow selection

- **WHEN** a Deck Author starts a new production version
- **THEN** the Controller records one declared current pipeline and selected
  workflow
- **AND** it does not create an alternative historical route

#### Scenario: A Framed deck has one straight selected route

- **WHEN** a Deck Author selects Framed for a current version
- **THEN** the Controller follows the existing selected Framed owner route
- **AND** it does not route through Pure or a historical branch

#### Scenario: A current resume preserves owner evaluation

- **WHEN** the Controller resumes a valid current production run
- **THEN** it obtains lifecycle facts from the existing owning evaluator
- **AND** it does not recreate them through compatibility logic
