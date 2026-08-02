## MODIFIED Requirements

### Requirement: Visual language and roles pass a deterministic no-text guard

Every provider clause and selected role clause SHALL pass the versioned Page
Authority text guard. The guard SHALL reject text-bearing instructions, unregistered
free prose, and invalid character or token forms before receipt compilation.

In addition, the per-slide `VISUAL SCENE` source text SHALL pass the same guard
before it is bound into a raw contract. The guard boundary SHALL be owned by
the workflow adapters: the source parser stores the scene as raw text, and each
adapter normalizes it at raw-contract compilation time using the shared
`normalizePageAuthorityTextGuard` routine. This preserves the `01-content` to
`02-visual-system` import boundary.

#### Scenario: Text-bearing registry instruction is rejected

- **WHEN** a clause includes a forbidden text-bearing instruction or invalid form
- **THEN** validation hard-stops before receipt compilation
- **AND** it reports the violated guard rule

#### Scenario: Text-bearing scene instruction is rejected

- **WHEN** a slide's `VISUAL SCENE` includes a forbidden text-bearing token
  (for example `caption`, `title`, `label`, or `letter`)
- **THEN** raw planning hard-stops with the guard's bounded error
- **AND** it reports the violated guard rule and does not author a provider call

#### Scenario: ASCII scene normalizes deterministically

- **WHEN** a slide's `VISUAL SCENE` text is guard-clean ASCII
- **THEN** the adapter binds the lowercase-normalized, whitespace-collapsed
  scene text into the raw contract
- **AND** the same input yields the same normalized output across compilations
