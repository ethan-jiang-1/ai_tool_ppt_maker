## ADDED Requirements

### Requirement: CONSTITUTION declares run-bundle learning surface with an explicit purpose

`charter/CONSTITUTION.md` SHALL declare a run-bundle **self-learning** surface at `deck_*/_learning/` and SHALL **name its single purpose in plain language** wherever the directory appears (including the human-readable tree snapshot annotation). The purpose SHALL be: this deck's **non-secret operational lessons** learned while working (so the next agent/session reads them before guessing)—**not** playbook progress, **not** secrets, **not** materials or generated artifacts. The constitution SHALL state that the **framework only defines the convention** (path, purpose, prohibitions); **each run bundle accumulates its own** lessons there via the agent. Secrets SHALL NOT be stored under `_learning/`. Playbook progress SHALL remain under `_state/`. A bare directory name without purpose text SHALL be treated as insufficient.

#### Scenario: Reader finds learning vs state vs env with purpose stated

- **WHEN** a reader opens `charter/CONSTITUTION.md`
- **THEN** they see `_learning/` described as the run-bundle learning surface
- **AND** the description states the purpose (non-secret operational lessons / read-before-guess)
- **AND** they see it distinguished from `_state/` and from `.env` secrets

#### Scenario: Tree snapshot annotates the purpose

- **WHEN** a reader views the canonical tree snapshot in `CONSTITUTION.md`
- **THEN** the `_learning/` line includes a short purpose annotation (not only the folder name)

#### Scenario: Framework does not own per-deck memory content

- **WHEN** the constitution describes `_learning/`
- **THEN** it states that learning content is owned by the run bundle (written during work)
- **AND** it does not require the framework tree to ship per-project endpoint lessons
