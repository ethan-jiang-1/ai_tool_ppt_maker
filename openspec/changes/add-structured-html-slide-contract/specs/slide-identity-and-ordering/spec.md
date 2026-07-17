## ADDED Requirements

### Requirement: Structured contract preserves stable identity and derived order

The HTML-first structured plan SHALL reuse the existing stable slide ID and current physical position contract. Reordering SHALL update derived positions and heading projections while preserving IDs, spoken keys, notes bindings, and per-slide semantic/visual fingerprints. The contract SHALL not introduce a second order source.

#### Scenario: Reordered structured slides keep identity

- **WHEN** a structured slide moves from position 7 to position 3 without content changes
- **THEN** its plan record reports position 3 with the same stable ID and spoken key
- **AND** its semantic and visual contract fingerprints remain unchanged

#### Scenario: Deleted identity is not reused

- **WHEN** a structured slide is deleted from a version
- **THEN** its formal ID and spoken key remain reserved by existing history rules
- **AND** a later structured insertion cannot reuse them silently

### Requirement: Round-trip edits do not shift notes or unrelated blocks

Structured contract serialization SHALL operate through the shared slide-document interface and SHALL preserve speaker-note ownership, epilogue boundaries, and unrelated slide blocks when identity/order changes are applied.

#### Scenario: Reorder preserves note binding

- **WHEN** two structured slides are reordered
- **THEN** each note remains attached to its stable slide ID
- **AND** no note is reassigned by numeric position
