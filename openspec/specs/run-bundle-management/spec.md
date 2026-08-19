# Run Bundle Management Specification

## Purpose

Define creation, validation, current topology, bounded historical handling, and
exact local Harness binding for Run Bundles.
## Requirements
### Requirement: Authority-carrying run operations require a current Harness binding

A missing, malformed, conflicting, or retired-root-named locator is a
`hard-stop` protecting the exact Deck-to-Harness identity invariant. Its direct
source of record is the locator itself and the diagnostic SHALL return the
nearest safe action: explicitly reconstruct a new current Bundle rather than
converting the old one. Every run-scoped operation that reads or mutates source,
state, or production authority SHALL verify the card at its derived Deck root
through the shared declared-current locator evaluator before its owner logic runs. It SHALL
not write a locator, state, receipt, generated artifact, migration record,
fallback root, or alternate projection.

`bundle_layout --check --structure-only` SHALL remain a layout-only,
non-authoritative observation. It MAY report an old or locatorless tree, but it
SHALL not select a run, read state, inspect production readiness, authorize
work, or write.

#### Scenario: An undeclared Bundle is used by a run operation

- **WHEN** a run-scoped command derives a Deck root whose card uses a retired
  undeclared schema or retired root fields
- **THEN** it returns the bounded unsupported-binding hard-stop before
  production, provider, generated-artifact, or state work
- **AND** it offers neither waiver nor automatic migration

#### Scenario: A structure-only check observes an undeclared tree

- **WHEN** `bundle_layout --check --structure-only` is given a locatorless or
  undeclared Bundle
- **THEN** it may report only the Bundle's filesystem layout without mutation
- **AND** it does not establish a current binding or continuation authority

### Requirement: Init and validation seed only the current Page Image Workflow topology

Before provider-facing work, a version SHALL explicitly select exactly one
`production.workflow`, `framed` or `pure`, under
`production.pipeline: page-image-workflow`. After the State owner accepts that
exact source, its matching state SHALL declare
`production_identity.by_version[exact-version]` with the same workflow and a
positive `source_epoch`. `hybrid`, a per-slide policy, an omitted workflow, a
missing/malformed identity record, or an undeclared source/state pair SHALL
produce the existing owner-issued failure before state, receipt, raw, or
provider work. Root and standalone initialization SHALL not accept a singleton
production-mode selector or emit a production-mode state/mirror record. The
locator remains a Harness-binding schema, not a production protocol.

#### Scenario: Init seeds one current topology

- **WHEN** initialization creates a production-ready source and state draft
- **THEN** the source declares one current pipeline and selected workflow and
  State records the corresponding current identity only through its owner
- **AND** neither surface includes a version-suffixed, historical, or fixed
  mode marker

#### Scenario: Fresh authoring waits for an explicit workflow choice

- **WHEN** a new Bundle has no selected production workflow
- **THEN** init retains the existing draft state awaiting explicit Framed/Pure choice
- **AND** it does not infer an identity record from history or directory
  contents

#### Scenario: A selected current source becomes a valid workflow pair

- **WHEN** source and State declare the exact current pipeline, workflow, and
  matching identity record
- **THEN** validation accepts their one selected workflow under existing rules
- **AND** it does not accept an alternate mode or contract pair

#### Scenario: Initialization cannot select a retired mode

- **WHEN** root or standalone initialization receives a `--mode` selector
- **THEN** it returns a bounded usage failure before creating a Bundle or state
  record
- **AND** it does not map the selector to a pipeline, workflow, or
  project-metadata mirror

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
call a provider, infer evidence from its source version, or parse, convert, or
resume predecessor state.

#### Scenario: A current Framed version is copied cleanly

- **WHEN** `ppt_flow new-version` copies a current selected Framed version
- **THEN** the target is a Framed authoring draft with fresh workflow evidence
- **AND** it does not inherit the source version's raw page, header composite,
  review decision, final manifest, or state format marker

#### Scenario: Successor initialization ignores predecessor state

- **WHEN** a valid current source and overrides are copied to a successor
- **THEN** the state owner initializes fresh declared-current target state from
  those current source facts
- **AND** the operation does not parse, convert, or adopt an existing source
  state as successor input

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

### Requirement: Initialization emits only unversioned current source seeds

New Run Bundles SHALL seed the declared current Visual Language source and
optional asset manifest without numeric `revision` or `version` format markers.
The Visual Language source, asset manifest, and current presentation package
remain independently owned source/configuration files; their seed SHALL not
create receipt, raw, review, delivery, or provider evidence.

#### Scenario: A new Bundle receives current source seeds

- **WHEN** initialization creates a new Run Bundle
- **THEN** its Visual Language source and optional asset manifest have only
  their declared current fields and no Harness-owned numeric generation marker
- **AND** initialization creates no lifecycle or provider evidence

### Requirement: Initialization seeds a neutral optional Page Design System source

Fresh Run Bundle initialization SHALL create the canonical backbone Page Design
System source as a zero-byte regular file. Its content SHALL be neutral: it
SHALL NOT contain deck-specific visual prose, a provider prompt, a source
literal, a historical example, lifecycle evidence, or a workflow-specific
default. A zero-byte seed and an absent optional source have the same current
runtime null semantics.

Current validation SHALL accept an older Bundle whose optional Page Design
System source is absent when its other declared current topology is valid. A
new-version operation SHALL retain the shared deck-level backbone source in
place and copy a matching version override only through its existing overrides
copy path; it SHALL still create fresh workflow evidence under the existing
rules. Initialization, validation, and new-version creation SHALL not create a
receipt, resolved source binding, raw plan, authorization, provider request,
review, or delivery evidence merely by handling this source.

#### Scenario: Init creates a discoverable neutral source

- **WHEN** `init` creates a new current Run Bundle
- **THEN** the backbone visual-style directory contains a zero-byte
  `page-design-system.md` regular file at its canonical location
- **AND** initialization creates no deck-specific provider prose or lifecycle
  evidence

#### Scenario: An existing Bundle without the optional seed remains valid

- **WHEN** current validation examines an otherwise valid older Bundle that
  lacks `page-design-system.md`
- **THEN** validation preserves the Bundle and accepts the optional source as
  runtime-null-compatible
- **AND** it does not write a seed, infer design prose, or begin provider work

#### Scenario: A successor retains source semantics without inheriting evidence

- **WHEN** `new-version` copies a current source version whose deck backbone
  contains a Page Design System and whose version contains a matching override
- **THEN** the successor continues to use the deck-level backbone source and
  receives the override only through the existing overrides copy rules while
  beginning with fresh replacement workflow evidence
- **AND** it does not copy a source binding, raw plan, provider page, review,
  final media, or delivery record

### Requirement: Current Image2 provider profile source is explicit and non-secret

The Run Bundle source validator SHALL resolve the canonical version override
before the backbone Image2 provider profile. It SHALL recognize the exact
pending source shape only to return its bounded source-repair result, and SHALL
emit one immutable path-free binding only from one exact confirmed source shape.
A present invalid override SHALL hard-stop as the selected source and SHALL NOT
fall back to backbone. The selected source SHALL be one confined regular UTF-8
YAML file using direct mappings/scalars without aliases, anchors, tags, merge
keys, duplicate keys, symlinks, or version/revision markers.

A confirmed source SHALL contain exactly the unversioned source schema,
non-empty lower-kebab `profile_id` and `endpoint_profile`,
`owner_declaration: { authority: deck-author, status: confirmed }`, and an
`operations` mapping with exactly `style-master-text-generation` and
`page-image-reference-generation`. Each operation SHALL contain exactly a
non-empty lower-kebab `route_id`, one non-empty provider `model`, and
`prompt_budget: { limit, unit }`; `limit` SHALL be a positive safe integer and
`unit` SHALL be exactly `unicode-code-points`, `utf16-code-units`, or
`utf8-bytes`. No numeric limit is a reserved profile kind or code-path selector.

The source and resolved binding SHALL contain no API key, credential, base URL,
authorization, State fact, provider response, remote probe result, filesystem
path, or inferred model/route capability. The binding's canonical digest SHALL
cover every confirmed source capability fact while its origin/path remains
diagnostic-only. Missing, pending, malformed, unknown, mixed, or unconfirmed
facts SHALL produce one non-bypassable source-repair hard-stop at the consuming
provider-free planning checkpoint without a binding or digest; the owner SHALL
not guess from `.env`, a model alias, inspection, prior plan, or remote failure.

#### Scenario: Confirmed profile resolves two explicit operations

- **WHEN** the selected confined source has the exact confirmed shape
- **THEN** the validator returns one path-free immutable binding with both
  operation profiles and one canonical digest over all confirmed facts
- **AND** neither operation inherits a route, model, limit, or unit from the
  other or from runtime environment values

#### Scenario: Invalid override cannot reveal backbone fallback

- **WHEN** a profile override is present but malformed, unconfirmed,
  unconfined, unreadable, or uses an unknown field or budget unit
- **THEN** the source validator hard-stops at that selected override before
  provider-facing planning
- **AND** it does not select the backbone source, repair the file, infer a
  capability, or write lifecycle evidence

#### Scenario: Arbitrary positive budgets remain ordinary data

- **WHEN** confirmed profiles use prompt limits 4,000, 16,000, or another
  positive safe integer for either operation
- **THEN** the same source contract accepts each value as ordinary limit data
- **AND** no value changes the source schema, operation identity, or resolver
  branch

#### Scenario: Pending source has no partial authority

- **WHEN** a selected source retains `status: pending` or combines pending null
  fields with confirmed operation facts
- **THEN** provider-facing planning returns the one profile-source repair
  hard-stop before a plan, grant, attempt, or provider initialization
- **AND** it does not treat partial facts, a prior profile, or environment
  identity as confirmation

### Requirement: Initialization seeds a neutral Image2 provider profile source

Fresh Run Bundle initialization SHALL create the canonical backbone
`image2-provider-profile.yaml` as one direct unversioned YAML source with
exactly the source schema, nullable `profile_id`, nullable `endpoint_profile`,
`owner_declaration: { authority: deck-author, status: pending }`, and exactly
the nullable `style-master-text-generation` and
`page-image-reference-generation` operation entries. The pending seed SHALL
contain no model, route, prompt limit, count unit, endpoint URL, credential,
example provider, inferred default, or confirmed owner decision.

Initialization and `new-version` SHALL treat the file as source only. A new
version SHALL retain the deck-level backbone source and copy a matching source
override only through the existing overrides copy path; neither operation SHALL
create a resolved profile binding, generation profile, Style Master/Page Image
plan, grant, attempt, provider request, or derived inspection.

Current topology validation SHALL preserve an otherwise valid existing Bundle
whose profile source is absent and SHALL NOT write or infer a replacement.
Provider-facing planning for that Bundle remains separately required to return
the Image2 profile owner's one source-repair hard-stop before plan publication.
Initialization and validation SHALL NOT migrate, inspect for, or translate a
former capability convention.

#### Scenario: Init creates a pending non-authorizing profile

- **WHEN** `init` creates a new current Run Bundle
- **THEN** its backbone visual-style directory contains the exact neutral
  pending Image2 profile source
- **AND** the seed contains no route capability, provider secret, authorization,
  lifecycle evidence, or provider work

#### Scenario: Existing Bundle absence remains byte-preserving

- **WHEN** current topology validation examines an otherwise valid existing
  Bundle without `image2-provider-profile.yaml`
- **THEN** validation preserves the Bundle and reports no inferred profile
- **AND** later provider-facing planning must use the owning source-repair path
  rather than a default, migration, or model-alias guess

#### Scenario: New version copies source without evidence

- **WHEN** a Work Version with a canonical Image2 profile override is copied to
  a successor
- **THEN** the successor receives that override only through the ordinary source
  copy rules and continues to see the shared backbone source
- **AND** it begins with no inherited profile-bound plan, grant, attempt,
  provider bytes, review, or delivery authority

### Requirement: `--check` admits only an exact run-dir before binding

`bundle_layout --check` SHALL apply the existing version-directory check
(`isVersionDir` / `isPageImageVersionDir`) before it derives a Deck root or
verifies Harness binding. A Deck root, repository root, or other path that
fails that check is existing `usage`: the diagnostic SHALL name the required
`3_versions/vN` argument and SHALL NOT report `harness_binding_invalid`.
`deckRoot()` SHALL NOT be taught to accept a Deck root as `--check` input.
This change SHALL NOT add a second shape detector beside `isVersionDir`.

When the target is an exact run-dir, binding verification remains the existing
hard-stop protecting Deck-to-Harness identity. `--check --structure-only`
stays layout-only and still does not establish a current binding.

#### Scenario: A Deck root is not a binding failure

- **WHEN** `bundle_layout --check` is given a Deck root or another non-run-dir
  path
- **THEN** the result is `usage` naming `3_versions/vN`
- **AND** the reason is not `harness_binding_invalid`

#### Scenario: An exact run-dir still verifies binding

- **WHEN** `bundle_layout --check` is given an exact `3_versions/vN` path
  whose locator cannot verify the local Harness
- **THEN** it returns the existing binding hard-stop
- **AND** it does not recategorize that failure as usage

### Requirement: Layout `--init` Next matches public init

After a successful scaffold, `bundle_layout --init` SHALL emit the same Next
sentence as `ppt_flow init`: `Next: ppt_flow.mjs status <v1Path>`, where
`<v1Path>` is the created `3_versions/v1` path. It SHALL NOT tell the Agent to
fill `2_backbone/` and `slide-specifications.md` as the first act, invent a
second public startup, or mention upstream material collection. `--init`
remains the layout owner's lower-level interface, not a competing journey.

#### Scenario: Both init entries name status

- **WHEN** `bundle_layout --init` successfully creates a current unbound draft
- **THEN** the human Next line is `Next: ppt_flow.mjs status <v1Path>`
- **AND** it matches the `ppt_flow init` Next for that same v1 path

### Requirement: Unproduced unique v1 can be owner-reseeded

The run-bundle owner SHALL expose one atomic unproduced-v1 reset. Admission
SHALL require that the target is exact `v1`, that no other `3_versions/vN`
exists, that current source/state identity inspects as a resolvable pair, and
that no irreversible record exists for that deck. Rebuildable local facts
(source receipt, source-bound target-evidence identity row, `_generated`
derived JSON without raw/final PNG or PPTX) SHALL NOT defeat admission.

On success the owner SHALL write the exact current deck-type initial seed to
`v1/slide-specifications.md`, replace State with the same unbound authoring
draft `init` writes, wipe rebuildable v1 `_generated` and `_scratch` contents
while retaining their README files, and remove only mutable v1 iteration scope
heads. It SHALL NOT delete append-mostly Style Master or progressive plan,
attempt, grant, or materialization history. It SHALL append one typed history
event. If admission fails, every byte SHALL remain unchanged.

#### Scenario: Unproduced materialized v1 returns to the init seed

- **WHEN** unique v1 has a resolvable identity, local source-bound evidence, and
  zero irreversible records
- **THEN** reset restores the exact deck-type seed, unbound authoring-draft
  State, and empty rebuildable generated/scratch trees
- **AND** append-mostly iteration plan files remain byte-identical

#### Scenario: A successor version blocks reset

- **WHEN** `3_versions/v2` or any other `vN` besides `v1` exists
- **THEN** reset refuses with zero writes
- **AND** v1 source, State, and derived trees remain byte-identical
