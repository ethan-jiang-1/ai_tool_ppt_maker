## MODIFIED Requirements

### Requirement: API key verification

The env check SHALL verify that an image-generation API key is set and non-empty. The **canonical** name SHALL be `IMAGE2_API_KEY`. Legacy aliases `IMAGE2_API_KEY` and `IMAGE2_API_KEY` SHALL also satisfy the check. Fix text SHALL name `IMAGE2_API_KEY`.

#### Scenario: Canonical IMAGE2 key

- **WHEN** `.env` contains non-empty `IMAGE2_API_KEY`
- **THEN** `api_key` passes and detail identifies `IMAGE2_API_KEY`

#### Scenario: Legacy alias key still works

- **WHEN** only `IMAGE2_API_KEY` or only `IMAGE2_API_KEY` is non-empty
- **THEN** `api_key` still passes

#### Scenario: Missing key

- **WHEN** none of the three key variables is non-empty
- **THEN** `api_key` fails and fix names `IMAGE2_API_KEY`

## ADDED Requirements

### Requirement: Image API base URL is a hard requirement

The env check SHALL require a non-empty base URL via `IMAGE2_BASE_URL` or `IMAGE2_BASE_URL`, or legacy `IMAGE2_BASE_URL` / `IMAGE2_BASE_URL` / `IMAGE2_BASE_URL`. When none is set, `image_base_url` SHALL be **`fail`** and overall NOT READY. The check SHALL NOT claim a silent default endpoint when URL is unset. Fix text SHALL name `IMAGE2_BASE_URL`.

#### Scenario: Canonical IMAGE2 base URL

- **WHEN** `.env` contains `IMAGE2_BASE_URL=https://example/v1`
- **THEN** `image_base_url` passes

#### Scenario: BASE_URLS alone satisfies the check

- **WHEN** `.env` has non-empty `IMAGE2_BASE_URL` and no `IMAGE2_BASE_URL`
- **THEN** `image_base_url` passes

#### Scenario: Missing base URL fails doctor

- **WHEN** a key is present but no base URL variable is set
- **THEN** `image_base_url` is `fail` and env-check is NOT READY
