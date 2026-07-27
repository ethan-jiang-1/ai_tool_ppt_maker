## ADDED Requirements

### Requirement: Raw generation has one Page Authority lineage
Current raw image generation SHALL bind raw contracts, profiles, reference eligibility, authorization,
manifest entries, and review evidence to Page Authority receipts. Whole-page and visual-slot lineage
shall not be a current ingress, cache, provider request, or completion route.

#### Scenario: A raw plan is built
- **WHEN** a current source requires raw generation
- **THEN** the plan contains only Page Authority Pure/Framed authority evidence and no legacy adapter identity


## REMOVED Requirements

### Requirement: Stage 2 is implemented inside the framework
**Reason**: The legacy contract is replaced by the current owner Page Authority adapter.
**Migration**: Use the current contract owned by Page Authority adapter.

### Requirement: Image2 smoke, persist secrets to .env, lessons to _lessons/
**Reason**: The legacy contract is replaced by the current owner `00-setup` + Image2 raw.
**Migration**: Use the current contract owned by `00-setup` + Image2 raw.

### Requirement: Modern visual-slot transport is isolated from whole-page generation
**Reason**: The legacy production contract is retired; no current production route retains it.
**Migration**: Use the Page Authority lifecycle for new work; use the read-only observer/adoption boundary for recognized historical runs.

### Requirement: CLI can inject the authorized modern visual-slot transport
**Reason**: The legacy production contract is retired; no current production route retains it.
**Migration**: Use the Page Authority lifecycle for new work; use the read-only observer/adoption boundary for recognized historical runs.

### Requirement: Contact sheet is in-framework
**Reason**: The legacy contract is replaced by the current owner Page Authority review.
**Migration**: Use the current contract owned by Page Authority review.

### Requirement: Raw image cache reuse is proven by a generation manifest
**Reason**: The legacy contract is replaced by the current owner Page Authority raw manifest.
**Migration**: Use the current contract owned by Page Authority raw manifest.

### Requirement: Pilot and header approval verify raw image provenance
**Reason**: The legacy contract is replaced by the current owner Page Authority review.
**Migration**: Use the current contract owned by Page Authority review.

### Requirement: Stage 2 passes per-slide assets as additional reference images
**Reason**: The legacy contract is replaced by the current owner `visual-asset-management` Image2 registry.
**Migration**: Use the current contract owned by `visual-asset-management` Image2 registry.

### Requirement: Generation profile includes asset reference fingerprints
**Reason**: The legacy contract is replaced by the current owner `visual-asset-management` Image2 registry.
**Migration**: Use the current contract owned by `visual-asset-management` Image2 registry.

### Requirement: Per-slide asset profile drives provenance invalidation
**Reason**: The legacy contract is replaced by the current owner `visual-asset-management` Image2 registry.
**Migration**: Use the current contract owned by `visual-asset-management` Image2 registry.

### Requirement: Post-generation provenance check uses per-slide profiles
**Reason**: The legacy contract is replaced by the current owner Page Authority raw manifest.
**Migration**: Use the current contract owned by Page Authority raw manifest.

### Requirement: Raw image artifacts are addressed by stable slide ID
**Reason**: The legacy contract is replaced by the current owner Page Authority raw manifest.
**Migration**: Use the current contract owned by Page Authority raw manifest.

### Requirement: Cross-version raw image reuse is verified materialization
**Reason**: The legacy contract is replaced by the current owner structural versioning.
**Migration**: Use the current contract owned by structural versioning.

### Requirement: Whole-page generation identifies the current lineage
**Reason**: The legacy contract is replaced by the current owner Page Authority raw manifest.
**Migration**: Use the current contract owned by Page Authority raw manifest.
