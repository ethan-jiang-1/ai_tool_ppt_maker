## Purpose

Define Stage 2 (image generation) as an **in-framework Node** capability: async
submit→poll→download via `image_api_client.mjs`, batch generation via
`stage2_generate_images.mjs`, and QA contact sheets via `make_contact_sheet.mjs`.
Credentials follow the Image2 contract (`IMAGE2_*`, with OPENAI_*/APIMART_* aliases).
No external agent skills. No Python. No bash.

## Requirements

### Requirement: Stage 2 is implemented inside the framework

Stage 2 SHALL be implemented by Node ESM modules under `PPTMAKER_FRAMEWORK/scripts/`. The unified pipeline SHALL call these modules directly, not discover external skills.

Image credentials SHALL follow the **Image2 contract**: canonical `IMAGE2_API_KEY` plus `IMAGE2_BASE_URL` and/or `IMAGE2_BASE_URLS`. Legacy `OPENAI_*` / `APIMART_*` SHALL remain accepted. Priority: `IMAGE2_*` then `OPENAI_*` then `APIMART_*`; CLI `--base-url` overrides env. These variables are for **image generation only**, not chat LLMs. Errors SHALL name IMAGE2 variables.

#### Scenario: Pipeline uses in-framework generator

- **WHEN** `unified_pipeline.mjs --stage 2` runs
- **THEN** Stage 2 uses `stage2_generate_images.mjs` with Image2-resolved credentials

#### Scenario: Missing base URL fails at resolve time

- **WHEN** Stage 2 runs with a key but no resolvable base URL
- **THEN** resolution fails naming `IMAGE2_BASE_URL`

### Requirement: Submit and poll accept data-array response envelopes

`image_api_client.mjs` SHALL extract submit `task_id` from object and array `data` envelopes, including `{ code, data: [ { task_id, status } ] }`, consistent with result's `data[0]` handling (closes BUG-008). Poll status SHALL read top-level or unwrapped `data` so array envelopes are not stuck as unknown. Unit tests SHALL cover array submit and object regression.

#### Scenario: Submit response with data array yields task_id

- **WHEN** submit returns `{"code":200,"data":[{"status":"submitted","task_id":"task_abc"}]}`
- **THEN** the client obtains `task_abc` without throwing `No task_id`

#### Scenario: Submit response with object data still works

- **WHEN** submit returns `{"task_id":"task_xyz"}` or `{"data":{"task_id":"task_xyz"}}`
- **THEN** the client still obtains the task id

### Requirement: Image2 smoke, persist secrets to .env, lessons to _lessons/

Framework entry docs (`BOOTSTRAP.md` and Image2 SSOT `workflow/00-setup/03-tool-selection.md`) SHALL require: on missing credentials or first image failure, the agent tries multiple combinations (IMAGE2_*, aliases, BASE_URLS, `--base-url`, user URLs) and a cheap smoke (`style-master … --force --resolution 1k`) before telling a novice to self-configure.

On success, the **run bundle** retains in two **explicitly named** places:

1. **Secrets** → walk-up `.env` (prefer deck-root): working `IMAGE2_API_KEY` / `IMAGE2_BASE_URL`
2. **Non-secret lesson** → `deck_*/_lessons/image2-proven.yaml` as **one concrete lesson file** under `_lessons/` (self-retained lessons / read-before-guess). That file SHALL obey `_lessons/README` writing rules (one lesson, no secrets). Fields: `proven_at`, `base_url`, `via` (`env`|`cli`|`alias`|`user-provided`), optional `notes`; **no API key field**

Entry docs SHALL describe `_lessons/` as the general retained-lessons surface and SHALL treat `image2-proven.yaml` as an Image2 example entry, not as the definition of `_lessons/`. Next session SHOULD read `_lessons/` (including `image2-proven.yaml` when present) before guessing endpoints. The agent SHALL NOT leave proven combos only in chat, SHALL NOT put keys in `_lessons/`, and SHALL NOT invent non-canonical folders for these lessons.

#### Scenario: Smoke succeeds then bundle retains the lesson

- **WHEN** a smoke combination succeeds after earlier failures
- **THEN** `.env` has canonical `IMAGE2_*` for the winning combo
- **AND** `_lessons/image2-proven.yaml` exists without an API key field

#### Scenario: Novice is not left with a single hard failure

- **WHEN** doctor reports missing Image2 URL or the first smoke fails
- **THEN** entry docs direct further combinations before "configure the API yourself" as the only next step

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

`image_api_client.mjs` SHALL emit a progress log at least every **30 seconds** while polling a task, including elapsed time and last known status. It SHALL continue to enforce the existing per-image wait budget (`MAX_WAIT_MS` or documented equivalent). On timeout it SHALL fail that image with an error that identifies the timeout (and task id when known), and SHALL stop polling that task.

#### Scenario: Long poll prints heartbeat

- **WHEN** a poll waits longer than 30 seconds before completion
- **THEN** output includes at least one progress line with elapsed time

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
