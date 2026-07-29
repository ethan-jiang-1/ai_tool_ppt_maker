## MODIFIED Requirements

### Requirement: Direct executables have explicit current ownership
Every direct executable SHALL be listed in the checked-in inventory and resolve through an allowed current v2/shared interface. The inventory SHALL not register a retired production executable, compatibility interface, v1 new-authoring interface, v1 receipt writer, or migration runtime.

#### Scenario: Inventory is checked
- **WHEN** architecture validation scans the script root
- **THEN** every executable has an approved current owner and source-to-test entry

#### Scenario: Retired interface is absent
- **WHEN** the checked-in script and ownership inventories are validated
- **THEN** no registered interface or source-to-test owner resolves to a compatibility or v1 path
- **AND** no current executable dispatches to a retired protocol

### Requirement: TARGET script layout enforces sibling adapters and shared semantic boundaries
The target script inventory SHALL give `03-framed-image` and `04-pure-image` separate adapter ownership. The Framed adapter SHALL be the only target caller of its capture/font/denied-network/timeout/cleanup runtime seam; the Pure adapter SHALL own Pure raw-to-final publication. Neither sibling SHALL import the other or its `internal/` modules.

Shared raw mechanics SHALL consume typed raw plans/evidence without Framed Text Frame, no-text, reserved-rectangle, Pure display, or refresh-policy semantics. `05-delivery` SHALL consume the common final-slide manifest and shall not publish different PPTX, notes, or delivery behavior by workflow. The checked-in architecture inventory and source-to-test mapping SHALL validate these boundaries and every direct executable's current owner.

Target adapters, shared workflow observation, and controller-observation code SHALL NOT import a non-v2 adapter, writer, receipt initializer, historical decoder, or migration implementation.

#### Scenario: Architecture validation finds a sibling import
- **WHEN** a target Framed module imports a target Pure module or its private internal path
- **THEN** architecture validation fails the ownership boundary
- **AND** it does not accept the import as a convenience fallback

#### Scenario: Architecture validation finds a non-v2 import
- **WHEN** an active adapter, observer, controller, or process module imports a non-v2 protocol implementation
- **THEN** architecture validation fails the ownership boundary
- **AND** it does not accept the import as a migration or read-only convenience
