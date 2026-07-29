## MODIFIED Requirements

### Requirement: Framework layout has no retired production owner

The framework directory map and executable inventory SHALL expose the retained
CURRENT v1 Page Authority implementation only through the explicit
compatibility/current-v1-page-authority ownership surface. Its source,
workflow guidance, and focused proof SHALL respectively live under the
scripts, workflow, and tests domain roots using that same logical path.
The map SHALL distinguish that existing-run-only compatibility owner from the
target method graph and SHALL NOT expose retired production owners, generic
compatibility branches, README-only test owners, or an uncalled iteration
interface.

#### Scenario: Script inventory is audited

- **WHEN** framework executable ownership is validated
- **THEN** every registered production executable belongs to Page Authority or a retained private runtime seam

#### Scenario: Compatibility paths are audited

- **WHEN** framework directory layout is inspected after the cleanup
- **THEN** the exact CURRENT v1 implementation, guidance, and focused proof
  resolve through compatibility/current-v1-page-authority
- **AND** scripts/04-image-production, workflow/04-image-production,
  workflow/05-iteration, tests/05-iteration, tests_e2e/04-image-production,
  and tests_e2e/05-iteration do not claim active ownership

### Requirement: Framework layout exposes target sibling workflow ownership

The framework directory map SHALL expose 03-framed-image, 04-pure-image,
05-delivery, and 06-iteration as target method-module owners. It SHALL show
03 and 04 as mutually exclusive siblings, 05 as their single shared delivery
owner, and 06 as the version-workflow-aware iteration owner. It SHALL keep
shared source/visual and raw mechanics distinct from workflow business owners
and SHALL not expose a second target finalization, PPTX, notes, or delivery
owner.

The map may identify the bounded CURRENT v1 compatibility resolver only at its
explicit compatibility home. It SHALL NOT make that resolver a new-authoring
workflow, retain undocumented generic branches after target activation, or
move workflow/05-delivery or tests/05-delivery into compatibility ownership.

#### Scenario: Target directory ownership is audited

- **WHEN** framework directory layout is inspected after target activation
- **THEN** Framed, Pure, Delivery, and Iteration each have one declared owner and 03/04 are shown as XOR siblings
- **AND** no active directory path claims a second target delivery or generic authority owner

#### Scenario: Shared delivery remains outside compatibility

- **WHEN** the directory map is checked with both retained v1 and selected v2
  evidence present
- **THEN** 05-delivery remains the one shared final-manifest, PPTX, notes, and
  delivery-review owner
- **AND** the compatibility home does not claim a separate delivery owner
