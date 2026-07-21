## Context

The framework currently has two different Image2 concepts but only one new-deck route:

- `initBundle()` and `create-deck.md` hard-code `html-first-v1` and local HTML completion.
- The whole-page Image2 stages already generate page images, lock headers, assemble PPTX, and inject
  notes, but `initLegacyBundle()` and `legacy-image2-maintenance.md` expose them only as compatibility.
- Modern `image2-refine` is deliberately isolated visual-slot work after HTML delivery; it is not a
  whole-page renderer and currently remains optional.
- `_state/state.yaml` has a deck-oriented `pipeline` scalar and version-scoped evidence, while public
  commands also probe source markers directly. There is no explicit per-version record for the user's
  current production intent.
- Default environment readiness is currently HTML-shaped: Playwright, ECharts, Chromium, and bundled
  HTML fonts block even when the selected whole-page Image2 path does not use them.

This change spans state migration, init, the root CLI, MD Controllers, readiness, and two existing
production adapters. It must preserve the existing state writer, provider authorization, provenance,
gate, journal/CAS, and source-marker owners instead of creating a second workflow or renderer.

## Goals / Non-Goals

**Goals:**

- Make `production_mode` the single mutable per-version intent record while keeping source pipeline as
  the actual renderer contract.
- Default new decks to a complete first-class `image2-only` create flow using the existing whole-page
  adapter.
- Keep `html-only` locally complete with new modern refinement disabled; retain old refinement work and
  make it executable/required only under `html-then-image2`.
- Centralize the three-mode policy so init, commands, status, and playbook validation cannot drift.
- Migrate historical state once and preserve all existing source, evidence, and refinement work.
- Leave an explicit HTML style-master adapter seam without implementing HTML visual-quality work.

**Non-Goals:**

- Improving HTML layout/rendering quality or implementing an HTML style-master adapter.
- Converting modern visual-slot refinement into a whole-page renderer.
- General `html-* <-> image2-only` switching, reverse authoring, preview/hash confirmation, or clean-vNext
  publication; those belong to `add-versioned-production-mode-transitions`.
- Replacing the existing source marker, provider client, stage implementations, gate evidence, or
  publication/recovery protocols.
- Reading or modifying production `deck_*` data as framework fixtures.

## Decisions

### 1. Separate mutable intent from actual renderer contract

JS/state owns this model:

```yaml
schema_version: 4
production_mode:
  by_version:
    3_versions/v1:
      mode: image2-only
```

The mode record answers what the user wants for one exact run version. The canonical source marker
answers what renderer contract that version actually contains. The existing `state.pipeline` may remain
as an active-execution compatibility projection during this change, but it is not consulted as mode and
cannot override the exact version source marker. `project-metadata.yaml` carries only the last presented
mode/version mirror.

For HTML, the source marker is explicit `production.pipeline: html-first-v1`. Whole-page Image2 keeps
the existing canonical markerless source; `legacy-image2-first` is only the normalized pipeline name
returned by the marker probe/policy. This change never writes it as frontmatter.

Alternative considered: store mode in metadata or infer it from the marker. Rejected because metadata
is already a display/config projection, and a source marker cannot distinguish `html-only` from
`html-then-image2` or represent a mutable user choice.

### 2. Add one pure, deep production-policy module

Create a shared Node ESM module near the run-bundle/state boundary, for example
`scripts/shared/run-bundle/production_mode.mjs`. It owns the closed vocabulary and exports a small
interface equivalent to:

```js
inspectProductionMode({ state, runDir, sourceMarker })
classifyProductionModeTransition({ fromMode, toMode, sourcePipeline })
productionPolicyForMode(mode)
```

The policy result contains `mode`, `pipeline`, `page_authority`, `refinement_policy`, and
`style_master_policy`. The module is pure: it does not write state, metadata, history, or generated
artifacts. `state.mjs` remains the filesystem/parser/migration/CAS owner and exposes the application-level
inspect/transition functions after it supplies a canonical state snapshot and exact source marker. This
inversion avoids a circular dependency between state parsing and policy inspection.

The closed mappings are: `html-only -> html-first-v1/html/disabled/reserved-html-adapter`,
`html-then-image2 -> html-first-v1/html/required/reserved-html-adapter`, and
`image2-only -> legacy-image2-first/image2/not-applicable/current`. The last pipeline value is a
normalized markerless-branch label, not source frontmatter.

Alternative considered: let every command map mode independently. Rejected because deletion of a
single caller would then change policy semantics and drift would be inevitable. Alternative considered:
make the policy module a second state repository. Rejected because it would split persistence and
recovery authority from `state.mjs`.

### 3. Migrate schema v3 to v4 once, per visible version

The state migration enumerates canonical `3_versions/vN/slide-specifications.md` sources under the deck
root. For each missing key it uses only `probeProductionMarker`: explicit HTML becomes `html-only`; the
markerless `legacy` probe branch becomes `image2-only` and is normalized elsewhere as
`legacy-image2-first`. It never reads refinement state, metadata, history, or
generated files to choose a mode. Existing valid keys are not rewritten, mixed historical pipelines are
allowed because the new record is version-scoped, and all unrelated node/gate evidence survives.

Migration happens through the existing heal/write owner when an existing durable state is safely
upgradable. Historical markerless bundles with no state remain non-writing under observation; explicit
controller entry creates schema v4 and assigns modes. A schema-v4 missing/invalid key is corruption or
repair-required, not a signal to rerun inference. Tests distinguish pre-v4 migration from post-v4 loss.

Existing explicit `migrate-html` compatibility remains usable. A newly published HTML target obtains
`html-only` only after its exact success receipt is verified; this does not add the general bidirectional
transition interface deferred to Change 2.

Schema migration is not reused for post-v4 version creation. Every same-pipeline new-version authority
calls an idempotent state registration with exact source and visible target runs. It copies only the
source version's mode after verifying target marker/pipeline and relationship. A crash after visible
publication yields `mode_registration_required`; ordinary target production stays blocked until the
same mechanical registration succeeds. A conflicting record or relationship fails closed. This keeps
runtime inference forbidden while allowing publication recovery without human mode selection.

Alternative considered: infer on every command for backward compatibility. Rejected because it makes
state deletion silently change user intent and lets generated/refinement history influence routing.

### 4. State owns same-pipeline mutation, version registration, and mirrors

Add state APIs and closed root-CLI operations, implemented under the existing expected-state write
boundary, for the exact run version:

```text
state <run> --set-production-mode <mode>
state <run> --repair-production-mode-mirror
state <target> --register-production-mode-from <source>
state <run> --record-image2-delivery-review <decision> [--reason <text>]
```

`html-only <-> html-then-image2` updates only the mode record, appends an audit
event after the authoritative commit, and asks the shared completion evaluator to reproject status.
Disabling required refinement never removes its records or bytes. Enabling it reuses them only after the
existing refinement evaluator proves freshness.

The state write is authoritative even if the metadata mirror update is interrupted. Init and successful
transition attempt the owner-mediated mirror update; status reports drift, and an explicit state-owned
repair action rewrites the mirror from state. No cross-store journal is added because the mirror is not
authorization or recovery truth. Observation remains non-mutating.

Cross-pipeline requests return `transition_required` before state mutation. They cannot accept `--force`
because in-place mutation would violate source ownership and recoverability.

Alternative considered: make mode immutable after init. Rejected because users may change production
intent during work. Alternative considered: atomically delete/reseed the current version for a pipeline
change. Rejected because it loses attributable source/evidence and is the work of Change 2.

### 5. Refactor init around a mode-selected seed, not mutate-after-init

Refactor `bundle_layout.mjs` so common scaffolding is created once and a selected seed adapter writes the
source/control/state shape. `initBundle(..., { mode })` defaults to `image2-only`; explicit HTML modes
use the current HTML seed, and `image2-only` uses the current whole-page seed currently reached through
`initLegacyBundle()`. Compatibility helpers can remain thin explicit wrappers for tests/old callers,
but the primary initializer must not create an HTML bundle and then destructively rewrite it into an
Image2 bundle.

The Image2 seed retains the accepted markerless source shape and mnemonic-v1 identity. It does not add
an explicit legacy pipeline marker. HTML seeds retain `html-first-v1`.

`ppt_flow init --mode` validates the enum before filesystem creation and reports exact mode, derived
pipeline, and next action. Init writes no generated/style-master/provider artifact and does not count as
provider authorization.

Alternative considered: keep HTML init and ask users to run a migration command immediately. Rejected
because it recreates the blocked HTML-first user journey and creates unnecessary transition state.

### 6. Keep one create-deck entry with mode-specific branches

MD remains the workflow owner. `create-deck.md` becomes a mode-aware controller supporting both source
pipelines. Its early setup reads the canonical policy, then follows one declared branch:

- `image2-only`: intake/whole-page source authoring -> Image2 readiness -> scoped provider decision ->
  style master -> scoped pilot decision -> pilot/content/visual/header review -> scoped remaining-build
  decision when a submit is needed -> build/PPTX/notes -> evidence-bound final review.
- `html-only`: the current local HTML path -> final review -> complete.
- `html-then-image2`: the current HTML path -> explicit handoff to the existing `image2-refine`
  controller -> return to new final review -> complete.

Controller frontmatter declares `supported_production_modes` and nodes declare optional closed
`production_modes`.
The playbook index computes the active node set from the exact mode. Inapplicable nodes are outside that
set: they are not marked `skipped`, and their existing records are neither deleted nor accepted as
current. A same-pipeline mode transition recomputes the active set and moves an inapplicable current
pointer through a declared handoff while preserving every record. This keeps `skipped` reserved for an
explicit human bypass.

The first-class Image2 branch reuses the existing maintenance authorization semantics rather than
inventing a new provider-attempt store. Before a command that will actually submit, the Controller shows
and persists exact operation/run/IDs-or-role/profile/max-count in the active typed user decision. CLI
rederives that scope before transport; drift returns to the same gate. Proven zero-submit reuse/local
work requires no authorization. Final review uses separate
`state --record-image2-delivery-review`, which derives and binds current header/contact-sheet/PPTX/notes
evidence to the active node and exposes no force continuation. The existing HTML delivery-review command
remains HTML-only. Historical `legacy-image2-maintenance` remains for compatibility/off-path work.

Alternative considered: create three largely duplicated create controllers. Rejected because their
intake, final review, state, and iteration contracts would drift. Alternative considered: route
`image2-only` new decks through legacy maintenance. Rejected because that preserves the product problem
and lacks a complete greenfield lifecycle.

### 7. Route once at the public boundary, then preserve adapter isolation

The root CLI resolves policy before mode-specific option parsing/readiness and passes a selected adapter
to existing operations. HTML adapter internals continue to validate `html-first-v1`; whole-page internals
continue to validate markerless/provenance ownership. Direct registered entry points call the same inspector or
remain closed to their explicit pipeline; none may fall back based on artifact presence.

The routing matrix is implemented as policy plus adapter methods for validate, pilot, approvals, build,
refresh, status, and readiness. `image2-only` invokes whole-page generation through ordinary pilot/build,
never `ppt_flow image2`. `html-only` rejects new modern refinement with guidance to the same-pipeline
mode switch. `html-then-image2` uses the HTML adapter for normal production and the existing modern
refinement adapter only at its declared lifecycle. One-slide decks refine their one eligible slot;
otherwise the existing 2-4 slide bound remains. This is adapter promotion, not a new renderer.

Alternative considered: rename `legacy-image2-first` in this change. Rejected because it expands source,
receipt, migration, and compatibility churn without improving the user-facing flow. The user-facing
mode provides the first-class concept while the existing pipeline identifier remains stable.

### 8. Readiness is scoped to common, HTML, and Image2 profiles

Refactor the environment evaluator around three check groups. Common contains Node/npm, common packages,
shared framework files, generic fallback-font observation, disk, and advisory Git. HTML adds exact
Playwright/ECharts, paired Chromium, bundled HTML fonts, and offline browser smoke. Image2 adds
credentials, endpoint, and in-framework whole-page generator presence.

The root grammar is:

```text
doctor [--mode <mode> | --run-dir <run>] [--smoke | --probe-vendors]
```

No selector keeps the current common+HTML behavior. Compatibility `--image2` selects common+Image2 and
is mutually exclusive with mode/run selectors. `image2-only` omits HTML-only checks. `html-only` selects
common+HTML. `html-then-image2` makes common+HTML blocking now and Image2 presence deferred guidance;
the explicit refinement boundary rechecks Image2 as blocking. A mode/run never implies a live probe.
This profile mapping lives in the environment owner and is consumed by doctor rather than duplicated.

Alternative considered: keep `--image2` as base-HTML-plus-Image2. Rejected because a broken or absent
HTML browser/chart runtime would still prevent the release path selected specifically to avoid HTML.

### 9. Completion is one mode-aware projection over existing evidence

Extend the state/status completion evaluator rather than storing a new `complete` flag:

- `html-only` requires current HTML gates, delivery receipts, PPTX/notes, and final review. Retained
  historical refinement does not create debt unless an accepted promotion has made delivery stale;
  unresolved chargeable attempts remain separately visible.
- `html-then-image2` requires the same HTML evidence, a current completed refinement lifecycle, and a
  post-refinement current final review.
- first-class `image2-only` requires current whole-page content/visual/header evidence, reviewed generated
  bytes, PPTX/notes, and the evidence-bound final-review node decision. Historical maintenance retains
  its accepted compatibility projection.

The evaluator reports the earliest owning missing prerequisite. It never treats a metadata mirror,
controller node alone, or a waiver as evidence that identity/provider/artifact facts are complete.

Alternative considered: persist a mode-specific completion boolean. Rejected because freshness is
derived from mutable receipts and would require another invalidation authority.

### 10. Preserve gate classification and current authorization owners

The visible outcome model follows both project policies:

- `guide`: deferred Image2 readiness during the HTML half of `html-then-image2`, metadata mirror drift,
  mode-disabled refinement guidance, post-publication mode registration repair, and the temporarily
  unavailable HTML style-master adapter. The Agent performs safe repair/rerun work.
- `confirm`: semantic mode selection, content/visual/header/candidate/final quality decisions, and any
  existing reasoned quality continuation. Records stay version-scoped with their current owners.
- `hard-stop`: unknown/missing mode after migration, mode/source mismatch, unsafe state/CAS/journal
  ownership, invalid provenance, required-current-profile failure, or missing explicit provider
  authorization. The next action repairs
  through state/source/provider owners; no force/waive bypass is added.

The public HTML `style-master` command returns successful typed `available: false` guidance without artifacts or provider
initialization. The policy value remains `reserved-html-adapter`, allowing a later HTML quality change
to implement a different token/reference-board contract behind the same command seam.

### 11. Verification covers policy, boundaries, and the release flow

Unit tests are required for the mode enum/policy matrix, exact run-version lookup, schema-v3 migration,
post-v4 fail-closed behavior, metadata drift, same-pipeline CAS transition, post-publication mode
registration/recovery, preservation of inactive branch/refinement work, active-node filtering,
completion projection, readiness profiles, and init seed selection. Existing secret-free fixtures should be extended;
no production deck is a test fixture.

Integration/contract tests are required for root CLI help/init/state/status/doctor/routing, mode-operation
mutual exclusion, Image2 authorization/final review, one-final-JSON
failure envelopes, return audits, playbook index/branch conditions, direct-entry isolation, and provider-
call/filesystem spies proving wrong adapters are untouched.

E2E tests are required for: default init through mocked Image2-primary pilot/review/build/PPTX/notes/
final review; explicit `html-only` local completion; `html-then-image2` blocked before refinement and
complete after mocked authorized refinement/new final review; historical markerless/HTML migration; and
HTML mode round-trip with retained refinement work. The full `npm test`, `npm run test:e2e`, and strict
OpenSpec validation remain final gates. No live provider call is made by tests.

## Risks / Trade-offs

- **[Risk] Default Image2 makes first-run provider readiness/cost visible sooner** -> BOOTSTRAP and
  doctor disclose offline readiness and existing explicit submit authorization; `html-only` stays an
  explicit zero-provider choice.
- **[Risk] State-schema migration spans versions with different pipelines** -> key by canonical run
  version, use source markers only during v3-to-v4 migration, preserve every existing record, and test
  mixed-version decks.
- **[Risk] A process stops after vNext is visible but before its mode record commits** -> production
  fails at `mode_registration_required`; exact source/target registration is idempotent, CAS-bound, and
  never infers from target artifacts alone.
- **[Risk] HTML runtime failures still block the Image2 release route** -> evaluate profile-specific
  dependency/runtime sets and prove the Image2 profile neither loads nor reports HTML-only checks.
- **[Risk] Root CLI and direct scripts choose different routes** -> share one inspector/policy and add
  direct-entry plus wrong-adapter spies to the registered executable audit.
- **[Risk] Required refinement can appear complete from stale optional work** -> revalidate existing
  plan/candidate/promotion/final-review identity when enabling `html-then-image2`; retain bytes but never
  trust them by presence.
- **[Risk] Mode mirror failure confuses users** -> keep state authoritative, surface bounded drift, and
  repair only through a state-owned mirror action; never add a second transaction journal for display.
- **[Risk] Existing code and docs use the word legacy for the whole-page implementation** -> change
  user/controller terminology now while retaining the stable pipeline ID and compatibility references;
  avoid a broad receipt/schema rename in this release change.
- **[Trade-off] One create controller needs mode-filtered active-node handling** -> extend the canonical
  index/query path while retaining inactive records; do not overload human `skipped` semantics or create
  three duplicated end-to-end controllers.
- **[Trade-off] Old binaries cannot safely own schema-v4 writes** -> deploy framework code and specs
  together; rollback before migration is straightforward, while after authoritative v4 writes recovery
  is forward-fix or an explicit future owner-mediated downgrade, never manual YAML deletion.

## Migration Plan

1. Add the pure policy module and tests without changing default behavior.
2. Add schema v4 parsing/migration, exact-version inspection, mode transition, mode-filtered active-node
   selection, status projection, metadata-mirror repair, and post-publication mode registration behind focused tests.
3. Refactor init seeds and add `--mode`, then switch the omitted-mode default after all three seed paths
   pass bundle checks.
4. Wire root/direct command routing, scoped provider authorization/final review, and common/HTML/Image2
   readiness/style-master policies while preserving existing adapter internals and diagnostics.
5. Update controllers, NODE-SPEC, BOOTSTRAP, COMMANDS, and method references; validate the complete
   controller graph.
6. Run targeted tests, full unit/integration tests, mocked E2E flows, return audit, and strict OpenSpec
   validation before release.

Existing durable v3 state upgrades on its first safe owner-mediated read/execute. Migration is
idempotent. If implementation fails before state commit, old bytes remain authoritative. If metadata
mirror publication fails after state commit, status reports repairable drift. No generated artifact is
migrated; stale derived output is rebuilt through its owning adapter. A post-v4 visible target never
uses schema migration as implicit mode inference: its exact publication handoff registers mode or leaves
the typed repair checkpoint.

## Open Questions

None for Change 1. Cross-pipeline transition command grammar, reverse whole-page source authoring, and
clean-vNext publication are intentionally resolved by `add-versioned-production-mode-transitions` after
this contract is archived.
