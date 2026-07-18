## ADDED Requirements

### Requirement: doctor forwards explicit Image2 readiness mode

`ppt_flow.mjs doctor` SHALL accept `--image2` and forward it to `env-check.mjs`. Help SHALL describe it as base checks plus offline Image2 presence checks, not a live provider probe. The change SHALL add no top-level command and SHALL keep doctor text-only; `ppt_flow doctor --json` remains unsupported. A delegated non-zero result SHALL continue to use the existing parent-envelope contract without exposing credential values.

#### Scenario: doctor --image2 is accepted

- **WHEN** Agent runs `ppt_flow.mjs doctor --image2`
- **THEN** the flag is passed through to env-check
- **AND** help explains that it checks Image2 presence without a network probe

#### Scenario: Image2 readiness failure is delegated safely

- **WHEN** delegated `env-check --image2` exits non-zero because credentials are missing
- **THEN** `ppt_flow doctor` preserves the existing delegated failure/envelope behavior
- **AND** stderr contains no API key value or provider body

## MODIFIED Requirements

### Requirement: doctor forwards optional --smoke

`ppt_flow.mjs doctor` SHALL accept `--smoke` and forward it to `env-check.mjs`. `--smoke` SHALL imply Image2 readiness, so the old invocation remains valid without also specifying `--image2`. Without `--smoke` and without `--probe-vendors`, doctor SHALL make no Image2 network call; default doctor SHALL run base readiness only unless `--image2` is present. `--image2 --smoke` MAY be accepted as a redundant explicit combination.

#### Scenario: doctor --smoke flag is accepted

- **WHEN** Agent runs `ppt_flow.mjs doctor --smoke`
- **THEN** the flag is passed through to env-check
- **AND** help text documents that it includes Image2 presence plus one live first-vendor probe

#### Scenario: default doctor is local only

- **WHEN** Agent runs `ppt_flow.mjs doctor` without Image2/live flags
- **THEN** the command delegates only base readiness
- **AND** it does not require credentials or make an Image2 network call

### Requirement: doctor forwards optional --probe-vendors

`ppt_flow.mjs doctor` SHALL accept `--probe-vendors` and forward it to `env-check.mjs`. `--probe-vendors` SHALL imply Image2 readiness, so the old invocation remains valid without also specifying `--image2`. Help text SHALL document that it probes every resolved Image2 vendor and prints a channel report, distinct from `--smoke`, which probes only the first. The top-level command inventory SHALL remain unchanged. Passing both `--smoke` and `--probe-vendors` SHALL be rejected as USAGE; `--image2` MAY accompany either live flag.

#### Scenario: doctor --probe-vendors flag is accepted

- **WHEN** Agent runs `ppt_flow.mjs doctor --probe-vendors`
- **THEN** the flag is passed through to env-check
- **AND** help text documents the implied Image2 presence checks and all-vendor live report

#### Scenario: live flags remain mutually exclusive

- **WHEN** Agent passes both `--smoke` and `--probe-vendors`
- **THEN** doctor exits non-zero with the existing usage/envelope authority
- **AND** no live provider request is started

#### Scenario: explicit Image2 plus one live flag is allowed

- **WHEN** Agent passes `--image2 --probe-vendors`
- **THEN** the redundant Image2 flag does not cause a usage failure or duplicate presence checks
