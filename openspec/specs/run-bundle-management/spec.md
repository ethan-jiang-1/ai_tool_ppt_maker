## Purpose

Define `bundle_layout.mjs` as the single source of truth for run-bundle directory structure — including the execution-state directory `_state/` and the self-retained lessons surface `_lessons/` at the deck root — and the CLI modes `--init` (scaffold), `--check` (validate against a whitelist), `--new-version` (create a clean downstream version), and `--self-check` (drift alarm for CI). This capability guarantees that run bundles have one authoritative, machine-enforced layout with discoverable progress state and purpose-stated lessons surface, so directory drift is caught rather than silently tolerated.

## Requirements

### Requirement: Bundle layout is the directory constitution

`bundle_layout.mjs` SHALL be the single source of truth for run-bundle directory structure, including the execution-state directory `_state/` at the deck root. Other scripts SHALL import general bundle path constants from `bundle_layout.mjs`. The `_state` directory/file name constants SHALL be imported from `scripts/lib/state.mjs` (not re-declared as string literals in `bundle_layout.mjs`). It SHALL support `--init` (scaffold, including `_state/` hints and initial state when absent), `--check` (validate), `--new-version` (create clean downstream version), and `--self-check` (drift alarm for CI, including `_state` presence in `renderTree()`). Absence of `_state/` on a legacy deck SHALL NOT by itself cause `--check --structure-only` to fail.

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
