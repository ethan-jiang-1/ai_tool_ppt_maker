## MODIFIED Requirements

### Requirement: Doctor derives readiness guidance from production mode
Root doctor SHALL pass the selected explicit mode, or the exact authoritative mode resolved from a run,
into the owning profile evaluator and SHALL NOT reimplement package/check classification. For
`image2-page-authority`, a run-bound operation selects only the required `framed-runtime` and/or
`image2-raw` profile; an unbound mode check reports those independent offline profiles without an
aggregate source-ready claim. Missing deferred readiness is a `guide` until the protected action; a
selected provider submit with missing credentials/endpoint/generator is a non-waivable authorization
hard-stop. Live `--smoke` or `--probe-vendors` still requires disclosed selection and shall not
authorize production generation.

#### Scenario: HTML-only doctor omits Image2 requirements
- **WHEN** run-aware doctor targets `html-only`
- **THEN** it runs common/HTML readiness and missing Image2 configuration does not block the run

#### Scenario: Image2-primary doctor checks provider presence
- **WHEN** doctor targets `image2-only` without a live flag
- **THEN** it includes offline Image2 presence checks, omits HTML-only checks, and reports bounded repair
- **AND** it makes no network request

#### Scenario: Page Authority local refresh is provider-free
- **WHEN** a valid Page Authority run selects `framed-local-refresh`
- **THEN** doctor checks `framed-runtime` without requiring or probing Image2 credentials
- **AND** it does not claim raw-generation readiness

#### Scenario: Required refinement is not silently probed
- **WHEN** doctor targets `html-then-image2` without live flags
- **THEN** it reports blocking HTML readiness plus deferred Image2 presence guidance
- **AND** it does not perform a smoke or vendor request

### Requirement: Environment check separates production readiness profiles
`env-check.mjs` SHALL resolve the profile set required by exactly one selected mode and operation.
`html-only` selects common plus HTML checks; `image2-only` and the documented `--image2` alias select
common plus offline whole-page Image2 presence; `html-then-image2` selects common plus blocking HTML
checks and deferred Image2 presence. `image2-page-authority` reports `framed-runtime` and `image2-raw`
independently when unbound; a run-bound `full-build`, `raw-generation`, `framed-local-refresh`, or
`assembly-notes` operation selects its closed required profile set. `--smoke` and `--probe-vendors`
remain mutually exclusive, imply Image2 readiness only after explicit selection, and retain live-probe
behavior only after presence checks pass.

Common checks SHALL include Node/npm, common packages, framework files required by shared
production/assembly, generic font fallback observation, disk space, and advisory Git. `framed-runtime`
adds the local browser/font/capture checks; `image2-raw` adds `api_key`, `image_base_url`, and the Page
Authority raw generator. The report SHALL name each selected profile, `current_action_ready`, and any
`deferred_not_ready` check. Deferred checks do not alter a current local operation exit status, but the
same check is blocking when its provider action is selected.

#### Scenario: New user has no Image2 configuration
- **WHEN** a `framed-local-refresh` profile passes and no Image2 configuration exists
- **THEN** env-check ends ready for that local action and exits 0
- **AND** it lists raw generation as not assessed rather than ready

#### Scenario: Explicit Page Authority raw generation checks Image2
- **WHEN** env-check selects Page Authority `raw-generation`
- **THEN** it runs common plus `api_key`, `image_base_url`, and raw-generator checks
- **AND** it makes no Image2 network call without a live flag

#### Scenario: Invalid Page Authority source has no profile fallback
- **WHEN** a run-bound doctor cannot establish the exact Page Authority source/state pair
- **THEN** it returns the resolver recovery diagnostic before environment checks
- **AND** it does not substitute metadata, a legacy mode, or a generic profile

#### Scenario: Required ECharts is missing
- **WHEN** exact local ECharts cannot be discovered for an explicitly selected legacy HTML profile
- **THEN** HTML readiness ends NOT READY with a dependency repair
- **AND** no browser or renderer work is attempted with an unknown chart runtime

#### Scenario: Explicit Image2 presence mode
- **WHEN** env-check runs with `--mode image2-only` or the documented `--image2` diagnostic alias for a legacy workflow
- **THEN** it runs common checks plus `api_key`, `image_base_url`, and the legacy whole-page generator
- **AND** it omits HTML-only checks and makes no Image2 network call

#### Scenario: HTML-then-Image2 has deferred provider setup
- **WHEN** common/HTML checks pass and Image2 presence fails under an existing `html-then-image2` run
- **THEN** current HTML readiness exits successfully and lists the Image2 failures as deferred guidance
- **AND** a later explicit legacy Image2 action rechecks them as blocking prerequisites
