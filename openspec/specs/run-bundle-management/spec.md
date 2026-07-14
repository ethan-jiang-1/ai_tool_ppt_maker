## Purpose

Provide the CLI/scaffold surface — `bundle_layout.mjs` modes `--init` (scaffold), `--check` (validate against a whitelist), `--new-version` (create a clean downstream version), and `--self-check` (drift alarm for CI) — that **enforces** the run-bundle directory ontology owned by capability `run-bundle-layout`. This capability owns operations (init/check/new-version/self-check + first-look README seeds and their golden-sample refresh), not the layout definition: the canonical tree, directory roles, structure gradient, and glossary Where Map are defined by `run-bundle-layout`. It guarantees that run bundles are machine-enforced against that ontology — including the execution-state directory `_state/` and the self-retained lessons surface `_lessons/` at the deck root — so directory drift is caught rather than silently tolerated.

## Requirements

### Requirement: Management enforces run-bundle-layout via bundle_layout.mjs

`bundle_layout.mjs` SHALL provide the CLI/scaffold surface that **enforces** the run-bundle ontology defined by capability `run-bundle-layout`: `--init` (scaffold, including `_state/` hints and initial state when absent), `--check` (validate), `--new-version` (create clean downstream version), and `--self-check` (drift alarm for CI, including `_state` presence in `renderTree()`). Other scripts SHALL import general bundle path constants from `bundle_layout.mjs`. The `_state` directory/file name constants SHALL be imported from `scripts/lib/state.mjs` (not re-declared as string literals in `bundle_layout.mjs`). Absence of `_state/` on a legacy deck SHALL NOT by itself cause `--check --structure-only` to fail.

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

`bundle_layout.mjs` SHALL treat `_state/` as a first-class run-bundle root directory. `initBundle` SHALL create `_state/` and write `_state/README.md` using the same README body owned by `scripts/lib/state.mjs` (so init scaffolding and `writeState` self-heal cannot drift). That README SHALL explain: purpose (playbook execution progress / whole-session resume pointer), primary fields (including that per-node `waiting_for` may record human waits), coexistence with `project-metadata.yaml`, pointers to `charter/NODE-SPEC.md` and `scripts/lib/state.mjs`, and that **after a cleared chat / disconnect / new session** agents MUST run `ppt_flow state` (where-am-I resume card) before restarting work — progress is on the deck disk, not in chat. `renderTree()` and the module header layout comment SHALL include `_state/` and SHALL indicate that `history.jsonl` is created on demand. `selfCheck()` SHALL fail if `renderTree()` omits `_state`.

#### Scenario: Init creates _state README

- **WHEN** Agent runs init for a new deck (via `bundle_layout --init` or `ppt_flow init`)
- **THEN** `deck_*/_state/README.md` exists
- **AND** the README mentions `NODE-SPEC` or `state.mjs` as the schema authority

#### Scenario: Canonical tree lists _state

- **WHEN** Agent inspects `renderTree()` output (including `node PPTMAKER_FRAMEWORK/scripts/bundle_layout.mjs` with no mode flags)
- **THEN** the tree text includes `_state`

#### Scenario: _state README mentions clear-context resume

- **WHEN** a developer reads `_state/README.md` from a freshly initialized deck
- **THEN** it instructs using `ppt_flow state` (or equivalent) to recover progress after a cleared session

### Requirement: Control-file templates mention _state

The `deck-guide.md` body seeded by `initBundle` SHALL mention `_state/state.yaml` as the place to inspect playbook / session progress (in addition to any `_generated/` artifact hints) and SHALL note that cleared-context / disconnect resume starts with `ppt_flow state` (whole-workflow where-am-I, not chat memory). The framework copy at `workflow/00-setup/template-deck-guide.md` SHALL likewise mention `_state/state.yaml` in its progress guidance so Expert/manual paths do not contradict init. The deck-root `README.md` template SHALL list `_state/` alongside the three-tier directories. The `project-metadata.yaml` template SHALL include a leading comment stating that pipeline gate fields live in metadata while playbook progress/gates live under `_state/` (field names and values SHALL remain unchanged).

#### Scenario: New deck-guide references state file

- **WHEN** a new bundle is initialized
- **THEN** `deck-guide.md` contains the path `_state/state.yaml`

#### Scenario: Framework template-deck-guide mentions _state

- **WHEN** a developer opens `PPTMAKER_FRAMEWORK/workflow/00-setup/template-deck-guide.md`
- **THEN** it contains the path `_state/state.yaml`

#### Scenario: New root README lists _state

- **WHEN** a new bundle is initialized
- **THEN** the deck-root `README.md` mentions `_state/`

#### Scenario: New metadata comments point at _state

- **WHEN** a new bundle is initialized
- **THEN** `project-metadata.yaml` contains a `#` comment that mentions `_state`

#### Scenario: Deck-guide mentions resume via ppt_flow state

- **WHEN** a developer opens the seeded `deck-guide.md` or framework `template-deck-guide.md`
- **THEN** it mentions `ppt_flow state` (or `state.yaml`) as the clear-context recovery entry

### Requirement: Run bundle includes _lessons/ with purpose-stated README

`bundle_layout.mjs` SHALL treat `deck_*/_lessons/` as the canonical deck-root **self-retained lessons** directory (replacing the former `_learning/` name). Its **single purpose** is: non-secret lessons retained after the agent (or maintainer) **probes and overcomes** difficulties—so the next session **reads before guessing**. It is not playbook progress, not secrets, not materials or `_generated/` outputs. Image2/env receipts are **examples**, not the definition of the directory. Leaving a successful fix only in chat SHALL be incomplete relative to this purpose.

`initBundle` SHALL create `_lessons/` and seed `_lessons/README.md` from Framework constant `LESSONS_DIR_README` (same pattern as `STATE_DIR_README`). That README SHALL include, in Chinese voice consistent with other dir READMEs:

- **这里放什么:** 克服困难后可复用的非密钥教训；先读再猜；禁止只留聊天  
- **闭环:** 试通或修好之后必须留下，避免下一轮失忆  
- **不放什么:** 密钥（→`.env`）、进度（→`_state/`）、素材、生成物、无复用吐槽  
- **谁读写:** Agent（编排器）/ 维护者；Framework 只定规矩  
- **怎么写（规矩）:** 一题一文；`kebab-case` 文件名；四问（遇到什么/怎么试的/结论/下次先看哪）；修好就留；禁密钥；`.md` 或 `.yaml`  
- **打个比方:** 非绑定例子，并声明不是目录清单  
- 禁止 API key  

Constants SHALL be `LESSONS_DIR` / `LESSONS_DIR_README` (not `LEARNING_*`). `renderTree` / CONSTITUTION snapshot SHALL list `_lessons/` with a purpose annotation and SHALL NOT present a single domain file as the sole canonical child. Deck-root `README.md` template SHALL list `_lessons/` with the same purpose. `deck-guide` / `template-deck-guide` MAY mention `_lessons/` only as retained lessons—**not** inside the `_state` progress block. Structure checks SHALL allow `_lessons/` at deck root. Absence of `_lessons/` on a legacy deck SHALL NOT by itself fail `--check --structure-only`. `selfCheck()` SHALL fail if `renderTree()` omits `_lessons`.

#### Scenario: Init seeds _lessons README with writing rules

- **WHEN** `ppt_flow init` (or `initBundle`) creates a new deck
- **THEN** `deck_*/_lessons/README.md` exists
- **AND** the README states 这里放什么 for retained non-secret lessons
- **AND** the README states writing rules (one-lesson-one-file, no-secrets)
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

### Requirement: checkBundle supports preview vs pipeline readiness

`bundle_layout.mjs` `checkBundle` SHALL support three readiness levels:

1. **structure** — canonical dirs/control files only (today's `requirePipelineReady=false`)
2. **preview** — structure plus `style_master.jpg` present; SHALL NOT require metadata `content_gate` / `visual_gate` to be approved or waived
3. **pipeline** — preview plus metadata gates ∈ {`approved`, `waived`} (today's `requirePipelineReady=true`)

Boolean `true`/`false` MAY remain as aliases for `pipeline`/`structure`. Callers that need style master without gates SHALL use `preview` (not `pipeline`).

#### Scenario: Preview ready with pending gates

- **WHEN** `checkBundle(runDir, 'preview')` (or equivalent) runs
- **AND** style master exists
- **AND** metadata gates are still `pending`
- **THEN** no gate-related violations are returned

#### Scenario: Pipeline ready still requires gates

- **WHEN** `checkBundle(runDir, 'pipeline')` or `checkBundle(runDir, true)` runs
- **AND** a metadata gate is `pending`
- **THEN** a gate-related violation is returned

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

`deck_ai_sdlc_keynote/README.md` and `deck_ai_sdlc_keynote/3_versions/v1/README.md` SHALL be refreshed to match current init-seed placement maps (including `_scratch/`), because `_writeIfAbsent` does not update stale READMEs.

#### Scenario: Keynote root README mentions _scratch

- **WHEN** Agent opens `deck_ai_sdlc_keynote/README.md`
- **THEN** the file mentions `_scratch` as the version temp outlet

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

`initBundle()` SHALL create the `assets/` subdirectory under `2_backbone/visual-style/` with four entries: `svg/`, `reference/`, `icons/` subdirectories and a stub `asset-manifest.yaml`. The stub manifest SHALL contain `version: 1` and `assets: {}`. A README file SHALL be written into the `assets/` directory explaining its purpose (visual asset catalog) and usage (add asset files, register in manifest, bind to slides with `**VISUAL ASSETS**`).

The `assets/` directory is **optional infrastructure** — `checkBundle()` SHALL NOT require it, and the pipeline SHALL operate correctly when it is absent. Old decks created before this feature SHALL continue to pass validation without it. `--new-version` SHALL copy any existing `overrides/visual-style/assets/` but SHALL NOT require it.

#### Scenario: Init creates assets skeleton

- **WHEN** `initBundle()` scaffolds a new deck
- **THEN** `2_backbone/visual-style/assets/` exists
- **AND** `2_backbone/visual-style/assets/asset-manifest.yaml` exists with `version: 1` and `assets: {}`
- **AND** `2_backbone/visual-style/assets/svg/`, `reference/`, and `icons/` directories exist

#### Scenario: Init writes assets README

- **WHEN** `initBundle()` scaffolds a new deck
- **THEN** `2_backbone/visual-style/assets/README.md` exists
- **AND** the README mentions `asset-manifest.yaml` and `**VISUAL ASSETS**`

#### Scenario: Init log mentions asset catalog creation

- **WHEN** `initBundle()` scaffolds a new deck
- **THEN** the returned log array includes an entry for the asset catalog path

#### Scenario: Old deck without assets directory passes validation

- **WHEN** `checkBundle()` validates a deck created before this feature (no `assets/` directory)
- **THEN** validation passes without error
- **AND** the absence of `assets/` is not reported as a problem
