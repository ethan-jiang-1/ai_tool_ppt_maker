## MODIFIED Requirements

### Requirement: Framework guidance names one current production protocol

Active framework guidance SHALL name `page-authority-image2-v2` as the sole
current protocol for new authoring and describe its version-level Framed/Pure
workflow choice. It SHALL describe `page-authority-image2-v1` mixed runs only
as a bounded CURRENT compatibility route, and retired protocols only as
bounded historical observation/adoption context. Guidance SHALL NOT present v1
per-slide authority as a new-deck choice or silently reinterpret v1 bytes as
v2.

#### Scenario: An active workflow reference is read

- **WHEN** an Agent reads Charter, BOOTSTRAP, or workflow guidance for a new version
- **THEN** it receives the v2 once-per-version workflow decision and ownership-aware refresh guidance
- **AND** it does not receive a v1 per-slide authority or retired protocol as an active production choice

## ADDED Requirements

### Requirement: Framework guidance presents sibling workflows and shared delivery

Active framework guidance SHALL present the target method graph as
`03-framed-image XOR 04-pure-image -> 05-delivery -> 06-iteration`. It SHALL
explain that the selected workflow owns its semantic rules and publishes a
common final-slide manifest; shared delivery owns final projection, full-page
PPTX, notes injection, and delivery review. It SHALL preserve the ownership and
invalidation rule that structural and whole-workflow changes use a previewed
exact-hash vNext path.

#### Scenario: Target workflow root is read

- **WHEN** an Agent opens the active target workflow root
- **THEN** it can identify one selected sibling route followed by shared delivery and iteration
- **AND** it does not read `03` and `04` as sequential production stages or independent delivery owners
