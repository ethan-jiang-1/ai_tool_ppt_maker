# Visual Config Specification (delta)

## MODIFIED Requirements

### Requirement: Pure deck visual system is a closed version-resolved source contract

For a current Pure Page Image Workflow run, Visual Config SHALL resolve
`pure-deck-visual-system.yaml` only from the version-resolved Page Image
presentation package using the canonical `runDir` supplied by the target
runtime. The record SHALL remain Pure-only and have a closed canonical shape
for class-addressable provider-facing typography hierarchy,
Style-Master-derived colour use, normalized page zones, whitespace rule, and
allowed layout families. It SHALL be content-neutral: it SHALL not carry slide
literals, claims, credentials, Framed-header facts, provider prompts, provider
output, review decision, or lifecycle state.

Visual Config SHALL expose only the validated immutable selected class
projection and its canonical binding to Pure callers. Framed SHALL not read,
inherit, or treat the Pure visual-system record or digest as a local-header
profile, protected composition, or provider constraint.

#### Scenario: A current Pure source resolves one deck system

- **WHEN** a current Pure source page reaches planning with a valid
  version-resolved presentation package
- **THEN** Visual Config returns the one catalog-bound Pure projection for that page
- **AND** it does not use an unselected class profile as input

#### Scenario: Framed remains independent of the Pure system

- **WHEN** a current Framed source is prepared beside a valid Pure visual-system record
- **THEN** Framed retains its visual-language and resolved Header Rendering
  Policy inputs without the Pure record or digest
- **AND** it does not derive a local profile, Reserved Header Region, or input
  digest from that record
