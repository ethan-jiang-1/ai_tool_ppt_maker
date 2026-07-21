## RENAMED Requirements

- FROM: `### Requirement: Fresh init defaults to a locally deliverable HTML-first source`
- TO: `### Requirement: Fresh init seeds an explicit production mode and matching source`

## ADDED Requirements

### Requirement: Version publication completes only after production-mode registration

`createVersion`, Structural Versioning publication, and every other same-pipeline visible-version
authority SHALL carry the exact source and target run identities into the state-owned registration
interface. They SHALL not report a fully usable target until registration succeeds or returns
already-current. Publication remains source/control-only and renderer/provider-free; registration adds
only the target mode record and its display mirror, never source approvals, node completion, generated
bytes, or refinement work.

If target publication succeeds but registration is interrupted, the visible target SHALL remain intact
and publication/status SHALL expose bounded `mode_registration_required` with the exact source/target
repair. Rerunning the repair SHALL verify target visibility, same-deck relationship, unchanged source
mode, matching marker-probe pipeline, and any existing target record before CAS. It SHALL not delete or
replace a visible target. Existing legacy-to-HTML migration supplies explicit `html-only` only after its
success receipt; other cross-pipeline registration is rejected.

#### Scenario: Clean same-pipeline vNext is registered

- **WHEN** Structural Versioning publishes a verified markerless target from an `image2-only` source
- **THEN** target mode is registered as `image2-only` before the operation reports the target production-ready
- **AND** the markerless source remains markerless

#### Scenario: Registration is interrupted after publication

- **WHEN** the target is visible but state CAS did not commit its mode
- **THEN** the target is preserved and ordinary production stops at `mode_registration_required`
- **AND** the Agent reruns the same owner-mediated registration without human mode selection

#### Scenario: Registration conflicts

- **WHEN** a visible target has a conflicting mode or no provable source relationship
- **THEN** run-bundle management fails closed without replacing target or changing source/state

## MODIFIED Requirements

### Requirement: Control-file templates mention _state

The seeded `deck-guide.md`, framework `workflow/00-setup/template-deck-guide.md`, and root README SHALL
identify `_state/state.yaml` as whole-workflow resume/progress authority and the only production-mode
routing authority, while keeping `_lessons` distinct. `project-metadata.yaml` SHALL explain that its
production-mode/version fields are display mirrors only. It SHALL also explain the disjoint gate
families: whole-page Image2 uses existing `content_gate|visual_gate` compatibility mirrors, while both
HTML modes use `html_content_gate|html_visual_gate` plus exact run versions and authoritative
version-scoped review records in state. Metadata alone SHALL authorize neither routing nor delivery.
HTML approval SHALL not overwrite whole-page scalar fields. Cleared-context resume SHALL start with
`ppt_flow state`; existing diagnostic-consumer and generated-artifact ownership guidance remains.

#### Scenario: Fresh HTML metadata explains gate authority

- **WHEN** init seeds an HTML-mode `project-metadata.yaml` and `deck-guide.md`
- **THEN** they point to `_state` for production mode, HTML gate evidence, and resume
- **AND** do not describe metadata scalars as sufficient routing or delivery proof

#### Scenario: Legacy metadata remains compatible

- **WHEN** a historical markerless deck is checked or resumed
- **THEN** existing whole-page metadata gate behavior is not silently reinterpreted as HTML or mode authority

#### Scenario: Deck contains legacy and HTML versions

- **WHEN** HTML approval updates deck-root metadata mirrors
- **THEN** whole-page scalar fields remain unchanged and markerless checks ignore all `html_*` fields

### Requirement: Golden sample first-look READMEs match current seeds

Seed/first-look coherence SHALL be proven from checked-in framework test fixtures produced in temporary
directories, not production `deck_*` or `dpt_*` data. Tests SHALL compare current root/version README
and deck-guide seeds across generic init plus every active deck-type template (`keynote`, `pitch`,
`report`, and `training`) and SHALL cover `_scratch`, `_state`, the default `image2-only` seed, both
explicit HTML-mode seeds, mode-owned placement guidance, and current Where Maps. Existing production
run bundles SHALL not be hand-edited or required as test inputs.

#### Scenario: Seed coherence suite runs without production decks

- **WHEN** the test workspace contains no `deck_*` or `dpt_*` production data
- **THEN** fresh generic and four deck-type fixtures prove coherent default and explicit-mode first-look seeds

### Requirement: Init creates assets directory skeleton with stub manifest

`initBundle()` SHALL retain the common `2_backbone/visual-style/assets/` scaffold with `svg/`,
`reference/`, and `icons/`, README, and exact empty v2 `asset-manifest.yaml` (`version: 2`, `assets: {}`)
for every mode. The README SHALL explain that structured ID/SHA binding through
`primary_visual.fallback` or typed-block icons is owned by HTML source, while `image2-only` keeps its
existing whole-page `VISUAL ASSETS` source contract; neither form becomes authority for the other
adapter. This common empty catalog does not select HTML or create a generated/provider artifact. The
directory remains optional for historical decks, and an existing markerless v1 manifest retains its
whole-page meaning without silent upgrade.

#### Scenario: Fresh init creates v2 catalog skeleton

- **WHEN** `initBundle()` scaffolds a new deck in any production mode
- **THEN** the assets directories and empty version-2 manifest exist
- **AND** the README distinguishes HTML structured binding from whole-page source ownership

#### Scenario: Old deck without assets remains valid

- **WHEN** a historical deck predates the asset directory
- **THEN** structure validation does not require one

#### Scenario: Legacy v1 manifest is not silently upgraded

- **WHEN** an existing markerless deck has a v1 manifest
- **THEN** init/check/heal preserves its whole-page meaning
- **AND** does not rewrite it without an explicit migration transaction

### Requirement: Structural version publication is source-only and renderer-free

The structural-version publication interface SHALL operate only on run-bundle source/control
scaffolding and deterministic local validation. It SHALL NOT invoke Stage 2, Image2, HTML composition,
any provider, materialize generated bytes, or copy/relabel reset/gate/delivery-review/node-decision
authorization. Its deterministic impact SHALL report HTML-mode `needs_local_materialization` separately
from whole-page Image2 `needs_render` remote debt and SHALL act on neither. For HTML targets, a later
explicit materializer MAY reuse only revalidated target-owned immutable bytes and SHALL create target
Stage-1/2/3 review evidence with Stage 4/5/final review pending, exactly as before.

After the source/control target becomes visible, the enclosing publication operation SHALL perform the
separate idempotent state-owned production-mode registration required by this change before reporting
the target production-ready. That registration writes only target mode authority and does not make
source publication a renderer, copy approvals/generated bytes, or satisfy target materialization.
Interruption after visibility preserves the target and reports `mode_registration_required`.

#### Scenario: Reordered HTML target is published source-only

- **WHEN** an authorized structural transaction reorders unchanged HTML slides
- **THEN** source publication creates the target without rendering or generated-byte reuse
- **AND** registration completes before a later explicit materializer owns target-local reuse and delivery rebuild

#### Scenario: Structural target does not inherit approval

- **WHEN** the source HTML version has current review records and the target is published/materialized
- **THEN** those records and any source reset epoch remain historical for the source version and are not copied into target authority
- **AND** target Stage 4 waits for target-version review plans and decisions

### Requirement: Bundle checks are pipeline-aware without mutating existing decks

`checkBundle()` SHALL inspect authoritative production mode when durable mode state exists and verify the
canonical source marker before applying adapter-specific required/forbidden generated and control rules.
Structure-only checks SHALL remain tolerant of absent state/assets on historical decks as already
specified. Check/heal SHALL never insert a source marker, infer or write a missing post-v4 mode, rewrite
markerless source, create generated directories, or migrate a deck merely to make validation pass.
Mode/source drift and an unregistered visible target SHALL return the owning state repair action.

#### Scenario: Existing markerless deck is checked

- **WHEN** a historical deck is validated after the default switch
- **THEN** whole-page-compatible structure rules apply without fabricating first-class execution state
- **AND** no HTML marker, mode record, or generated directory is created by the check

### Requirement: Fresh init seeds an explicit production mode and matching source

Both `bundle_layout --init` and `ppt_flow init`, including generic init and every active deck-type
template (`keynote`, `pitch`, `report`, and `training`), SHALL accept one exact mode
`html-only|html-then-image2|image2-only` and SHALL default an omitted mode to `image2-only`.
They SHALL seed canonical `3_versions/v1/slide-specifications.md` whose marker-probe branch matches the
mode: both HTML modes use explicit `production.pipeline: html-first-v1`, and `image2-only` uses the
existing canonical markerless whole-page source contract. Init SHALL NOT write
`production.pipeline: legacy-image2-first`; that string is the normalized pipeline name for the
markerless branch, not a valid source marker. Every new source SHALL use
`identity.scheme: mnemonic-v1`.

HTML seeds SHALL retain the exact structured-body/family guidance owned by `html-slide-contract`, no
legacy top-level `render`, `RENDER MODE`, `IMAGE PROMPT`, or `VISUAL ASSETS`, and a valid `html_first`
visual projection. The Image2-primary seed SHALL contain the existing whole-page Image2 authoring and
render-mode controls needed by Stage 1 while presenting them as a first-class production source rather
than a compatibility downgrade.

Deck-root state SHALL seed authoritative
`production_mode.by_version["3_versions/v1"].mode`; metadata SHALL seed only the human-readable mode/v1
mirror. Mode-owned gate mirrors SHALL begin pending and SHALL not authorize delivery. Init SHALL not
create style-master output, page images, headers, HTML output, PPTX/notes output, provider attempts, or
modern refinement state.

#### Scenario: Fresh init uses the release default

- **WHEN** a user initializes a new run bundle without `--mode`
- **THEN** v1 state records `image2-only` and source uses its matching canonical markerless contract
- **AND** the result reports mode, pipeline, and Image2-primary next action

#### Scenario: User explicitly selects html-only

- **WHEN** init receives `--mode html-only`
- **THEN** it seeds the local HTML-first source and an authoritative `html-only` v1 mode
- **AND** it creates no refinement completion obligation

#### Scenario: Fresh init selects HTML without asking for renderer

- **WHEN** init receives the already selected `--mode html-only`
- **THEN** its source explicitly selects `html-first-v1` and intake does not ask for another renderer choice

#### Scenario: User explicitly selects html-then-image2

- **WHEN** init receives `--mode html-then-image2`
- **THEN** it seeds the same HTML-first source contract with a required-refinement mode record
- **AND** no provider plan or authorization is created during init

#### Scenario: Fresh init separates gate mirrors

- **WHEN** any mode initializes v1
- **THEN** state contains the routing authority and metadata contains only the v1 display mirror
- **AND** no mirror or pending gate authorizes production

#### Scenario: Init remains write-bounded

- **WHEN** init completes
- **THEN** it has written only canonical source/control/state/lesson scaffolding
- **AND** no generated production or provider artifact exists
