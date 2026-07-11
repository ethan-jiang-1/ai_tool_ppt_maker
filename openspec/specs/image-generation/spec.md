## Purpose

Define Stage 2 (image generation) as an **in-framework Node** capability: async
submit→poll→download via `image_api_client.mjs`, batch generation via
`stage2_generate_images.mjs`, and QA contact sheets via `make_contact_sheet.mjs`.
Credentials follow the Image2 contract (`IMAGE2_VENDORS` and/or `IMAGE2_*`, with OPENAI_*/APIMART_* aliases).
No external agent skills. No Python. No bash.

## Requirements

### Requirement: Stage 2 is implemented inside the framework

Stage 2 SHALL be implemented by Node ESM modules under `PPTMAKER_FRAMEWORK/scripts/`. The unified pipeline SHALL call these modules directly, not discover external skills.

Image credentials SHALL be resolved by a single SSOT helper (`resolveVendors` or equivalent) into an ordered list of `{ base_url, api_key }` vendors. Canonical configuration forms:

1. **Vendor list (preferred for multi-key):** non-empty `IMAGE2_VENDORS` — comma-separated ordered items `base_url|KEY_ENV_VAR` (recommended example: `https://s.lconai.com/v1|CODEX_API_KEY_LCONAI,https://zenmux.ai/api/v1|CODEX_API_KEY_ZENMUX,https://api.apib.ai/v1|APIMART_API_KEY`). The list SHALL NOT embed secret values; each item resolves `api_key` from `process.env[KEY_ENV_VAR]`. An item without `|KEY_ENV_VAR` SHALL fall back to the shared Image2 key (`IMAGE2_API_KEY`, then OPENAI_*/APIMART_* aliases). If any listed item cannot resolve a key, resolution SHALL fail and name the missing variable.
2. **Legacy single-key + URL(s):** when `IMAGE2_VENDORS` is empty/unset — `IMAGE2_API_KEY` (or aliases) plus `IMAGE2_BASE_URL` and/or `IMAGE2_BASE_URLS` (OPENAI_*/APIMART_* aliases). The client SHALL synthesize an ordered vendor list sharing that one key.

**Priority:** CLI `--base-url` (highest) SHALL replace the URL list and MUST pair only with the shared Image2 key (not a key borrowed from `IMAGE2_VENDORS`); if no shared key is set, resolution SHALL fail naming `IMAGE2_API_KEY`. Else if `IMAGE2_VENDORS` is non-empty it SHALL be the sole env vendor source and legacy `IMAGE2_BASE_URL` / `IMAGE2_BASE_URLS` SHALL be ignored for routing. Else legacy URL(s) + shared key. These variables are for **image generation only**, not chat LLMs. Errors SHALL name the IMAGE2 variable that is missing or in use (`IMAGE2_VENDORS` / `IMAGE2_BASE_URL` / `IMAGE2_API_KEY` as applicable).

`generateOneImage` SHALL try vendors **in list order**. On each failure it SHALL log with the existing `Mirror failed (<base_url>):` prefix and the error message (no silent swallow). When all vendors fail it SHALL throw an error whose message includes an **attempts summary** (each attempt: base URL + short error; at most five attempts in the summary). Sync vs async SHALL remain one thin post-submit branch: if `extractImageRef` yields an image, save it; else if a task id exists, poll; else fail that attempt. Output shapes (`url`, `b64_json`, poll-embedded URL) SHALL continue through one extract helper — no per-vendor strategy classes.

#### Scenario: Pipeline uses in-framework generator

- **WHEN** `unified_pipeline.mjs --stage 2` runs
- **THEN** Stage 2 uses `stage2_generate_images.mjs` with Image2-resolved credentials

#### Scenario: Missing base URL fails at resolve time

- **WHEN** Stage 2 runs with a shared key but no resolvable base URL and no `IMAGE2_VENDORS`
- **THEN** resolution fails naming `IMAGE2_BASE_URL`

#### Scenario: IMAGE2_VENDORS resolves per-vendor keys

- **WHEN** `IMAGE2_VENDORS` lists two `url|KEY_ENV` items and both KEY_ENV values are set
- **THEN** `resolveVendors` returns two vendors with distinct keys in list order

#### Scenario: IMAGE2_VENDORS missing KEY_ENV fails at resolve

- **WHEN** `IMAGE2_VENDORS` lists `https://example/v1|MISSING_KEY_VAR` and that variable is unset
- **AND** no shared Image2 key applies as fallback for that item
- **THEN** resolution fails naming `MISSING_KEY_VAR`

#### Scenario: Legacy BASE_URLS plus single key still works

- **WHEN** only `IMAGE2_API_KEY` and `IMAGE2_BASE_URLS` are set (no `IMAGE2_VENDORS`)
- **THEN** the client synthesizes an ordered vendor list sharing that key

#### Scenario: IMAGE2_VENDORS wins over legacy BASE_URL

- **WHEN** both `IMAGE2_VENDORS` and `IMAGE2_BASE_URL` are set
- **THEN** routing uses only the `IMAGE2_VENDORS` list

#### Scenario: CLI --base-url requires shared key

- **WHEN** `--base-url` is passed and no shared `IMAGE2_API_KEY` / OPENAI / APIMART key is set
- **THEN** resolution fails naming `IMAGE2_API_KEY`
- **AND** it does not silently use a key from `IMAGE2_VENDORS`

#### Scenario: Failover logs each attempt and aggregates on total failure

- **WHEN** the first vendor fails and the second also fails
- **THEN** output includes a `Mirror failed` line for each vendor base URL
- **AND** the thrown error message includes an attempts summary covering both

#### Scenario: Sync submit success without task_id

- **WHEN** submit returns an extractable image ref and no task id
- **THEN** the client saves the image without polling

### Requirement: Submit and poll accept data-array response envelopes

`image_api_client.mjs` SHALL extract submit `task_id` from object and array `data` envelopes, including `{ code, data: [ { task_id, status } ] }`, consistent with result's `data[0]` handling (closes BUG-008). Poll status SHALL read top-level or unwrapped `data` so array envelopes are not stuck as unknown. Unit tests SHALL cover array submit and object regression.

#### Scenario: Submit response with data array yields task_id

- **WHEN** submit returns `{"code":200,"data":[{"status":"submitted","task_id":"task_abc"}]}`
- **THEN** the client obtains `task_abc` without throwing `No task_id`

#### Scenario: Submit response with object data still works

- **WHEN** submit returns `{"task_id":"task_xyz"}` or `{"data":{"task_id":"task_xyz"}}`
- **THEN** the client still obtains the task id

### Requirement: Image2 smoke, persist secrets to .env, lessons to _lessons/

Framework entry docs (`BOOTSTRAP.md` and Image2 SSOT `workflow/00-setup/03-tool-selection.md`) SHALL require: on missing credentials or first image failure, the agent tries multiple combinations (`IMAGE2_VENDORS` items in order, IMAGE2_*, aliases, BASE_URLS, `--base-url`, user URLs) and a cheap smoke (`doctor --smoke` and/or `style-master … --force --resolution 1k`) before telling a novice to self-configure. When image-path symptoms persist (smoke fail, 502, all vendors fail, or user reports images will not generate), entry docs SHALL also direct the agent to offer channel体检 in plain language (playbook `probe-image-channels` / `doctor --probe-vendors`) rather than only "configure the API yourself". Entry docs SHALL document `IMAGE2_VENDORS` as the multi-vendor form and SHALL state that when `IMAGE2_VENDORS` is set it takes routing precedence over `IMAGE2_BASE_URL` / `IMAGE2_BASE_URLS`.

On success, the **run bundle** retains:

1. **Secrets and routing in `.env`** (walk-up, prefer deck-root): secret key **values** in their env vars; optional non-secret `IMAGE2_VENDORS` routing line (KEY_ENV **names** only in that line).
2. **Non-secret lesson** → `deck_*/_lessons/image2-proven.yaml` under `_lessons/` (read-before-guess). Fields: `proven_at`, `base_url`, `via` (`env`|`cli`|`alias`|`user-provided`|`vendors`), optional `notes`; **no API key field**.

Entry docs SHALL describe `_lessons/` as the general retained-lessons surface and SHALL treat `image2-proven.yaml` as an Image2 example entry, not as the definition of `_lessons/`. Next session SHOULD read `_lessons/` before guessing endpoints. The agent SHALL NOT leave proven combos only in chat, SHALL NOT put keys in `_lessons/`, and SHALL NOT invent non-canonical folders for these lessons.

#### Scenario: Smoke succeeds then bundle retains the lesson

- **WHEN** a smoke combination succeeds after earlier failures
- **THEN** `.env` retains the working secret vars and any chosen `IMAGE2_VENDORS` routing
- **AND** `_lessons/image2-proven.yaml` exists without an API key field

#### Scenario: Novice is not left with a single hard failure

- **WHEN** doctor reports missing Image2 URL/key or the first smoke fails
- **THEN** entry docs direct further combinations (including the next `IMAGE2_VENDORS` item) and channel体检 as a concrete next step before "configure the API yourself" as the only next step

#### Scenario: Persist docs name _lessons as general surface

- **WHEN** an agent follows BOOTSTRAP / `03-tool-selection` after a successful smoke
- **THEN** those docs tell them to write the non-secret receipt under `_lessons/` as one lesson among possible lessons (not under `_state/` or as chat-only)
- **AND** they do not describe `_lessons/` as an Image2-only directory

### Requirement: Contact sheet is in-framework

After image generation, the pipeline SHALL produce a contact sheet using
`make_contact_sheet.mjs` (`@napi-rs/canvas`), not an external skill.

#### Scenario: Contact sheet written under preview/

- **WHEN** Stage 2 completes successfully
- **THEN** a JPEG contact sheet is written under `_generated/preview/`

### Requirement: No external skill dependency

The framework SHALL NOT require `image2-ppt` or `image2-imagegen` skills to be
installed for production readiness.

#### Scenario: Doctor without skills dirs

- **WHEN** env-check runs with no `.claude/skills` / `.agents/skills` present
- **THEN** `stage2_generator` is still `ok` if in-framework scripts exist

### Requirement: Poll loop emits heartbeat within MAX_WAIT_MS

`image_api_client.mjs` SHALL emit a progress log at least every **30 seconds** (`HEARTBEAT_MS`) while waiting on a single image, covering:

1. **Submit wait** — while `POST …/images/generations` is in flight (including sync vendors that block until the image is ready), including elapsed time, vendor base URL, and `phase=submit` (or equivalent).
2. **Poll wait** — while polling a task, including elapsed time, last known status, and task id when known (`phase=poll` or equivalent).

Submit wait SHALL be bounded by the same per-image budget as poll (`MAX_WAIT_MS` or documented equivalent) via abort/timeout; on submit timeout the attempt SHALL fail with an error that identifies timeout, `phase=submit`, vendor, and elapsed time. On poll timeout it SHALL fail that image with an error that identifies the timeout and task id when known, and SHALL stop polling that task.

#### Scenario: Long poll prints heartbeat

- **WHEN** a poll waits longer than 30 seconds before completion
- **THEN** output includes at least one progress line with elapsed time

#### Scenario: Long sync submit prints heartbeat

- **WHEN** a submit request stays in flight longer than 30 seconds before returning
- **THEN** output includes at least one progress line naming the vendor and submit phase

#### Scenario: Submit timeout fails the attempt

- **WHEN** a single submit stays in flight longer than `MAX_WAIT_MS`
- **THEN** that vendor attempt fails with a timeout error identifying submit phase
- **AND** the client may failover to the next vendor

#### Scenario: Per-image timeout stops polling

- **WHEN** a single image poll exceeds `MAX_WAIT_MS`
- **THEN** that image generation fails with a timeout error
- **AND** the client does not continue polling that task

### Requirement: Image API response fixtures cover extract paths

The test suite SHALL include checked-in, secret-free JSON fixtures for known relay shapes (at minimum: submit `data:[{task_id}]`, and a completed poll body with embedded image URL under `data.result.images[0].url`). Tests SHALL assert exported unwrap/extract helpers accept those fixtures.

#### Scenario: Fixture poll embedded URL extracts

- **WHEN** tests load the poll-embedded-image fixture
- **THEN** the extract helper returns the image URL (or downloadable ref)
- **AND** no API key appears in the fixture files

### Requirement: Stage 2 batch progress is logged as i/N

`stage2_generate_images.mjs` SHALL log batch progress for each slide using 1-based `i/N` (index and total) and the slide id when starting generation and when finishing with success or error.

#### Scenario: Stage 2 prints slide i of N

- **WHEN** Stage 2 generates a batch of three slides
- **THEN** output includes progress lines that identify each slide as part of `i/3` (or equivalent `i/N`)

### Requirement: Image generation trace records vendor attempts without secrets

When `generateOneImage` succeeds and writes a trace JSON (e.g. `*.apimart-task.json`), the trace SHALL include the winning `base_url` and an `attempts` array of prior failed tries as `{ base_url, error }` (empty array when the first vendor succeeded), **without** API key values. Total failure after all vendors fail SHALL NOT be required to write a trace file; the thrown attempts summary is sufficient.

#### Scenario: Successful failover trace names winning base_url and prior attempts

- **WHEN** the first vendor fails and the second succeeds and a trace path is provided
- **THEN** the trace file includes the winning `base_url`
- **AND** `attempts` includes the failed first vendor
- **AND** no API key appears in the trace file

#### Scenario: First-vendor success writes empty attempts

- **WHEN** the first vendor succeeds and a trace path is provided
- **THEN** the trace includes the winning `base_url`
- **AND** `attempts` is an empty array
