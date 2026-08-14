## MODIFIED Requirements

### Requirement: Image API base URL is a hard requirement

In Image2 mode, the env check SHALL require a resolvable single image API
endpoint configuration via a non-empty `IMAGE2_BASE_URL` that passes the same
one-endpoint normalization used by current Page Image production operations. A
value containing a comma SHALL be malformed configuration, rather than a list
of endpoints.

When none is set or the value is malformed, `image_base_url` SHALL be **`fail`**
and the Image2-mode verdict SHALL be NOT READY. The check SHALL NOT claim a
silent default endpoint when URL is unset, split a configured value, or treat
that value as a failover list. Fix text SHALL name `IMAGE2_BASE_URL`. Base mode
SHALL omit this check. A failed `image_base_url` check SHALL prevent `--smoke`
or `--probe-vendors` from starting provider network work.

#### Scenario: Canonical IMAGE2 base URL

- **WHEN** `.env` contains `IMAGE2_BASE_URL=https://example/v1`
- **AND** Image2 mode is selected
- **THEN** `image_base_url` passes

#### Scenario: Comma-separated base URL fails before a live probe

- **WHEN** `IMAGE2_BASE_URL` contains a comma-separated value
- **AND** Image2 mode with `--smoke` or `--probe-vendors` is selected
- **THEN** `image_base_url` is `fail` and env-check is NOT READY before a
  provider POST
- **AND** it does not submit to any portion of the configured value or present
  the value as a failover list

#### Scenario: Missing base URL fails doctor

- **WHEN** a shared key is present but no base URL variable is set
- **AND** Image2 mode is selected
- **THEN** `image_base_url` is `fail` and env-check is NOT READY

#### Scenario: Missing base URL does not affect base mode

- **WHEN** no base URL is set and env-check runs in base mode
- **THEN** no `image_base_url` check is emitted
