# Run Bundle Management Specification

## Purpose

Define creation, validation, current topology, bounded historical handling, and
exact local Harness binding for Run Bundles.
## Requirements
### Requirement: Init emits only a v2 Harness-bound locator

Fresh Run Bundle initialization SHALL verify its creating local Harness root
and write only a `pptmaker-run-bundle-v2` locator with exactly `schema`,
`deck_root`, `harness_root`, and `harness_relation`. It SHALL not write
retired root fields, `harness_id`, a version pin, or a
portable binding record.

#### Scenario: A fresh Bundle is initialized from the Harness

- **WHEN** a user initializes a new Run Bundle through the canonical Harness
  entrypoint
- **THEN** the Bundle receives one verified v2 local-Harness locator
- **AND** no legacy locator or compatibility data is created

### Requirement: Authority-carrying run operations require a current Harness binding

A missing, malformed, conflicting, v1, or retired-root-named locator is a
`hard-stop` protecting the exact Deck-to-Harness identity invariant. Its direct
source of record is the locator itself and the diagnostic SHALL return the
nearest safe action: explicitly reconstruct a new current Bundle rather than
converting the old one. Every run-scoped operation that reads or mutates source,
state, or production authority SHALL verify the card at its derived Deck root
through the shared v2 locator evaluator before its owner logic runs. It SHALL
not write a locator, state, receipt, generated artifact, migration record,
fallback root, or compatibility projection.

`bundle_layout --check --structure-only` SHALL remain a layout-only,
non-authoritative observation. It MAY report an old or locatorless tree, but it
SHALL not select a run, read state, inspect production readiness, authorize
work, or write.

#### Scenario: A v1 Bundle is used by a run operation

- **WHEN** a run-scoped command derives a Deck root whose card uses a retired
  v1 schema or retired root fields
- **THEN** it returns the bounded unsupported-binding hard-stop before
  production, provider, generated-artifact, or state work
- **AND** it offers neither waiver nor automatic migration

#### Scenario: A structure-only check observes an old tree

- **WHEN** `bundle_layout --check --structure-only` is given a locatorless or
  v1 Bundle
- **THEN** it may report only the Bundle's filesystem layout without mutation
- **AND** it does not establish a current binding or continuation authority

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
