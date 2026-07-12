## MODIFIED Requirements

### Requirement: Stage 2 is implemented inside the framework

Stage 2 SHALL be implemented by Node ESM modules under `PPTMAKER_FRAMEWORK/scripts/`. The unified pipeline SHALL call these modules directly, not discover external skills.

Image credentials SHALL be resolved by a single SSOT helper (`resolveVendors` or equivalent) into an ordered list of `{ base_url, api_key }` vendors. Canonical configuration forms:

1. **Vendor list (preferred for multi-key):** non-empty `IMAGE2_VENDORS` — comma-separated ordered items `base_url|KEY_ENV_VAR`. The list SHALL NOT embed secret values; each item resolves `api_key` from `process.env[KEY_ENV_VAR]`. An item without `|KEY_ENV_VAR` SHALL fall back to the shared Image2 key (`IMAGE2_API_KEY`, then OPENAI_*/APIMART_* aliases). If any listed item cannot resolve a key, resolution SHALL skip that vendor with a warning and continue; if **all** vendors are skipped, resolution SHALL fail naming every missing variable.
2. **Legacy single-key + URL(s):** when `IMAGE2_VENDORS` is empty/unset — `IMAGE2_API_KEY` (or aliases) plus `IMAGE2_BASE_URL` and/or `IMAGE2_BASE_URLS` (OPENAI_*/APIMART_* aliases). The client SHALL synthesize an ordered vendor list sharing that one key.

**Priority:** CLI `--base-url` (highest) SHALL replace the URL list. `--base-url` SHALL accept comma-separated URLs. Each URL SHALL become a vendor sharing the same Image2 key. If no shared key is set, resolution SHALL fail naming `IMAGE2_API_KEY`. Else if `IMAGE2_VENDORS` is non-empty it SHALL be the sole env vendor source.

`generateOneImage` SHALL try vendors **in list order**. On each failure it SHALL log a structured warning with `vendor`, `error`, and `retry` fields for MD Controller consumption. When all vendors fail it SHALL throw an error whose message includes an attempts summary. Sync vs async SHALL remain one thin post-submit branch.

#### Scenario: IMAGE2_VENDORS missing KEY_ENV skips vendor gracefully

- **WHEN** `IMAGE2_VENDORS` lists three vendors where one's `KEY_ENV_VAR` is unset and two are set
- **THEN** resolution skips the unset vendor with a structured warning
- **AND** returns the two vendors with valid keys in list order

#### Scenario: All IMAGE2_VENDORS keys missing fails resolution

- **WHEN** `IMAGE2_VENDORS` lists vendors where every `KEY_ENV_VAR` is unset
- **AND** no shared Image2 key applies as fallback
- **THEN** resolution fails naming every missing variable

#### Scenario: CLI --base-url accepts comma-separated list

- **WHEN** `--base-url https://a.com/v1,https://b.com/v1` is passed and a shared key is set
- **THEN** `resolveVendors` returns two vendors in order, both sharing the same key
- **AND** `generateOneImage` tries `a.com` first, falls back to `b.com` on failure

#### Scenario: Single --base-url behavior unchanged

- **WHEN** `--base-url https://a.com/v1` is passed (single URL, no comma)
- **THEN** resolution returns one vendor (backward-compatible)

## ADDED Requirements

### Requirement: Mirror download retries on transient failure

`generateOneImage` SHALL retry each vendor's submit→poll→download sequence up to **two additional times** (three total attempts) when the failure is a retryable transient error. Retryable errors SHALL include: HTTP 5xx, `ECONNRESET`, `ETIMEDOUT`, `ECONNREFUSED`, and `fetch` network errors. Non-retryable errors SHALL include: HTTP 4xx. Retries SHALL use exponential backoff: 1s before first retry, 2s before second retry. Same-vendor retries SHALL NOT create separate entries in the `attempts[]` array——only the final outcome (success or failure after all retries) is recorded per vendor. Each retry SHALL be logged so MD Controller can track progress.

#### Scenario: Transient 502 is retried then succeeds

- **WHEN** a vendor returns HTTP 502 on first attempt
- **THEN** the client waits 1 second and retries the same vendor
- **AND** if the retry succeeds, the image is saved normally

#### Scenario: Persistent 502 exhausts retries then fails over

- **WHEN** a vendor returns HTTP 502 on all three attempts
- **THEN** the client logs each retry failure
- **AND** falls back to the next vendor in the list

#### Scenario: 401 is not retried

- **WHEN** a vendor returns HTTP 401
- **THEN** the client does NOT retry that vendor
- **AND** immediately falls back to the next vendor

