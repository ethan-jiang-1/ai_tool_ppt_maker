## ADDED Requirements

### Requirement: Structural plans bind one replacement Page Image Workflow without acceptance inheritance

Structural preview and exact-plan apply SHALL bind the target version to one
explicit `framed` or `pure` `page-image-workflow-v1` selection. A workflow
change, mixed policy, `hybrid` value, or per-slide authority override SHALL be
structural work and SHALL not mutate an existing version in place. Apply SHALL
create a clean target source/state draft without inheriting source receipt,
Style Master acceptance, provider-page evidence, Complete Page Review,
final-slide manifest, assembly, notes, or delivery acceptance. It SHALL make
no provider call.

#### Scenario: A workflow switch creates a clean target

- **WHEN** an exact structural plan changes a current version from Framed to
  Pure
- **THEN** the target binds `pure` under the replacement protocol with fresh
  workflow evidence
- **AND** it does not reuse the source version's raw page or review decision

#### Scenario: Per-slide workflow policy is rejected before apply

- **WHEN** a structural plan contains a slide-specific workflow override
- **THEN** preview reports the source/structural repair action
- **AND** apply does not create a target version or submit provider work

## REMOVED Requirements

### Requirement: TARGET structural plans bind one workflow without inheriting acceptance

**Reason**: It binds structural work to the retired Page Authority v2 target.

**Migration**: Bind the target only to the replacement Page Image Workflow and
fresh target evidence.
