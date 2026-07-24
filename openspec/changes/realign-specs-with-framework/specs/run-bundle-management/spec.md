## MODIFIED Requirements

### Requirement: Fresh init seeds an explicit production mode and matching source
Both `bundle_layout --init` and `ppt_flow init`, including generic init and every active deck-type template (`keynote`, `pitch`, `report`, and `training`), SHALL accept one exact mode `html-only|html-then-image2|image2-only` and SHALL default an omitted mode to `image2-only`. They SHALL seed canonical `3_versions/v1/slide-specifications.md` with a direct source marker that matches the selected mode: `html-only` and `html-then-image2` use `production.pipeline: html-first-v1`, while `image2-only` uses `production.pipeline: whole-page-image2-v1`. Every new source SHALL use `identity.scheme: mnemonic-v1`.

HTML seeds SHALL retain the exact structured-body/family guidance owned by `html-slide-contract`, no legacy top-level `render`, `RENDER MODE`, `IMAGE PROMPT`, or `VISUAL ASSETS`, and a valid `html_first` visual projection. The Image2-primary seed SHALL contain the current whole-page Image2 authoring and render-mode controls needed by Stage 1 while presenting them as a first-class production source rather than a compatibility downgrade.

Deck-root state SHALL seed authoritative `production_mode.by_version["3_versions/v1"].mode`; metadata SHALL seed only the human-readable mode/v1 mirror. Mode-owned gate mirrors SHALL begin pending and SHALL not authorize delivery. Init SHALL not create style-master output, page images, headers, HTML output, PPTX/notes output, provider attempts, or modern refinement state.

#### Scenario: Fresh init uses the release default
- **WHEN** a user initializes a new run bundle without `--mode`
- **THEN** v1 state records `image2-only` and source declares `production.pipeline: whole-page-image2-v1`
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

### Requirement: Cross-pipeline transitions publish only clean target versions
Run-bundle management SHALL materialize a cross-pipeline target only from confined, explicitly authored candidate source/control inputs under the source version's transition scratch owner. Preparation MAY generate only the source's stable identity/order ledger; it SHALL not copy or derive renderer-owned target source/control from opposite-pipeline prose, notes, prompts, render modes, visual assets, metadata/history, pixels, or generated artifacts. Preview SHALL bind candidate and inherited backbone receipts, source/target versions and modes, expected pipeline markers, the digest of explicitly authored target-intake fields, and the target's deterministic impact. Apply SHALL revalidate those inputs, use the existing same-parent reservation/no-replace publication authority, write an exact target transition receipt, and leave the source version untouched.

The transition adapter SHALL use `_scratch/production-mode-transition/` as its sole source-local candidate/plan/journal owner, with exactly `candidate-run/`, `plan.json`, and `apply-journal.json` as immediate entries. The candidate root is the only writable candidate source/control tree. `plan.json` is the only `pptmaker-production-mode-transition-preview-v1` preview, and `apply-journal.json` is the only `pptmaker-production-mode-transition-apply-journal-v1` journal. Its post-publication success receipt SHALL be target-local `_generated/qa/production_mode_transition.json`, contain `pptmaker-production-mode-transition-success-v1`, and be the only visible-target registration/handoff authority. Retired HTML-migration scratch, schemas, plans, journals, generated output, and receipts SHALL be rejected as transition authority; a mode-governed request SHALL use only the current adapter.

The transition owner SHALL use exact closed artifacts: `pptmaker-production-mode-transition-preview-v1`, `pptmaker-production-mode-transition-apply-journal-v1`, and `pptmaker-production-mode-transition-success-v1`. Its preview plan hash covers the source execution identity, source/target versions/modes/pipelines, candidate and inherited control receipts, expected target marker, and direction-specific deterministic impact. The journal binds that hash, exact source execution/version, target identity/mode/pipeline, opaque 64-lowercase-hex owner token, normalized host, positive PID, age timestamp, and exact confined reservation/staging basenames. The success receipt binds the same relationship, target source/control proof, and target-intake digest; it is the only post-publication registration/handoff authority.

An active/proven-live same-host journal is non-overridable. A proven-dead same-host journal younger than 60000 ms returns a retry conflict and may be automatically recovered at or after that age. A valid cross-host or otherwise uncertain journal may be recovered only with its exact owner token, at age at least 300000 ms, after the Controller persists the state owner's exact journal-digest-bound human no-active-apply confirmation. Malformed, unconfined, foreign, mismatched, or stale journal inputs fail closed. Recovery never replaces a visible target: it either completes exact receipt-bound registration/handoff, cleans only an absent owned target transaction then restores source, or hard-stops for inspection.

For an HTML target, current renderer validation/materialization proves the existing contract can run; it SHALL NOT impose a new HTML quality score, visual-parity requirement, style master, or aesthetic retry. For an Image2 target, publication SHALL create only canonical explicit whole-page source/control state and report `needs_render`; it SHALL NOT invoke a provider or copy HTML output. The target receives mode authority only through the post-publication state handoff described by `node-specification`.

#### Scenario: HTML source becomes an Image2 target
- **WHEN** a confirmed HTML-to-Image2 candidate is published
- **THEN** vNext contains only the authored explicit whole-page target source/control shape and pending target work
- **AND** no HTML generated bytes, review, provider authorization, or completion record is copied

#### Scenario: Image2 source becomes an HTML target
- **WHEN** a confirmed Image2-to-HTML candidate passes the existing local source/renderer contract
- **THEN** vNext contains the selected explicit HTML marker and target-local pending delivery evidence
- **AND** the operation does not require an HTML aesthetic score or visual parity verdict

#### Scenario: Publication crashes before mode handoff
- **WHEN** a verified target becomes visible before its target mode is registered
- **THEN** the target remains intact, ordinary target production reports one mode-registration recovery, and rerun is idempotent

#### Scenario: Target collision or candidate drift occurs
- **WHEN** the target name already exists or any bound candidate/input receipt differs at apply time
- **THEN** publication creates no replacement target and the source version remains unchanged

#### Scenario: Retired scratch cannot supply transition authority
- **WHEN** a source contains retired HTML-migration scratch while a production-mode transition is prepared
- **THEN** the transition reads and writes only `_scratch/production-mode-transition/`
- **AND** it neither adopts the retired candidate nor treats its plan, journal, or derived artifacts as transition evidence

#### Scenario: Uncertain transition journal needs explicit human confirmation
- **WHEN** a transition apply journal is valid but cross-host or otherwise owner-uncertain
- **THEN** recovery remains blocked until its exact token is at least 300000 ms old and the state owner records matching journal-digest-bound no-active-apply confirmation
- **AND** it does not delete, replace, or register a target before those conditions hold

### Requirement: Version publication completes only after production-mode registration
Every same-pipeline visible-version publication SHALL carry the exact source and target run identities
to the state-owned registration interface. It SHALL report a target as usable only after that interface
has recorded the exact current mode or returned already-current. The interface SHALL verify the source
mode, target visibility and same-deck relationship, direct target marker, expected pipeline, and any
existing target record before its expected-state CAS. It SHALL add only the target mode and display
mirror; it SHALL not copy source Controller records, approvals, generated bytes, provider authority,
or delivery evidence.

If publication becomes visible before registration, the target SHALL remain intact and ordinary
production SHALL return bounded `mode_registration_required` guidance for the exact mechanical retry.
That retry SHALL not delete or replace the target and SHALL not ask a human to choose a mode. A
confirmed current cross-pipeline production-mode transition is the sole additional registration path:
it SHALL use its exact candidate, plan, journal, target receipt, and state-owned baseline handoff.
No marker, metadata mirror, source history, historical receipt, or directory shape SHALL register a
mode. A missing, retired, malformed, or conflicting source/state protocol SHALL fail before target
registration and emit one owner-issued typed next action without mutation.

#### Scenario: Current same-pipeline vNext is registered
- **WHEN** Structural Versioning publishes a verified `whole-page-image2-v1` target from an `image2-only` source
- **THEN** state records `image2-only` for that exact target before publication reports it usable
- **AND** the source/target marker relationship remains explicit

#### Scenario: Registration is interrupted after publication
- **WHEN** a current target is visible but the registration CAS has not committed
- **THEN** ordinary production stops at `mode_registration_required` without replacing the target
- **AND** the same state-owned retry can complete only the exact current registration

#### Scenario: Historical identity cannot register a target
- **WHEN** a visible target has no current source marker, no durable source mode, or only a historical receipt
- **THEN** registration fails closed with one bounded owner-issued typed next action
- **AND** it does not infer a mode or change either version

### Requirement: Management enforces run-bundle-layout via bundle_layout.mjs
`bundle_layout.mjs` SHALL provide the CLI/scaffold surface that enforces the run-bundle ontology owned
by `run-bundle-layout`: `--init`, `--check`, `--new-version`, and `--self-check`. Other scripts SHALL
import general bundle-path constants from it; `_state` directory/file constants SHALL be imported from
`scripts/shared/state/state.mjs`, not re-declared. This capability SHALL not define a second directory
ontology; tree conformity and the glossary Where Map remain owned by `run-bundle-layout`.

`--check --structure-only` MAY report physical layout facts for an older bundle that lacks `_state`, but
that result SHALL not declare it a supported current run, infer a version or mode, or enter resume,
readiness, repair, or Controller execution. State-aware checking SHALL classify absent/retired identity
as unsupported and return the state owner's one bounded typed next action without writing a marker,
state file, or generated artifact.

#### Scenario: Init creates a current whitelist-clean bundle
- **WHEN** `bundle_layout --init deck_test` runs
- **THEN** `bundle_layout --check deck_test/3_versions/v1 --structure-only` passes with zero violations
- **AND** the new bundle has current source and state identity

#### Scenario: Structure-only inspection does not promote an old bundle
- **WHEN** a physically valid older deck lacks `_state/`
- **THEN** `--check --structure-only` may report its layout without writing files
- **AND** state-aware check/resume does not treat the result as current execution authority

### Requirement: Control-file templates mention _state
The seeded `deck-guide.md`, framework `workflow/00-setup/template-deck-guide.md`, and root README
SHALL identify `_state/state.yaml` as resume/progress and production-mode routing authority, while
keeping `_lessons` distinct. `project-metadata.yaml` SHALL describe production mode/version and gate
fields as display mirrors only. Current whole-page Image2 uses its owned `content_gate|visual_gate`
mirror family; HTML uses `html_content_gate|html_visual_gate` plus exact version-scoped review evidence
in state. Neither family, nor metadata alone, SHALL authorize routing or delivery, and one pipeline's
publisher SHALL not mutate the other's mirror family.

Guidance SHALL tell a resumed Agent to call `ppt_flow state` first and to follow the returned bounded
action. Historical metadata may be described only as non-authoritative diagnostic input: it SHALL not
be reinterpreted into a mode, Controller, approval, or continuation route.

#### Scenario: Fresh HTML metadata explains gate authority
- **WHEN** init seeds an HTML-mode `project-metadata.yaml` and `deck-guide.md`
- **THEN** they point to `_state` for mode, HTML evidence, and resume
- **AND** they do not present metadata scalars as sufficient routing or delivery proof

#### Scenario: Whole-page and HTML mirrors remain disjoint
- **WHEN** a current HTML approval updates its display mirror
- **THEN** current whole-page scalar mirrors remain unchanged
- **AND** neither mirror family satisfies the other pipeline's readiness

#### Scenario: Historical metadata is not a resume route
- **WHEN** `ppt_flow state` sees historical metadata without a supported current state/source pair
- **THEN** it returns one bounded owner-issued typed next action without writing a mirror or active execution

### Requirement: checkBundle supports preview vs pipeline readiness
`checkBundle` SHALL retain its synchronous violation-array interface and
`structure|preview|pipeline` readiness modes plus boolean aliases. It SHALL classify the direct current
source marker and durable mode before branch-specific checks. A current
`whole-page-image2-v1` / `image2-only` preview requires structure and `style_master.jpg` but not
approved gates; its pipeline readiness additionally requires its current owned gate evidence. HTML
preview requires structure, valid HTML source/control/catalog, base local renderer readiness, and no
`deletion_pending` reset, but not a style master or approved gates. HTML pipeline additionally uses the
same read-only HTML-review evaluator and exact current-reset version-scoped evidence.

Direct readiness SHALL not create artifacts, write mode/gate/reset evidence or mirrors, recover a
journal, claim/complete a reset, start asynchronous work, or load browser/provider code. Missing,
retired, malformed, or mismatched source/state identity is an unsupported-protocol result, not a
whole-page fallback; it SHALL name the bounded owner action and leave the bundle unchanged.

#### Scenario: Current whole-page preview is style-master based
- **WHEN** a consistent current whole-page run has structure, a style master, and pending gates
- **THEN** preview readiness passes while pipeline readiness remains blocked
- **AND** no gate or state is written by the check

#### Scenario: HTML pipeline has only metadata approval
- **WHEN** metadata gates say approved but current `_state` HTML evidence is absent
- **THEN** pipeline readiness fails closed

#### Scenario: Unsupported historical source has no fallback
- **WHEN** a run has an absent or retired marker or no exact durable mode
- **THEN** readiness reports the source/state protocol problem without selecting a pipeline
- **AND** it does not create a state file, marker, or generated directory

### Requirement: Init produces the run-bundle Agent diagnostic entry
`bundle_layout.mjs#initBundle` and therefore `ppt_flow init` SHALL generate deck-root `AGENTS.md` and
`CLAUDE.md` as short pointers first to `RUN_BUNDLE.md` and then to `deck-guide.md`. The generated root
README SHALL tell a human to give `RUN_BUNDLE.md` to a local repository Agent. The guide and
`workflow/00-setup/template-deck-guide.md` SHALL contain the runtime-consumer essentials owned by
`node-specification`: parse the final CLI failure envelope, use supported structured
`diagnostic.next`, preserve `program`/`args` boundaries, stop on `requires_human:true`, do not invent
omitted lineage, and edit source then rerun rather than hand-edit `_generated/`.

Scaffold writes are create-if-absent. Normal status, build, and check commands SHALL not create or
overwrite these controls in an existing bundle. Absence of a newer discovery card in an existing bundle
is not a migration trigger or execution authority; state-aware commands shall return their ordinary
bounded current-protocol diagnostic rather than silently upgrading the bundle.

#### Scenario: Fresh init is discoverable to agent-agnostic runtimes
- **WHEN** `initBundle` creates a temporary deck
- **THEN** `AGENTS.md` and `CLAUDE.md` route to `RUN_BUNDLE.md` then `deck-guide.md`
- **AND** the guide includes the current diagnostic-consumer essentials

#### Scenario: Existing bundle is not silently rewritten
- **WHEN** an existing bundle lacks an Agent control file and normal commands run
- **THEN** they do not create or overwrite that file
- **AND** they do not treat the absence as permission to migrate or resume a historical protocol

### Requirement: Init creates assets directory skeleton with stub manifest
`initBundle()` SHALL retain the common `2_backbone/visual-style/assets/` scaffold with `svg/`,
`reference/`, `icons/`, README, and exact empty v2 `asset-manifest.yaml` (`version: 2`, `assets: {}`)
for every current mode. The README SHALL explain that structured ID/SHA binding through
`primary_visual.fallback` or typed-block icons belongs to HTML source, while `image2-only` uses its
current whole-page `VISUAL ASSETS` source contract; neither form is authority for the other adapter.
The empty catalog selects no pipeline and creates no generated/provider artifact.

An older absent or unrecognized manifest is non-authoritative diagnostic input. Init, check, and state
healing SHALL not rewrite it, infer a pipeline from it, or create an asset catalog merely to make a
historical bundle appear current. A supported current run receives only the canonical v2 scaffold at
fresh init or through an explicitly authorized current source-control edit.

#### Scenario: Fresh init creates v2 catalog skeleton
- **WHEN** `initBundle()` scaffolds a new deck in any production mode
- **THEN** the asset directories and empty v2 manifest exist
- **AND** the README distinguishes HTML structured binding from current whole-page ownership

#### Scenario: Historical manifest cannot classify a run
- **WHEN** an existing bundle contains a v1 or unknown asset manifest
- **THEN** check/state leaves it unchanged and does not infer a mode or generated-asset authority

### Requirement: Bundle checks are pipeline-aware without mutating existing decks
`checkBundle()` SHALL inspect authoritative production mode only after it has verified the canonical
direct source marker and exact durable state relationship, then apply adapter-specific required and
forbidden control/generated rules. Structure-only checks may report physical layout facts for older
bundles, but state-aware checks SHALL not treat absence of state/assets as support for a historical
route. Check and heal SHALL never insert a source marker, infer/write a missing mode, rewrite source,
create generated directories, or migrate a bundle merely to make validation pass. Mode/source drift,
an unregistered visible target, and every unsupported protocol SHALL return the owning bounded repair
or recreation action.

#### Scenario: Check observes an unsupported older bundle
- **WHEN** a bundle has a historical whole-page tree but lacks a supported current source/state pair
- **THEN** check reports its non-writing source/state diagnostic
- **AND** no marker, mode record, generated directory, or Controller state is fabricated


### Requirement: Topology ignores only an explicit macOS system artifact
HTML-production and production-mode-transition topology walks in bundle_layout.mjs SHALL ignore only an entry whose basename is exactly .DS_Store. They SHALL not use a generic dotfile predicate or ignore __pycache__, unknown hidden children, journals, locks, reservations, or staging paths. A known lock, journal, or reservation is accepted only through its current owning transaction allowlist and remains visible to that owner's recovery checks; all other unexpected entries, including names beginning with ., are reported by the applicable validator. Retired migration scratch has no topology owner or allowlist.

#### Scenario: Finder metadata does not break current topology
- **WHEN** .DS_Store appears in otherwise valid checked HTML or production-mode-transition ownership
- **THEN** bundle checking ignores only that exact entry
- **AND** all other topology rules still run

#### Scenario: Retired scratch is not an allowlist
- **WHEN** a retired html-migration journal or lock appears in a bundle
- **THEN** topology reports the ownership violation
- **AND** it does not recover, hide, or adopt the file

## REMOVED Requirements

### Requirement: Explicit legacy-to-HTML migration publishes a clean version atomically
**Reason**: The historical migration transaction, old-side modes, and receipt handoff are removed.

**Migration**: Use the current cross-pipeline production-mode transition for a valid explicit run.

### Requirement: Migration preparation confines its projected candidate
**Reason**: The `_scratch/html-migration/projected-run/` candidate is no longer supported.

**Migration**: Current candidate confinement remains owned by `_scratch/production-mode-transition/`.
