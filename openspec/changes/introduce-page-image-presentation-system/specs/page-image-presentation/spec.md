## ADDED Requirements

### Requirement: V2 Page Image Presentation System resolves one closed package

For a V2 `page-authority-image2-v2` run, the Page Image Presentation System
SHALL resolve exactly four source documents from the fixed version-resolved
`visual-style/page-image-presentation/` package: `page-classes.yaml`,
`deck-baseline.yaml`, `pure-profiles.yaml`, and
`framed-header-profiles.yaml`. Each selected file SHALL use normal
override-first/backbone-default selection; the four files SHALL validate as one
closed, direct, alias-free package before a receipt, presentation, or raw
contract is published.

The package SHALL declare exactly `standard`, `opening`, `transition`, and
`closing`, with `standard` as default, one Deck Baseline, Pure profile records,
and Framed Header Profile records. It SHALL not carry slide literals, provider
prompt prose, generated pixels, lifecycle State, credentials, or caller paths.

#### Scenario: A complete V2 package resolves from normal source ownership

- **WHEN** a V2 version overrides one fixed presentation file and remaining
  files resolve from backbone
- **THEN** planning resolves one validated package with a canonical digest
- **AND** it does not read a generated projection or arbitrary configuration
  path

#### Scenario: An incomplete package stops before derived work

- **WHEN** a selected file is missing, malformed, escapes its owner, or refers
  to an absent profile
- **THEN** planning emits the owning source/configuration repair before receipt
  publication, raw planning, authorization, or provider work
- **AND** it does not synthesize a fallback from code or generated evidence

### Requirement: A Page Class selects one workflow-isolated presentation

The system SHALL normalize every V2 slide to one Page Class and combine the
Deck Baseline with its selected profile into immutable
`pptmaker-resolved-page-presentation-v1` data. The record SHALL include the
normalized class and provenance, selected profile identity, inherited baseline,
selected workflow projection, source bindings, and selected-presentation
SHA-256 digest.

For `pure`, the projection SHALL contain only the selected Pure full-page
treatment. For `framed`, it SHALL contain only the selected Header Profile,
including fixed header fields and Reserved Header Region. A class SHALL NOT
change the version's workflow, expose a sibling-workflow subtree, admit
slide-authored coordinates, or create a review-time override.

#### Scenario: The same class projects differently without workflow change

- **WHEN** a `transition` page is planned once in a V2 Pure version and once
  in a V2 Framed version
- **THEN** both retain the same normalized Page Class but each exposes only its
  workflow-appropriate projection
- **AND** neither projection contains sibling-workflow facts

#### Scenario: The opening treatment remains a class treatment

- **WHEN** a V2 Framed `opening` class selects the title-only Header Profile
- **THEN** the resolved presentation exposes that fixed profile and Reserved
  Header Region
- **AND** the slide cannot add another header field, local coordinate, or
  alternate profile

### Requirement: Selected presentation semantics have selected-only invalidation

The selected-presentation digest SHALL bind normalized Page Class, selected
package records, inherited Deck Baseline, and selected workflow projection. A
class, baseline, or selected-profile change SHALL require a new raw contract
and Complete Page Review. An unselected class or sibling profile change SHALL
not stale a page.

#### Scenario: Reclassifying a V2 page invalidates only that page

- **WHEN** canonical source changes one stable slide ID from `standard` to
  `closing`
- **THEN** that page's selected-presentation digest changes and prior raw work
  is no longer current
- **AND** unchanged pages retain their selected-presentation digests

#### Scenario: An unselected profile edit does not stale a standard page

- **WHEN** a package changes only the `transition` Framed Header Profile while
  a page resolves `standard`
- **THEN** the standard page retains its selected-presentation digest
- **AND** planning does not claim selected-presentation drift for that page

### Requirement: Initial V2 profile mappings preserve existing visual treatments

The seeded V2 package SHALL map `standard`, `opening`, `transition`, and
`closing` to the Pure `baseline` profile. That profile SHALL preserve the
existing Pure title zone `{ x: 0.08, y: 0.08, width: 0.84, height: 0.22 }`,
content zone `{ x: 0.08, y: 0.34, width: 0.84, height: 0.54 }`, `generous`
density, and `editorial-hero`, `diagram-led`, and `data-led` layout families.
The Deck Baseline SHALL preserve the existing provider typography and
colour-role vocabulary.

For Framed, `standard`, `transition`, and `closing` SHALL select the `standard`
Header Profile. It preserves the existing canvas, font families, colour and
contrast treatment, Header Region, and kicker/title/subtitle bounds.
`opening` SHALL select `opening-title-only`, which retains those shared canvas,
theme, Header Region, and title bounds but permits and requires only `title`.
No initial profile may add a novel geometry, body owner, or visual treatment.

#### Scenario: Seeded V2 mappings do not introduce a new visual language

- **WHEN** initialization creates the V2 presentation package
- **THEN** all classes resolve to the specified baseline Pure facts and mapped
  Framed profiles
- **AND** the Framed opening differs only by omission of kicker and subtitle

#### Scenario: Later profile design remains version-scoped

- **WHEN** a version changes a profile or class mapping through canonical
  package source
- **THEN** only slides whose selected projection changes are invalidated
- **AND** a slide cannot override that mapping, geometry, or workflow directly
