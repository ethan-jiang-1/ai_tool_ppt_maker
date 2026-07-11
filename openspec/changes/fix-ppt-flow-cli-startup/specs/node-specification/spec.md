## ADDED Requirements

### Requirement: CLI failures return structured JSON to MD Controllers

When a CLI step hard-fails, the script SHALL provide a JSON failure envelope (`ok`, `code`, `message`, `hint`, `where`) in addition to a non-zero exit code, so an MD Controller or agent can identify the error and attempt repair without scraping prose. This aligns with `charter/CONSTITUTION.md` (CLI 失败回执宪法) and `charter/NODE-SPEC.md` (CLI ⇔ MD 协议).

#### Scenario: Gate check blocks Stage 2

- **WHEN** `ppt_flow.mjs state <runDir> --check-gates` finds a pending gate
- **THEN** exit is non-zero
- **AND** output includes JSON with `ok: false` and a stable `code` indicating gate blockage
- **AND** `hint` names which gate(s) are not approved

#### Scenario: MD Controller reads failure

- **WHEN** any `ppt_flow` hard failure occurs during a playbook CLI step
- **THEN** the controller can parse `code` + `hint` and decide the next repair action
- **AND** it does not depend solely on matching `Fatal error:` text
