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
compose final PNG bytes from accepted text-free native raw evidence and its
local Text Frame; the Pure adapter SHALL publish the accepted native raw PNG
bytes unchanged as final PNG bytes. Both SHALL publish the same
`page-authority-final-slide-manifest-v2` schema, bound to the source receipt,
accepted raw evidence, ordered stable IDs/positions, final byte hashes, and
actual final media dimensions, and workflow provenance.

Pure finalization SHALL retain the verified provider-native bytes, their actual
dimensions, and raw-byte digest exactly; it SHALL NOT crop, resize, transcode,
or otherwise normalize them. Framed finalization SHALL continue to own its
fixed local composition output and SHALL NOT present its local frame as a
repair of provider raw bytes.
The selected adapter SHALL NOT invoke or import its sibling adapter. A final
manifest SHALL NOT be published before exact accepted raw evidence is current,
and no workflow adapter SHALL publish a PPTX, notes receipt, or delivery review.

#### Scenario: Framed and Pure publish interchangeable delivery input

- **WHEN** valid target Framed and target Pure receipts each have current accepted raw evidence
- **THEN** their selected adapters each publish a valid v2 final-slide manifest with the same schema
- **AND** `05-delivery` can consume either manifest without an authority-specific caller contract

#### Scenario: Pure final preserves native provider bytes

- **WHEN** a Pure receipt finalizes accepted provider PNG evidence with positive
  native dimensions
- **THEN** each final PNG has the same bytes, dimensions, and digest as its
  accepted raw PNG
- **AND** the final manifest binds those unchanged final bytes in current order

#### Scenario: Non-default Pure dimensions reach delivery unchanged

- **WHEN** a Pure receipt finalizes accepted provider PNG evidence whose
  dimensions differ from `2048x1136`
- **THEN** its final manifest records those actual dimensions and delivery
  accepts the final bytes without normalization
- **AND** the resulting PPTX uses the image as a full-slide projection without
  changing the evidence bytes

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

### Requirement: Framed Pilot preview reuses the final composition contract

For a current Framed Pilot projection, Image Production SHALL use the same
private canonical frame compiler, browser evaluator, checked-in font inventory,
underlay validation, and capture profile that Framed finalization uses. It SHALL
produce preview-only evidence for the selected current Pilot tuples containing
both the exact text-free underlay and the production-equivalent Text Frame
composite. The caller SHALL not supply HTML, CSS, fonts, capture settings,
publication paths, alternate renderers, or a trusted proof result.

The Pilot publisher SHALL not write a final-slide manifest, final projection,
PPTX, notes receipt, accepted raw evidence, or delivery decision. A failed
Framed preflight or capture SHALL return the existing owning source,
environment, or Harness repair action before any Pilot decision is offered.

#### Scenario: Framed Pilot composition is production-equivalent but preview-only

- **WHEN** current selected Framed underlays enter a Pilot review projection
- **THEN** the adapter validates and captures the same composite contract used by finalization
- **AND** it publishes only Pilot evidence without creating final or delivery artifacts

#### Scenario: Pilot callers cannot select another renderer

- **WHEN** a Pilot caller supplies a renderer, HTML, CSS, font path, capture override, or output path
- **THEN** the Framed adapter rejects the request before browser setup
- **AND** it does not create evidence or fall back to a different renderer

### Requirement: Pilot evidence preserves selected-workflow isolation

The selected workflow adapter SHALL own the workflow-specific Pilot
contribution. Pure Pilot evidence SHALL present the exact current raw image
bytes as the selected workflow's content for all final pixels, with identity
and plan/profile bindings, and SHALL not invoke, import, or expose Framed
composition, Text Frame, safe-zone, or underlay semantics. Shared production
mechanics may validate generic coverage and labels but SHALL not decide Pilot
visual quality for either workflow.

#### Scenario: Pure Pilot has no Framed semantics

- **WHEN** a current Pure Pilot projection is prepared
- **THEN** it contains exact current raw image bytes and generic identity
  evidence only
- **AND** no Framed compositor, safe-zone guide, or Text Frame contribution is used

#### Scenario: Sibling workflow cannot publish Pilot evidence

- **WHEN** a Framed run is passed to a Pure Pilot publisher or a Pure run is passed to a Framed Pilot publisher
- **THEN** the selected-workflow check hard-stops before artifact publication
- **AND** the owner does not delegate to the sibling adapter

### Requirement: Production final files use NN_slideID naming

The final-slide manifest SHALL name each production file `NN_slideID.png`,
where `NN` is the item's current `position` zero-padded to two digits and
`slideID` is the stable mnemonic `slide_id`. The final manifest validator SHALL
require this exact path shape, and PPTX assembly SHALL consume it. `slide_id`
remains the cross-version identity inside the filename; `NN` is only the current
position projection and changes with reordering.

#### Scenario: Final files carry position prefix

- **WHEN** a final manifest is created for ordered slides with positions 1..N
- **THEN** each item path is `NN_slideID.png` in position order
- **AND** the validator accepts those exact paths

#### Scenario: Non-prefixed final path is rejected

- **WHEN** a final manifest item path is not `NN_slideID.png` (for example
  `${slide_id}.png` only)
- **THEN** the final manifest validator reports an invalid item
- **AND** assembly does not accept the manifest
