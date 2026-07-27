## Purpose

Define Image Production as the active capability family with separate whole-page and visual-slot adapters.
## Requirements
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

### Requirement: Page Authority has one finalization Interface
Image Production SHALL expose one `page-authority-image2` adapter for a consistent Page Authority
source/state pair. Its only external final-slide publication Interface SHALL be `finalizePage(...)`,
which publishes a verified Pure raw image or a verified Framed composition. A caller SHALL not select a
header-lock, HTML-delivery, visual-slot, or alternate compositor route for this protocol.

#### Scenario: Mixed authorities share finalization
- **WHEN** valid Pure and Framed evidence reaches finalization
- **THEN** both final slides are published through `finalizePage(...)`

#### Scenario: Raw acceptance is required before publication
- **WHEN** a reviewable current raw projection has no decision
- **THEN** finalization returns the raw-review `confirm` action without publication
- **AND** invalid or stale raw evidence hard-stops publication

### Requirement: Framed compositor is a private evidence-bound adapter
The private Framed compositor SHALL accept only a verified full-canvas underlay, preflight-fit Text
Frame, composition receipt, and `framed-runtime` evidence. It SHALL reject caller CSS, markup, asset
paths, capture options, publication roots, and legacy artifacts.

#### Scenario: Caller cannot introduce a second renderer
- **WHEN** a caller supplies HTML, CSS, or capture configuration to Framed finalization
- **THEN** composition rejects the input before browser setup
- **AND** no final artifact is published
