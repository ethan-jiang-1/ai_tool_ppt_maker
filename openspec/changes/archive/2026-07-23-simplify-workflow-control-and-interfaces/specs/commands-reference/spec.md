## ADDED Requirements

### Requirement: COMMANDS resume guidance names the inspection control input

For a known exact run, `COMMANDS.md` SHALL direct resume and gate guidance to
`state --json.workflow_inspection.primary_action` and the owner-issued `continuation`. It SHALL
distinguish these read-only observation inputs from the direct public CLI command that performs a
mutation, and SHALL not instruct an Agent to use `html_resume_guidance` as an executable control
protocol.

#### Scenario: Human resumes an existing deck
- **WHEN** a human or Agent follows COMMANDS guidance for an existing exact run
- **THEN** it obtains the current inspection action before selecting the owner mutation route
- **AND** it does not infer a route from a compatibility summary or rendered artifact
