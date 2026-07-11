## MODIFIED Requirements

### Requirement: doctor forwards optional --smoke

`ppt_flow.mjs doctor` SHALL accept `--smoke` and forward it to `env-check.mjs`. Without `--smoke` and without `--probe-vendors`, doctor remains presence-only (no Image2 network).

#### Scenario: doctor --smoke flag is accepted

- **WHEN** Agent runs `ppt_flow.mjs doctor --smoke`
- **THEN** the flag is passed through to env-check
- **AND** help text documents `--smoke`

## ADDED Requirements

### Requirement: doctor forwards optional --probe-vendors

`ppt_flow.mjs doctor` SHALL accept `--probe-vendors` and forward it to `env-check.mjs`. Help text SHALL document that `--probe-vendors` probes every resolved Image2 vendor and prints a channel report (distinct from `--smoke`, which probes only the first). The CLI command count remains **12** (no new top-level subcommand). Passing both `--smoke` and `--probe-vendors` SHALL be rejected (forwarded mutual exclusion or local USAGE).

#### Scenario: doctor --probe-vendors flag is accepted

- **WHEN** Agent runs `ppt_flow.mjs doctor --probe-vendors`
- **THEN** the flag is passed through to env-check
- **AND** help text documents `--probe-vendors`
