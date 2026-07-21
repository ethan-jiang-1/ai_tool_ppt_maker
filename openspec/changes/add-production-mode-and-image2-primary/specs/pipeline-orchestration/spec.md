## ADDED Requirements

### Requirement: One production policy dispatches every normal adapter operation

Public orchestration SHALL consume one shared production policy resolved from the exact run version.
For each mode it SHALL return the canonical pipeline, final page authority, refinement policy, and
style-master policy: `html-only` maps to `html-first-v1`/HTML/disabled/reserved-HTML-adapter;
`html-then-image2` maps to `html-first-v1`/HTML/required/reserved-HTML-adapter; and `image2-only` maps to
`legacy-image2-first`/whole-page Image2/not-applicable/current. Command routers, playbook validation,
init, and status SHALL not maintain independent mode tables.

`legacy-image2-first` in the policy is the normalized name for the canonical markerless branch; the
evaluator SHALL NOT require or write that value as source frontmatter. `html-only`'s disabled refinement
policy forbids new modern `image2 *` lifecycle operations while retaining previously attributable
refinement/source work for a later switch back to `html-then-image2`.

The evaluator SHALL validate state mode before source marker and shall stop at the first failed
authority/identity prerequisite. After a consistent policy is established, validate, pilot, gate,
build, refresh, and status SHALL delegate to the existing isolated adapter; no fallback chain SHALL
select an adapter from generated artifacts or from whichever readiness check succeeds.
For a first-class whole-page flow, orchestration SHALL determine whether the selected operation will
actually submit provider work before transport initialization; a submit requires the current
Controller-owned scoped authorization, while a proven zero-submit reuse/local path does not.

#### Scenario: HTML-then-Image2 selects HTML composition

- **WHEN** orchestration inspects a consistent `html-then-image2` run
- **THEN** normal production delegates to HTML and reports required modern refinement as completion policy
- **AND** whole-page Image2 is not selected

#### Scenario: Image2-only selects whole-page generation

- **WHEN** orchestration inspects a consistent `image2-only` run
- **THEN** pilot/build/refresh delegate to the whole-page adapter and preserve its gates/provenance

#### Scenario: Generated files suggest another adapter

- **WHEN** stale HTML artifacts coexist with an authoritative consistent `image2-only` run
- **THEN** orchestration ignores them as routing authority
- **AND** it does not try the HTML adapter as fallback

## RENAMED Requirements

- FROM: `### Requirement: HTML and legacy production adapters remain mutually isolated`
- TO: `### Requirement: HTML and whole-page Image2 production adapters remain mutually isolated`
- FROM: `### Requirement: Legacy Image2 entry points enforce their own remote prerequisites`
- TO: `### Requirement: Whole-page Image2 entry points enforce their own remote prerequisites`

## MODIFIED Requirements

### Requirement: Whole-page Image2 entry points enforce their own remote prerequisites

Every first-class `image2-only` or historical compatibility orchestration path SHALL first determine
whether selected work can reuse current verified artifacts. Only a path that is about to submit Image2
work SHALL validate action-specific prerequisites, immediately before entering its remote adapter.
Every remote submit SHALL require resolvable Image2 credentials and base URL. Whole-page generation
through pilot, build, or visual rebuild SHALL additionally require its current style-reference asset.
Style-master generation SHALL require transport prerequisites but SHALL NOT require a pre-existing
style master. The guard SHALL use existing credential, run-bundle, and style-reference authorities and
SHALL NOT rely on a prior doctor result. A missing prerequisite SHALL fail before provider submit with
the existing secret-safe CLI diagnostic authority.

A first-class `image2-only` submit SHALL also require the active Controller node's current scoped typed
authorization for the exact run, operation, stable IDs/roles, generation profile, and maximum
submissions; orchestration SHALL rederive and compare that scope before transport. Historical
compatibility SHALL retain its already-accepted authorization contract. Local-only Stage subsets, dry
runs, Structural Versioning materialization from verified artifacts, notes-only refresh, assembly that
reuses already reviewed images, a no-op style-master invocation retaining its existing output, and
Stage 2 when every selected image has current provenance SHALL NOT acquire transport prerequisites or
provider authorization and SHALL NOT make a remote request merely because a doctor profile omitted
Image2 checks.

#### Scenario: Legacy pilot has no credentials

- **WHEN** a historical compatibility pilot reaches its Image2 generation boundary without resolvable `IMAGE2_API_KEY` or `IMAGE2_BASE_URL`
- **THEN** it fails before the provider adapter is called
- **AND** the diagnostic points to explicit Image2 readiness/remediation without exposing secret values

#### Scenario: Legacy Stage 2 has no style reference

- **WHEN** a historical compatibility build or visual refresh is about to enter Stage 2 and its required style master is absent
- **THEN** orchestration fails before any Image2 submit
- **AND** it identifies the style-reference prerequisite through existing run-bundle paths

#### Scenario: Style-master generation has no style master yet

- **WHEN** whole-page style-master generation has valid Image2 transport prerequisites but no existing style master
- **THEN** the action may enter its remote adapter after any required current scoped authorization
- **AND** does not impose the page-generation style-reference guard on itself

#### Scenario: Local stages do not inherit Image2 gate

- **WHEN** an invocation runs only Stages 1, 3, 4, or 5 from valid local/reviewed inputs
- **THEN** missing Image2 credentials do not block the invocation
- **AND** no provider submit occurs

#### Scenario: Structural materialization remains remote-free

- **WHEN** a structural version reuses verified expensive raw renders under the existing materialization contract
- **THEN** it does not run an Image2 readiness or authorization guard as a substitute for materialization evidence
- **AND** it never silently invokes remote rendering

#### Scenario: Dry run does not require or submit Image2

- **WHEN** a whole-page pipeline invocation includes Stage 2 but is executed with `--dry-run`
- **THEN** it may report the future prerequisite/authorization boundary but does not require secret values, launch a provider adapter, or submit remote work

#### Scenario: Current generated artifacts require no transport lookup

- **WHEN** style-master or Stage 2 determines that every selected output can be retained or reused under current provenance without generation
- **THEN** missing Image2 credentials and base URL do not block the invocation
- **AND** no transport prerequisite resolver, provider-authorization lookup, or provider adapter is invoked

#### Scenario: First-class Image2 submit has stale authorization

- **WHEN** an `image2-only` operation would submit a changed or expanded scope relative to the active node's typed decision
- **THEN** orchestration fails before transport and reports the exact scope requiring fresh authorization

### Requirement: HTML and whole-page Image2 production adapters remain mutually isolated

Every public run-dir entry SHALL inspect canonical version-scoped production mode and verify the
canonical source marker before branch-specific readiness. The HTML adapter SHALL reject whole-page
prompt/render/header artifacts as authority; the whole-page Image2 adapter SHALL not infer HTML from
structured-looking prose or consume HTML production manifests. Provider-call spies and exact directory
diffs SHALL prove that HTML create/preview/build/refresh/structural operations never touch whole-page
Image2 or modern-refinement remote paths, and that `image2-only` operations never consume HTML output.
Calling the whole-page adapter from a first-class Image2-primary controller SHALL not weaken this
isolation or turn modern visual-slot refinement into a whole-page renderer.

#### Scenario: HTML deck has legacy generated files

- **WHEN** stale whole-page prompt/image/header directories coexist with a consistent HTML-mode source
- **THEN** HTML orchestration ignores them as production authority
- **AND** consumes only structured-plan and HTML-production evidence

#### Scenario: Markerless deck has HTML generated files

- **WHEN** a consistent `image2-only` run contains stray HTML-production bytes
- **THEN** whole-page orchestration does not use them to satisfy production or review gates

#### Scenario: First-class Image2 path reuses the isolated adapter

- **WHEN** create-deck dispatches a new `image2-only` run
- **THEN** it invokes the existing whole-page stages through the shared policy
- **AND** does not label the user workflow as HTML refinement or legacy-only maintenance

### Requirement: HTML-first source validation is available before HTML-first production

The three write-free validation routes SHALL remain: `ppt_flow validate <run-dir>`, direct Stage-1
`--validate --spec <canonical-source>`, and unified Stage-1 `--dry-run`. Their single canonical-source,
no-alternate-control/legacy-alias, write-free, receipt-validation, and direct arbitrary-output rejection
contracts remain unchanged.

For a valid `production.pipeline: html-first-v1` run in either HTML mode, canonical unified Stage 1 SHALL
publish only the structured plan; HTML Stage 2 publishes self-contained pages; HTML Stage 3 publishes
measured verified final slides and preview evidence; Stage 4 consumes provider-neutral final slides;
and Stage 5 injects notes. HTML preview/build/refresh/materialization SHALL run without dotenv,
credentials, whole-page style master, provider/model setup, whole-page prompt files, header lock, or a
remote adapter. Direct whole-page style-master/header approval commands remain inapplicable to HTML
with branch-specific guidance rather than becoming prerequisites.

For first-class `image2-only` and historical markerless compatibility, the markerless branch SHALL
retain its whole-page options, style-master/readiness guards, Stage 2, Stage-3 header behavior,
pilot/header review, refresh paths, and standalone artifact interfaces. The first-class route adds only
mode/controller authorization and final-review ownership around those interfaces. Malformed markers or
mode/source drift SHALL fail before either adapter's readiness or writes. Adapters SHALL not consume one
another's manifests, gates, generated directories, or prerequisites.

#### Scenario: Structured source validates locally

- **WHEN** a valid HTML-first source runs any explicit validation route
- **THEN** contract validation completes with zero writes and zero remote setup

#### Scenario: HTML-first canonical Stage 1 remains the sole plan writer

- **WHEN** canonical unified Stage 1 processes a valid HTML-mode run
- **THEN** it atomically rebuilds only `_generated/slide_plan.json`
- **AND** direct Stage 1 still cannot publish to an arbitrary output

#### Scenario: HTML-first complete build succeeds locally

- **WHEN** content/visual gate requirements are current and the user runs build on a valid HTML-mode deck
- **THEN** Stages 1-5 publish current HTML pages, final slides, contact sheet, PPTX, and notes
- **AND** no Image2 credential/whole-page-style-master/provider prerequisite is resolved

#### Scenario: HTML-first stage dry-run remains write-free

- **WHEN** any supported HTML-first stage selection uses `--dry-run`
- **THEN** orchestration validates and reports planned local work without publishing generated/state bytes

#### Scenario: Invalid or drifted stage preserves prior artifacts

- **WHEN** HTML source/control/runtime input validation or a pre-publish receipt recheck fails
- **THEN** the prior plan/page/final/delivery artifacts remain intact
- **AND** no newly created generated directory is left current

#### Scenario: Legacy style/header command targets HTML-first

- **WHEN** whole-page `style-master` or header approval targets an HTML-mode run
- **THEN** it fails before provider/readiness/writes with branch-inapplicable guidance
- **AND** points to HTML visual preview/gate rather than removing the marker

#### Scenario: Legacy production remains unchanged

- **WHEN** a consistent `image2-only` or historical compatibility source has no HTML-first marker
- **THEN** existing whole-page pilot/build/refresh behavior and prerequisites remain selected
- **AND** HTML manifests or gates cannot authorize it
