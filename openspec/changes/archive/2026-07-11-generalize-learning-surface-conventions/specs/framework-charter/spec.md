## MODIFIED Requirements

### Requirement: CONSTITUTION declares run-bundle learning surface with an explicit purpose

`charter/CONSTITUTION.md` SHALL declare a run-bundle **self-retained lessons** surface at `deck_*/_lessons/` and SHALL give it a **dedicated governing section** (not only a tree-line annotation). That section SHALL state, in plain language, the **agentic loop**: the agent workflow is expected to **probe, overcome difficulties on its own, and retain non-secret lessons** under `_lessons/` so the next session reads before guessing—rather than amnesiacally restarting from chat. The framework SHALL define only the convention (path, purpose, writing rules, prohibitions); **each run bundle accumulates its own** lessons via the agent. The surface is **not** playbook progress, **not** secrets, **not** materials or generated artifacts. Domain-specific receipts (for example an Image2 smoke file) MAY be cited as **examples**, but SHALL NOT be the sole purpose of `_lessons/`. Secrets SHALL NOT be stored under `_lessons/`. Playbook progress SHALL remain under `_state/`. A bare directory name without purpose text SHALL be treated as insufficient. The constitution and tree snapshot SHALL use `_lessons/` (not `_learning/`) as the canonical path.

#### Scenario: Charter section states the agentic retain loop

- **WHEN** a reader opens `charter/CONSTITUTION.md`
- **THEN** they find a dedicated section for the `_lessons/` surface
- **AND** that section states probe / overcome / retain / read-before-guess in plain language
- **AND** it distinguishes `_lessons/` from `_state/` and from `.env` secrets

#### Scenario: Tree snapshot annotates _lessons without a single-file monopoly

- **WHEN** a reader views the canonical tree snapshot in `CONSTITUTION.md`
- **THEN** the `_lessons/` line includes a short purpose annotation (not only the folder name)
- **AND** the snapshot does not imply the directory exists only for one named receipt file

#### Scenario: Framework does not own per-deck lesson content

- **WHEN** the constitution describes `_lessons/`
- **THEN** it states that lesson content is owned by the run bundle (written during work)
- **AND** it does not require the framework tree to ship per-project endpoint lessons
