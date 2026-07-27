## MODIFIED Requirements

### Requirement: Environment check separates production readiness profiles
Environment checks for `image2-only` SHALL remain explicit diagnostic profile selection only; they SHALL
not select an ordinary production route for an exact recognized legacy run, initialize a provider, or
serve as provider authorization. A recognized legacy run must first use the provider-free adoption route;
after its clean Page Authority target is published, any later raw-generation operation resolves the
target's Page Authority profile and requires its own current authorization.

#### Scenario: Explicit Image2 presence profile is diagnostic only
- **WHEN** env-check runs with `--mode image2-only` or the documented `--image2` diagnostic alias
- **THEN** it may report common checks plus Image2 presence requirements for the whole-page generator
- **AND** it does not authorize, resume, or dispatch a historical run to provider work

#### Scenario: Historical HTML provider work is deferred to the target
- **WHEN** an exact recognized `html-then-image2` source has deferred Image2 presence failures
- **THEN** the Controller directs it to provider-free adoption rather than an old provider action
- **AND** any later Page Authority raw action rechecks the target's provider prerequisites
