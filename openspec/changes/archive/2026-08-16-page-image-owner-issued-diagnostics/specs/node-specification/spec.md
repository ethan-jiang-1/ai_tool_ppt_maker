# Node Specification Specification (delta)

## MODIFIED Requirements

### Requirement: ctx parameter provides run bundle paths to conditions

`checkEntry` and `checkExit` SHALL accept a `ctx` parameter providing:
`deckDir` (deck root), `runDir` (current version dir), and `harnessDir`
(PPT Maker Harness root). FILESYSTEM conditions SHALL resolve paths relative
to these directories. The context SHALL not expose a retired root field.

Visual-language readiness SHALL resolve the current canonical Visual
Language source through the run-bundle owner's declared current path (the
`page-image-visual-language.yaml` source in the current run-bundle visual
layout) and SHALL NOT reference the retired
`page-authority-visual-language.yaml` path or rebuild a competing path
string mirror.

#### Scenario: Condition resolves file path via ctx

- **WHEN** `checkEntry('authoring-slides', playbookDir, state, { deckDir, runDir })` is called
- **THEN** the `slide_specs_exists` condition checks `join(runDir, 'slide-specifications.md')`
- **AND** visual-language readiness resolves the current canonical Visual
  Language source through the run-bundle owner and never the retired
  page-authority path

#### Scenario: Developer looks up a condition

- **WHEN** a developer opens `charter/NODE-SPEC.md`
- **THEN** they see the complete conditions catalog with standard names

### Requirement: CLI ⇔ MD failure protocol uses JSON envelopes

Playbook CLI steps that invoke `ppt_flow.mjs` SHALL treat a non-zero exit as
actionable only when paired with the JSON failure envelope on stderr (last
non-empty line), as defined by `cli-surface` and `charter/CONSTITUTION.md`.
MD Controllers SHALL consume the canonical four-part diagnostic handoff:
`diagnostic.category` and `diagnostic.reason` classify the failure, and
`diagnostic.next` is the sole recovery authority; the Controller follows the
exact next action within its authority and stops when
`next.requires_human` is true. Top-level `code`/`message`/`hint` SHALL
remain a compatibility summary and SHALL NOT be used to decide a repair
action. Controllers SHALL NOT derive a parallel recovery route from prose,
file presence, or code/hint branching — they SHALL NOT depend solely on
matching prose such as `Fatal error:`.

#### Scenario: MD Controller reads a ppt_flow failure

- **WHEN** a playbook CLI step runs `ppt_flow.mjs` and it exits non-zero
- **THEN** the controller parses the last non-empty stderr line as JSON
- **AND** it uses `diagnostic.category`/`reason`/`next` to decide the repair
  action and does not branch on top-level `code` or `hint`
