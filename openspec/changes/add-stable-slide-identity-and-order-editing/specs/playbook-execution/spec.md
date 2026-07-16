## ADDED Requirements

### Requirement: Restructure controller executes one previewed slide transaction

`restructure-slides.md` SHALL translate add, delete, reorder, normalization, and combined structure intent into the shared `ppt_flow slides` transaction path. Before any structural mutation, the controller SHALL obtain and show a preview containing resolved formal IDs, `position + slide_id + title` before/after order, target version boundary, refresh impact, and semantic-reference warnings. It SHALL retain the preview's canonical `plan_sha256` internally and wait for explicit user authorization before applying a membership or order change; the user SHALL not need to handle the hash. It SHALL NOT manually split, reorder, or renumber the canonical Markdown outside that deterministic transaction.

After authorization, the controller SHALL apply the exact same base-hash- and plan-hash-bound transaction to create the next version, consume its edit receipt, and semantically resolve reported prose-reference warnings. Structural apply and materialization SHALL make no remote calls. The controller SHALL rebuild cheap target-local stages from verified raw inputs, and SHALL treat `needs_render` as an incomplete-production report requiring a separately authorized Generated Image Rebuild. Heading-only normalization MAY use the documented atomic current-version exception. A stale base, changed plan hash, or ambiguous selector SHALL return to preview/confirmation rather than auto-rebase or guess.

#### Scenario: Reorder is previewed before version creation

- **WHEN** a user asks to move the current seventh page after the current third page
- **THEN** `restructure-slides` resolves both positions in one pre-edit snapshot and shows the formal-ID before/after preview
- **AND** retains the preview plan hash for the later apply
- **AND** creates no version until the user authorizes that transaction

#### Scenario: Applied receipt limits expensive work

- **WHEN** a confirmed reorder-only transaction reports all retained raw renders verified
- **THEN** the controller rebuilds Stage 3 and later cheap outputs in the created version
- **AND** does not route unchanged retained slides through remote Generated Image Rebuild

#### Scenario: Unproven render pauses before remote cost

- **WHEN** structural apply succeeds but its receipt reports one or more `needs_render` IDs
- **THEN** the controller reports the published source version and incomplete production scope separately
- **AND** does not invoke a remote renderer until the user has authorized the material rebuild cost

#### Scenario: Insert requires Agent-owned mnemonic

- **WHEN** a user requests a new slide
- **THEN** the Agent authors its content and pronounceable two-block formal ID before preview
- **AND** the deterministic CLI validates the ID without inventing one

#### Scenario: Reference warning blocks premature completion

- **WHEN** the edit receipt identifies natural-language page-number references requiring review
- **THEN** the controller inspects and semantically updates the target-version source as needed
- **AND** does not mark structure verification complete from numeric normalization alone

#### Scenario: Plan hash mismatch returns to preview

- **WHEN** the transaction available at apply no longer has the hash shown before authorization
- **THEN** the controller obtains and shows a fresh preview
- **AND** does not issue a bare apply or reinterpret the original page numbers

### Requirement: Restructure controller uses the version and deck escape ladder

`restructure-slides.md` SHALL guide the Agent through the narrowest truthful scope: heading-only projection repair in the current version; same-deck clean vNext for membership/order changes; explicit rebuild of unproven raw renders in that vNext; and recommendation of a new deck when audience, objective, or narrative materially changes. It SHALL not require every request to be preserved in one source version or even one deck. Deterministic technical routing remains Agent-owned; the controller SHALL ask the user only when accepting material remote cost, discarding or materially changing content, or deciding whether the work is a genuinely new deck.

#### Scenario: Same narrative stays in vNext

- **WHEN** pages are added, deleted, or reordered while audience and narrative remain continuous
- **THEN** the controller uses the same deck's Structural Versioning Path
- **AND** does not ask the user to choose a technical commit strategy

#### Scenario: New audience warrants a new deck

- **WHEN** the requested revision changes the audience and narrative enough that the old deck identity is misleading
- **THEN** the controller recommends a new deck with a concise reason
- **AND** waits for the user's product decision before creating it

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
