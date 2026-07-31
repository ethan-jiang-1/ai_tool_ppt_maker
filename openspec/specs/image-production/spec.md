## Purpose

Define Image Production as the active Page Authority capability family.
## Requirements
### Requirement: Page Authority has one finalization Interface
For the exact TARGET `page-authority-image2-v2` / `image2-page-authority-v2` pair, the selected workflow adapter SHALL be the only final-slide publisher. It SHALL publish the common v2 final-slide manifest and shall not route a receipt through another protocol adapter or alternate compositor. A marker/state mismatch or stale raw evidence SHALL stop before final-slide publication.

#### Scenario: Raw acceptance is required before publication
- **WHEN** a reviewable target raw projection has no decision
- **THEN** finalization returns the raw-review `confirm` action without publication
- **AND** invalid or stale raw evidence hard-stops final-slide publication

#### Scenario: TARGET finalization selects one workflow publisher
- **WHEN** a valid TARGET source/state pair has workflow `framed` or `pure`
- **THEN** only its matching workflow adapter may publish the v2 final-slide manifest
- **AND** it does not invoke another-protocol or sibling workflow adapter

### Requirement: Framed compositor is a private evidence-bound adapter

The private Framed adapter SHALL own one canonical frame compiler and browser evaluator used for both
plan-time proof and final composition. It SHALL derive its document only from the normalized Framed
preset, current Text Frame, canonical render profile, and verified full-canvas underlay. Final
composition SHALL require current accepted raw evidence whose Framed raw contract binds that same
render profile, and SHALL repeat layout, font, geometry, network, and capture checks before publication.

Callers SHALL NOT supply or attest HTML, CSS, asset paths, font paths, capture options, publication
roots, preflight results, composition callbacks, alternate renderers, or legacy artifacts. The adapter
SHALL return final bytes for an entire bounded batch only after every page passes; it SHALL NOT publish
a partial final manifest when any page fails.

#### Scenario: Caller cannot introduce a second renderer
- **WHEN** a caller supplies HTML, CSS, capture configuration, a trusted preflight object, or a composition callback to Framed finalization
- **THEN** composition rejects the input before browser setup
- **AND** no final artifact is published

#### Scenario: Final profile drift stops publication

- **WHEN** accepted underlay evidence binds a render profile different from the current canonical profile
- **THEN** Framed finalization returns the owning Generated Image Rebuild hard-stop
- **AND** it does not rebind the underlay or publish a partial final manifest

#### Scenario: Final composition repeats the accepted evaluator

- **WHEN** current accepted underlay evidence and current Text Frames enter Framed finalization
- **THEN** the adapter compiles and evaluates the same canonical frame contract used at planning
- **AND** only a completely successful batch may publish final PNG bytes and the common manifest
### Requirement: TARGET workflow adapters publish one common final-slide manifest

For a current `page-authority-image2-v2` source receipt, the selected workflow
adapter SHALL be the only final-slide publisher. The Framed adapter SHALL
compose final PNG bytes from accepted text-free raw evidence and its local Text
Frame; the Pure adapter SHALL publish accepted raw image bytes as final
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

### Requirement: Image production resolves only selected v2 workflow owners
Image Production SHALL resolve an exact v2 source/state pair marker-first to the selected `03-framed-image` or `04-pure-image` adapter followed by shared `05-delivery`. A non-v2, partial, hybrid, or mismatched pair SHALL not resolve an adapter, writer, receipt initializer, or finalization path; it receives the owning unsupported-protocol or identity hard-stop.

#### Scenario: Production adapter inventory is inspected
- **WHEN** a production caller presents a v2 source/state pair
- **THEN** it resolves only the declared selected workflow owner
- **AND** no non-v2 adapter is exported, registered, or imported
