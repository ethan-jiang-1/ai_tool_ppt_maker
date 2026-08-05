## Purpose

Define executable ownership, import boundaries, and provider-free architecture
verification for scripts that are supplied by the PPT Maker Harness.

## ADDED Requirements

### Requirement: Harness executables have explicit current ownership

Every direct executable SHALL be housed by `ppt_maker_harness/`, listed in the
checked-in inventory, and resolve through an allowed current v2 or shared
interface. The inventory SHALL not register a retired Framework-root executable,
compatibility interface, v1 new-authoring interface, v1 receipt writer, or
migration runtime.

#### Scenario: Harness script inventory is checked

- **WHEN** architecture validation scans the Harness script root
- **THEN** every executable has an approved current owner and source-to-test
  entry
- **AND** no registered interface resolves through the retired Framework root

### Requirement: Harness script layout keeps current runtime seams bounded

The retained browser capture, font, denied-network, timeout, and cleanup
primitives SHALL be reachable only through the Page Authority Framed compositor
seam and SHALL not create a second Deck rendering or delivery entrypoint.
The Framed and Pure adapters SHALL remain separate; neither sibling SHALL
import the other or its private internals. Shared delivery SHALL consume the
common final-slide manifest and SHALL not publish different PPTX, notes, or
delivery behavior by workflow.

#### Scenario: Architecture validation finds a retired or sibling import

- **WHEN** an active adapter, observer, controller, or process module imports a
  retired protocol implementation or the other target sibling's private module
- **THEN** architecture validation fails the ownership boundary
- **AND** it does not accept the import as a compatibility, migration, or
  convenience fallback
