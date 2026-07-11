## MODIFIED Requirements

### Requirement: API key verification

The env check SHALL verify that image-generation credentials can resolve at least one usable API key, consistent with `resolveVendors` / Image2 contract:

- **Shared key path:** non-empty `IMAGE2_API_KEY`, or legacy aliases `OPENAI_API_KEY` / `APIMART_API_KEY`.
- **Vendor-list path:** when `IMAGE2_VENDORS` is non-empty, every listed item MUST resolve a key (`process.env[KEY_ENV]` or shared-key fallback for items without `|KEY_ENV`). If any item cannot resolve a key, `api_key` SHALL fail and fix text SHALL name the missing variable(s).

When neither a shared key nor a fully resolvable `IMAGE2_VENDORS` key set is available, `api_key` SHALL fail. Fix text SHALL name `IMAGE2_API_KEY` and MAY also name `IMAGE2_VENDORS` / the missing `KEY_ENV`.

#### Scenario: Canonical IMAGE2 key

- **WHEN** `.env` contains non-empty `IMAGE2_API_KEY`
- **THEN** `api_key` passes and detail identifies `IMAGE2_API_KEY`

#### Scenario: Legacy alias key still works

- **WHEN** only `OPENAI_API_KEY` or only `APIMART_API_KEY` is non-empty
- **AND** `IMAGE2_VENDORS` is unset
- **THEN** `api_key` still passes

#### Scenario: IMAGE2_VENDORS keys satisfy api_key without shared IMAGE2_API_KEY

- **WHEN** `IMAGE2_VENDORS` lists `url|KEY_ENV` items whose KEY_ENV values are all set
- **AND** `IMAGE2_API_KEY` / OPENAI / APIMART shared keys are unset
- **THEN** `api_key` passes

#### Scenario: IMAGE2_VENDORS with missing KEY_ENV fails api_key

- **WHEN** `IMAGE2_VENDORS` lists `https://example/v1|MISSING_KEY_VAR` and `MISSING_KEY_VAR` is unset
- **AND** no shared Image2 key fallback applies for that item
- **THEN** `api_key` fails naming `MISSING_KEY_VAR` (or equivalent actionable fix)

#### Scenario: Missing key

- **WHEN** no shared Image2 key is set and `IMAGE2_VENDORS` is unset/empty
- **THEN** `api_key` fails and fix names `IMAGE2_API_KEY`

### Requirement: Image API base URL is a hard requirement

The env check SHALL require a resolvable image API endpoint configuration via **either**:

- non-empty `IMAGE2_VENDORS` (ordered `base_url|KEY_ENV` list), **or**
- non-empty `IMAGE2_BASE_URL` or `IMAGE2_BASE_URLS`, or legacy `OPENAI_BASE_URL` / `APIMART_BASE_URL` / `APIMART_BASE_URLS`.

When none is set, `image_base_url` SHALL be **`fail`** and overall NOT READY. The check SHALL NOT claim a silent default endpoint when URL is unset. Fix text SHALL name `IMAGE2_BASE_URL` and MAY also name `IMAGE2_VENDORS`.

#### Scenario: Canonical IMAGE2 base URL

- **WHEN** `.env` contains `IMAGE2_BASE_URL=https://example/v1`
- **THEN** `image_base_url` passes

#### Scenario: BASE_URLS alone satisfies the check

- **WHEN** `.env` has non-empty `IMAGE2_BASE_URLS` and no `IMAGE2_BASE_URL`
- **THEN** `image_base_url` passes

#### Scenario: IMAGE2_VENDORS alone satisfies the check

- **WHEN** `.env` has non-empty `IMAGE2_VENDORS` with at least one parseable `base_url` item
- **AND** no `IMAGE2_BASE_URL` / `IMAGE2_BASE_URLS`
- **THEN** `image_base_url` passes

#### Scenario: Missing base URL fails doctor

- **WHEN** a shared key is present but no base URL variable and no `IMAGE2_VENDORS` is set
- **THEN** `image_base_url` is `fail` and env-check is NOT READY

### Requirement: Optional --smoke performs one live credential probe

`env-check.mjs` SHALL accept `--smoke`. When set (and `--probe-vendors` is not set), after presence checks pass, it SHALL perform one minimal live Image2 probe against the **first** vendor from `resolveVendors`. Success SHALL be an extractable image ref **or** a task id, using the same exported extract helpers as the client (no forked parser). Full async image completion is NOT required. Without `--smoke` and without `--probe-vendors`, env-check SHALL NOT make Image2 network calls. Zero npm dependencies (dynamic-import sibling ESM allowed).

#### Scenario: --smoke fails on bad credentials

- **WHEN** credentials resolve but the API rejects the probe
- **AND** `env-check --smoke` runs
- **THEN** overall status is NOT READY
- **AND** the report indicates the smoke/probe failed

#### Scenario: --smoke succeeds on task_id without waiting for image

- **WHEN** the API accepts submit and returns a task id
- **AND** `env-check --smoke` runs
- **THEN** the smoke check passes without waiting for image completion

#### Scenario: --smoke succeeds on sync image without task_id

- **WHEN** the API accepts submit and returns an extractable image ref with no task id
- **AND** `env-check --smoke` runs
- **THEN** the smoke check passes

#### Scenario: Default doctor stays offline

- **WHEN** `env-check` runs without `--smoke` and without `--probe-vendors`
- **THEN** it does not perform an Image2 network probe

## ADDED Requirements

### Requirement: Optional --probe-vendors reports every Image2 channel

`env-check.mjs` SHALL accept `--probe-vendors`. When set, after presence checks pass, it SHALL live-probe **each** vendor from `resolveVendors` in order (same success rule as `--smoke`: image ref or task id; no forked parser). It SHALL log `probing i/N` progress and per-vendor submit heartbeats consistent with the image client's wait contract. For each vendor it SHALL print `base_url`, `ok|fail`, `mode` (`sync`|`async`|`unknown`), `elapsed_s`, and a short `error` on failure — never API key values. After all probes it SHALL print a Summary (OK vs FAIL) and a suggested `IMAGE2_VENDORS=` line (working vendors first sorted by ascending elapsed time; failed vendors appended in original relative order). Exit 0 if at least one vendor is OK; otherwise non-zero with an actionable failure path. It SHALL NOT write `.env` or `_lessons/`. If both `--smoke` and `--probe-vendors` are passed, the tool SHALL fail with a clear usage error (mutually exclusive).

#### Scenario: --probe-vendors lists per-vendor outcomes

- **WHEN** three vendors are configured and `--probe-vendors` runs
- **THEN** output includes a result line for each vendor
- **AND** a suggested `IMAGE2_VENDORS` ordering appears
- **AND** no API key values appear in the output

#### Scenario: --probe-vendors exits non-zero when all fail

- **WHEN** every vendor probe fails
- **AND** `--probe-vendors` runs
- **THEN** the process exits non-zero

#### Scenario: --smoke and --probe-vendors together are rejected

- **WHEN** both `--smoke` and `--probe-vendors` are passed
- **THEN** the process exits non-zero with a usage/mutual-exclusion error
