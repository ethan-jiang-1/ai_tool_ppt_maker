## ADDED Requirements

### Requirement: Active run-bundle tree guidance names the complete current visual source set

Active run-bundle tree guidance SHALL name the current Style Master iteration
history, current Style Master intent source, current Page Image visual-language
source, and current `pure-deck-visual-system.yaml` source locations. The Style
Master intent and visual-language sources remain distinct from the Page Image
presentation package; neither is replaced by the Pure-only source. The tree
remains a human-readable snapshot; `bundle_layout.mjs` and this capability
remain the current layout authorities.

#### Scenario: Maintainer reads the Run Bundle tree

- **WHEN** a maintainer consults active Charter or reference tree guidance
- **THEN** it can locate current Style Master history, intent, visual-language,
  and Pure visual-system sources with their distinct roles
- **AND** it does not replace one current source with another or create a
  competing layout authority
