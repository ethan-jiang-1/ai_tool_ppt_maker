## MODIFIED Requirements

### Requirement: playbook/ directory contains five MD controllers

`PPTMAKER_FRAMEWORK/playbook/` SHALL contain exactly five files: `full-creation.md`, `edit-text.md`, `edit-visual.md`, `edit-notes.md`, and `restructure.md`. Each SHALL have a `description` field in its frontmatter. File names SHALL be human-readable, matching the natural-language triggers in COMMANDS.md.

#### Scenario: Human lists playbook directory

- **WHEN** a human lists `playbook/`
- **THEN** they see `full-creation.md` (全量创建), `edit-text.md` (文本修改), `edit-visual.md` (视觉修改), `edit-notes.md` (备注修改), `restructure.md` (结构变更)
- **AND** each file's frontmatter shows a one-line `description`
- **AND** filenames `chain-a.md`, `chain-b.md`, `chain-c.md` do NOT exist

## RENAMED Requirements

### Requirement: Chain playbooks cover iteration workflows

FROM: `chain-a.md`, `chain-b.md`, `chain-c.md`, and `structural.md`
TO: `edit-text.md`, `edit-visual.md`, `edit-notes.md`, and `restructure.md`
