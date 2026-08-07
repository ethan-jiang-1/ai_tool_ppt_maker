## ADDED Requirements

### Requirement: Commands route current Page Image changes by compiled-input ownership

Active `COMMANDS.md` guidance SHALL describe one version-level
`page-image-workflow-v1` choice, `framed` or `pure`, and route work through the
selected owner. It SHALL route Provider Content Schema, visual-direction,
generation-profile, protected-geometry, raw-contract, and provider-context
changes to raw rebuild. A Framed local overlay refresh may be offered only when
the owner proves that compiled provider input, protected geometry, raw contract,
and local profile are unchanged; header literal changes normally require raw
rebuild. Notes-only work remains delivery-owned, and insert/delete/reorder or
workflow changes route through previewed exact-hash Structural Versioning.

Guidance SHALL explain `hybrid` only as a description of Framed composition,
not as a user-selectable workflow or slide-level choice. It SHALL remain
goal-oriented and obtain current status from Workflow Inspection before
selecting an owner mutation.

#### Scenario: A user changes a Framed header literal

- **WHEN** a user asks to change the title on a current Framed page
- **THEN** COMMANDS guidance routes to the owner-issued raw rebuild path
- **AND** it does not promise a provider-free Text Frame refresh

#### Scenario: A user requests a workflow switch

- **WHEN** a user asks to change a version from Framed to Pure
- **THEN** COMMANDS guidance routes to Structural Versioning preview and exact
  plan confirmation
- **AND** it does not describe an in-place mode mutation or reuse acceptance

### Requirement: Commands expose the replacement protocol's unsupported-input boundary

When command guidance receives a v2 Page Authority source/state/receipt or
evidence identity, it SHALL present the bounded unsupported-protocol/export
action before route selection. It SHALL not infer the selected workflow, read
historical evidence as current, offer compatibility, or create a conversion,
adoption, or fallback path.

#### Scenario: v2 input is not offered as a production route

- **WHEN** a human asks to resume or change a v2 run
- **THEN** command guidance presents the protocol hard-stop and its owner
action
- **AND** it does not offer a Page Image Workflow mutation or inspection route

### Requirement: COMMANDS presents Page Image Workflow goals without protocol mechanics

The novice-facing request table SHALL describe presentation goals, needed
clarification, expected result, meaningful human confirmation/cost boundary,
and coarse timing. It SHALL not expose raw prompt text, compiled-input digests,
provider grants, internal adapter names, v2 Page Authority terminology, or a
fixed Image2 command sequence. Detailed lifecycle and command forms remain
with current playbooks and CLI owners.

#### Scenario: A novice requests a visual change

- **WHEN** a user reads the command reference for changing a page
- **THEN** the reference explains the next human/Agent interaction in
goal-oriented terms
- **AND** it does not require the user to identify a workflow-internal record

## REMOVED Requirements

### Requirement: COMMANDS routes Page Authority structural changes through clean targets

**Reason**: Its structural source and evidence terminology is Page Authority
v2-specific.

**Migration**: Route replacement workflow structural changes through the same
previewed clean-target rule.

### Requirement: Commands route work by Page Authority ownership and invalidation

**Reason**: It makes the retired v2 ownership model current.

**Migration**: Route only by replacement compiled-input ownership.

### Requirement: Commands route TARGET work by one version workflow and owner

**Reason**: It is bound to the `page-authority-image2-v2` target.

**Migration**: Use the new `page-image-workflow-v1` version policy.

### Requirement: COMMANDS.md presents user goals rather than protocol mechanics

**Reason**: Its active-documentation rule still uses Page Authority mechanics
as the current implementation vocabulary.

**Migration**: Present current Page Image Workflow goals without protocol
internals.
