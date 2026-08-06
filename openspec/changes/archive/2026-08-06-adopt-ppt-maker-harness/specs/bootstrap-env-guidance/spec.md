## ADDED Requirements

### Requirement: Bootstrap guidance names the canonical Harness entry

Bootstrap and top-level onboarding guidance SHALL identify
`ppt_maker_harness/BOOTSTRAP.md` as the Harness startup document and
`ppt_maker_harness/scripts/ppt_flow.mjs` as the canonical production entrypoint.
It SHALL not present the retired Framework root as a supported startup path.

#### Scenario: An Agent begins Harness startup

- **WHEN** an Agent follows active onboarding for PPT work or local readiness
- **THEN** it enters through the Harness BOOTSTRAP document and its current CLI
  entrypoint
- **AND** it does not infer a production Run Bundle or compatibility route
