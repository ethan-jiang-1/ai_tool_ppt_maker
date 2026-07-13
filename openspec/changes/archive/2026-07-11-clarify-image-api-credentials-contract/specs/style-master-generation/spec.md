## MODIFIED Requirements

### Requirement: Style master uses in-framework image client

`generate_style_master.mjs` SHALL read `style-master-prompt.md`, call `image_api_client.mjs`, and write `style_master.jpg` plus a trace under `2_backbone/visual-style/`. Credentials SHALL follow the Image2 contract (`IMAGE2_API_KEY` + base URL, with OPENAI_*/IMAGE2_* aliases).

#### Scenario: Generate from prompt

- **WHEN** `generate_style_master.mjs --run-dir <version>` runs with valid Image2 credentials
- **THEN** it writes `style_master.jpg` without searching skill directories
