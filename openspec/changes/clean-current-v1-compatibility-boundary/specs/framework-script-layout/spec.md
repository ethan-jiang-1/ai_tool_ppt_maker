## MODIFIED Requirements

### Requirement: Direct executables have explicit current ownership

Every direct executable SHALL be listed in the checked-in inventory and resolve
through an allowed current interface. The inventory SHALL not register a
retired production executable, a dead scripts/05-iteration pass-through, or a
generic v1 new-authoring interface. The architecture inventory SHALL register
the exact CURRENT v1 compatibility interface at
compatibility/current-v1-page-authority and map it to one focused
unit/integration owner; it SHALL not list scripts/04-image-production or
scripts/05-iteration as active interfaces.

#### Scenario: Inventory is checked

- **WHEN** architecture validation scans the script root
- **THEN** every executable has an approved current owner and source-to-test entry

#### Scenario: Dead compatibility pass-through is absent

- **WHEN** the checked-in script and ownership inventories are validated
- **THEN** no registered interface or source-to-test owner resolves to
  scripts/05-iteration/index.mjs or its internal application pass-through
- **AND** the compatibility interface has exactly one declared owner

### Requirement: TARGET script layout enforces sibling adapters and shared semantic boundaries

The target script inventory SHALL give 03-framed-image and 04-pure-image
separate adapter ownership. The Framed adapter SHALL be the only target caller
of its capture/font/denied-network/timeout/cleanup runtime seam; the Pure
adapter SHALL own Pure raw-to-final publication. Neither sibling SHALL import
the other or its internal/ modules.

Shared raw mechanics SHALL consume typed raw plans/evidence without Framed Text
Frame, no-text, reserved-rectangle, Pure display, or refresh-policy semantics.
05-delivery SHALL consume the common final-slide manifest and shall not
publish different PPTX, notes, or delivery behavior by workflow. The checked-in
architecture inventory and source-to-test mapping SHALL validate these
boundaries and every direct executable's current owner.

Target adapters, shared workflow observation, and controller-observation code
SHALL NOT import the CURRENT v1 compatibility mutation interface. The
top-level process adapter may dispatch to that interface only after exact
marker/state resolution establishes CURRENT v1; it SHALL NOT be an import edge
available to target execution or observation.

#### Scenario: Architecture validation finds a sibling import

- **WHEN** a target Framed module imports a target Pure module or its private internal path
- **THEN** architecture validation fails the ownership boundary
- **AND** it does not accept the import as a convenience fallback

#### Scenario: Shared delivery consumes either target provenance

- **WHEN** 05-delivery receives valid Framed and Pure final-slide manifests
- **THEN** it validates and delivers both through the same manifest/PPTX/notes/review interface
- **AND** its behavior does not branch on workflow semantics

#### Scenario: Architecture validation finds a target compatibility-writer import

- **WHEN** a target adapter, shared workflow observer, or controller-observation
  module imports the CURRENT v1 compatibility mutation interface
- **THEN** architecture validation fails the cross-protocol ownership boundary
- **AND** it does not accept the import as a read-only convenience
