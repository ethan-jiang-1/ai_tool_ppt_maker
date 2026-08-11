# Run Bundle Management Specification

## Purpose

Define creation, validation, current topology, bounded historical handling, and
exact local Harness binding for Run Bundles.
## Requirements
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

Before provider-facing work, a version SHALL explicitly select exactly one
`production.workflow`, `framed` or `pure`, under
`production.pipeline: page-image-workflow`; its matching state SHALL declare
`image2-page-workflow`. `hybrid`, a per-slide policy, an omitted workflow, or
an undeclared source/state pair SHALL produce the existing owner-issued failure
before state, receipt, raw, or provider work. The locator remains a
Harness-binding schema, not a production protocol.

#### Scenario: Init seeds one current topology

- **WHEN** initialization creates a production-ready source and state draft
- **THEN** they declare one current pipeline/mode pair and one selected workflow
- **AND** they do not include a version-suffixed or historical marker

#### Scenario: Fresh authoring waits for an explicit workflow choice

- **WHEN** a new Bundle has no selected production workflow
- **THEN** init retains the existing draft state awaiting explicit Framed/Pure choice
- **AND** it does not infer a marker from history or directory contents

#### Scenario: A selected current source becomes a valid workflow pair

- **WHEN** source and state declare the exact current pipeline/mode pair
- **THEN** validation accepts their one selected workflow under existing rules
- **AND** it does not accept an alternate contract pair

### Requirement: Initialization and validation seed one complete Page Image presentation package

Initialization SHALL seed the four canonical Page Image presentation source
documents at the current Run Bundle layout locations with one complete,
cross-file-valid default package. Current layout validation SHALL evaluate the
package as a unit before a dependent Page Image owner plans raw work and SHALL
return the source/configuration repair action for an absent, malformed, or
cross-file-inconsistent document. It SHALL not synthesize a missing document,
fall back to a generated projection, inspect an existing production bundle, or
convert a retired `FRAME PRESET` source.

Seeding or validating the package SHALL not create a page receipt, resolved
per-page file, raw plan, provider work, authorization, review decision, or
other lifecycle evidence. `new-version` continues to copy only canonical source
and overrides into a clean successor with fresh workflow evidence.

#### Scenario: Init creates a presentation-ready draft

- **WHEN** `init` creates a new Run Bundle
- **THEN** it seeds the complete valid Page Image presentation package beside
  the current narrative sources and workflow draft
- **AND** it does not create page-level derived data or provider/review records

#### Scenario: A malformed package stops before raw work

- **WHEN** a current source selects a workflow but its presentation package is
  missing or cross-file-inconsistent
- **THEN** validation reports the bounded source/configuration repair action
  before receipt-dependent raw planning or provider work
- **AND** it does not write a default, a migration, or a new lifecycle record

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

### Requirement: Init emits only a current Harness-bound locator

Fresh Run Bundle initialization SHALL verify its creating local Harness root
and write only the unversioned `run-bundle-locator` contract with exactly
`schema`, `deck_root`, `harness_root`, and `harness_relation`. It SHALL not
write retired root fields, a version suffix, a compatibility marker, or a
second locator format.

#### Scenario: Init creates a current locator

- **WHEN** a new Run Bundle is initialized
- **THEN** it contains one schema-declared unversioned locator and its required
  binding fields
- **AND** no historical locator format is emitted

#### Scenario: A fresh Bundle is initialized from the Harness

- **WHEN** initialization uses a current local Harness root
- **THEN** it writes the one declared locator in the new Bundle
- **AND** it does not create a second root-format branch

### Requirement: Initialization seeds only the current narrative-source layout
Run Bundle initialization SHALL seed the canonical editable Story Outline and
Design Constraints sources at their current backbone paths alongside the
existing current workflow draft. Its structure validation SHALL recognize those
exact current source entries and reject a new layout that substitutes or emits
the retired `outline.md` path.

Initialization SHALL not inspect an existing production Run Bundle to fill,
convert, or migrate either narrative source. It SHALL not create provider work,
source-bound State evidence, review evidence, or a materialized page plan merely
by seeding the sources. Its ordinary Controller state remains separately owned
by the existing initialization path.

#### Scenario: Init creates a narrative-ready draft
- **WHEN** `init` creates a new Run Bundle
- **THEN** the current narrative source pair is present with the current
  Page Image workflow draft
- **AND** no page-plan, provider, or review record is created
