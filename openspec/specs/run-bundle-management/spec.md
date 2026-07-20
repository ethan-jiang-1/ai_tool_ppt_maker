## Purpose

Provide the CLI/scaffold surface at `scripts/shared/run-bundle/bundle_layout.mjs` that enforces the run-bundle ontology owned by `run-bundle-layout`; it consumes categorized shared state rather than redefining the layout.
## Requirements
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

The seeded `deck-guide.md`, framework `workflow/00-setup/template-deck-guide.md`, and root README SHALL identify `_state/state.yaml` as whole-workflow resume/progress authority and shall keep `_lessons` distinct. `project-metadata.yaml` SHALL explain the disjoint mirror fields: legacy readiness retains existing `content_gate|visual_gate`; HTML status uses `html_content_gate|html_visual_gate` plus exact `*_run_version`, while authoritative HTML content/visual evidence lives in version-scoped `_state` records and metadata alone cannot authorize delivery. HTML approval never overwrites legacy scalar fields. Cleared-context resume SHALL start with `ppt_flow state`. Templates SHALL continue to carry the diagnostic-consumer and generated-artifact ownership guidance already required by the main spec.

#### Scenario: Fresh HTML metadata explains gate authority

- **WHEN** init seeds `project-metadata.yaml` and `deck-guide.md`
- **THEN** they point to `_state` for HTML gate evidence/resume
- **AND** do not describe metadata scalars as sufficient HTML delivery proof

#### Scenario: Legacy metadata remains compatible

- **WHEN** a markerless deck is checked or resumed
- **THEN** existing legacy metadata gate behavior is not silently reinterpreted

#### Scenario: Deck contains legacy and HTML versions

- **WHEN** HTML approval updates deck-root metadata mirrors
- **THEN** legacy scalar fields remain unchanged and markerless checks ignore all `html_*` fields

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

Seed/first-look coherence SHALL be proven from checked-in framework test fixtures produced in temporary directories, not production `deck_*` or `dpt_*` data. Tests SHALL compare current root/version README and deck-guide seeds across generic init plus every active deck-type template (`keynote`, `pitch`, `report`, and `training`) and SHALL cover `_scratch`, `_state`, HTML-first defaults, and current placement maps. Existing production run bundles SHALL not be hand-edited or required as test inputs.

#### Scenario: Seed coherence suite runs without production decks

- **WHEN** the test workspace contains no `deck_*` or `dpt_*` production data
- **THEN** fresh generic and four deck-type fixtures prove current first-look seeds

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

`initBundle()` SHALL create `2_backbone/visual-style/assets/` with `svg/`, `reference/`, and `icons/` directories, README, and an empty HTML-first v2 `asset-manifest.yaml` containing exactly `version: 2` and `assets: {}`. The README SHALL explain v2 ID/SHA registration and binding through structured `primary_visual.fallback` or typed-block icon IDs; it SHALL NOT direct new decks to legacy `VISUAL ASSETS` fields. The directory remains optional for old decks, and a markerless legacy deck with no assets directory or a present v1 manifest SHALL remain valid under legacy semantics.

#### Scenario: Fresh init creates v2 catalog skeleton

- **WHEN** `initBundle()` scaffolds a new deck
- **THEN** the assets directories and empty version-2 manifest exist
- **AND** the README describes structured asset-ID binding

#### Scenario: Old deck without assets remains valid

- **WHEN** a legacy deck predates the asset directory
- **THEN** structure validation does not require one

#### Scenario: Legacy v1 manifest is not silently upgraded

- **WHEN** an existing markerless deck has a v1 manifest
- **THEN** init/check/heal preserves its legacy meaning
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

The structural-version publication interface SHALL operate only on run-bundle source/control scaffolding and deterministic local validation. It SHALL NOT invoke Stage 2, Image2, HTML rendering/composition, any provider, materialize generated bytes, or copy/relabel any reset/gate/delivery-review/node-decision authorization. Its deterministic impact SHALL report HTML-first `needs_local_materialization` separately from markerless legacy `needs_render` remote debt and SHALL act on neither. For HTML runs, a subsequent explicit orchestration materialization MAY reuse verified prior immutable bytes only after target fingerprint/receipt validation and SHALL copy them into target-owned objects/manifests bound to the target current reset ID (initially null); no cross-version path/evidence/reset reference or renderer/provider call belongs to source publication. The materializer SHALL create exact target Stage-1/2/3 reset-null review plans/artifacts, return `review_required`, and leave Stage 4/5/delivery review pending; a post-approval continuation then rebuilds canonical delivery/PPTX/notes locally.

#### Scenario: Reordered HTML target is published source-only

- **WHEN** an authorized structural transaction reorders unchanged HTML slides
- **THEN** source publication creates the target without rendering or generated-byte reuse
- **AND** a later explicit materializer owns verified target-local reuse and delivery rebuild

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

### Requirement: Fresh init defaults to a locally deliverable HTML-first source

Both `bundle_layout --init` and `ppt_flow init`, including generic init and every active deck-type template (`keynote`, `pitch`, `report`, and `training`), SHALL seed canonical `3_versions/v1/slide-specifications.md` authoring controls with `production.pipeline: html-first-v1`, `identity.scheme: mnemonic-v1`, the exact structured-body/family guidance owned by `html-slide-contract`, and no legacy top-level `render`, `RENDER MODE`, `IMAGE PROMPT`, or `VISUAL ASSETS`. The seeded visual configuration SHALL include a valid `html_first` projection. Deck-root metadata/state SHALL seed HTML mirrors as `pending` with exact run version `v1` in the new `html_*` fields while retaining existing legacy scalar fields as pending compatibility fields; reset ID SHALL be null by absence and init SHALL not seed an `html-production-reset` record. Neither mirror family authorizes delivery. Init SHALL not create style master, page prompts, legacy image/header outputs, HTML production outputs, or Image2 refinement paths/state.

#### Scenario: Fresh init selects HTML without asking for renderer

- **WHEN** a user initializes a new run bundle
- **THEN** its canonical source explicitly selects `html-first-v1`
- **AND** subsequent intake does not need to choose a render engine

#### Scenario: Fresh init separates gate mirrors

- **WHEN** HTML-first v1 metadata/state is seeded
- **THEN** `html_*` mirrors are pending and bound to v1 while legacy gate fields remain separate pending compatibility fields

#### Scenario: Init remains write-bounded

- **WHEN** init completes
- **THEN** it has written only canonical source/control/state/lesson scaffolding
- **AND** no generated production or provider artifact exists

### Requirement: Bundle checks are pipeline-aware without mutating existing decks

`checkBundle()` SHALL inspect the canonical source marker before applying pipeline-specific required/forbidden generated and control rules. Structure-only checks SHALL remain tolerant of absent state/assets on historical decks as already specified. Check/heal SHALL never insert a marker, rewrite legacy source, create generated directories, or migrate a deck merely to make validation pass.

#### Scenario: Existing markerless deck is checked

- **WHEN** a legacy deck is validated after the default switch
- **THEN** legacy-compatible structure rules apply
- **AND** no HTML marker or directory is created

### Requirement: Explicit legacy-to-HTML migration publishes a clean version atomically

Run-bundle management SHALL expose a preview/apply transaction that accepts a complete version-local candidate source/control delta, materializes the exact isolated `_scratch/html-migration/projected-run/` candidate workspace, validates its scratch Stage-1 plan, and renders the complete proposed HTML deck locally through a framework-issued `migration-preview` context. It SHALL produce a source diff/proposed contact sheet/exact plan hash plus `old_side_mode: verified-current|degraded-missing|degraded-stale`. `verified-current` requires a complete current common-adaptable legacy final-slide set and a locally built comparison sheet; a Stage-2 raw sheet alone is insufficient. Missing/stale final-slide evidence SHALL produce a diagnosis/placeholder with no old pixels, provider calls, or parity claim and MAY point to separately authorized legacy maintenance. Scratch publication SHALL not mutate or satisfy legacy/canonical current manifests, gates, state, assembly, notes, or completion.

The plan SHALL bind base/candidate receipts, anticipated target version, old-side mode/evidence, and ordered proposed composition/final PNG/contact-sheet SHAs. Confirmed apply SHALL require the current deck-root state to have the exact active source-version `migrate-import` apply execution whose declared plan hash/mode equal the human acknowledgement; missing/unrelated/mismatched execution fails before the apply journal. It SHALL use the existing run-bundle target-reservation/no-replace same-parent publication authority. Before any reservation/staging creation it SHALL generate a cryptographically random 64-lowercase-hex owner token, derive exact confined reservation/staging basenames from the anticipated target plus that token, and atomically create complete `_scratch/html-migration/apply-journal.json` containing exactly `schema: pptmaker-html-migration-apply-journal-v1`, `owner_token`, normalized host, positive PID, exact `created_at_epoch_ms`, source execution ID, source/anticipated-target versions, plan hash, old-side mode, and those basenames. The journal SHALL not require a later field-population rewrite. Only that owner may create/clean the exact hidden paths. Apply SHALL recheck unchanged journal bytes and ownership immediately before reservation creation, staging creation, each staged publication transaction, success-receipt write, and final rename. It SHALL recheck every plan/input/target precondition, copy only authorized source/control/assets into hidden vNext, construct a fresh `canonical-run` context with target reset ID null by absence regardless of any source-version reset history, revalidate/rerender the real target without copying scratch generated bytes, and write exact target `_generated/qa/html_migration.json` with `schema: pptmaker-html-migration-success-v1`, pipeline/publication scope, source execution ID/version, target version, plan hash/mode, source/control receipt set, ordered composition fingerprints/final PNG SHAs, contact-sheet SHA, and timestamp. That receipt SHALL prove only migration publication/handoff and SHALL NOT satisfy reset, content/visual gates, assembly, notes, delivery review, or completion. Apply SHALL require exact proposed-output equality, then publish through one same-parent visible-directory rename that cannot replace a target. Target collision or any input/evidence/output drift SHALL publish no visible version and require a new preview. It SHALL not modify the legacy version, infer structured bodies from prompts, copy legacy generated artifacts or migration-preview objects/manifests/receipts, inherit reset/provider/gate/delivery-review authorization, or invoke legacy generation. The visible target MAY contain its newly rerendered canonical HTML/final/contact-sheet artifacts, but Stage 4/completion SHALL remain blocked until its own content/visual reviews are recorded.

The apply journal SHALL be an exclusive fence for that migration transaction. A second preview/apply or migration-scratch reset SHALL return `CONFLICT` while it exists. Normal success SHALL remove the owned reservation then journal only after visible target/receipt verification. Recovery without a token SHALL require the exact host, proven-dead PID, and age at least `MIGRATION_APPLY_AUTO_RECOVERY_MIN_AGE_MS = 60000`. Cross-host/otherwise uncertain recovery SHALL require prior human confirmation that no migration apply is active, the exact journal token, and age at least `MIGRATION_APPLY_EXPLICIT_RECOVERY_MIN_AGE_MS = 300000`; a proven-active same-host PID remains non-overridable. Token/age/journal/path drift or an unconfined/foreign reservation/staging fails closed.

Recovery SHALL use actual filesystem state rather than journal phase as truth. If the visible target is absent, it may remove only the exact token-owned hidden staging/reservation and journal, then restart apply from current plan/preconditions and rerender fully; it SHALL never continue from partial generated bytes. If the visible target exists, recovery SHALL remove nothing from it and succeed idempotently only when exact `_generated/qa/html_migration.json`, source/control receipts, canonical output SHAs, target version, plan hash, mode, and source execution ID all match the journal; it may then remove only the owned reservation/journal. Any existing target mismatch, target without exact receipt, foreign hidden path, or third state returns `CONFLICT` for inspection. Recovery never creates approval/review evidence.

#### Scenario: User accepts the complete comparison

- **WHEN** preview produced a current exact plan and the user confirms its hash
- **THEN** apply publishes one clean HTML-first vNext with newly rerendered canonical HTML/final/contact-sheet artifacts and pending target-version reviews
- **AND** leaves the legacy version unchanged

#### Scenario: Candidate or control drifts after preview

- **WHEN** any candidate/source/control/asset receipt changes before apply
- **THEN** apply fails without a visible new version
- **AND** requires a new preview and human comparison

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
