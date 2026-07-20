## MODIFIED Requirements

### Requirement: playbook/ directory contains the registered MD controllers

`playbook/` SHALL contain eleven active ordered MD Controllers: the existing ten controllers plus `image2-refine.md`, and shared node `classify-change.md`. `legacy-image2-maintenance` remains markerless Phase 5; `probe-image-channels` remains Phase 0. `image2-refine` SHALL serve only a marked HTML-first run with current `html-delivery-review: proceed`, and SHALL not be entered by fresh create, ordinary local iteration, or markerless maintenance.

#### Scenario: Agent lists available controllers
- **WHEN** the playbook index is built
- **THEN** it contains eleven ordered controllers, including optional modern refinement and legacy maintenance as distinct owners

#### Scenario: HTML deck selects legacy controller
- **WHEN** an HTML-first run attempts to enter `legacy-image2-maintenance`
- **THEN** entry validation fails with a pipeline-ownership diagnostic

### Requirement: Playbook lifecycle and methodology metadata are explicit

Every registered node SHALL declare lifecycle Phase `0|1|2|3|4|5` and one exact final method module. Phase 3 owns complete HTML delivery; Phase 4 owns only the optional `image2-refine` lifecycle after current delivery; Phase 5 owns legacy whole-page maintenance; provider channel probing remains Phase 0. No other controller/node may declare Phase 4 or import its private transport.

#### Scenario: Optional refinement node is unambiguous
- **WHEN** the controller index inspects an `image2-refine` execution node
- **THEN** it declares lifecycle 4/module `04-image2-refinement` and requires current HTML delivery evidence

#### Scenario: Legacy route keeps its owner
- **WHEN** the graph resolves markerless maintenance
- **THEN** it remains Phase 5 and does not enter modern refinement
