## Purpose

Define `generate_style_master.mjs`, which produces the deck's visual anchor image: it reads `style-master-prompt.md` from the run bundle, calls the external `image2-imagegen` skill with credentials bridged from `.env`, and writes the result to `2_backbone/visual-style/style_master.jpg`. This capability guarantees that every deck has a single generated style master that downstream image prompts can anchor to for visual consistency.

## Requirements

### Requirement: Style master is generated from source prompt

`generate_style_master.mjs` SHALL read `style-master-prompt.md` from the run bundle, call the `image2-imagegen` skill with it, and save the result as `style_master.jpg`.

#### Scenario: Generate style master

- **WHEN** agent runs `node scripts/generate_style_master.mjs --run-dir deck_demo/3_versions/v1`
- **THEN** `2_backbone/visual-style/style_master.jpg` is created or overwritten
- **AND** API credentials are loaded from `.env` and bridged to the skill's expected environment variables
