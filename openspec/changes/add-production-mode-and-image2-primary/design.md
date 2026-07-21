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

This change spans state migration, init, the root CLI, MD Controllers, readiness, and two existing
production adapters. It must preserve the existing state writer, provider authorization, provenance,
gate, journal/CAS, and source-marker owners instead of creating a second workflow or renderer.

## Goals / Non-Goals

**Goals:**

- Make `production_mode` the single mutable per-version intent record while keeping source pipeline as
  the actual renderer contract.
- Default new decks to a complete first-class `image2-only` create flow using the existing whole-page
  adapter.
- Keep `html-only` locally complete and make modern refinement a completion requirement only for
  `html-then-image2`.
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

Alternative considered: let every command map mode independently. Rejected because deletion of a
single caller would then change policy semantics and drift would be inevitable. Alternative considered:
make the policy module a second state repository. Rejected because it would split persistence and
recovery authority from `state.mjs`.

### 3. Migrate schema v3 to v4 once, per visible version

The state migration enumerates canonical `3_versions/vN/slide-specifications.md` sources under the deck
root. For each missing key it uses only `probeProductionMarker`: HTML becomes `html-only`; markerless or
`legacy-image2-first` becomes `image2-only`. It never reads refinement state, metadata, history, or
generated files to choose a mode. Existing valid keys are not rewritten, mixed historical pipelines are
allowed because the new record is version-scoped, and all unrelated node/gate evidence survives.

Migration happens through the existing heal/write owner when an existing durable state is safely
upgradable. Historical markerless bundles with no state remain non-writing under observation; explicit
controller entry creates schema v4 and assigns modes. A schema-v4 missing/invalid key is corruption or
repair-required, not a signal to rerun inference. Tests distinguish pre-v4 migration from post-v4 loss.

Existing explicit `migrate-html` compatibility remains usable. A newly published HTML target obtains
`html-only` through the same bounded new-version initialization/migration rule; this does not add the
general bidirectional transition interface deferred to Change 2.

Alternative considered: infer on every command for backward compatibility. Rejected because it makes
state deletion silently change user intent and lets generated/refinement history influence routing.

### 4. State owns same-pipeline mutation; mirrors follow authority

Add a state API and root-CLI operation, implemented under the existing expected-state write boundary,
for the exact run version. `html-only <-> html-then-image2` updates only the mode record, appends an audit
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

`ppt_flow init --mode` validates the enum before filesystem creation and reports exact mode, derived
pipeline, and next action. Init writes no generated/style-master/provider artifact and does not count as
provider authorization.

Alternative considered: keep HTML init and ask users to run a migration command immediately. Rejected
because it recreates the blocked HTML-first user journey and creates unnecessary transition state.

### 6. Keep one create-deck entry with mode-specific branches

MD remains the workflow owner. `create-deck.md` becomes a mode-aware controller supporting both source
pipelines. Its early setup reads the canonical policy, then follows one declared branch:

- `image2-only`: intake/whole-page source authoring -> Image2 readiness -> style master -> pilot ->
  content/visual/header review -> build/PPTX/notes -> final review.
- `html-only`: the current local HTML path -> final review -> complete.
- `html-then-image2`: the current HTML path -> explicit handoff to the existing `image2-refine`
  controller -> return to new final review -> complete.

Inapplicable branch nodes are recorded as deterministically skipped with an `inapplicable:<mode>` reason
through the state API, so the fixed playbook index and completion query remain auditable. A same-pipeline
mode transition reopens or skips only the affected refinement handoff/completion nodes and leaves
evidence untouched. The existing `legacy-image2-maintenance` controller remains for historical/off-path
maintenance; it is no longer the new-deck entry.

Alternative considered: create three largely duplicated create controllers. Rejected because their
intake, final review, state, and iteration contracts would drift. Alternative considered: route
`image2-only` new decks through legacy maintenance. Rejected because that preserves the product problem
and lacks a complete greenfield lifecycle.

### 7. Route once at the public boundary, then preserve adapter isolation

The root CLI resolves policy before mode-specific option parsing/readiness and passes a selected adapter
to existing operations. HTML adapter internals continue to validate `html-first-v1`; whole-page internals
continue to validate their marker/provenance. Direct registered entry points call the same inspector or
remain closed to their explicit pipeline; none may fall back based on artifact presence.

The routing matrix is implemented as policy plus adapter methods for validate, pilot, approvals, build,
refresh, status, and readiness. `image2-only` invokes whole-page generation through ordinary pilot/build,
never `ppt_flow image2`. `html-then-image2` uses the HTML adapter for normal production and the existing
modern refinement adapter only at its declared lifecycle. This is adapter promotion, not a new renderer.

Alternative considered: rename `legacy-image2-first` in this change. Rejected because it expands source,
receipt, migration, and compatibility churn without improving the user-facing flow. The user-facing
mode provides the first-class concept while the existing pipeline identifier remains stable.

### 8. Completion is one mode-aware projection over existing evidence

Extend the state/status completion evaluator rather than storing a new `complete` flag:

- `html-only` requires current HTML gates, delivery receipts, PPTX/notes, and final review.
- `html-then-image2` requires the same HTML evidence, a current completed refinement lifecycle, and a
  post-refinement current final review.
- `image2-only` requires existing whole-page content/visual/header evidence, reviewed generated bytes,
  PPTX/notes, and final review.

The evaluator reports the earliest owning missing prerequisite. It never treats a metadata mirror,
controller node alone, or a waiver as evidence that identity/provider/artifact facts are complete.

Alternative considered: persist a mode-specific completion boolean. Rejected because freshness is
derived from mutable receipts and would require another invalidation authority.

### 9. Preserve gate classification and current authorization owners

The visible outcome model follows both project policies:

- `guide`: missing optional readiness before its protected action, metadata mirror drift, and the
  temporarily unavailable HTML style-master adapter. The Agent performs safe repair/rerun work.
- `confirm`: semantic mode selection, content/visual/header/candidate/final quality decisions, and any
  existing reasoned quality continuation. Records stay version-scoped with their current owners.
- `hard-stop`: unknown/missing mode after migration, mode/source mismatch, unsafe state/CAS/journal
  ownership, invalid provenance, or missing explicit provider authorization. The next action repairs
  through state/source/provider owners; no force/waive bypass is added.

The public HTML `style-master` command returns typed capability guidance without artifacts or provider
initialization. The policy value remains `reserved-html-adapter`, allowing a later HTML quality change
to implement a different token/reference-board contract behind the same command seam.

### 10. Verification covers policy, boundaries, and the release flow

Unit tests are required for the mode enum/policy matrix, exact run-version lookup, schema-v3 migration,
post-v4 fail-closed behavior, metadata drift, same-pipeline CAS transition, preservation of refinement
work, completion projection, and init seed selection. Existing secret-free fixtures should be extended;
no production deck is a test fixture.

Integration/contract tests are required for root CLI help/init/state/status/doctor/routing, one-final-JSON
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
- **[Trade-off] One create controller needs explicit branch/skipped-node handling** -> accept the small
  state/index extension to avoid three duplicated end-to-end controllers.
- **[Trade-off] Old binaries cannot safely own schema-v4 writes** -> deploy framework code and specs
  together; rollback before migration is straightforward, while after authoritative v4 writes recovery
  is forward-fix or an explicit future owner-mediated downgrade, never manual YAML deletion.

## Migration Plan

1. Add the pure policy module and tests without changing default behavior.
2. Add schema v4 parsing/migration, exact-version inspection, mode transition, status projection, and
   metadata-mirror repair behind focused tests.
3. Refactor init seeds and add `--mode`, then switch the omitted-mode default after all three seed paths
   pass bundle checks.
4. Wire root/direct command routing and readiness/style-master policies while preserving existing
   adapter internals and diagnostics.
5. Update controllers, NODE-SPEC, BOOTSTRAP, COMMANDS, and method references; validate the complete
   controller graph.
6. Run targeted tests, full unit/integration tests, mocked E2E flows, return audit, and strict OpenSpec
   validation before release.

Existing durable v3 state upgrades on its first safe owner-mediated read/execute. Migration is
idempotent. If implementation fails before state commit, old bytes remain authoritative. If metadata
mirror publication fails after state commit, status reports repairable drift. No generated artifact is
migrated; stale derived output is rebuilt through its owning adapter.

## Open Questions

None for Change 1. Cross-pipeline transition command grammar, reverse whole-page source authoring, and
clean-vNext publication are intentionally resolved by `add-versioned-production-mode-transitions` after
this contract is archived.
