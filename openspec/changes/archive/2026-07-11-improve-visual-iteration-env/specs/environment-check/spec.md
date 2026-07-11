## ADDED Requirements

### Requirement: Optional --smoke performs one live credential probe

`env-check.mjs` SHALL accept `--smoke`. When set, after presence checks for API key and base URL pass, it SHALL perform one minimal live Image2 probe: POST image generation with a tiny prompt and treat **obtaining a `task_id`** as success (full image completion NOT required). Probe failure SHALL mark the check NOT READY with actionable fix text. Without `--smoke`, env-check SHALL NOT make Image2 network calls. The script SHALL remain free of npm dependencies (Node built-ins only; may dynamic-import sibling ESM helpers).

#### Scenario: --smoke fails on bad credentials

- **WHEN** key and base URL are non-empty but the API rejects the probe
- **AND** `env-check --smoke` runs
- **THEN** overall status is NOT READY
- **AND** the report indicates the smoke/probe failed

#### Scenario: --smoke succeeds on task_id without waiting for image

- **WHEN** the API accepts submit and returns a task id
- **AND** `env-check --smoke` runs
- **THEN** the smoke check passes without waiting for image completion

#### Scenario: Default doctor stays offline

- **WHEN** `env-check` runs without `--smoke`
- **THEN** it does not perform an Image2 network probe
