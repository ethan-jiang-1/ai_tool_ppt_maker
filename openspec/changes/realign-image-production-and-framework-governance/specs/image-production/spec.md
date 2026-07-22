## ADDED Requirements

### Requirement: Image Production has explicit whole-page and visual-slot adapters
The framework SHALL expose `04-image-production` as a capability family with separate `whole-page` and `visual-slot` public adapters. `image2-only` SHALL enter only whole-page production; `html-then-image2` SHALL enter visual-slot only after current HTML delivery. Directory number SHALL NOT determine legality or final-page authority.

#### Scenario: Image2-only starts whole-page work
- **WHEN** a consistent `image2-only` run enters production from visual-system work
- **THEN** it reaches the whole-page adapter without HTML-delivery prerequisite
- **AND** visual-slot state is not created

#### Scenario: Visual-slot lacks current delivery
- **WHEN** an `html-then-image2` run lacks current HTML delivery
- **THEN** visual-slot entry returns its owner prerequisite action
- **AND** no provider attempt or adapter state is written
