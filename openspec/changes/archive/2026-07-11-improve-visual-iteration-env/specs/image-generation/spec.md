## ADDED Requirements

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
