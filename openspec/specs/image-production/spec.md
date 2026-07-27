## Purpose

Define Image Production as the active Page Authority capability family.
## Requirements

### Requirement: Page Authority has one finalization Interface
Image Production SHALL expose one `page-authority-image2` adapter for a consistent Page Authority
source/state pair. Its only external final-slide publication Interface SHALL be `finalizePage(...)`,
which publishes a verified Pure raw image or a verified Framed composition. A caller SHALL not select a
retired adapter or alternate compositor route for this protocol.

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

### Requirement: Image production exposes one Page Authority adapter
The image-production public surface SHALL expose only the Page Authority adapter and its Pure/Framed
branches. Retired adapters SHALL not be exported, registered, or imported by an
active production caller.

#### Scenario: Production adapter inventory is inspected
- **WHEN** a current production caller imports image production
- **THEN** it can resolve Page Authority only
