## ADDED Requirements

### Requirement: Environment checks are owned by the Harness root

The normal installed environment diagnostic SHALL be invoked through
`node ppt_maker_harness/scripts/ppt_flow.mjs doctor`; the pre-install recovery
entry SHALL be `ppt_maker_harness/scripts/00-setup/env-check.mjs`. Both paths
remain bounded readiness checks and SHALL not use the retired Framework root as
an alias or infer a Deck, Run Bundle, provider authorization, or controller
continuation.

#### Scenario: An Agent performs normal Harness readiness

- **WHEN** an installed Agent requests the normal environment diagnostic
- **THEN** it invokes the Harness `ppt_flow doctor` entrypoint
- **AND** it receives existing bounded readiness evidence rather than a
  Framework-root fallback
