## ADDED Requirements

### Requirement: HTML-first source produces one validated structured slide plan

The opt-in `production.pipeline: html-first-v1` source branch SHALL parse its fenced `SLIDE BODY` YAML into one versioned structured slide plan. The plan SHALL contain stable slide IDs, derived positions, layout-family discriminators, typed blocks, visual contract data, and deterministic diagnostics. Unsupported schema versions, duplicate body fences, unknown top-level contract fields, or conflicting pipeline markers SHALL fail before a plan is published.

#### Scenario: Valid structured source parses

- **WHEN** a source declares `production.pipeline: html-first-v1` and contains one valid `SLIDE BODY` fence
- **THEN** parsing emits a versioned structured slide plan with stable IDs, current positions, family names, and typed blocks
- **AND** no browser, Image2 provider, or PPTX stage is invoked

#### Scenario: Legacy source remains outside the branch

- **WHEN** a source has no HTML-first pipeline marker
- **THEN** existing legacy Stage 1 parsing remains the selected path
- **AND** HTML-first schema rules are not inferred from prompt prose

#### Scenario: Invalid marker or fence fails closed

- **WHEN** the marker is duplicated/conflicting, the fence is duplicated, or the schema version is unsupported
- **THEN** parsing fails with a bounded source location and remediation
- **AND** no partial plan is written

### Requirement: Layout families are discriminated and renderer-neutral

The `html-slide-contract` registry SHALL define ten stable layout-family discriminators. Each family SHALL declare typed content blocks, required and optional fields, canonical normalized slot geometry, capacity metadata, and fallback behavior. Family validation SHALL not accept arbitrary CSS, browser coordinates, or renderer-specific code in the source contract.

#### Scenario: Family fields validate deterministically

- **WHEN** a slide selects a registered family with valid typed blocks
- **THEN** the resolved plan includes that family's canonical geometry, capacities, and slot names
- **AND** the result is independent of any browser implementation

#### Scenario: Unknown family is rejected

- **WHEN** a slide names a family outside the registry
- **THEN** validation fails with the slide ID, family value, and allowed-family evidence
- **AND** the plan is not publishable

### Requirement: Source capacity preflight is grapheme-aware and bounded

HTML-first validation SHALL count grapheme clusters and declared word/line units using one deterministic Unicode-aware helper, compare them with family capacities, and report field path, measured count, capacity, and remediation. The fixed fixture corpus SHALL cover ASCII, Latin accents, punctuation/currency, numerals, Simplified Chinese, and CJK punctuation. Results SHALL be labeled source-capacity evidence and SHALL not claim browser pixel or line-wrap proof.

#### Scenario: English and Han fixtures pass within capacity

- **WHEN** representative English and Simplified-Chinese blocks fit their declared family capacities
- **THEN** preflight returns structured pass evidence for each measured field
- **AND** the plan remains renderer-neutral

#### Scenario: Over-capacity content is actionable

- **WHEN** a block exceeds its family capacity
- **THEN** validation reports the exact field, grapheme/word/line count, capacity, and bounded fix
- **AND** it does not silently truncate or reflow content

### Requirement: Visual contract resolves selection and fallback states without Image2

Each visual-bearing slide MAY declare `primary_visual` with an asset ID and semantic role. Resolution SHALL return exactly one of `fallback`, `selected`, `stale`, or `broken`, together with source-layer, SHA, and reason evidence. Missing, unregistered, path-invalid, or digest-mismatched bytes SHALL be detected even when a selected binding exists. The contract SHALL not resolve credentials, submit providers, or create refinement authorization.

#### Scenario: Fallback visual is valid without Image2

- **WHEN** a primary visual has a valid local fallback asset and no selected provider output
- **THEN** resolution returns `fallback` with asset origin and SHA evidence
- **AND** the structured plan is valid with zero Image2 configuration

#### Scenario: Broken selected binding fails closed

- **WHEN** a selected asset is missing, unregistered, or has a mismatched SHA
- **THEN** resolution returns `broken` with the affected asset ID and repair path
- **AND** fallback validation does not hide the integrity failure

### Requirement: Contract fingerprints are stable across reorder

The semantic and `visual_contract_fingerprint` values for a slide SHALL hash canonical content keyed by stable ID, schema version, family geometry, tokens, and resolved asset contract, but SHALL exclude physical position and array order. An ordered plan digest MAY change when order changes.

#### Scenario: Reorder preserves per-slide fingerprints

- **WHEN** unchanged slides are reordered
- **THEN** each retained slide keeps the same semantic and visual contract fingerprints
- **AND** only derived positions and the ordered plan digest change

### Requirement: Structured source round-trip preserves non-owned Markdown

The parser/serializer SHALL limit canonical writes to the owned `SLIDE BODY` fence and deterministic structured references. Leading frontmatter, preamble, speaker notes, epilogue, and unrelated Markdown bytes SHALL remain unchanged on a no-op round trip.

#### Scenario: No-op round trip is byte-stable

- **WHEN** a valid structured source is parsed and serialized without a semantic edit
- **THEN** non-owned source regions and notes are byte-identical
- **AND** the structured fence uses canonical YAML ordering
