## ADDED Requirements

### Requirement: TARGET Page Authority state is bound to one version workflow

For the exact `page-authority-image2-v2` /
`image2-page-authority-v2` pair, Node Specification SHALL record the bound
source receipt identity, version workflow, source epoch, provider
authorization scope, accepted raw-evidence references, and final/delivery
references through the existing state owner. The state writer SHALL accept only
`framed` or `pure` when it matches the immutable v2 source receipt. MD
Controller and inspection consumers SHALL read the owner-issued projection and
SHALL NOT recreate receipt, CLI, or evidence schemas.

The state validator SHALL treat a missing workflow, source/state workflow
mismatch, v1/v2 identity collision, or evidence bound to a different receipt or
epoch as a non-mutating hard-stop. Its primary result SHALL identify the
earliest direct-fact failure and one owner-issued repair-and-rerun action.

#### Scenario: Target state records its source workflow once

- **WHEN** a valid v2 Pure source receipt initializes a fresh target version
- **THEN** state records mode `image2-page-authority-v2`, workflow `pure`, and source epoch `1`
- **AND** every later target node reads that one workflow rather than a per-slide authority field

#### Scenario: Source and state cannot claim different target workflows

- **WHEN** a v2 source receipt says `framed` and the state record says `pure`
- **THEN** validation returns the source/state identity repair hard-stop without writing state
- **AND** no controller, inspection, or generation path guesses which workflow to use

### Requirement: TARGET structural versions begin with fresh workflow evidence

An exact-plan structural transaction that publishes a v2 target SHALL bind the
chosen workflow into the preview and confirmed plan hash. Apply SHALL initialize
target state at source epoch `1` with target-owned unreviewed provenance or
`needs_raw_generation` debt only. It SHALL NOT carry provider authorization,
raw review, final projection, PPTX, notes, delivery decision, or active
execution from its source version, including an exact CURRENT v1 source.

#### Scenario: Workflow switch creates a clean vNext state

- **WHEN** a confirmed structural transaction switches a version from target Framed to target Pure
- **THEN** the published vNext state binds workflow `pure` and starts with fresh target evidence state
- **AND** apply makes no provider call or inherits the source final/delivery acceptance
