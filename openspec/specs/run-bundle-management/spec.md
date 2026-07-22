## Purpose

Provide the CLI/scaffold surface at `scripts/shared/run-bundle/bundle_layout.mjs` that enforces the run-bundle ontology owned by `run-bundle-layout`; it consumes categorized shared state rather than redefining the layout.
## Requirements
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
### Requirement: Management enforces run-bundle-layout via bundle_layout.mjs

`bundle_layout.mjs` SHALL provide the CLI/scaffold surface that **enforces** the run-bundle ontology defined by capability `run-bundle-layout`: `--init` (scaffold, including `_state/` hints and initial state when absent), `--check` (validate), `--new-version` (create clean downstream version), and `--self-check` (drift alarm for CI, including `_state` presence in `renderTree()`). Other scripts SHALL import general bundle path constants from `bundle_layout.mjs`. The `_state` directory/file name constants SHALL be imported from `scripts/shared/state/state.mjs` (not re-declared as string literals in `bundle_layout.mjs`). Absence of `_state/` on a legacy deck SHALL NOT by itself cause `--check --structure-only` to fail.

This capability SHALL NOT define a second directory ontology. Conformity of `deck_*` trees is owned by `run-bundle-layout`. The glossary Where Map is owned by `run-bundle-layout`.

#### Scenario: Init creates whitelist-clean bundle

- **WHEN** `bundle_layout --init deck_test` runs
- **THEN** `bundle_layout --check deck_test/3_versions/v1 --structure-only` passes with zero violations

#### Scenario: Check catches ad-hoc directory

- **WHEN** a run bundle has a manually created unexpected entry at the version root (for example `random_dir/`)
- **THEN** `bundle_layout --check` reports it as an unexpected entry and exits non-zero

#### Scenario: Init seeds _state for both entry points

- **WHEN** either `bundle_layout --init` or `ppt_flow init` creates a new deck
- **THEN** `deck_*/_state/state.yaml` exists after init completes
- **AND** the file begins with a `#` comment header

### Requirement: Run bundle scaffolds a discoverable _state directory

`bundle_layout.mjs` SHALL treat `_state/` as a first-class run-bundle root directory. `initBundle` SHALL create `_state/` and write `_state/README.md` using the same README body owned by `scripts/shared/state/state.mjs` (so init scaffolding and `writeState` self-heal cannot drift). That README SHALL explain: purpose (playbook execution progress / whole-session resume pointer), primary fields (including that per-node `waiting_for` may record human waits), coexistence with `project-metadata.yaml`, pointers to `charter/NODE-SPEC.md` and `scripts/shared/state/state.mjs`, and that **after a cleared chat / disconnect / new session** agents MUST run `ppt_flow state` (where-am-I resume card) before restarting work — progress is on the deck disk, not in chat. `renderTree()` and the module header layout comment SHALL include `_state/` and SHALL indicate that `history.jsonl` is created on demand. `selfCheck()` SHALL fail if `renderTree()` omits `_state`.

#### Scenario: Init creates _state README

- **WHEN** Agent runs init for a new deck (via `bundle_layout --init` or `ppt_flow init`)
- **THEN** `deck_*/_state/README.md` exists
- **AND** the README mentions `NODE-SPEC` or `state.mjs` as the schema authority

#### Scenario: Canonical tree lists _state

- **WHEN** Agent inspects `renderTree()` output (including `node PPTMAKER_FRAMEWORK/scripts/shared/run-bundle/bundle_layout.mjs` with no mode flags)
- **THEN** the tree text includes `_state`

#### Scenario: _state README mentions clear-context resume

- **WHEN** a developer reads `_state/README.md` from a freshly initialized deck
- **THEN** it instructs using `ppt_flow state` (or equivalent) to recover progress after a cleared session

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

### Requirement: Run bundle includes _lessons/ with purpose-stated README

`bundle_layout.mjs` SHALL treat `deck_*/_lessons/` as the canonical deck-root **self-retained lessons** directory (replacing the former `_learning/` name). Its **single purpose** is: non-secret lessons retained after the agent (or maintainer) **probes and overcomes** difficulties—so the next session **reads before guessing**. It is not playbook progress, not secrets, not materials or `_generated/` outputs. Image2/env receipts are **examples**, not the definition of the directory. Leaving a successful fix only in chat SHALL be incomplete relative to this purpose.

`initBundle` SHALL create `_lessons/` and seed `_lessons/README.md` from Framework constant `LESSONS_DIR_README` (same pattern as `STATE_DIR_README`). That README SHALL include, in Chinese voice consistent with other dir READMEs:

- **这里放什么:** 克服困难后可复用的非密钥教训；先读再猜；禁止只留聊天  
- **闭环:** 试通或修好之后必须留下，避免下一轮失忆  
- **不放什么:** 密钥（→`.env`）、进度（→`_state/`）、素材、生成物、无复用吐槽  
- **谁读写:** Agent（编排器）/ 维护者；Framework 只定规矩  
- **怎么写（规矩）:** 一题一文；`kebab-case` 文件名；四问（遇到什么/怎么试的/结论/下次先看哪）；修好就留；禁密钥；`.md` 或 `.yaml`
- **A copy-paste markdown template** for new `.md` lessons, showing the 4-question structure with placeholder text, so the agent can trivially scaffold a well-formed lesson  
- **打个比方:** 非绑定例子，并声明不是目录清单  
- 禁止 API key  

The `GUIDE_FILE` template (deck-guide.md seeded by `initBundle`) SHALL include a prominent "自留教训" section that references the `lessons.mjs list` command for the agent to run. This section SHALL be visually distinct from the "当前进度" section and SHALL NOT be buried inside it.

Constants SHALL be `LESSONS_DIR` / `LESSONS_DIR_README` (not `LEARNING_*`). `renderTree` / CONSTITUTION snapshot SHALL list `_lessons/` with a purpose annotation and SHALL NOT present a single domain file as the sole canonical child. Deck-root `README.md` template SHALL list `_lessons/` with the same purpose. `deck-guide` / `template-deck-guide` MAY mention `_lessons/` only as retained lessons—**not** inside the `_state` progress block. Structure checks SHALL allow `_lessons/` at deck root. Absence of `_lessons/` on a legacy deck SHALL NOT by itself fail `--check --structure-only`. `selfCheck()` SHALL fail if `renderTree()` omits `_lessons`.

#### Scenario: Init seeds _lessons README with writing rules and template

- **WHEN** `ppt_flow init` (or `initBundle`) creates a new deck
- **THEN** `deck_*/_lessons/README.md` exists
- **AND** the README states 这里放什么 for retained non-secret lessons
- **AND** the README states writing rules (one-lesson-one-file, no-secrets)
- **AND** the README includes a copy-paste markdown template for new lessons
- **AND** Image2/env mentions are examples only

#### Scenario: Tree and deck README annotate _lessons purpose

- **WHEN** Agent inspects `renderTree()` or a newly inited deck-root `README.md`
- **THEN** `_lessons/` appears with a purpose annotation (retained lessons / read-before-guess)
- **AND** the tree does not imply the directory exists only for `image2-proven.yaml`

#### Scenario: Structure check allows _lessons; legacy absence soft

- **WHEN** a deck has `_lessons/` at the deck root
- **AND** `bundle_layout --check … --structure-only` runs
- **THEN** `_lessons/` is not reported as unexpected

- **WHEN** a legacy deck lacks `_lessons/`
- **AND** `--check --structure-only` runs
- **THEN** absence of `_lessons/` alone does not fail the check

#### Scenario: selfCheck requires _lessons in renderTree

- **WHEN** `bundle_layout --self-check` runs
- **AND** `renderTree()` omits `_lessons`
- **THEN** self-check fails

#### Scenario: deck-guide template surfaces lessons separately from progress

- **WHEN** `initBundle` writes `deck-guide.md`
- **THEN** the file includes a "自留教训" section that is visually distinct from the "当前进度" section
- **AND** the section references `lessons.mjs list` as the command to list lessons

### Requirement: checkBundle supports preview vs pipeline readiness

`checkBundle` SHALL retain its synchronous violation-array interface, `structure|preview|pipeline` readiness and boolean aliases, and classify the canonical production marker before branch-specific checks. Markerless legacy preview SHALL require structure plus `style_master.jpg` and no approved gates; legacy pipeline SHALL additionally require compatible metadata gates. HTML preview SHALL require structure, valid HTML source/control/catalog, base local renderer readiness, and no `deletion_pending` reset but SHALL NOT require a style master or approved gates. HTML pipeline SHALL additionally consume the same read-only HTML-review evaluator through a bundle-layout-owned trusted context and require current-reset authoritative version-scoped content/visual evidence; metadata mirrors alone SHALL not satisfy it. Direct readiness checks SHALL not create artifacts, mutate gate/reset evidence/mirrors, recover a journal, claim/complete a reset, start async work, or load browser/provider code. Owning build/approval/check-gates orchestration MAY call the separate gate recovery interface before invoking `checkBundle`; only the explicit reset command may claim/complete reset.

#### Scenario: HTML preview has no style master

- **WHEN** a structurally valid HTML-first run with local runtime readiness invokes preview check
- **THEN** absence of `style_master.jpg` is not a violation
- **AND** pending gates do not block review composition

#### Scenario: HTML pipeline has only metadata approval

- **WHEN** metadata gates say approved but current `_state` HTML evidence is absent
- **THEN** pipeline readiness fails closed

#### Scenario: HTML preview is checked during reset deletion

- **WHEN** authoritative state contains `html-production-reset.status: deletion_pending`
- **THEN** preview and pipeline readiness both report the reset conflict without claiming ownership or writing files

#### Scenario: Legacy preview remains style-master based

- **WHEN** a markerless run has structure, style master, and pending gates
- **THEN** legacy preview readiness passes while legacy pipeline readiness remains blocked

### Requirement: Version directory includes _scratch for temp backups

`bundle_layout.mjs` SHALL **enforce** the `run-bundle-layout` role of `3_versions/v{n}/_scratch/` (`SCRATCH_SUBDIR`): `initBundle` and `--new-version` SHALL create `_scratch/` and seed `_scratch/README.md` (purpose, gradient pointer, route-elsewhere, deletable). `--new-version` SHALL NOT copy prior version scratch files. `selfCheck()` SHALL fail if `renderTree()` omits `_scratch`. Init-seeded `.gitignore` SHALL ignore scratch contents while keeping `README.md` tracked.

#### Scenario: Init creates version _scratch README

- **WHEN** Agent runs init for a new deck
- **THEN** `deck_*/3_versions/v1/_scratch/README.md` exists
- **AND** the README states temp/backup purpose and points away from `_lessons` / `_generated` / `_state`

#### Scenario: new-version seeds empty scratch

- **WHEN** Agent runs `--new-version` from v1 that has files under `_scratch/`
- **THEN** the new version has `_scratch/README.md`
- **AND** does not contain the prior version’s scratch bak files

### Requirement: checkBundle allows _scratch and rejects deck-root litter

`checkBundle` SHALL enforce `run-bundle-layout` strictness: version-root whitelist allows `_scratch/` (internals not filename-whitelisted); deck-root allows only control files, optional `MIGRATION.md`, tier dirs, `_state/`, `_lessons/`, and `.env` / `.env.example` / `.gitignore`; other deck-root entries (for example `_slidespec.bak-*`, ad-hoc `_tmp/`) SHALL fail the check.

#### Scenario: Version _scratch is not unexpected

- **WHEN** a version dir contains `_scratch/` with a bak file inside
- **AND** Agent runs `bundle_layout --check` on that version
- **THEN** `_scratch` is not reported as an unexpected version-root entry

#### Scenario: Deck-root bak fails check

- **WHEN** a deck root contains `_slidespec.bak-kicker` (or similar loose bak)
- **AND** Agent runs `bundle_layout --check` on a version under that deck
- **THEN** check reports the deck-root entry as unexpected and exits non-zero

### Requirement: First-look README seeds surface layout placement tokens

Init-seeded `_DIR_READMES` SHALL surface `run-bundle-layout` placement tokens before an agent opens leaf drawers: deck-root README SHALL name `3_versions/v{n}/_scratch/` as version temp/bak and mention structure gradient (上严下松); `3_versions` README SHALL state that `--new-version` does not copy `_scratch/` contents (in addition to not copying `_generated/`).

#### Scenario: Deck-root seed README names _scratch

- **WHEN** Agent reads the init-seeded deck-root `README.md`
- **THEN** the text mentions `_scratch` under `3_versions/v{n}/` as the temp/bak outlet

#### Scenario: Versions seed README mentions scratch on new-version

- **WHEN** Agent reads the init-seeded `3_versions/README.md`
- **THEN** the text states that new-version does not copy `_scratch` contents

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

### Requirement: Init produces the run-bundle Agent diagnostic entry

`bundle_layout.mjs#initBundle` and therefore `ppt_flow init` SHALL generate deck-root `AGENTS.md` and `CLAUDE.md` as short pointers to `deck-guide.md`. The generated guide SHALL include the runtime consumer essentials owned by `node-specification`: parse the final CLI failure envelope; use supported structured `diagnostic.next`; preserve `program`/`args` boundaries; stop on `requires_human:true`; do not invent omitted lineage; edit source and rerun rather than hand-editing `_generated/`. The producer-owned `workflow/00-setup/template-deck-guide.md` SHALL carry the same essentials so the manual/Expert seed and `initBundle` output do not contradict each other.

The producer SHALL be the durable fix. Tests SHALL initialize a fresh temporary deck and assert all generated files and structure validity. Existing golden or user run bundles, including `deck_ai_sdlc_keynote`, SHALL NOT be hand-edited as part of this change. This change SHALL NOT alter the root/version README placement-map seeds. Because scaffold writes are create-if-absent, legacy bundles MAY gain the new control only through an explicit future migration/repair operation, not an incidental pipeline run.

#### Scenario: Fresh init is discoverable to agent-agnostic runtimes

- **WHEN** `initBundle` creates a temporary deck
- **THEN** root `AGENTS.md` and `CLAUDE.md` both route to `deck-guide.md`
- **AND** the guide contains diagnostic consumer essentials
- **AND** the framework `template-deck-guide.md` expresses the same essentials
- **AND** `--check --structure-only` passes

#### Scenario: Existing deck is not silently rewritten

- **WHEN** an existing run bundle lacks `AGENTS.md`
- **AND** normal status/build/pipeline commands run
- **THEN** they do not create or overwrite root Agent control files
- **AND** the deck remains valid under legacy compatibility

#### Scenario: This producer change does not refresh the golden deck

- **WHEN** this change is implemented and its diff is reviewed
- **THEN** no file under `deck_ai_sdlc_keynote/` is changed
- **AND** fresh-scaffold tests, not a hand-patched generated deck, prove the new control behavior

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

### Requirement: Structural versions are prepared invisibly and published atomically

Run-bundle management SHALL expose one structural-version publication interface that owns target-name reservation, clean-version seeding, hidden staging, validation, final publication, and failed-attempt cleanup. Given a valid source version, confirmed visible `vN` target, and transformed canonical slide source, the interface SHALL require that visible target not to exist and SHALL atomically acquire an invocation-owned hidden reservation for that target before staging. It SHALL then construct the complete target source/control tree in a separately unique hidden sibling directory under the same `3_versions/` parent. It SHALL seed the same clean-version roles as the existing version authority, including source, overrides, `_generated/`, `_scratch/`, and canonical README files, without copying prior generated or scratch contents.

Before publication, the interface SHALL run staging-aware run-bundle structure validation and the caller-supplied side-effect-free transformed-source validation against the staging tree. Only the reservation owner MAY publish or clean up that target's reservation/staging. After all writes and validations succeed, and while the reservation is still held, the interface SHALL verify the visible target remains absent and rename the hidden staging sibling to the confirmed visible `vN` path with one same-parent filesystem rename that MUST NOT replace an existing path. It SHALL then release its reservation. The visible target SHALL not exist before that rename. The success result SHALL identify source, target, and publication facts without exposing reservation or staging paths as durable locators.

#### Scenario: Valid structural version appears in one publication step

- **WHEN** a structural transaction prepares valid transformed source from `v2` for target `v3`
- **THEN** the complete target is built and validated under a hidden sibling of `v3`
- **AND** `v3` becomes visible only through the final same-parent rename
- **AND** the returned target passes the canonical run-bundle and source validations

#### Scenario: Clean target does not inherit derived artifacts

- **WHEN** source `v2` contains generated outputs and scratch backups
- **THEN** the prepared target receives canonical empty `_generated/` and `_scratch/` roles
- **AND** does not copy source generated outputs or scratch contents before publication

#### Scenario: Concurrent publication cannot clobber a version

- **WHEN** two structural invocations both attempt to reserve visible target `v3`
- **THEN** at most one invocation acquires the target reservation and may continue toward publication
- **AND** the other fails with a fresh-preview path without deleting the winner's reservation, staging, or visible version

#### Scenario: Target appears before final rename

- **WHEN** a visible target path appears despite an earlier absence check
- **THEN** final publication fails without replacing or merging that path
- **AND** cleanup remains scoped to the failing invocation's reservation and staging

### Requirement: Failed structural publication preserves every visible version

If reservation, staging creation, transformed-source writing, validation, or final publication fails, run-bundle management SHALL leave the source version unchanged and SHALL NOT expose an empty or partially written visible target. Cleanup SHALL be scoped by the invocation ownership token to its hidden staging and reservation paths. It SHALL NOT delete or overwrite a pre-existing visible version, another invocation's reservation/staging, or any source/control file outside its staging root. An unknown or stale-looking reservation owned by another invocation SHALL fail closed with an inspection diagnostic rather than be auto-removed. If cleanup itself fails, the primary operation SHALL still fail and identify its hidden staging/reservation paths for deterministic inspection; those paths SHALL remain non-authoritative and SHALL NOT be reported as a created version.

#### Scenario: Source validation fails in staging

- **WHEN** the transformed source fails canonical slide validation after staging is populated
- **THEN** the operation fails before final rename
- **AND** source `v2` remains byte-identical
- **AND** visible target `v3` does not exist

#### Scenario: Existing target is never adopted or deleted

- **WHEN** the requested visible target name already exists before structural publication
- **THEN** publication fails before creating or mutating that target
- **AND** cleanup does not remove or rewrite the pre-existing version

#### Scenario: Failed cleanup does not masquerade as publication

- **WHEN** the primary preparation fails and its hidden staging cannot be fully removed
- **THEN** the result remains a failed publication with the staging locator available for inspection
- **AND** no success receipt names the staging directory as vNext

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

### Requirement: Fresh run bundles seed an optional Git safety boundary

`bundle_layout.mjs#initBundle` SHALL seed `.gitignore` for every fresh run bundle regardless of Git availability or worktree state. The seed SHALL ignore `.env`, `3_versions/*/_generated/`, and `3_versions/*/_scratch/*`, while explicitly re-including `3_versions/*/_scratch/README.md`. It SHALL not broadly ignore source/control Markdown, slide specifications, overrides, metadata, `_state`, `_lessons`, or required control README files.

The init, ordinary new-version, and structural-version publication authorities SHALL not invoke Git, require a worktree, require a verifiable history or clean working tree, initialize a repository, create a commit, or modify a remote. Existing bundles SHALL not have `.gitignore` or Git state rewritten incidentally by pipeline execution, structural publication, a doctor invocation, or an unrelated fresh-bundle initialization elsewhere.

`initBundle`'s generated `deck-guide.md` seed and the reference `workflow/00-setup/template-deck-guide.md` SHALL remain aligned on the fresh-bundle Git boundary: Git is optional; visible `vN` remains the deck work-version authority; `_generated/` is never a recovery target; this change adds no automated Git source recovery or default recovery protocol; and no Git mutation occurs without explicit user authorization for the named operation and exact scope. The generated guide is create-if-absent; the reference template does not authorize incidental rewriting of an existing guide.

#### Scenario: Fresh bundle has safe ignore rules before Git exists

- **WHEN** `initBundle` creates a new deck outside any Git worktree
- **THEN** its `.gitignore` excludes `.env`, generated output, and scratch contents while retaining the scratch README
- **AND** no `.git` directory, commit, or other Git mutation is created

#### Scenario: Source and control remain eligible for user-owned tracking

- **WHEN** a user later initializes or uses a repository at a confirmed project root containing a fresh run bundle
- **THEN** the seeded ignore rules do not exclude slide specifications, backbone source, overrides, metadata, `_state`, `_lessons`, or required README/control files
- **AND** they do not require force-adding generated output

#### Scenario: Structural publication is independent of Git state

- **WHEN** a structural transaction publishes a valid clean vNext while Git is missing, the current directory has no confirmed worktree, has no verifiable HEAD, or has uncommitted changes
- **THEN** publication follows the existing source-only hidden-staging contract
- **AND** it makes no Git invocation or Git mutation and does not alter its success/failure semantics

#### Scenario: Fresh guide does not overclaim Git protection

- **WHEN** `initBundle` creates a fresh deck
- **THEN** the generated `deck-guide.md` contains the aligned optional-Git/version/derived-output/authorization rule from the template
- **AND** it does not claim that deck initialization initialized, verified, or otherwise created Git protection

#### Scenario: Existing guide is not silently rewritten

- **WHEN** an existing bundle has a `deck-guide.md` from an earlier seed
- **AND** init, doctor, pipeline, or structural publication runs
- **THEN** that guide is not overwritten as an incidental Git-safety update

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

### Requirement: Explicit legacy-to-HTML migration publishes a clean version atomically

Run-bundle management SHALL expose a preview/apply transaction that resolves a complete confined projected candidate. The candidate source plus sparse `overrides/` are authored inputs; all unchanged controls are effective only through the closed precedence `candidate override > source-version override > deck-root backbone`. Preview SHALL validate the same Stage-1 plan and render the complete proposed HTML deck locally through a framework-issued `migration-preview` context. It SHALL produce a source diff/proposed contact sheet/exact plan hash plus `old_side_mode: verified-current|degraded-missing|degraded-stale`. `verified-current` requires a complete current common-adaptable legacy final-slide set and a locally built comparison sheet; a Stage-2 raw sheet alone is insufficient. Missing/stale final-slide evidence SHALL produce a diagnosis/placeholder with no old pixels, provider calls, or parity claim and MAY point to separately authorized legacy maintenance. Scratch publication SHALL not mutate or satisfy legacy/canonical current manifests, gates, state, assembly, notes, or completion.

The plan SHALL bind the existing canonical sorted `base_receipts` and `candidate_receipts` arrays for candidate source/overrides and all selected source-version/backbone inputs, anticipated target version, old-side mode/evidence, and ordered proposed composition/final-PNG/contact-sheet SHAs. Before normal apply, the state owner must have atomically recorded the human's exact confirmation on the same active source-version `migrate-import` execution and made `apply-html-migration` its sole active node. Only that node's exact execution-bound `migration_plan_hash`/`old_side_mode`/`migration_source_version` fields may authorize apply; all three must match the source run and current plan. Missing, unrelated, root-level, aliased, or mismatched declarations fail before the apply journal. Confirmation and apply SHALL re-resolve all bound inputs and old-side evidence before reservation or staging; any source/candidate/inherited receipt drift or old-side mode/evidence drift requires a new preview and confirmation.

It SHALL use the existing run-bundle target-reservation/no-replace same-parent publication authority. Before any reservation/staging creation it SHALL generate a cryptographically random 64-lowercase-hex owner token, derive exact confined reservation/staging basenames from the anticipated target plus that token, and atomically create complete `_scratch/html-migration/apply-journal.json` containing exactly `schema: pptmaker-html-migration-apply-journal-v1`, `owner_token`, normalized host, positive PID, exact `created_at_epoch_ms`, source execution ID, source/anticipated-target versions, plan hash, old-side mode, and those basenames. The journal SHALL not require a later field-population rewrite. Only that owner may create/clean the exact hidden paths. Apply SHALL recheck unchanged journal bytes and ownership immediately before reservation creation, staging creation, each staged publication transaction, success-receipt write, and final rename.

Apply SHALL construct the hidden target from the same inherited source-version/backbone inputs, copy only the revalidated candidate `slide-specifications.md` and sparse `overrides/`, construct a fresh `canonical-run` context with target reset ID null by absence regardless of any source-version reset history, and revalidate/rerender the real target without copying the legacy source tree or migration-preview generated bytes. It SHALL write exact target `_generated/qa/html_migration.json` with `schema: pptmaker-html-migration-success-v1`, pipeline/publication scope, source execution ID/version, target version, plan hash/mode, the same canonical base/candidate receipt arrays, ordered composition fingerprints/final PNG SHAs, contact-sheet SHA, and timestamp. That receipt SHALL prove only migration publication/handoff and SHALL NOT satisfy reset, content/visual gates, assembly, notes, delivery review, or completion. Apply SHALL require exact proposed-output equality, then publish through one same-parent visible-directory rename that cannot replace a target. Target collision or any input/evidence/output drift SHALL publish no visible version. It SHALL not modify the legacy version, infer structured bodies from prompts, copy legacy or migration-preview generated artifacts/manifests/receipts, inherit reset/provider/gate/delivery-review authorization, or invoke legacy generation. The visible target MAY contain its newly rerendered canonical HTML/final/contact-sheet artifacts, but Stage 4/completion SHALL remain blocked until its own content/visual reviews are recorded.

The apply journal SHALL be an exclusive fence for that migration transaction. A second preview/apply or migration-scratch reset SHALL return `CONFLICT` while it exists. Normal success SHALL remove the owned reservation then journal only after visible target/receipt verification. Recovery without a token SHALL require the exact host, proven-dead PID, and age at least `MIGRATION_APPLY_AUTO_RECOVERY_MIN_AGE_MS = 60000`. Cross-host/otherwise uncertain recovery SHALL require prior human confirmation that no migration apply is active, the exact journal token, and age at least `MIGRATION_APPLY_EXPLICIT_RECOVERY_MIN_AGE_MS = 300000`; a proven-active same-host PID remains non-overridable. Token/age/journal/path drift or an unconfined/foreign reservation/staging fails closed.

Recovery SHALL use actual filesystem state rather than journal phase as truth. If the visible target is absent, it may remove only the exact token-owned hidden staging/reservation and journal, then restart apply from current plan/preconditions and rerender fully; it SHALL never continue from partial generated bytes. If the visible target exists, recovery SHALL remove nothing from it and succeed idempotently only when exact `_generated/qa/html_migration.json`, complete receipts, canonical output SHAs, target version, plan hash, mode, and source execution ID all match the journal; it may then remove only the owned reservation/journal. Any existing target mismatch, target without exact receipt, foreign hidden path, or third state returns `CONFLICT` for inspection. Recovery never creates approval/review evidence.

#### Scenario: User accepts the complete comparison

- **WHEN** preview produced a current exact plan, the user confirms its hash/mode, and the state-owned confirmation transition succeeds
- **THEN** apply publishes one clean HTML-first vNext with newly rerendered canonical HTML/final/contact-sheet artifacts and pending target-version reviews
- **AND** leaves the legacy version unchanged

#### Scenario: Candidate or inherited input drifts after preview

- **WHEN** any candidate, source-version override, or backbone receipt changes before confirmation or apply
- **THEN** confirmation or apply fails without a visible new version
- **AND** requires a new preview and human comparison

#### Scenario: Comparison mode drifts after preview

- **WHEN** old-side evidence changes such that its current mode differs from the mode shown in the preview plan
- **THEN** confirmation and apply do not publish a target
- **AND** the Controller obtains a fresh comparison and exact confirmation

#### Scenario: Apply crashes before visible publication

- **WHEN** the owner is proven dead and the visible target is absent
- **THEN** recovery removes only its exact journal-bound staging/reservation, reruns from current preconditions, and never reuses partial generated bytes

#### Scenario: Journal changes before final rename

- **WHEN** apply-journal bytes or ownership no longer match after staging succeeds
- **THEN** final publication aborts without exposing the target or cleaning foreign paths

#### Scenario: Apply crashes after visible publication

- **WHEN** the target exists with the exact in-target success receipt and outputs but journal cleanup did not finish
- **THEN** recovery verifies it and returns idempotent success without replacing or rerendering the target

#### Scenario: Recovery finds a conflicting target

- **WHEN** the anticipated visible target exists without the exact bound receipt/output lineage
- **THEN** recovery leaves target/staging/journal unchanged and returns `CONFLICT`

### Requirement: Migration preparation confines its projected candidate

Run-bundle management SHALL recognize `_scratch/html-migration/projected-run/` as the only location written by migration preparation. Its non-derived entries SHALL be exactly `slide-specifications.md`, `overrides/`, `preparation.json`, `authoring-context.json`, and `authoring-checklist.json`; `_generated/` is its only derived owner. The candidate inherits source-version overrides and deck-root backbone controls read-only through the candidate resolver. Preparation SHALL not create a loose candidate source, write the markerless source version, modify deck-root state/metadata, or reserve/publish a visible target. The existing migration preview/apply authority SHALL consume the candidate only through its confined resolver and receipt set.

When an old loose scratch candidate is present, only an explicit prepare may read it for compatibility and may copy it into an empty projected candidate. Preview/check SHALL not silently adopt, move, or delete it. Preview SHALL recompute readiness from candidate source/overrides rather than treat support JSON as proof. Target staging SHALL copy only revalidated candidate `slide-specifications.md` and `overrides/`. A projected candidate with conflicting authored inputs, an unconfined path, a symlink escape, or an active migration apply journal SHALL fail closed before candidate replacement or target staging. Candidate support JSON and derived `_generated/` output remain rebuildable or advisory and cannot satisfy canonical target approvals, state, or delivery facts.

#### Scenario: First preparation leaves the source version untouched

- **WHEN** a valid markerless run is prepared for HTML migration
- **THEN** all created candidate source/override files are descendants of `_scratch/html-migration/projected-run/`
- **AND** the source specifications, source controls, deck-root state/metadata, and visible `3_versions/vN` set are unchanged

#### Scenario: Preview does not adopt a loose legacy candidate

- **WHEN** `_scratch/html-migration/slide-specifications.md` exists but no projected candidate exists
- **THEN** preview returns preparation guidance without moving or modifying the loose file
- **AND** only explicit prepare may offer compatible import into an empty projected candidate

#### Scenario: Candidate symlink escape fails before staging

- **WHEN** a projected candidate source/control/asset path resolves outside the candidate root
- **THEN** validation fails without source mutation, hidden target creation, or visible publication

### Requirement: Topology ignores only an explicit macOS system artifact

HTML-production and migration-scratch topology walks in `bundle_layout.mjs` SHALL ignore only an entry whose basename is exactly `.DS_Store`. They SHALL not use a generic dotfile predicate or ignore `__pycache__`, unknown hidden children, journals, locks, reservations, or staging paths. A known lock/journal/reservation is accepted only through its owning transaction allowlist and remains visible to that owner's recovery checks; all other unexpected entries, including names beginning with `.`, SHALL be reported by the applicable HTML/migration topology validator. This requirement SHALL not broaden unrelated run-bundle owner behavior.

#### Scenario: Finder metadata does not break HTML topology

- **WHEN** `.DS_Store` appears in an otherwise valid checked HTML generated or migration directory
- **THEN** bundle checking ignores that exact entry
- **AND** all non-system topology rules still run

#### Scenario: Unknown dotfile is not hidden

- **WHEN** an HTML generated owner contains `.foreign-cache`
- **THEN** bundle checking reports the unexpected hidden entry
- **AND** it does not classify it as macOS metadata

#### Scenario: Transaction owner files remain observable

- **WHEN** a migration journal or publication lock appears in a location not owned by its expected transaction
- **THEN** topology/recovery reports the ownership conflict
- **AND** it does not silently skip the file because its name begins with `.`
