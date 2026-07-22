## Purpose

Define `generate_style_master.mjs`, which produces the deck's visual anchor
image using the in-framework `image_api_client.mjs` (Node fetch, async API)
under the Image2 credentials contract. No external `image2-imagegen` skill.

## Requirements
### Requirement: Style-master routing preserves a future HTML adapter seam

The public `style-master` route SHALL consume the canonical production policy before invoking an
implementation. For `image2-only`, it SHALL delegate to the current in-framework Image2 style-master
generator with its existing credential, trace, and deck-system behavior, but only after a first-class
Controller has recorded the current scoped human authorization when a provider submit is actually
needed. A current no-op/reuse path requires no provider authorization. For either HTML mode, the
policy SHALL expose a reserved HTML adapter seam; until an HTML adapter exists, the command SHALL
return typed `capability_not_available` guidance with a local next action and SHALL create no
`style_master.jpg`, provider request, or legacy control artifact.
That HTML result SHALL be a successful `guide` (`available: false`), not a hard failure.

The mode contract SHALL NOT specify style master as permanently forbidden for HTML and SHALL NOT
require a future HTML adapter to reuse the Image2 image artifact, prompt shape, or provider semantics.
Unknown mode/pipeline identity or missing Image2 provider authorization SHALL remain hard-stop outcomes
owned by state/CLI readiness rather than being downgraded to capability guidance.

#### Scenario: Image2-primary style master runs

- **WHEN** `style-master` targets a consistent authorized `image2-only` run
- **THEN** it invokes the current Image2 implementation and records its existing output/trace

#### Scenario: HTML style master is not implemented yet

- **WHEN** `style-master` targets a consistent HTML mode
- **THEN** it returns typed reserved-adapter guidance without provider work or legacy artifact writes
- **AND** the result does not declare HTML visual-system support permanently impossible

#### Scenario: Mode identity is invalid

- **WHEN** state mode and source pipeline disagree
- **THEN** style-master hard-stops at identity recovery before capability guidance or provider readiness

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
