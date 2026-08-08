## ADDED Requirements

### Requirement: Pure deck visual system is a closed version-resolved source contract

For a current Pure Page Image Workflow run, Visual Config SHALL resolve one
`pure-deck-visual-system-v1` record from the existing version-resolved visual-style source
location using the canonical `runDir` supplied by the target runtime. The record SHALL have a closed canonical shape for a provider-facing typography
hierarchy, Style-Master-derived colour use, normalized page zones, whitespace rule, and allowed
layout families. It SHALL be content-neutral: it SHALL not carry slide literals, claims,
credentials, provider prompts, provider output, review decision, or lifecycle state.

Visual Config SHALL expose only a validated immutable projection and its canonical digest to Pure
callers. Framed SHALL not read, inherit, or treat the Pure visual-system record as a local-header
preset, protected geometry, or provider constraint.

#### Scenario: A current Pure source resolves one deck system

- **WHEN** a current Pure source is prepared with a valid version-resolved visual-system record
- **THEN** Visual Config returns one content-neutral canonical projection and digest for that run
- **AND** every Pure page can consume the same projection without a per-slide profile selection

#### Scenario: Framed remains independent of the Pure system

- **WHEN** a current Framed source is prepared beside a valid Pure visual-system record
- **THEN** Framed retains its existing visual-language and Header Rendering Policy inputs
- **AND** it does not derive a local profile, protected zone, or input digest from that record

### Requirement: Invalid Pure visual-system source stops before dependent work

Visual Config SHALL reject a missing, malformed, escaping, or unsupported Pure visual-system
source record before it publishes dependent Pure raw facts, authorizes provider work, or treats a
profile as current. The failure SHALL preserve source and existing evidence, identify the
source/configuration repair-and-rerun action, and SHALL not synthesize a default profile, read a
prior generated artifact, or create State, grant, review, or waiver data.

#### Scenario: A legacy Pure run lacks the required source record

- **WHEN** a current Pure run has no valid version-resolved visual-system source record
- **THEN** planning stops at the source/configuration failure before raw-plan or provider work
- **AND** it does not silently adopt a default, Style Master image, Framed preset, or historical
  generated evidence

#### Scenario: An unselected source change does not affect the Pure contract

- **WHEN** a visual-style file outside the selected Pure visual-system source changes
- **THEN** Visual Config retains the current Pure visual-system projection and digest
- **AND** it does not claim profile drift from that unselected file
