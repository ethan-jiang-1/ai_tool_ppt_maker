## Purpose

Define `bundle_layout.mjs` as the single source of truth for run-bundle directory structure — including the execution-state directory `_state/` and the operational-learning surface `_learning/` at the deck root — and the CLI modes `--init` (scaffold), `--check` (validate against a whitelist), `--new-version` (create a clean downstream version), and `--self-check` (drift alarm for CI). This capability guarantees that run bundles have one authoritative, machine-enforced layout with discoverable progress state and purpose-stated learning surface, so directory drift is caught rather than silently tolerated.

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

`bundle_layout.mjs` SHALL treat `_state/` as a first-class run-bundle root directory. `initBundle` SHALL create `_state/` and write `_state/README.md` using the same README body owned by `scripts/lib/state.mjs` (so init scaffolding and `writeState` self-heal cannot drift). That README SHALL explain: purpose (playbook execution progress), primary fields, coexistence with `project-metadata.yaml`, and pointers to `charter/NODE-SPEC.md` and `scripts/lib/state.mjs`. `renderTree()` and the module header layout comment SHALL include `_state/` and SHALL indicate that `history.jsonl` is created on demand. `selfCheck()` SHALL fail if `renderTree()` omits `_state`.

#### Scenario: Init creates _state README

- **WHEN** Agent runs init for a new deck (via `bundle_layout --init` or `ppt_flow init`)
- **THEN** `deck_*/_state/README.md` exists
- **AND** the README mentions `NODE-SPEC` or `state.mjs` as the schema authority

#### Scenario: Canonical tree lists _state

- **WHEN** Agent inspects `renderTree()` output (including `node PPTMAKER_FRAMEWORK/scripts/bundle_layout.mjs` with no mode flags)
- **THEN** the tree text includes `_state`

### Requirement: Control-file templates mention _state

The `deck-guide.md` body seeded by `initBundle` SHALL mention `_state/state.yaml` as the place to inspect playbook progress (in addition to any `_generated/` artifact hints). The framework copy at `workflow/00-setup/template-deck-guide.md` SHALL likewise mention `_state/state.yaml` in its progress guidance so Expert/manual paths do not contradict init. The deck-root `README.md` template SHALL list `_state/` alongside the three-tier directories. The `project-metadata.yaml` template SHALL include a leading comment stating that pipeline gate fields live in metadata while playbook progress/gates live under `_state/` (field names and values SHALL remain unchanged).

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

### Requirement: Run bundle includes _learning/ with purpose-stated README

`bundle_layout.mjs` SHALL treat `deck_*/_learning/` as a canonical deck-root directory whose **single purpose** is: this deck's **non-secret operational lessons** (read-before-guess)—not playbook progress, not secrets, not materials or `_generated/` outputs.

`initBundle` SHALL create `_learning/` and seed `_learning/README.md` from a Framework-owned constant (same pattern as `_state/README` via `STATE_DIR_README`). That README SHALL explicitly include, in Chinese voice consistent with other dir READMEs:

- **这里放什么:** 本 deck 操作中试出来的、可复用的非密钥经验；下次 Agent/人先读再猜  
- **不放什么:** 密钥（→`.env`）、playbook 进度（→`_state/`）、素材、生成物  
- **谁读写:** Agent（代表本 bundle）  
- **约定文件:** `image2-proven.yaml`（Image2 冒烟试通回执；无 API key 字段）  
- 禁止把密钥写入本目录  

The human-readable tree (`renderTree` / CONSTITUTION snapshot) SHALL list `_learning/` **with a purpose annotation**. Deck-root `README.md` template SHALL list `_learning/` with the same purpose (not a bare name). `deck-guide` / `template-deck-guide` MAY mention `_learning/` only as operational lessons—**not** inside the playbook-progress (`_state`) guidance block. Structure checks SHALL allow `_learning/` at deck root. Absence of `_learning/` on a legacy deck SHALL NOT by itself fail `--check --structure-only`. `selfCheck()` SHALL fail if `renderTree()` omits `_learning`.

#### Scenario: Init seeds purpose-stated learning README

- **WHEN** `ppt_flow init` (or `initBundle`) creates a new deck
- **THEN** `deck_*/_learning/README.md` exists
- **AND** the README contains an explicit 这里放什么 (or equivalent) purpose statement for non-secret operational lessons
- **AND** the README states the no-secrets rule and points at `image2-proven.yaml` as the Image2 receipt filename

#### Scenario: Tree and deck README annotate purpose

- **WHEN** Agent inspects `renderTree()` output or a newly inited deck-root `README.md`
- **THEN** `_learning/` appears with a short purpose annotation (operational lessons / non-secret), not only the folder name

#### Scenario: Structure check allows _learning; legacy absence soft

- **WHEN** a deck has `_learning/` at the deck root
- **AND** `bundle_layout --check … --structure-only` runs
- **THEN** `_learning/` is not reported as an unexpected path

- **WHEN** a legacy deck lacks `_learning/`
- **AND** `--check --structure-only` runs
- **THEN** absence of `_learning/` alone does not fail the check

#### Scenario: selfCheck requires _learning in renderTree

- **WHEN** `bundle_layout --self-check` runs
- **AND** `renderTree()` omits `_learning`
- **THEN** self-check fails
