## ADDED Requirements

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
