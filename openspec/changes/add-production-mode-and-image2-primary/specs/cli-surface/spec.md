## ADDED Requirements

### Requirement: Public CLI exposes one production-mode surface

`ppt_flow init` SHALL accept exact `--mode html-only|html-then-image2|image2-only` and default to
`image2-only`. The closed state grammar SHALL add exactly:

- `ppt_flow state <run-dir> --set-production-mode <mode>` for an exact same-pipeline mode transition;
- `ppt_flow state <run-dir> --repair-production-mode-mirror` to copy the exact authoritative mode/version into metadata; and
- `ppt_flow state <target-run-dir> --register-production-mode-from <source-run-dir>` for idempotent same-pipeline post-publication registration; and
- `ppt_flow state <run-dir> --record-image2-delivery-review <proceed|repair|redirect> [--reason <text>]` for first-class whole-page final review.

These forms SHALL be mutually exclusive with one another and with JSON, gate checks/recovery, and
delivery-review forms. Registration SHALL reject a source outside the same deck, a non-visible target,
a changed/conflicting relationship, and cross-pipeline use; the existing migration owner MAY call its
internal explicit-`html-only` registration only after verifying the exact migration success receipt.
Same-pipeline HTML transitions SHALL delegate to the state owner, while cross-pipeline requests SHALL
return typed `transition_required` guidance without an in-place edit. Help and successful init/mode/
registration/repair results SHALL include normalized run version, selected mode, derived pipeline, and
nearest next action.

Unknown mode values, missing/corrupt authority, mode/source mismatch, or CAS conflict SHALL use the
existing one-final-JSON diagnostic producer and SHALL fail before branch-specific readiness, provider
credentials, generated paths, or writes. CLI return audits SHALL cover every new success and non-zero
path without copying the diagnostic schema into MD consumers.

#### Scenario: Init omits mode

- **WHEN** `ppt_flow init` is called without `--mode`
- **THEN** stdout reports `image2-only`, its whole-page pipeline, and the Image2-primary next action

#### Scenario: Invalid mode is supplied

- **WHEN** init or a mode transition receives an unknown mode
- **THEN** CLI returns `USAGE` through the registered diagnostic envelope before creating or changing a bundle

#### Scenario: Same-pipeline transition succeeds

- **WHEN** the exact run changes from `html-only` to `html-then-image2` with current expected state
- **THEN** CLI reports the old/new mode and unchanged `html-first-v1` pipeline
- **AND** it does not submit provider work

#### Scenario: Cross-pipeline transition is deferred

- **WHEN** the exact run requests `image2-only` from an HTML mode
- **THEN** CLI reports typed versioned-transition guidance and makes no state/source/generated mutation

#### Scenario: Published target registration is retried

- **WHEN** the exact same-pipeline target is visible but its prior mode registration was interrupted
- **THEN** `state --register-production-mode-from` commits or reports the already-current target record idempotently
- **AND** it does not copy source gates, node completion, or generated evidence

#### Scenario: State operation flags are mixed

- **WHEN** a caller combines mode transition, mirror repair, registration, JSON, gate, or delivery-review forms
- **THEN** CLI returns `USAGE` before state, metadata, source, or target mutation

### Requirement: Doctor exposes production-scoped readiness without hidden live work

The root grammar SHALL add `ppt_flow doctor --mode <mode>` and
`ppt_flow doctor --run-dir <run-dir>`. The two selectors SHALL be mutually exclusive. `--run-dir`
SHALL inspect the exact authoritative mode and fail closed on unusable state/drift; `--mode` supports
pre-init checks. Omitted selectors retain the existing default HTML-readiness compatibility behavior.
Existing `--image2` SHALL remain a compatibility alias for the `image2-only` readiness profile and SHALL
be mutually exclusive with either selector. `--smoke` and `--probe-vendors` remain mutually exclusive,
imply an Image2-capable profile when no selector is supplied, and retain their disclosed live-submit
semantics; neither flag is inferred from a mode or run.

`html-only` SHALL run common plus HTML requirements. `image2-only` SHALL run common plus Image2 presence
requirements and omit HTML-only Playwright/ECharts/Chromium/font-runtime checks. `html-then-image2`
SHALL make common plus HTML failures blocking for current HTML work and report missing Image2 presence
as deferred guidance until the refinement boundary; the explicit Image2 check at that boundary remains
blocking. Human/JSON output SHALL distinguish selected profile, current-action readiness, deferred
readiness, and whether a live request was explicitly selected.

#### Scenario: Pre-init Image2-primary doctor is scoped

- **WHEN** `doctor --mode image2-only` runs without live flags
- **THEN** HTML-only runtime failures do not affect the verdict and Image2 presence is checked offline

#### Scenario: Existing run supplies mode authority

- **WHEN** `doctor --run-dir <run-dir>` targets a valid `html-only` version
- **THEN** it runs the HTML readiness profile without consulting metadata as mode authority

#### Scenario: HTML-then-Image2 can begin locally

- **WHEN** HTML readiness passes but deferred Image2 presence fails under `html-then-image2`
- **THEN** doctor reports current HTML work ready plus the later repair guidance
- **AND** no live provider request runs and refinement submit remains blocked until repaired

#### Scenario: Doctor selectors conflict

- **WHEN** mode, run-dir, or the compatibility `--image2` selector is combined incompatibly
- **THEN** doctor returns `USAGE` before environment/provider inspection

### Requirement: Public production commands route from canonical mode policy

For run-scoped `validate`, `pilot`, `approve`, `style-master`, `build`, `refresh`, `image2`, `state`,
and `status`, `ppt_flow` SHALL inspect the exact version-scoped production mode before
branch-specific parsing/readiness and SHALL verify its source pipeline. It SHALL then delegate to the
existing owning adapter: HTML commands for both HTML modes, normal whole-page pilot/build for
`image2-only`, and modern `image2 *` refinement only for `html-then-image2`. `html-only` SHALL return
typed mode-disabled guidance to the same-pipeline switch without creating/refining state; whole-page
`image2-only` SHALL return not-applicable guidance to normal pilot/build and SHALL NOT redirect modern
refinement commands into whole-page generation.

Mode-inapplicable but future-reserved behavior MAY return successful typed guidance only when no
protected invariant is at risk. Unknown identity, pipeline drift, active ownership conflict, invalid
provenance, or missing provider authorization SHALL remain a non-waivable hard failure through the
existing producer-owned envelope.

For a durable first-class `image2-only` create execution, `state <run-dir>
--record-image2-delivery-review <proceed|repair|redirect> [--reason <text>]` SHALL call the state-owned
Image2 final-review publication described by `node-specification`; it SHALL reject `--force` and every
caller-supplied lineage field. The existing HTML branch and its explicit evidence continuation remain
unchanged. Before a first-class whole-page style-master, pilot, build, or refresh actually submits to a
provider, the Controller SHALL have persisted a current typed human authorization for the shown
operation/scope/count; CLI SHALL fail before submit if the active first-class execution lacks that
decision. No authorization is required when provenance proves the selected command will make zero
provider submissions. Historical compatibility retains its accepted explicit maintenance-controller
authorization semantics.

#### Scenario: Image2-primary pilot routes normally

- **WHEN** `ppt_flow pilot` targets a consistent `image2-only` version
- **THEN** it delegates to whole-page Image2 pilot generation with existing cost/provenance gates
- **AND** it does not invoke HTML composition or modern refinement

#### Scenario: HTML-only build stays local

- **WHEN** `ppt_flow build` targets a consistent `html-only` version with current gates
- **THEN** it delegates to the existing local HTML delivery path without Image2 credentials

#### Scenario: Modern Image2 is inapplicable to whole-page mode

- **WHEN** `ppt_flow image2 plan` targets `image2-only`
- **THEN** CLI returns typed not-applicable guidance that points to normal pilot/build
- **AND** it creates no refinement state or provider attempt

#### Scenario: Modern Image2 is disabled in html-only

- **WHEN** `ppt_flow image2 plan` targets `html-only`
- **THEN** CLI returns typed guidance for `state --set-production-mode html-then-image2`
- **AND** it creates no refinement state or provider attempt

#### Scenario: Provider authority is missing

- **WHEN** an Image2-primary operation reaches a chargeable submit boundary without existing authorization/readiness
- **THEN** CLI hard-stops before submit and names the authorized recovery action
- **AND** no force or quality waiver bypasses provider authority

#### Scenario: HTML style-master seam is not implemented

- **WHEN** a consistent HTML mode invokes `style-master`
- **THEN** CLI exits successfully with typed `available: false` guide output and the local visual-system next action
- **AND** it writes no artifact and initializes no provider

#### Scenario: Image2-primary final review is recorded

- **WHEN** the Controller invokes `state --record-image2-delivery-review proceed` after showing current whole-page delivery
- **THEN** CLI derives and atomically binds the current execution/version/artifact evidence
- **AND** it creates no HTML delivery-review record

## MODIFIED Requirements

### Requirement: CLI surface preserves command names

The `ppt_flow` CLI SHALL continue to expose exactly 15 top-level commands: `doctor`, `init`, `status`,
`approve`, `style-master`, `validate`, `pilot`, `build`, `refresh`, `new-version`, `test`, `state`,
`slides`, `migrate-html`, and `image2`. Existing arguments remain compatible except for the declared
omitted-init default change to `image2-only` and the added production-mode selectors/closed state
operations. `image2` SHALL expose only closed `plan`, `authorize`, `generate`, `accept`, `use-html`,
`cleanup`, and unknown-submit resolution operations for `html-then-image2`; it is the sole modern
visual-slot refinement CLI entry and SHALL not become the whole-page Image2 entry for `image2-only`.
`migrate-html` SHALL expose only closed `prepare`, `preview`, and `apply` operations and SHALL not mutate
a source version in place.

`state` SHALL retain controller-owned migration confirmation and add only the closed production-mode,
mirror-repair, version-registration, and Image2-primary final-review operations specified by this
change. None is a new top-level command, a fourth `migrate-html` operation, or a generic state editor.
Migration confirmation remains exact `--confirm-migration-apply --plan-hash <hash> --old-side-mode
<verified-current|degraded-missing|degraded-stale>`.

#### Scenario: Help lists the complete surface

- **WHEN** `ppt_flow --help` runs
- **THEN** all 15 command names, including `image2`, are listed once

#### Scenario: Existing init invocation remains valid

- **WHEN** Agent runs `ppt_flow init deck_demo --deck-type keynote --style dark-executive`
- **THEN** a run bundle is created using the compatible invocation shape and new `image2-only` default

#### Scenario: Migration preparation is advertised without adding a top-level command

- **WHEN** Agent reads `ppt_flow migrate-html --help`
- **THEN** help lists `prepare --preset <name>`, `preview`, and `apply` as the closed migration operations
- **AND** the top-level command inventory remains 15

### Requirement: state prints a where-am-I resume card

`ppt_flow.mjs state` human output and successful `--json` output SHALL retain the whole-session
where-am-I card and SHALL resolve authoritative production mode before verifying the canonical source
pipeline. The card SHALL expose non-empty `workflow_summary` and `suggested_next`, exact nullable
`production_mode`, exact normalized `pipeline`, mode/source consistency, and `state_present`. When
durable state exists it SHALL retain active `playbook`, `current_node`, current-node status, optional
`waiting_for`/`note`, gates, and `playbook_stack`, and SHALL evaluate pending/completion only against the
mode-filtered active node set. For a historical markerless deck without state it SHALL expose
`production_mode: null`, the read-only compatibility projection, legacy-maintenance ownership, and
`state_present: false`; it SHALL leave execution fields null/not-active and create no state. The bounded
non-writing migration-handoff projection remains unchanged.

Closed recovery, HTML delivery-review, production-mode transition/mirror/version-registration, and
Image2-primary final-review operations SHALL remain mutually exclusive with `--json`, `--check-gates`,
and one another as declared by their owners. Existing `--record-delivery-review` SHALL apply to both
HTML modes through `html-first-v1`; `--record-image2-delivery-review` SHALL apply only to a durable
first-class `image2-only` create execution. Each derives its own evidence and rejects caller-supplied
lineage. Historical compatibility uses its existing review semantics.

For both HTML modes, top-level JSON `html_reviews` SHALL retain the existing bounded content, visual,
delivery, reset, and journal projection. For `html-only`, current accepted delivery SHALL not gain
refinement debt. For `html-then-image2`, that same HTML evidence SHALL be reported as current but
overall completion and `suggested_next` SHALL require current refinement and renewed final review. For
`image2-only`, `html_reviews` SHALL be null and the card SHALL expose bounded whole-page gate, header,
PPTX/notes, final-review freshness, completion, and nearest-owner facts from the shared evaluator; it
SHALL not expose an HTML/refinement record or infer currentness from generated-file presence.

The retained HTML projection SHALL preserve exact enums and bounded fields: content/visual decisions
`pending|approved|waived`, freshness `current|stale|missing|invalid`, independent
`evidence_complete`, bounded `waived_checks`, visual outstanding recipe keys/slide IDs, delivery
decision `null|proceed|repair|redirect`, reset status/ownership, and gate-journal status plus its opaque
token only when the existing contract permits it. Plain state/status SHALL not expose reset IDs, claim
timestamps, bound SHAs/paths, or raw owner data and SHALL perform no recovery. The exact migration
handoff output remains `migration_handoff_pending` plus source/target versions and guidance, without
receipt SHAs/paths.

`state --recover-gate-journal` SHALL retain its exact token, ownership, and age rules. HTML
`--record-delivery-review` SHALL retain normal/forced proceed reason rules, complete-evidence rules,
current reviewable PPTX/contact-sheet minimum, and the prohibition on caller-supplied digest/path/SHA/
timestamp values. `repair|redirect` still require bounded reasons and complete current evidence. The
new Image2 final-review operation has no force path and SHALL not weaken any of these HTML contracts.

Suggested-next SHALL remain waiting-first, then identity/registration/journal repair, then the earliest
mode-owned stale or missing decision/artifact action. Card construction SHALL remain in the shared state
module so `status` consumes exactly the same non-mutating projection. Deck resolution SHALL continue
through `deckRoot(resolve(runDir))`, and the top-level command count remains 15.

#### Scenario: HTML resume card exposes outstanding review

- **WHEN** an HTML-mode run has current content approval but stale page evidence for two slides
- **THEN** state output identifies the HTML pipeline and the two sorted outstanding slide IDs
- **AND** suggested-next names the visual-review path rather than whole-page Image2

#### Scenario: Complete HTML card omits Phase-4 debt

- **WHEN** current delivery, notes, gates, and `html-delivery-review: proceed` verify under `html-only`
- **THEN** workflow summary reports a complete deliverable
- **AND** suggested-next does not require lifecycle 4 or create refinement state

#### Scenario: Forced delivery card remains transparent

- **WHEN** current target PPTX/contact sheet support forced HTML `proceed` but lineage evidence is incomplete
- **THEN** the card reports current user acceptance with `evidence_complete: false` and bounded `waived_checks`
- **AND** suggested-next recommends repair without fabricating a missing receipt

#### Scenario: Markerless state card does not seed execution

- **WHEN** `state` inspects a historical markerless deck without `_state/state.yaml`
- **THEN** output identifies the compatibility projection, null mode, legacy-maintenance ownership, and `state_present: false`
- **AND** no state file is written and no active node is fabricated

#### Scenario: Interrupted journal is observable but not healed by plain state

- **WHEN** plain state sees new authoritative state with the old metadata mirror
- **THEN** the owning review/mode projection reports repairable mirror drift
- **AND** state emits no journal, state, or metadata write

#### Scenario: Cross-host journal is explicitly recovered

- **WHEN** the Controller has shown an uncertain journal, obtained human confirmation that its owner stopped, and invokes `state --recover-gate-journal` with the exact current token after 300000 ms
- **THEN** CLI applies only the exact recovery matrix and exits with bounded recovered/blocked status
- **AND** it does not create a content/visual decision

#### Scenario: Recovery token is stale or owner is active

- **WHEN** the token mismatches, journal changed, minimum age is unmet, or same-host PID is active
- **THEN** recovery fails with `CONFLICT` or repair-required evidence and changes no store

#### Scenario: Uncertain owner diagnostic requires a human

- **WHEN** state/check-gates/build cannot automatically recover an uncertain journal
- **THEN** the producer-owned next action marks human confirmation required and carries the opaque token for the Controller
- **AND** it does not tell the human to edit `_state` or invent approval

#### Scenario: Delivery review decision is recorded

- **WHEN** the Controller invokes state `--record-delivery-review repair --reason <text>` after showing current HTML delivery
- **THEN** the command publishes one current evidence-bound repair decision
- **AND** status remains incomplete and routes to the owning repair node

#### Scenario: Delivery review targets legacy run

- **WHEN** a historical markerless compatibility run receives `--record-delivery-review`
- **THEN** it fails before state writes and points to its whole-page controller review semantics

#### Scenario: Waiting state remains first

- **WHEN** durable state has a non-empty current-node `waiting_for`
- **THEN** `suggested_next` surfaces that wait before artifact-based heuristics

#### Scenario: State resolves deck via deckRoot

- **WHEN** Agent supplies a version run directory under `3_versions/vN`
- **THEN** state resolves the deck through `deckRoot(resolve(runDir))`

#### Scenario: Required refinement remains visible

- **WHEN** an `html-then-image2` run has current HTML delivery but missing or stale refinement
- **THEN** the card reports overall completion false and points to the exact refinement owner

#### Scenario: Image2-primary card uses whole-page evidence

- **WHEN** a durable `image2-only` run has current whole-page delivery and final review
- **THEN** the card reports completion without HTML or modern-refinement debt

### Requirement: status surfaces playbook position and lesson count

`ppt_flow.mjs status` SHALL reuse the exact non-mutating mode-aware resume-card projection from `state`
after resolving mode and verifying pipeline. With durable state, human and JSON output SHALL retain
production mode, normalized pipeline, active playbook/current node, mode-filtered completion, and the
nearest owning action. Both HTML modes SHALL expose existing `html_reviews`; `html-only` can complete
without Phase 4, while `html-then-image2` remains incomplete until current refinement and renewed final
review. First-class `image2-only` SHALL expose whole-page gate/header/delivery/final-review facts without
HTML/refinement debt. A historical markerless deck without state SHALL report compatibility and
`state_present: false` without healing/seeding state or inventing an execution.

Status SHALL retain the `Lessons` line and JSON `lessons_count`, counting files in deck-root `_lessons/`
except `README.md` without invoking `lessons.mjs` as a subprocess. Missing/empty remains zero/`none`;
positive counts retain the review hint.

#### Scenario: Status shows lesson count when lessons exist

- **WHEN** Agent runs status on a deck with two lesson files excluding README
- **THEN** human output shows `Lessons: 2` with the review hint
- **AND** JSON includes `lessons_count: 2`

#### Scenario: Status shows no lessons

- **WHEN** `_lessons/` is absent or contains no counted files
- **THEN** human output shows `Lessons: none`
- **AND** JSON includes `lessons_count: 0`

#### Scenario: Status shows durable playbook position

- **WHEN** a run has usable `_state/state.yaml`
- **THEN** human and JSON output include its active playbook and current node

#### Scenario: HTML status exposes evidence freshness

- **WHEN** an HTML-mode run has stale content, one uncovered recipe key, and no delivery review
- **THEN** status exposes each condition through the shared HTML review projection
- **AND** does not reduce them to metadata scalar gate values

#### Scenario: Markerless status is non-writing

- **WHEN** a historical markerless deck lacks `_state/state.yaml`
- **THEN** status reports legacy compatibility without creating state or inventing an execution pointer

#### Scenario: Image2-primary status is mode-owned

- **WHEN** status targets a durable consistent `image2-only` run
- **THEN** it reports whole-page completion facts and the first missing owner action rather than compatibility maintenance

### Requirement: Pilot uses preview readiness and does not waive gates

`ppt_flow pilot` SHALL resolve authoritative production mode and verify source pipeline before
readiness. For first-class `image2-only` and historical markerless compatibility, preview readiness
SHALL remain structure plus current style master, content/visual gates SHALL not be required or mutated,
and whole-page Stage 2 SHALL receive `--preview`. A first-class operation that will submit provider work
also requires its current scoped authorization; proven zero-submit reuse does not. For both HTML modes,
pilot SHALL require structure plus valid local HTML source/runtime inputs but no whole-page style master
or approved gates; it SHALL compose production-equivalent review artifacts only and shall not publish
Stage 4/PPTX. Neither adapter writes `waived` merely to unlock preview. Full build still requires the
adapter's current authoritative gate evidence.

#### Scenario: HTML preview runs while gates are pending

- **WHEN** a valid HTML-mode run has pending content/visual gates
- **THEN** pilot produces review evidence without whole-page style master or provider setup
- **AND** Stage 4 remains blocked

#### Scenario: Legacy preview behavior remains compatible

- **WHEN** a historical markerless run has a style master and pending gates
- **THEN** pilot may run whole-page Stage 2 under compatibility preview readiness
- **AND** does not mutate gate fields

#### Scenario: Image2-primary preview uses the same adapter

- **WHEN** a consistent `image2-only` run enters pilot preview
- **THEN** it uses whole-page preview readiness and current authorization only if a submit is required

### Requirement: Pilot accepts --force-images and skips by default

`ppt_flow pilot` SHALL retain `--force-images` for first-class `image2-only` and historical markerless
compatibility: without it, current pilot images are skipped; with it, selected whole-page images
regenerate under the applicable authorization/review contract. For either HTML mode, `--force-images`
SHALL fail with `USAGE` before readiness/writes because HTML preview freshness is fingerprint-driven;
callers SHALL use the HTML preview/rebuild selector instead of a provider-generation flag.

#### Scenario: Legacy pilot skips existing images by default

- **WHEN** historical markerless pilot images exist and pilot runs without `--force-images`
- **THEN** whole-page Stage 2 skips those current files

#### Scenario: HTML pilot receives force-images

- **WHEN** a marked HTML-mode run invokes pilot with `--force-images`
- **THEN** the command fails before writes/provider setup with the HTML preview next action

#### Scenario: Image2-primary force-images is authorized

- **WHEN** `image2-only` pilot will regenerate selected images with `--force-images`
- **THEN** submit scope must match the active first-class authorization before transport

### Requirement: approve dual-writes metadata and _state gates

`ppt_flow approve <runDir> <gate>` SHALL resolve production mode and verify pipeline before validating
approval evidence. For first-class `image2-only` and historical markerless compatibility, existing
metadata `content_gate|visual_gate` and `_state.gates.content|visual` writes/reads SHALL remain and HTML
approval SHALL never overwrite them. For both HTML modes, ordinary content/visual approval SHALL require
no reset pending plus the exact current-reset hash of an `approvable: true` plan covering every
outstanding evidence item; scoped, incomplete, or pre-reset plans SHALL fail and list missing/stale
evidence. Explicit `--waive --reason` MAY retain the existing bounded current-identity waiver behavior.

Successful HTML publication SHALL write one version-scoped/current-reset `html-content-review` or
`html-visual-review` record under authoritative state, update only matching `_state.gates.html_*`
mirrors/run versions, then update only metadata `html_*` mirrors through the recoverable journal. These
fields remain compatibility/status mirrors and SHALL never satisfy readiness alone or overwrite
whole-page scalars. Waiver reasons retain the shared 1024-byte `normalizeHumanReason` rule; ambiguous or
unrecoverable partial writes fail closed.

#### Scenario: HTML visual approval binds current evidence

- **WHEN** Agent approves visual with the exact current HTML review-plan hash
- **THEN** authoritative current-version visual evidence is published before mirrors are synchronized
- **AND** the record binds current preview/fingerprint evidence

#### Scenario: HTML waiver omits a reason

- **WHEN** Agent requests an HTML gate waiver without an explicit reason
- **THEN** approval fails without changing authoritative evidence or mirrors

#### Scenario: HTML scoped plan is incomplete

- **WHEN** ordinary approval supplies a current hash whose plan is non-approvable because other evidence is outstanding
- **THEN** approval fails, identifies the missing IDs/coverage, and writes neither state nor mirrors

#### Scenario: HTML incomplete plan is explicitly waived

- **WHEN** current source/reset/version identity is valid and Agent supplies `--waive --reason` for that incomplete plan
- **THEN** the gate publishes `status: waived` with bounded failed checks
- **AND** readiness reports the waiver decision separately from evidence completeness

#### Scenario: Legacy approval remains compatible

- **WHEN** Agent approves a historical markerless gate
- **THEN** existing metadata and `_state.gates` values remain synchronized

#### Scenario: HTML approval coexists with approved legacy version

- **WHEN** one deck has whole-page gate scalars and an HTML version is approved
- **THEN** HTML publication changes only `html_*` mirror fields and authoritative HTML evidence
- **AND** `content_gate|visual_gate` plus `_state.gates.content|visual` remain byte-semantically unchanged

#### Scenario: Image2-primary approval uses whole-page gates

- **WHEN** Agent approves content or visual for `image2-only`
- **THEN** the ordinary whole-page scalar/state contract applies without creating HTML review evidence

### Requirement: Title refresh routes by the affected slides' resolved modes

`ppt_flow refresh --kind title` SHALL resolve production mode, verify pipeline, and retain
`--only <ids>|--all` selector semantics. For both HTML modes, header text is renderer-owned visible
content: refresh SHALL rebuild affected local review output, validate overflow, stale content approval
when its fingerprint changes, preserve visual approval only when dependencies remain unchanged, reject
whole-page force/reuse/profile options, and wait for current HTML evidence before Stage 4. For
first-class `image2-only` and historical compatibility, existing render-mode routing, selector-free
body-lock restriction, `TITLE_REVIEW_REQUIRED`, force-pilot/header evidence, and reviewed-image reuse
SHALL remain.

#### Scenario: HTML title changes

- **WHEN** one marked slide title changes
- **THEN** local review pixels are rebuilt, content evidence becomes stale, and visual evidence remains current if visual dependencies are unchanged
- **AND** no whole-page/header-review route is selected

#### Scenario: Legacy full-page title changes

- **WHEN** a historical markerless selected title belongs to full-page and lacks current header review
- **THEN** existing `TITLE_REVIEW_REQUIRED` and exact force-pilot action remain

#### Scenario: Image2-primary title uses render mode

- **WHEN** an `image2-only` title refresh resolves full-page or body+header-lock
- **THEN** it selects the existing whole-page render-aware path through normal mode ownership

### Requirement: Existing approve command records header review evidence

`ppt_flow approve <run-dir> header` SHALL be whole-page-Image2-only: it applies to first-class
`image2-only` and historical markerless compatibility and retains current pilot/provenance checks,
version-scoped `nodes.header-review.by_version`, matching-profile merge/partial coverage, stale
rejection, and ID-plus-reason waiver behavior without changing content/visual metadata gates. For both
HTML modes it SHALL fail before readiness/artifact/state writes with branch-inapplicable guidance to
`approve ... visual --plan-hash`; HTML evidence SHALL never enter `header-review`.

#### Scenario: Legacy partial header batches merge

- **WHEN** two historical markerless current pilot batches have matching fingerprint/profile
- **THEN** their reviewed IDs merge under the same version record

#### Scenario: HTML run approves header

- **WHEN** a marked HTML-mode run invokes `approve ... header`
- **THEN** CLI writes no whole-page evidence and points to the current HTML visual review path

#### Scenario: Image2-primary header approval remains first class

- **WHEN** current `image2-only` pilot evidence is reviewed
- **THEN** header approval records the existing version-scoped whole-page evidence without entering compatibility maintenance

### Requirement: Build preserves reviewed full-page images

For first-class `image2-only` and historical markerless compatibility, current header evidence SHALL
retain reviewed/accepted full-page preservation: default force conflicts with reviewed bytes,
`build --reuse-images` preserves matching reviewed images and generates only missing/unreviewed ones,
and profile drift requires new pilot/review. Any actual first-class submit also requires exact current
build authorization; a proven reuse-only build does not. For both HTML modes, currentness SHALL come
from effective composition fingerprints/manifests; `--reuse-images`, whole-page resolution/model/
provider options, and whole-page review evidence SHALL be rejected before writes. HTML build SHALL
reuse current immutable effective objects automatically and never treat forced-fallback review bytes as
delivery.

#### Scenario: Legacy reviewed build uses reuse

- **WHEN** historical markerless header evidence/profile/images are current
- **THEN** `build --reuse-images` preserves those images and fills only missing whole-page output

#### Scenario: HTML build receives reuse-images

- **WHEN** a marked HTML-mode run invokes build with `--reuse-images`
- **THEN** the command rejects the whole-page-only option before production writes

#### Scenario: Image2-primary reuse avoids a fictitious authorization

- **WHEN** `image2-only` build proves every selected image reusable with zero submits
- **THEN** it preserves reviewed bytes without requesting or consuming provider authorization
