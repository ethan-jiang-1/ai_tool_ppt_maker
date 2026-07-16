## ADDED Requirements

### Requirement: Restructure controller executes one previewed slide transaction

`restructure-slides.md` SHALL translate add, delete, reorder, normalization, and combined structure intent into the shared `ppt_flow slides` transaction path. Before any structural mutation, the controller SHALL obtain and show a preview containing resolved formal IDs, `position + slide_id + title` before/after order, target version boundary, refresh impact, and semantic-reference warnings. It SHALL wait for explicit user authorization before applying a membership or order change. It SHALL NOT manually split, reorder, or renumber the canonical Markdown outside that deterministic transaction.

After authorization, the controller SHALL apply the same base-hash-bound transaction to create the next version, consume its edit receipt, semantically resolve reported prose-reference warnings, then regenerate only the receipt's missing or stale scope through the applicable refresh paths. Heading-only normalization MAY use the documented atomic current-version exception. A stale base or ambiguous selector SHALL return to preview/confirmation rather than auto-rebase or guess.

#### Scenario: Reorder is previewed before version creation

- **WHEN** a user asks to move the current seventh page after the current third page
- **THEN** `restructure-slides` resolves both positions in one pre-edit snapshot and shows the formal-ID before/after preview
- **AND** creates no version until the user authorizes that transaction

#### Scenario: Applied receipt limits expensive work

- **WHEN** a confirmed reorder-only transaction reports all retained render artifacts verified
- **THEN** the controller rebuilds order-dependent outputs in the created version
- **AND** does not route unchanged retained slides through remote Generated Image Rebuild

#### Scenario: Insert requires Agent-owned mnemonic

- **WHEN** a user requests a new slide
- **THEN** the Agent authors its content and pronounceable two-block formal ID before preview
- **AND** the deterministic CLI validates the ID without inventing one

#### Scenario: Reference warning blocks premature completion

- **WHEN** the edit receipt identifies natural-language page-number references requiring review
- **THEN** the controller inspects and semantically updates the target-version source as needed
- **AND** does not mark structure verification complete from numeric normalization alone

### Requirement: Structural verification is identity-aware

The restructure controller's final verification SHALL inspect the target PPTX and evidence for exact current order, expected ID membership, current heading projections, ID-aligned notes, and unchanged retained-page identity. It SHALL present the result using current position, formal ID, and title and SHALL retain the existing user-evidence gate before completion.

#### Scenario: Deleted middle page does not shift notes

- **WHEN** a confirmed transaction deletes a middle slide and target production completes
- **THEN** final verification checks that every retained formal ID has its own note at the new plan position
- **AND** asks for user confirmation against the actual target PPTX

#### Scenario: Retained page moved but kept identity

- **WHEN** an unchanged page appears at a new target position
- **THEN** verification reports its new position and unchanged formal ID
- **AND** does not treat the heading-number change as an ID migration
