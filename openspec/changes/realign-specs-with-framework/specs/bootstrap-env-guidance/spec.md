## MODIFIED Requirements

### Requirement: Image2 first-time credential setup is self-contained in BOOTSTRAP
BOOTSTRAP Step 1 SHALL provide self-contained Image2 presence setup when the selected/default mode is `image2-only` or when `html-then-image2` approaches required refinement. An `html-only` refinement request first changes mode and then uses the required-refinement path. BOOTSTRAP SHALL give the `.env` location, `doctor --mode image2-only` (with `doctor --image2` retained only as the documented diagnostic alias), `IMAGE2_API_KEY`/`IMAGE2_BASE_URL` repair, and the distinction between offline presence, disclosed live diagnostics, and exact production authorization. Init or mode selection SHALL not count as a provider authorization.

For `html-only`, BOOTSTRAP SHALL proceed after common/HTML readiness without soliciting credentials; an explicit later refinement request first receives the mode switch to `html-then-image2`, then the existing exact-plan authorization explanation. For `image2-only`, guidance SHALL describe whole-page Image2 as the primary renderer reached through normal pilot/build, not visual-slot refinement or a maintenance route.

#### Scenario: Fresh user starts an Image2-primary deck
- **WHEN** common readiness passes and the user accepts `image2-only`
- **THEN** BOOTSTRAP provides offline credential presence setup before provider-backed pilot/build
- **AND** does not perform a live request or record production authorization

#### Scenario: Fresh user starts an HTML deck
- **WHEN** common/HTML readiness passes and the user selects `html-only`
- **THEN** BOOTSTRAP proceeds without asking for Image2 credentials or live probes

#### Scenario: User elects optional refinement
- **WHEN** an `html-only` user explicitly requests refinement
- **THEN** BOOTSTRAP explains the required same-pipeline mode switch, deferred Image2 readiness, and exact authorization before submission

#### Scenario: User reaches required refinement
- **WHEN** `html-then-image2` reaches its provider-dependent refinement step
- **THEN** BOOTSTRAP/controller explains offline readiness and exact authorization before submission

### Requirement: BOOTSTRAP stays in sync with environment readiness profiles
When `env-check.mjs` adds, moves, or changes a stable check name/profile, BOOTSTRAP Step 1 SHALL update the matching labeled repair in the same change. Exact ECharts SHALL remain an HTML check and repair alongside Playwright/Chromium/fonts, not an Image2-only blocker. Checks emitted only by Image2 profiles, `--smoke`, or `--probe-vendors` SHALL remain under Image2 readiness and SHALL be described as applicable to `image2-only` or required refinement after the explicit mode switch. `env-check` remains the check-name/ownership authority; prose SHALL match its owning readiness group.

#### Scenario: Base ECharts check is added
- **WHEN** the stable default/HTML report includes exact ECharts readiness
- **THEN** BOOTSTRAP's HTML section includes the same named check and executable remediation

#### Scenario: Image2-only check appears
- **WHEN** a check is emitted only in Image2 mode
- **THEN** it is absent from the base prerequisite list and documented under Image2 readiness
- **AND** its blocking scope is tied to the selected Image2-dependent action
