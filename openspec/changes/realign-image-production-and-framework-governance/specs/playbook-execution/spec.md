## MODIFIED Requirements

### Requirement: Playbook lifecycle and methodology metadata are explicit
Every registered node SHALL declare lifecycle Phase `0|1|2|3|4|5` and one exact final method module
`00-setup|01-content|02-visual-system|03-html-production|04-image-production|05-iteration`.
Phase 3 owns complete HTML delivery. `04-image-production` owns the separate visual-slot and whole-page
adapters: visual-slot is disabled for `html-only`, required by `html-then-image2` completion, and requires
current HTML delivery; whole-page is legal only for `image2-only` and retains its direct authorization
and final-review owners. Phase 5 owns mode-aware iteration and compatibility routing, not Image
Production implementation. These annotations classify ownership only and SHALL NOT create a scheduling
or prerequisite rule.

#### Scenario: Visual-slot node is unambiguous
- **WHEN** the controller index inspects `image2-refine`
- **THEN** it declares its Image Production module, requires `html-then-image2`, and preserves disabled html-only work without executing it

#### Scenario: Whole-page node is unambiguous
- **WHEN** the graph resolves first-class `image2-only` production
- **THEN** its whole-page node declares `04-image-production` and is legal without HTML delivery
- **AND** it does not route through compatibility maintenance

## ADDED Requirements

### Requirement: Playbook adapter entry uses mode and dependency predicates
Controller legality SHALL use authoritative production mode and declared dependencies, never
method-module number. Whole-page entry SHALL remain independent of HTML delivery; visual-slot entry
SHALL require current HTML delivery and its existing authorization boundary. Existing public
workflow-inspection owner/action identifiers and CLI continuation fields SHALL remain their documented
compatibility values during this change; they are not evidence of a retired physical owner.

#### Scenario: Numeric module does not create a dependency
- **WHEN** a whole-page node is inspected for an `image2-only` run
- **THEN** it is legal without HTML node completion
