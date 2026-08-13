## ADDED Requirements

### Requirement: Active Harness guidance exposes one terminology and authority hierarchy

Active repository and Harness entry guidance SHALL identify
`openspec/specs/` as the normative behavior contract and `CONTEXT.md` as the
canonical terminology reference. It SHALL direct run-bundle production through
BOOTSTRAP, the Agent Contract, and the applicable current Controller guidance,
without making the glossary/reference a competing controller or executable
entry.

The guidance SHALL distinguish the `page-image-workflow` pipeline, the
version-level `production.workflow: framed|pure` selection, and
method-module/MD Controller workflow guidance. It SHALL not reintroduce
numeric lifecycle labels, a live HTML Production family, a visual-slot Image
Production branch, or an alternate Page Image protocol.

#### Scenario: Agent begins repository maintenance

- **WHEN** an Agent enters the repository to maintain the Harness
- **THEN** its entry guidance identifies the normative specifications and the
  terminology reference with their distinct roles
- **AND** it does not treat either reference as a replacement for an owning
  Controller, CLI, or run-bundle source of record

#### Scenario: Agent begins deck production

- **WHEN** an Agent enters a current run-bundle production route
- **THEN** the active guidance distinguishes pipeline, selected workflow, and
  method-module/Controller meanings before directing the existing entry route
- **AND** it does not offer HTML Production, visual-slot Image Production, or a
  second Page Image workflow as a current choice
