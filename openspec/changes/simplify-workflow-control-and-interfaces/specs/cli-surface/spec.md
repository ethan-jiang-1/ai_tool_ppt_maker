## ADDED Requirements

### Requirement: CLI routing does not duplicate workflow evaluation

`ppt_flow` SHALL parse arguments, dispatch to the selected direct owner, and emit the existing
CLI envelope. It SHALL obtain caller-facing workflow guidance from inspection and SHALL not add a
second mode/gate/recovery evaluator or result schema. Any retained compatibility alias SHALL be a
time-bounded pure forwarder with no duplicated logic.

#### Scenario: Compatibility alias is invoked
- **WHEN** a supported temporary alias is used
- **THEN** it forwards to the canonical owner invocation and preserves its envelope
- **AND** it does not calculate independent readiness or recovery guidance
