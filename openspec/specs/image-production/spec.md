## Purpose

Define Image Production as the active Page Authority capability family.
## Requirements
### Requirement: Page Authority has one finalization Interface

For the exact CURRENT `page-authority-image2-v1` /
`image2-page-authority` pair, Image Production SHALL retain the one
`page-authority-image2` adapter and its `finalizePage(...)` final-slide
publication interface. It SHALL continue to publish verified Pure raw images
or verified Framed compositions through that bounded v1 lifecycle.

For the exact TARGET `page-authority-image2-v2` /
`image2-page-authority-v2` pair, the selected workflow adapter is the only
final-slide publisher. It SHALL publish the common v2 final-slide manifest and
shall not route a target receipt through the v1 adapter or an alternate
compositor. A marker/state mismatch or stale raw evidence SHALL stop before
final-slide publication.

#### Scenario: Mixed authorities share finalization

- **WHEN** valid CURRENT Pure and Framed evidence reaches v1 finalization
- **THEN** both final slides are published through the v1 `finalizePage(...)` interface
- **AND** the v1 adapter does not infer a TARGET workflow

#### Scenario: Raw acceptance is required before publication

- **WHEN** a reviewable current raw projection has no decision
- **THEN** finalization returns the raw-review `confirm` action without publication
- **AND** invalid or stale raw evidence hard-stops v1 or v2 final-slide publication

#### Scenario: TARGET finalization selects one workflow publisher

- **WHEN** a valid TARGET source/state pair has workflow `framed` or `pure`
- **THEN** only its matching workflow adapter may publish the v2 final-slide manifest
- **AND** it does not invoke the v1 adapter or the sibling workflow adapter

### Requirement: Framed compositor is a private evidence-bound adapter
The private Framed compositor SHALL accept only a verified full-canvas underlay, preflight-fit Text
Frame, composition receipt, and `framed-runtime` evidence. It SHALL reject caller CSS, markup, asset
paths, capture options, publication roots, and legacy artifacts.

#### Scenario: Caller cannot introduce a second renderer
- **WHEN** a caller supplies HTML, CSS, or capture configuration to Framed finalization
- **THEN** composition rejects the input before browser setup
- **AND** no final artifact is published

### Requirement: Image production exposes one Page Authority adapter

Image Production SHALL expose the bounded CURRENT v1 `page-authority-image2`
adapter only for an exact v1 pair. For TARGET, it SHALL expose the selected
`03-framed-image` or `04-pure-image` workflow adapter through marker-first
resolution, followed by the shared `05-delivery` interface. Retired adapters
shall not be exported, registered, or imported by an active production caller.

#### Scenario: Production adapter inventory is inspected

- **WHEN** a current production caller presents an exact v1 or v2 source/state pair
- **THEN** it resolves only the adapter or workflow owner declared for that pair
- **AND** it does not select a retired adapter, generic fallback, or conflicting sibling

### Requirement: TARGET workflow adapters publish one common final-slide manifest

For a current `page-authority-image2-v2` source receipt, the selected workflow
adapter SHALL be the only final-slide publisher. The Framed adapter SHALL
compose final PNG bytes from accepted text-free raw evidence and its local Text
Frame; the Pure adapter SHALL publish accepted full-page raw bytes as final
PNG bytes. Both SHALL publish the same
`page-authority-final-slide-manifest-v2` schema, bound to the source receipt,
accepted raw evidence, ordered stable IDs/positions, final byte hashes, and
workflow provenance.

The selected adapter SHALL NOT invoke or import its sibling adapter. A final
manifest SHALL NOT be published before exact accepted raw evidence is current,
and no workflow adapter SHALL publish a PPTX, notes receipt, or delivery review.

#### Scenario: Framed and Pure publish interchangeable delivery input

- **WHEN** valid target Framed and target Pure receipts each have current accepted raw evidence
- **THEN** their selected adapters each publish a valid v2 final-slide manifest with the same schema
- **AND** `05-delivery` can consume either manifest without an authority-specific caller contract

#### Scenario: Wrong workflow finalization is rejected

- **WHEN** a Pure receipt is presented to the Framed adapter or a Framed receipt is presented to the Pure adapter
- **THEN** the adapter rejects the wrong workflow ownership before writing final output
- **AND** it does not delegate to or import the sibling adapter as a fallback
