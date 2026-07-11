## MODIFIED Requirements

### Requirement: Stage 2 is implemented inside the framework

Stage 2 SHALL be implemented by Node ESM modules under `PPTMAKER_FRAMEWORK/scripts/`. The unified pipeline SHALL call these modules directly, not discover external skills.

Image credentials SHALL follow the **Image2 contract**: canonical `IMAGE2_API_KEY` plus `IMAGE2_BASE_URL` and/or `IMAGE2_BASE_URLS`. Legacy `OPENAI_*` / `APIMART_*` SHALL remain accepted. Priority: `IMAGE2_*` then `OPENAI_*` then `APIMART_*`; CLI `--base-url` overrides env. These variables are for **image generation only**, not chat LLMs. Errors SHALL name IMAGE2 variables.

#### Scenario: Pipeline uses in-framework generator

- **WHEN** `unified_pipeline.mjs --stage 2` runs
- **THEN** Stage 2 uses `stage2_generate_images.mjs` with Image2-resolved credentials

#### Scenario: Missing base URL fails at resolve time

- **WHEN** Stage 2 runs with a key but no resolvable base URL
- **THEN** resolution fails naming `IMAGE2_BASE_URL`

## ADDED Requirements

### Requirement: Submit and poll accept data-array response envelopes

`image_api_client.mjs` SHALL extract submit `task_id` from object and array `data` envelopes, including `{ code, data: [ { task_id, status } ] }`, consistent with result's `data[0]` handling (closes BUG-008). Poll status SHALL read top-level or unwrapped `data` so array envelopes are not stuck as unknown. Unit tests SHALL cover array submit and object regression.

#### Scenario: Submit response with data array yields task_id

- **WHEN** submit returns `{"code":200,"data":[{"status":"submitted","task_id":"task_abc"}]}`
- **THEN** the client obtains `task_abc` without throwing `No task_id`

#### Scenario: Submit response with object data still works

- **WHEN** submit returns `{"task_id":"task_xyz"}` or `{"data":{"task_id":"task_xyz"}}`
- **THEN** the client still obtains the task id

### Requirement: Image2 smoke, persist secrets to .env, lessons to _learning/

Framework entry docs (`BOOTSTRAP.md` and Image2 SSOT `workflow/00-setup/03-tool-selection.md`) SHALL require: on missing credentials or first image failure, the agent tries multiple combinations (IMAGE2_*, aliases, BASE_URLS, `--base-url`, user URLs) and a cheap smoke (`style-master … --force --resolution 1k`) before telling a novice to self-configure.

On success, the **run bundle** learns in two **explicitly named** places:

1. **Secrets** → walk-up `.env` (prefer deck-root): working `IMAGE2_API_KEY` / `IMAGE2_BASE_URL`
2. **Non-secret operational lesson** → `deck_*/_learning/image2-proven.yaml` under the `_learning/` surface whose purpose is **this deck's reusable non-secret operational lessons** (not `_state/`, not chat-only). Fields: `proven_at`, `base_url`, `via` (`env`|`cli`|`alias`|`user-provided`), optional `notes`; **no API key field**

Entry docs SHALL name `_learning/` by that purpose when instructing persist/read. Next session SHOULD read `_learning/image2-proven.yaml` before guessing endpoints. The agent SHALL NOT leave proven combos only in chat, SHALL NOT put keys in `_learning/`, and SHALL NOT invent non-canonical folders for these lessons.

#### Scenario: Smoke succeeds then bundle retains the lesson

- **WHEN** a smoke combination succeeds after earlier failures
- **THEN** `.env` has canonical `IMAGE2_*` for the winning combo
- **AND** `_learning/image2-proven.yaml` exists without an API key field

#### Scenario: Novice is not left with a single hard failure

- **WHEN** doctor reports missing Image2 URL or the first smoke fails
- **THEN** entry docs direct further combinations before "configure the API yourself" as the only next step

#### Scenario: Persist docs name _learning purpose

- **WHEN** an agent follows BOOTSTRAP / `03-tool-selection` after a successful smoke
- **THEN** those docs tell them to write the non-secret receipt under `_learning/` as operational lessons (not under `_state/` or as chat-only)
