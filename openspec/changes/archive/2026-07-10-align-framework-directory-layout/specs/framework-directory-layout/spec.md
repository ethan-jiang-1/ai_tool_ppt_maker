## MODIFIED Requirements

### Requirement: Framework root has exactly five subdirectories

`PPTMAKER_FRAMEWORK/` SHALL contain exactly five subdirectories: `workflow/`, `scripts/`, `charter/`, `reference/`, and `playbook/`. No other subdirectories SHALL exist at this level.

#### Scenario: Human lists framework root

- **WHEN** a human runs `ls PPTMAKER_FRAMEWORK/`
- **THEN** they see exactly `workflow/`, `scripts/`, `charter/`, `reference/`, `playbook/` plus the five root .md files
- **AND** directories named with Phase numbers (00_, 01_, etc.) or `automation/` do NOT appear

### Requirement: Reference documents are under reference/

`quick-start.md`, `glossary.md`, `anti-patterns.md`, and `version-log.md` SHALL be located under `PPTMAKER_FRAMEWORK/reference/`.

#### Scenario: Human looks up glossary

- **WHEN** a human needs to understand a framework term
- **THEN** they find the glossary at `reference/glossary.md`

## RENAMED Requirements

- FROM: `### Requirement: Framework root has exactly four subdirectories`
- TO: `### Requirement: Framework root has exactly five subdirectories`
