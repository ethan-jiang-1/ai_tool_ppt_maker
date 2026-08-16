# Environment Check Specification (delta)

## ADDED Requirements

### Requirement: Live probe binds an exact run with a pre-POST profile fence

`probe <run-dir> [--smoke|--vendors]` SHALL first resolve the exact run's
confirmed provider profile and require `IMAGE2_PROVIDER_PROFILE_ID` to match it;
any missing, invalid, or mismatched profile SHALL stop the probe before any POST.
Its success SHALL report connectivity only, not readiness, capability fit, or
production authorization. `--smoke` SHALL submit once to the first vendor;
`--probe-vendors` SHALL submit once per resolved vendor; the two modes SHALL be
mutually exclusive, redirects SHALL not be retried, and output SHALL remain
secret-safe.

#### Scenario: A wrong, missing, or pending profile fails before any POST

- **WHEN** `probe` cannot resolve or match the exact run's confirmed provider
  profile
- **THEN** it stops before any POST
- **AND** it does not infer a fallback profile, alias, or migrate the run

#### Scenario: Probe success is connectivity only

- **WHEN** `probe` completes its bounded submits successfully
- **THEN** it reports connectivity only
- **AND** it does not grant readiness, capability, or production authorization

## MODIFIED Requirements

### Requirement: Live Image2 smoke states its connectivity-only evidence boundary

`env-check --smoke` SHALL describe a successful live Image2 submission as connectivity evidence for the selected
endpoint and credential pair only. A successful smoke result SHALL NOT claim that a production Style Master or
Page Image Workflow prompt is within a provider limit, that the provider will honor a requested image size, that a
sync or async result will decode as valid media, or that a current run is authorized to generate. The smoke
request remains the existing single minimal live probe and SHALL not be expanded into a production-like prompt,
image decode, or task-completion workflow.

The provider-free Style Master `plan` operation remains the authoritative deterministic preflight for its
compiled prompt bound. Human and JSON-compatible smoke output SHALL preserve the existing report schema while
making this evidence boundary clear without exposing prompt, credential, or provider response content.

#### Scenario: Smoke success is not presented as Style Master production readiness

- **WHEN** `probe --smoke` receives an accepted sync image reference or task identifier
- **THEN** it reports successful endpoint connectivity with a statement that production prompt and media
  compatibility are not verified by the probe
- **AND** it does not claim that Style Master generation can proceed or that a provider response meets a native media contract

#### Scenario: Smoke remains a single minimal submission

- **WHEN** `probe --smoke` runs against a configured Image2 endpoint
- **THEN** it performs only the existing one minimal POST and does not fetch image bytes, poll an async task, or
  submit a compiled Style Master prompt
- **AND** it creates no grant, attempt, authorization, receipt, workflow state, or run-bundle artifact

#### Scenario: Plan owns Style Master prompt preflight

- **WHEN** a Style Master provider brief cannot meet its deterministic Harness-owned bound
- **THEN** `style-master plan` fails before authorization regardless of a prior successful smoke result
- **AND** the smoke report is not interpreted as competing readiness authority
