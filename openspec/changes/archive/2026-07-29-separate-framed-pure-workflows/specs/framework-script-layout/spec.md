## ADDED Requirements

### Requirement: TARGET script layout enforces sibling adapters and shared semantic boundaries

The target script inventory SHALL give `03-framed-image` and `04-pure-image`
separate adapter ownership. The Framed adapter SHALL be the only target caller
of its capture/font/denied-network/timeout/cleanup runtime seam; the Pure
adapter SHALL own Pure raw-to-final publication. Neither sibling SHALL import
the other or its `internal/` modules.

Shared raw mechanics SHALL consume typed raw plans/evidence without Framed
Text Frame, no-text, reserved-rectangle, Pure display, or refresh-policy
semantics. `05-delivery` SHALL consume the common final-slide manifest and
shall not publish different PPTX, notes, or delivery behavior by workflow. The
checked-in architecture inventory and source-to-test mapping SHALL validate
these boundaries and every direct executable's current owner.

#### Scenario: Architecture validation finds a sibling import

- **WHEN** a target Framed module imports a target Pure module or its private internal path
- **THEN** architecture validation fails the ownership boundary
- **AND** it does not accept the import as a convenience fallback

#### Scenario: Shared delivery consumes either target provenance

- **WHEN** `05-delivery` receives valid Framed and Pure final-slide manifests
- **THEN** it validates and delivers both through the same manifest/PPTX/notes/review interface
- **AND** its behavior does not branch on workflow semantics
