## MODIFIED Requirements

### Requirement: Page Image Workflow compiles one auditable provider input per slide

For a V2 `page-authority-image2-v2` receipt, the selected adapter SHALL compile
one immutable provider input for each slide from canonical receipt, selected
visual language, accepted Style Master selection, generation profile, Header
Rendering Policy, and selected Page Image Presentation. Its bytes and SHA-256
digest SHALL bind the selected-presentation digest into raw contract, plan,
inspection projection, authorization, attempt, provenance, reconciliation, and
final evidence.

Pure input SHALL request all visible content using only selected Pure
presentation. Framed input SHALL use only selected Header Profile, include
exact header literals as context not to render, closed Provider Content Schema,
and profile-derived protection facts. Shared transport submits only bound bytes;
it shall not reinterpret workflow semantics.

#### Scenario: Framed compilation binds non-rendering header context

- **WHEN** a V2 Framed receipt is compiled for raw planning
- **THEN** input binds selected-presentation digest, exact header context, and
  profile-derived protection facts
- **AND** its bound digest changes with a selected presentation fact or header
  literal

#### Scenario: Transport cannot rewrite an adapter input

- **WHEN** raw generation is authorized from compiled V2 provider input
- **THEN** submitted bytes match the bytes bound into authorization and attempt
  lineage
- **AND** transport does not append a workflow branch, select a sibling
  profile, or replace the digest

## ADDED Requirements

### Requirement: V2 Image2 plan publishes a bound Pre-Production Data View

After V2 source, presentation, and adapter controller compilation, `image2
plan` SHALL publish one provider-free rebuildable Pre-Production Data View
before authorization or submission. It SHALL contain a deck-level
`presentation-control-map.json` plus independent per-slide
`source-receipt.json`, `resolved-presentation.json`, and
`image2-controller.json`; Framed additionally publishes `framed-header.html`
without a provider raster underlay.

Each artifact SHALL carry schema identity and applicable source receipt,
presentation, plan, and controller bindings. The controller exposes structured
non-secret facts and exact compiled-input digest; the existing provider-input
inspection remains the exact-byte audit sidecar. The Data View contains no
credential, provider response, or arbitrary unbound prompt.

#### Scenario: A Framed plan exposes both controllers before paid work

- **WHEN** a valid V2 Framed `image2 plan` completes
- **THEN** every selected page has bound receipt, presentation, controller, and
  deterministic Header HTML under the Data View root
- **AND** the writer performs no provider initialization, authorization,
  submission, review, or State read/write

#### Scenario: Missing view is rebuilt rather than treated as approval

- **WHEN** valid V2 source and plan lack current Data View artifacts
- **THEN** `image2 plan` rebuilds them from canonical source, presentation, and
  adapter output
- **AND** it does not create a grant, State record, or new authorization

### Requirement: Pre-Production Data View is inspection-only and non-navigational

The Data View SHALL not select workflow, source, profile, plan, batch, grant,
submission, reconciliation, review, or acceptance. `artifact-view` may provide
a safe locator or summary but shall not create the view or copy raw provider
prompt prose into Human Navigation. A stale, malformed, or missing view is
diagnosed through the source/plan owner and rebuilt only by `image2 plan`.

#### Scenario: A Data View edit cannot control lifecycle work

- **WHEN** a Data View file is modified, removed, or added by hand
- **THEN** lifecycle inspection does not use it as source, authority, or
  evidence
- **AND** the next plan replaces it from owners or reports earliest
  source/plan failure
