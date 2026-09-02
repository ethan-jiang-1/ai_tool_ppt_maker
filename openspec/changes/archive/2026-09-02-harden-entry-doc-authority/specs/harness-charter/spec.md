## ADDED Requirements

### Requirement: BOOTSTRAP carries a bounded entry vocabulary scaffold

`ppt_maker_harness/BOOTSTRAP.md` SHALL include, before Step 0, a bounded
vocabulary scaffold that gives one plain-language gloss for each Page Image
term its own steps rely on. The scaffold SHALL cover at minimum: run bundle,
`--run-dir` as a version leaf, Work Version, receipt, state, the version-level
`production.workflow: framed|pure` selection, hard-stop, Image2 Call Shape, the
Image2 provider profile versus `IMAGE2_PROVIDER_PROFILE_ID`, `_generated/` as
rebuildable output, and `slide_id` versus `position`. The scaffold SHALL state
that it is a reading aid and that canonical terminology and the where-map
remain owned by `CONTEXT.md` and `ppt_maker_harness/reference/glossary.md`. It
SHALL NOT restate authority for any Controller, CLI command, lifecycle rule, or
specification.

#### Scenario: An Agent reads Step 1 before CONTEXT.md

- **WHEN** an Agent encounters the entry terms in BOOTSTRAP Step 1 or Step 2
  without having read the terminology reference
- **THEN** the scaffold's one-line glosses let it parse the step it is reading
- **AND** each gloss points into the owning references for the full definition

#### Scenario: Terminology evolves after the scaffold is written

- **WHEN** a term's canonical definition changes in `CONTEXT.md` while the
  scaffold's short gloss still reflects the older wording
- **THEN** the defect is a stale reading aid owned by this guidance
- **AND** it does not create a competing terminology or lifecycle authority

#### Scenario: A maintainer checks the scaffold's boundary

- **WHEN** the coherence guard or a maintainer reviews the scaffold
- **THEN** it contains no command grammar, no production authorization rule,
  and no spec-level behavior beyond pointing to the owning references
- **AND** removing the scaffold would not change any run-bundle production
  behavior
