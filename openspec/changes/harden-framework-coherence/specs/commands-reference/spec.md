## ADDED Requirements

### Requirement: Title-edit intents route by resolved render mode

`COMMANDS.md` and its target playbooks SHALL treat a request to change KICKER, TITLE, or SUBTITLE as an intent that requires Stage 1 resolution before selecting the execution chain. The routing table MAY initially name `edit-text`, but the agent SHALL inspect `layout_contract.render_mode` and route `body+header-lock` slides to Chain A and `full-page` slides to Chain B with image/header review obligations.

#### Scenario: Natural-language title edit targets a body-lock slide

- **WHEN** the user asks to change a title and the selected slide resolves to `body+header-lock`
- **THEN** the agent uses stages 1,3,4,5 without regenerating the image

#### Scenario: Natural-language title edit targets a full-page slide

- **WHEN** the user asks to change a title and the selected slide resolves to `full-page`
- **THEN** the agent regenerates only the affected image with forced image generation
- **AND** obtains current header review evidence before completing the build

#### Scenario: Mixed title edit requires explicit scope

- **WHEN** a title-edit request affects both render modes and no slide scope is provided
- **THEN** routing fails safely with a request for affected slide selection
- **AND** does not silently apply Chain A to the full-page slides
