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

## ADDED Requirements

### Requirement: Stateful Controller entry follows verified Harness binding

Before a Controller or state consumer uses a run-scoped Deck as current work,
the owning CLI or locator entry SHALL verify that Bundle's v2 local Harness
binding. The MD Controller SHALL consume the resulting bounded success or
hard-stop and SHALL not infer a current execution, choose another Harness, or
seed state from a structure-only observation.

#### Scenario: A legacy Bundle is presented to a stateful command

- **WHEN** a stateful command derives a Deck root with a missing or legacy
  locator
- **THEN** it returns the binding owner's one bounded hard-stop before reading
  state or selecting a Controller node
- **AND** the Controller does not create a replacement state record
