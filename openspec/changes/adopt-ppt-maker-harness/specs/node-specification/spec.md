## MODIFIED Requirements

### Requirement: NODE-SPEC.md exists in charter directory

`ppt_maker_harness/charter/NODE-SPEC.md` SHALL exist as the constitutional
specification for Nodes, defining their anatomy, state schema, and execution
rules.

#### Scenario: Developer reads node specification

- **WHEN** a developer opens `ppt_maker_harness/charter/NODE-SPEC.md`
- **THEN** they understand the Node frontmatter structure, state schema, and
  how playbooks are organized

### Requirement: ctx parameter provides run bundle paths to conditions

`checkEntry` and `checkExit` SHALL accept a `ctx` parameter providing:
`deckDir` (deck root), `runDir` (current version dir), and `harnessDir`
(PPT Maker Harness root). FILESYSTEM conditions SHALL resolve paths relative to
these directories. The context SHALL not expose `frameworkDir` as a current
protocol field.

#### Scenario: Condition resolves file path via ctx

- **WHEN** `checkEntry('authoring-slides', playbookDir, state, { deckDir,
  runDir, harnessDir })` is called
- **THEN** the `slide_specs_exists` condition checks `join(runDir,
  'slide-specifications.md')`
- **AND** visual-language readiness checks `join(deckDir,
  '2_backbone/visual-style/page-authority-visual-language.yaml')`

#### Scenario: Developer looks up a condition

- **WHEN** a developer opens `charter/NODE-SPEC.md` beneath the Harness root
- **THEN** they see the complete conditions catalog with standard names
