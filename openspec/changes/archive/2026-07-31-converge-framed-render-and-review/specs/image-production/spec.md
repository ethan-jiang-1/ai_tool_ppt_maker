## MODIFIED Requirements

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
