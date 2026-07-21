## ADDED Requirements

### Requirement: Doctor derives readiness guidance from production mode

Run-aware `ppt_flow doctor` SHALL inspect the canonical production policy before selecting readiness
guidance. `html-only` SHALL require base/local HTML checks only; `html-then-image2` SHALL require base
HTML readiness and report Image2 readiness as the prerequisite for its later required refinement;
`image2-only` SHALL require Image2 presence readiness for provider-backed production and SHALL report
local HTML readiness only for shared local post-processing that actually applies. Direct
`env-check.mjs` SHALL retain its explicit base, `--image2`, `--smoke`, and `--probe-vendors` contracts;
mode resolution belongs to the root adapter and SHALL not silently trigger a live probe.

Readiness absence is a `guide` until the user enters its protected action. At a selected provider submit
boundary, missing credentials/endpoint/generator is a non-waivable authorization/security hard stop.
Live `--smoke` or `--probe-vendors` SHALL still require its existing disclosed confirmation and SHALL
not authorize production generation.

#### Scenario: HTML-only doctor omits Image2 requirements

- **WHEN** run-aware doctor targets `html-only`
- **THEN** it runs base/local HTML readiness and missing Image2 configuration does not block the run

#### Scenario: Image2-primary doctor checks provider presence

- **WHEN** run-aware doctor targets `image2-only`
- **THEN** it includes offline Image2 presence checks and reports the bounded repair for missing configuration
- **AND** it makes no network request

#### Scenario: Required refinement is not silently probed

- **WHEN** doctor targets `html-then-image2` without live flags
- **THEN** it reports base readiness plus offline Image2 readiness for the later refinement boundary
- **AND** it does not perform a smoke or vendor request
