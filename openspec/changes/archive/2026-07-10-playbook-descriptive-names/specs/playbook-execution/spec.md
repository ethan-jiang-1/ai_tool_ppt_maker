## MODIFIED Requirements

### Requirement: playbook/ directory contains five MD controllers

`PPTMAKER_FRAMEWORK/playbook/` SHALL contain exactly five files: `create-deck.md`, `edit-text.md`, `edit-visual.md`, `edit-notes.md`, and `restructure-slides.md`. Each SHALL have a `description` field in its frontmatter. File names SHALL be verb-noun pairs, matching the natural-language triggers in COMMANDS.md.

#### Scenario: Human lists playbook directory

- **WHEN** a human lists `playbook/`
- **THEN** they see `create-deck.md` (全量创建), `edit-text.md` (文本修改), `edit-visual.md` (视觉修改), `edit-notes.md` (备注修改), `restructure-slides.md` (结构变更)
- **AND** each file's frontmatter shows a one-line `description`
- **AND** filenames `chain-a.md`, `chain-b.md`, `chain-c.md`, `structural.md`, `full-creation.md` do NOT exist

## RENAMED Requirements

### Requirement: Chain playbooks cover iteration workflows

FROM: `chain-a.md`, `chain-b.md`, `chain-c.md`, and `structural.md`
TO: `edit-text.md`, `edit-visual.md`, `edit-notes.md`, and `restructure-slides.md`

### Requirement: Full creation playbook covers complete deck creation

FROM: `full-creation.md`
TO: `create-deck.md`
