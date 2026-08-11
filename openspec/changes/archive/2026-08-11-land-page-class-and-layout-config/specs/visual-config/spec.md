## ADDED Requirements

### Requirement: Page Image presentation is a closed version-resolved package

Visual Config SHALL resolve the version's Page Image presentation only from the
normal override-first/backbone-default source locations for these four files
under `visual-style/page-image-presentation/`: `page-class-catalog.yaml`,
`deck-defaults.yaml`, `pure-deck-visual-system.yaml`, and
`framed-header-profiles.yaml`. The four files form one closed package: the
catalog owns only the closed class set, default `standard`, and class-to-profile
identifiers; deck defaults own only workflow-neutral typography, colour roles,
and density; the other two files own only their respective workflow facts.

Each document SHALL declare one current unversioned source contract:
`pptmaker-page-image-class-catalog`, `pptmaker-page-image-deck-defaults`,
`pptmaker-pure-deck-visual-system`, or `pptmaker-framed-header-profiles`.
Those contracts belong to `layout-config`, not the visual-language registry;
they SHALL not use a revision/version marker or an undeclared schema value.

The resolver SHALL validate the full package before publishing a projection. It
SHALL require every catalog class to bind exactly one selected profile for each
current workflow and SHALL reject a missing, malformed, unknown,
cross-file-inconsistent, or cross-workflow fact before raw planning. It SHALL
not synthesize a profile, borrow a generated projection, use a previous plan,
or turn the Pure visual-system file into a shared registry.

#### Scenario: A complete package resolves both workflow bindings

- **WHEN** all four version-resolved source files have matching closed class and
  profile identifiers
- **THEN** Visual Config validates one complete package before dependent planning
- **AND** it retains separate Pure and Framed bindings for each class

#### Scenario: A package document has no current contract marker

- **WHEN** a selected package document omits, changes, or versions its declared schema contract
- **THEN** Visual Config reports the bounded source/configuration repair action
- **AND** it does not adopt a previous source shape or publish a projection

#### Scenario: A cross-file binding error stops at direct source

- **WHEN** a catalog class names a profile absent from its workflow-specific file
- **THEN** Visual Config reports the bounded source/configuration repair action
- **AND** it does not publish a projection, use an older generated value, or create lifecycle evidence

### Requirement: Page Class resolution publishes one isolated projection with provenance

For every normalized Page Source class and selected version workflow, Visual
Config SHALL resolve exactly one workflow-specific presentation projection. The
projection SHALL identify the normalized class, selected profile identifier,
and the deck-default or selected-profile origin of every inherited value. It
SHALL not merge a second class, accept a per-page geometry override, or expose
Pure zones or provider-facing facts to Framed callers; it SHALL not expose
Framed header geometry, local typography, or protected regions to Pure callers.

The resolved projection is an in-memory deterministic input to the current
owners. It SHALL NOT itself become a C5 per-page file, a source replacement,
provider result, review decision, approval, or parallel state record.

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

## MODIFIED Requirements

### Requirement: Framed Header Rendering Policy owns one transparent protected overlay

For workflow `framed`, Visual Config SHALL resolve the catalog-bound Framed
header profile for the page's normalized Page Class. The profile SHALL govern
only the permitted `kicker`, `title`, and `subtitle` set, deterministic local
typography, geometry, browser/capture profile, and a transparent-first local
overlay. It MAY supply profile-bound minimal contrast treatment but SHALL NOT
turn the protected area into an opaque card, a blank strip, a crop, or a general
local body renderer.

The selected profile SHALL emit protected geometry as a provider-facing
composition constraint and as a review guide. The protected geometry SHALL
require avoidance of provider-rendered text and key subjects while preserving a
full-canvas continuous provider page; it is not proof that the provider has
obeyed the constraint. Pure SHALL not receive a Framed header profile or
protected geometry.

Before compilation, the resolver SHALL compare the source receipt's non-null
Framed header literals with the selected profile's permitted field set. A
literal that the profile does not permit SHALL fail with the direct Page Source
repair action. The resolver SHALL NOT drop, rewrite, move to provider-visible
content, or infer a different Page Class for that literal.

#### Scenario: Framed frame fits only the local header

- **WHEN** a Framed source header is evaluated against its resolved Page Class profile
- **THEN** deterministic fit validates only the profile-permitted kicker, title,
  and subtitle literals under that canonical local profile
- **AND** provider-rendered body, labels, metrics, and callouts do not enter the
  local frame fit contract

#### Scenario: Protected geometry does not create a blank page band

- **WHEN** a Framed provider input is compiled from its resolved profile
- **THEN** it includes the profile's protected geometry as an avoidance
  constraint and review guide
- **AND** it does not instruct the provider to crop the canvas, leave a blank
  strip, or prohibit all page text

#### Scenario: A title-only class cannot silently lose a source subtitle

- **WHEN** a Framed `opening` profile permits only title and its source receipt
  contains a non-null subtitle
- **THEN** resolution stops with the field-level Page Source repair action before raw planning
- **AND** it does not omit the subtitle, pass it to the provider, or substitute another class

### Requirement: Pure deck visual system is a closed version-resolved source contract

For a current Pure Page Image Workflow run, Visual Config SHALL resolve
`pure-deck-visual-system.yaml` only from the version-resolved Page Image
presentation package using the canonical `runDir` supplied by the target
runtime. The record SHALL remain Pure-only and have a closed canonical shape
for class-addressable provider-facing typography hierarchy,
Style-Master-derived colour use, normalized page zones, whitespace rule, and
allowed layout families. It SHALL be content-neutral: it SHALL not carry slide
literals, claims, credentials, Framed-header facts, provider prompts, provider
output, review decision, or lifecycle state.

Visual Config SHALL expose only the validated immutable selected class
projection and its canonical binding to Pure callers. Framed SHALL not read,
inherit, or treat the Pure visual-system record or digest as a local-header
profile, protected geometry, or provider constraint.

#### Scenario: A current Pure source resolves one deck system

- **WHEN** a current Pure source page reaches planning with a valid
  version-resolved presentation package
- **THEN** Visual Config returns the one catalog-bound Pure projection for that page
- **AND** it does not use an unselected class profile as input

#### Scenario: Framed remains independent of the Pure system

- **WHEN** a current Framed source is prepared beside a valid Pure visual-system record
- **THEN** Framed retains its visual-language and resolved Header Rendering
  Policy inputs without the Pure record or digest
- **AND** it does not derive a local profile, protected zone, or input digest from that record
