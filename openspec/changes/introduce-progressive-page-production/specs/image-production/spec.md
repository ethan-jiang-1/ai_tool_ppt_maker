## ADDED Requirements

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
environment, or framework repair action before any Pilot decision is offered.

#### Scenario: Framed Pilot composition is production-equivalent but preview-only

- **WHEN** current selected Framed underlays enter a Pilot review projection
- **THEN** the adapter validates and captures the same composite contract used by finalization
- **AND** it publishes only Pilot evidence without creating final or delivery artifacts

#### Scenario: Pilot callers cannot select another renderer

- **WHEN** a Pilot caller supplies a renderer, HTML, CSS, font path, capture override, or output path
- **THEN** the Framed adapter rejects the request before browser setup
- **AND** it does not create evidence or fall back to a different renderer

### Requirement: Pilot evidence preserves selected-workflow isolation

The selected workflow adapter SHALL own the workflow-specific Pilot contribution.
Pure Pilot evidence SHALL present the exact current raw full-page bytes with
identity and plan/profile bindings and SHALL not invoke, import, or expose
Framed composition, Text Frame, safe-zone, or underlay semantics. Shared
production mechanics may validate generic coverage and labels but SHALL not
decide Pilot visual quality for either workflow.

#### Scenario: Pure Pilot has no Framed semantics

- **WHEN** a current Pure Pilot projection is prepared
- **THEN** it contains exact full-page raw bytes and generic identity evidence only
- **AND** no Framed compositor, safe-zone guide, or Text Frame contribution is used

#### Scenario: Sibling workflow cannot publish Pilot evidence

- **WHEN** a Framed run is passed to a Pure Pilot publisher or a Pure run is passed to a Framed Pilot publisher
- **THEN** the selected-workflow check hard-stops before artifact publication
- **AND** the owner does not delegate to the sibling adapter
