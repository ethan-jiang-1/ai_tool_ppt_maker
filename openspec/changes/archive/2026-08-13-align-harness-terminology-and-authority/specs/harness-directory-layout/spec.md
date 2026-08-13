## ADDED Requirements

### Requirement: Active Harness source maps include the schema definition home

Active Harness source maps and path references SHALL list
`ppt_maker_harness/schema/` beside the current `workflow/`, `scripts/`,
`charter/`, `reference/`, and `playbook/` homes. They SHALL describe it as the
single authoritative production-schema definition home and SHALL not describe
it as a Run Bundle, runtime controller, generated-output location, or a
competing directory-layout authority.

#### Scenario: Maintainer reads an active source map

- **WHEN** a maintainer reads active Harness directory guidance or its where
  map
- **THEN** it can locate the `schema/` definition home and its ownership role
- **AND** it does not confuse that home with user-owned run-bundle data
