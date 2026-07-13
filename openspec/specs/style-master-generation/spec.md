## Purpose

Define `generate_style_master.mjs`, which produces the deck's visual anchor
image using the in-framework `image_api_client.mjs` (Node fetch, async API)
under the Image2 credentials contract. No external `image2-imagegen` skill.

## Requirements

### Requirement: Style master uses in-framework image client

`generate_style_master.mjs` SHALL read `style-master-prompt.md`, call `image_api_client.mjs`, and write `style_master.jpg` plus a trace under `2_backbone/visual-style/`. Credentials SHALL follow the Image2 contract via the **same** `resolveVendors` path as Stage 2 (`IMAGE2_API_KEY` + `IMAGE2_BASE_URL`) — no separate credential parser and no duplicate failover logic in the wrapper.

When `2_backbone/visual-style/deck_system.txt` is present (same path Stage 1 uses), the generator SHALL append that file's loaded text to the effective style-master prompt using the same loader semantics as Stage 1 (`loadDeckSystem` or a shared extract), so style master and page prompts share one constraint source. It SHALL NOT inject per-slide body copy from slide specs. When the file is absent, behavior SHALL remain prompt-file-only. The CLI SHALL support `--no-deck-system` to skip injection when debugging.

Style-master generation inherits the image client's visible wait heartbeats (`phase=submit|poll`) and vendor failover logging (`Mirror failed`); the wrapper SHALL NOT suppress or rewrite those progress lines into silence.

#### Scenario: Generate from prompt

- **WHEN** `generate_style_master.mjs --run-dir <version>` runs with valid Image2 credentials
- **THEN** it writes `style_master.jpg` without searching skill directories

#### Scenario: deck_system text is included when present

- **WHEN** `2_backbone/visual-style/deck_system.txt` exists
- **AND** style-master generation runs without `--no-deck-system`
- **THEN** the effective prompt sent to the image API includes that file's loaded text

#### Scenario: --no-deck-system skips injection

- **WHEN** `deck_system.txt` exists
- **AND** generation runs with `--no-deck-system`
- **THEN** the effective prompt does not append deck_system text

#### Scenario: Style master uses shared vendor resolution

- **WHEN** `IMAGE2_API_KEY` + `IMAGE2_BASE_URL` are configured and style-master runs
- **THEN** generation uses the same Image2 credential path as Stage 2 (via `image_api_client`)
