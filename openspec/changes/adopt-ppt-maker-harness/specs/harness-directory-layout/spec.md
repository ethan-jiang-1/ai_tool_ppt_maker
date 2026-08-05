## Purpose

Define the canonical PPT Maker Harness source root, its durable source-domain
boundary, and its separation from user-owned Run Bundle and research data.

## ADDED Requirements

### Requirement: The Harness has one canonical root

The reusable production system SHALL be named **PPT Maker Harness** and SHALL
have exactly one canonical source root, `ppt_maker_harness/`. The former
`PPTMAKER_FRAMEWORK/` pathname SHALL not exist after the transition as a
directory, symlink, alias, empty shell, or duplicate source tree.

#### Scenario: A maintainer locates the reusable production system

- **WHEN** a maintainer inspects the repository after the rename
- **THEN** reusable Charter, workflow, playbook, reference, and executable
  assets are located only under `ppt_maker_harness/`
- **AND** no old Framework root can be selected as an active source owner

### Requirement: Harness source and production data stay separate

The Harness Maintenance Domain SHALL consist of `ppt_maker_harness/`,
`openspec/`, `tests/`, and `tests_e2e/`. Run Bundles and deep-research
directories SHALL remain user-owned production data, SHALL not become Harness
implementation roots, and SHALL not be read or modified merely to perform this
rename.

#### Scenario: A new Run Bundle is initialized

- **WHEN** a Harness creates a Run Bundle
- **THEN** Deck source and generated data are created under that Bundle rather
  than in Harness source directories
- **AND** the Bundle is not treated as a test fixture or rename-migration input

### Requirement: Harness layout has one current production owner graph

The Harness directory map and executable inventory SHALL give every registered
production executable one declared current v2 or shared owner. It SHALL expose
`03-framed-image`, `04-pure-image`, `05-delivery`, and `06-iteration` as the
target method-module owners; `03` and `04` SHALL be mutually exclusive
siblings, `05` their single shared delivery owner, and `06` the
version-workflow-aware iteration owner. It SHALL not expose a compatibility
home, v1 implementation, migration runtime, or second delivery owner.

#### Scenario: Harness directory ownership is audited

- **WHEN** the Harness directory layout is inspected
- **THEN** every registered production executable has one declared current
  owner and the Framed and Pure routes are shown as XOR siblings
- **AND** no retired root or protocol claims active production ownership
