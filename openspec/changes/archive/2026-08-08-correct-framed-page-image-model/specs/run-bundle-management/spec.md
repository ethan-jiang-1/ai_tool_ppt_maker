## ADDED Requirements

### Requirement: Init and validation seed only the current Page Image Workflow topology

Fresh Run Bundle initialization SHALL create a Page Image Workflow authoring
path, not a default production route. Before provider-facing work, a version
shall explicitly select exactly one `production.workflow`, `framed` or `pure`,
under `production.pipeline: page-image-workflow-v1`; its matching state SHALL
declare `image2-page-workflow-v1`. `hybrid`, a per-slide policy, omitted
workflow, or a mismatched source/state pair SHALL produce the owner-issued
source-repair or `unsupported-protocol/export` hard-stop before state, receipt, raw,
or provider work.

The local `pptmaker-run-bundle-v2` locator remains a Harness-binding schema,
not a Page Authority production protocol. Init and validation SHALL continue
to verify that one exact local Harness binding without creating portability,
fallback, or cross-Harness adoption behavior.

#### Scenario: Fresh authoring waits for an explicit workflow choice

- **WHEN** a newly initialized version has not selected `framed` or `pure`
- **THEN** validation reports the workflow-selection prerequisite
- **AND** it does not infer a state mode, per-slide authority, or provider route

#### Scenario: A selected current source becomes a valid workflow pair

- **WHEN** a version selects `pure` with the replacement pipeline and matching
  current state mode
- **THEN** validation recognizes one Pure Page Image Workflow route
- **AND** it does not create a Framed policy or a `hybrid` route

### Requirement: Retired Page Authority bundles hard-stop without migration

Normal state-aware validation and every run operation that carries production
authority SHALL reject `page-authority-image2-v2`,
`image2-page-authority-v2`, or v2 receipt/evidence records before derived
artifact reads, state mutation, or provider initialization. It SHALL retain
the supplied source and state bytes unchanged and return the bounded
`unsupported-protocol/export` action. Structure-only layout checks remain
non-authoritative and may describe physical files without establishing current
production authority.

#### Scenario: A v2 bundle cannot be reinitialized into the new workflow

- **WHEN** normal validation reads an old v2 source/state pair
- **THEN** it stops at the protocol boundary and preserves the pair
- **AND** it does not write replacement source, state, receipt, or migration
  records

### Requirement: New versions begin with fresh replacement workflow evidence

When `ppt_flow new-version` copies an exact current Page Image Workflow
version with its selected workflow, the new version SHALL become a clean
authoring draft for that same explicit workflow. It may retain copied canonical
source and overrides, but it SHALL begin with no source receipt, Style Master
selection, raw plan/authorization/evidence, Complete Page Review, final-slide
manifest, assembly, notes, or delivery facts. The copy operation SHALL not
call a provider or infer evidence from its source version.

#### Scenario: A current Framed version is copied cleanly

- **WHEN** `ppt_flow new-version` copies a current selected Framed version
- **THEN** the target is a Framed authoring draft with fresh workflow evidence
- **AND** it does not inherit the source version's raw page, header composite,
  review decision, or final manifest

## REMOVED Requirements

### Requirement: Init and bundle validation seed only Page Authority topology

**Reason**: It initializes the retired v2 source/state topology.

**Migration**: Initialize only the explicit replacement Page Image Workflow
authoring path.

### Requirement: Current bundle ownership is explicit

**Reason**: Its Page Authority ownership vocabulary and artifact route are
retired.

**Migration**: Use the replacement workflow's source, state, review, final,
assembly, and notes owners.

### Requirement: Init and validation distinguish target workflow authoring from CURRENT compatibility

**Reason**: The old requirement retains v2 as current and frames compatibility
as an operational concern.

**Migration**: Use the replacement workflow's explicit authoring choice; all
v2 input hard-stops without conversion.

### Requirement: A clean current Page Authority version becomes an authoring draft

**Reason**: Its source and state identity are tied to Page Authority v2.

**Migration**: Copy only an exact current Page Image Workflow version into a
fresh replacement-protocol draft.
