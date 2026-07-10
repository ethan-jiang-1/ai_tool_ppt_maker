## Purpose

Define `generate_style_master.mjs`, which produces the deck's visual anchor
image using the in-framework `image_api_client.mjs` (Node fetch, async API).
No external `image2-imagegen` skill.

## Requirements

### Requirement: Style master uses in-framework image client

`generate_style_master.mjs` SHALL read `style-master-prompt.md` from the run
bundle, call `image_api_client.mjs`, and write `style_master.jpg` plus a trace
file under `2_backbone/visual-style/`.

#### Scenario: Generate from prompt

- **WHEN** `generate_style_master.mjs --run-dir <version>` is run with valid
  credentials and base URL
- **THEN** it writes `style_master.jpg` next to the prompt without searching
  skill directories
