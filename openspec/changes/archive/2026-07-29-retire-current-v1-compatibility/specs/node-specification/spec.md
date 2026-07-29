## REMOVED Requirements

### Requirement: Page Authority state owns source epoch and evidence references
**Reason**: This requirement names the retired v1 state mode as current state authority.
**Migration**: The v2 workflow-bound state requirement is the sole active source/evidence contract.

### Requirement: Page Authority structural targets begin with fresh evidence state
**Reason**: This requirement defines structural publication for the retired v1 mode.
**Migration**: Use TARGET structural versions with fresh workflow evidence.

### Requirement: Current state contains one Page Authority evidence graph
**Reason**: It retains bounded legacy observation/adoption facts in current state.
**Migration**: Current state records only v2 workflow evidence; historical facts are external migration/export inputs.

### Requirement: Legacy observations remain non-authoritative
**Reason**: Legacy observer/adoption is not a current state capability after retirement.
**Migration**: Retired input is classified by the direct protocol evaluator without state mutation.

## MODIFIED Requirements

### Requirement: TARGET structural versions begin with fresh workflow evidence
An exact-plan structural transaction that publishes a v2 target SHALL bind the chosen workflow into the preview and confirmed plan hash. Apply SHALL initialize target state at source epoch `1` with target-owned unreviewed provenance or `needs_raw_generation` debt only. It SHALL NOT carry provider authorization, raw review, final projection, PPTX, notes, delivery decision, or active execution from its source version.

#### Scenario: Workflow switch creates a clean vNext state
- **WHEN** a confirmed structural transaction switches a version from target Framed to target Pure
- **THEN** the published vNext state binds workflow `pure` and starts with fresh target evidence state
- **AND** apply makes no provider call or inherits the source final/delivery acceptance
