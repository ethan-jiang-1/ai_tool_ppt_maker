## MODIFIED Requirements

### Requirement: Run bundle includes _lessons/ with purpose-stated README

`bundle_layout.mjs` SHALL treat `deck_*/_lessons/` as the canonical deck-root **self-retained lessons** directory (replacing the former `_learning/` name). Its **single purpose** is: non-secret lessons retained after the agent (or maintainer) **probes and overcomes** difficulties—so the next session **reads before guessing**. It is not playbook progress, not secrets, not materials or `_generated/` outputs. Image2/env receipts are **examples**, not the definition of the directory. Leaving a successful fix only in chat SHALL be incomplete relative to this purpose.

`initBundle` SHALL create `_lessons/` and seed `_lessons/README.md` from Framework constant `LESSONS_DIR_README` (same pattern as `STATE_DIR_README`). That README SHALL include, in Chinese voice consistent with other dir READMEs:

- **这里放什么:** 克服困难后可复用的非密钥教训；先读再猜；禁止只留聊天
- **闭环:** 试通或修好之后必须留下，避免下一轮失忆
- **不放什么:** 密钥（→`.env`）、进度（→`_state/`）、素材、生成物、无复用吐槽
- **谁读写:** Agent（编排器）/ 维护者；Framework 只定规矩
- **怎么写（规矩）:** 一题一文；`kebab-case` 文件名；四问（遇到什么/怎么试的/结论/下次先看哪）；修好就留；禁密钥；`.md` 或 `.yaml`
- **打个比方:** 非绑定例子，并声明不是目录清单
- **A copy-paste markdown template** for new `.md` lessons, showing the 4-question structure with placeholder text, so the agent can trivially scaffold a well-formed lesson
- 禁止 API key

Constants SHALL be `LESSONS_DIR` / `LESSONS_DIR_README` (not `LEARNING_*`). `renderTree` / CONSTITUTION snapshot SHALL list `_lessons/` with a purpose annotation and SHALL NOT present a single domain file as the sole canonical child. Deck-root `README.md` template SHALL list `_lessons/` with the same purpose. `deck-guide` / `template-deck-guide` MAY mention `_lessons/` only as retained lessons—**not** inside the `_state` progress block. Structure checks SHALL allow `_lessons/` at deck root. Absence of `_lessons/` on a legacy deck SHALL NOT by itself fail `--check --structure-only`. `selfCheck()` SHALL fail if `renderTree()` omits `_lessons`.

The `GUIDE_FILE` template (deck-guide.md seeded by `initBundle`) SHALL include a prominent "自留教训" section that references the `lessons.mjs list` command for the agent to run. This section SHALL be visually distinct from the "当前进度" section and SHALL NOT be buried inside it.

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
