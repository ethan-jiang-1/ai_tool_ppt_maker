# Framework Charter Specification

## Purpose

Define active framework guidance for Page Authority production, ownership-aware
refresh, structural versioning, and bounded historical adoption.

## Requirements

### Requirement: Framework guidance names one current production protocol

Active framework guidance SHALL name Page Authority as the sole current production
protocol and describe retired protocols only as bounded historical
observation/adoption context.

#### Scenario: An active workflow reference is read

- **WHEN** an Agent reads Charter, BOOTSTRAP, or workflow guidance
- **THEN** it receives Page Authority ownership and refresh guidance without a retired production choice

### Requirement: Framework guidance routes changes by ownership and invalidation

Active guidance SHALL route Framed Text Frame-only edits to local refresh, raw
contract changes to raw rebuild, notes-only edits to notes refresh, and structural
changes to previewed exact-hash versioning.

#### Scenario: A slide is reordered

- **WHEN** an Agent receives a reorder request
- **THEN** it enters Structural Versioning Path before any affected refresh work
