# Framework Script Layout Specification

## Purpose

Define current script ownership, executable inventory, import boundaries, and
provider-free architecture verification.

## Requirements

### Requirement: Script layout confines Framed runtime to Page Authority

The retained browser capture, font, denied-network, timeout, and cleanup
primitives SHALL be reachable only through the Page Authority Framed compositor
seam. They SHALL NOT create a second deck rendering or delivery entrypoint.

#### Scenario: Framed finalization imports its retained runtime

- **WHEN** a Framed Page Authority slide is finalized
- **THEN** it uses the private runtime seam without importing a retired deck contract or renderer

### Requirement: Direct executables have explicit current ownership

Every direct executable SHALL be listed in the checked-in inventory and resolve
through an allowed current interface. The inventory SHALL not register a retired
production executable.

#### Scenario: Inventory is checked

- **WHEN** architecture validation scans the script root
- **THEN** every executable has an approved current owner and source-to-test entry
