## MODIFIED Requirements

### Requirement: Page Class resolution publishes one isolated projection with provenance

For every normalized Page Source class and selected version workflow, Visual
Config SHALL resolve exactly one workflow-specific presentation projection. The
projection SHALL identify the normalized class, selected profile identifier,
and the deck-default or selected-profile origin of every inherited value. It
SHALL not merge a second class, accept a per-page geometry override, or expose
Pure zones or provider-facing facts to Framed callers; it SHALL not expose
Framed header geometry, local typography, or protected regions to Pure callers.

The resolved projection is the deterministic input to the current owners. At
the exact provider-free `image2 plan` publication checkpoint, it SHALL be
serializable once as that page's derived `page-layout`, preserving the selected
workflow, binding digest, and value-level provenance. The published layout is
not an input to resolution or adapter compilation, and SHALL not become a
source replacement, provider result, review decision, approval, or parallel
state record. A missing or invalid projection prevents the dependent plan
publication; it SHALL not be replaced with a prior generated layout.

#### Scenario: A special class resolves one Framed treatment

- **WHEN** a Framed page with `PAGE CLASS: opening` reaches Visual Config
- **THEN** it receives exactly the catalog-bound Framed profile and provenance
  for its inherited values
- **AND** it does not receive a Pure profile or an undeclared one-off treatment

#### Scenario: A Pure projection cannot inherit Framed facts

- **WHEN** a Pure page resolves a valid class
- **THEN** its projection contains only the catalog binding, workflow-neutral
  defaults, and selected Pure facts
- **AND** a Framed header region or local-header setting is rejected rather than copied into it

#### Scenario: Publication preserves a Framed projection without making it authority

- **WHEN** a Framed page's valid selected projection is published at `image2 plan`
- **THEN** its `page-layout` identifies only that page's selected profile,
  workflow-isolated facts, binding digest, and value provenance
- **AND** later compilation continues from the resolver rather than reading the
  published file
