# Framework Charter Specification

## Purpose

Define active framework guidance for Page Authority production, ownership-aware
refresh, structural versioning, and bounded historical adoption.
## Requirements
### Requirement: Framework guidance names one current production protocol
Active framework guidance SHALL name `page-authority-image2-v2` as the sole current production protocol and describe its version-level Framed/Pure workflow choice. It SHALL not describe another protocol, per-slide authority, compatibility, or historical adoption as an active workflow context. A non-v2 input may be mentioned only as the generic unsupported-protocol hard-stop.

#### Scenario: An active workflow reference is read
- **WHEN** an Agent reads Charter, BOOTSTRAP, or workflow guidance for a version
- **THEN** it receives the v2 once-per-version workflow decision and ownership-aware refresh guidance
- **AND** it does not receive another protocol or compatibility path as a production choice

### Requirement: Framework guidance routes changes by ownership and invalidation

Active guidance SHALL route Framed Text Frame-only edits to local refresh, raw
contract changes to raw rebuild, notes-only edits to notes refresh, and structural
changes to previewed exact-hash versioning.

#### Scenario: A slide is reordered

- **WHEN** an Agent receives a reorder request
- **THEN** it enters Structural Versioning Path before any affected refresh work

### Requirement: Framework guidance presents sibling workflows and shared delivery

Active framework guidance SHALL present the target method graph as
`03-framed-image XOR 04-pure-image -> 05-delivery -> 06-iteration`. It SHALL
explain that the selected workflow owns its semantic rules and publishes a
common final-slide manifest; shared delivery owns final projection, complete-deck
PPTX, notes injection, and delivery review. It SHALL preserve the ownership and
invalidation rule that structural and whole-workflow changes use a previewed
exact-hash vNext path.

#### Scenario: Target workflow root is read

- **WHEN** an Agent opens the active target workflow root
- **THEN** it can identify one selected sibling route followed by shared delivery and iteration
- **AND** it does not read `03` and `04` as sequential production stages or independent delivery owners
