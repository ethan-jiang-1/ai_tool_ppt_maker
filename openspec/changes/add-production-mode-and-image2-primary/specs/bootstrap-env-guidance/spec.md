## ADDED Requirements

### Requirement: BOOTSTRAP presents production mode before mode-specific readiness

After foundation repair, BOOTSTRAP SHALL explain the three production modes, identify
`image2-only` as the new-deck default, and let the Agent carry an explicit user selection into
`ppt_flow init --mode`. It SHALL describe `html-only` as the local deterministic route,
`html-then-image2` as local HTML delivery plus required authorized visual-slot refinement, and
`image2-only` as first-class whole-page Image2 production. The explanation SHALL not claim that HTML
is permanently text-only or that Image2-primary is legacy maintenance.

The Agent SHALL run the readiness mode protecting the selected next action. Environment repair is
mechanical and SHALL proceed through the existing checker/fix/rerun path; semantic mode selection and
provider authorization remain human-owned. A mode choice SHALL not itself authorize a live probe or
production request.

#### Scenario: New user accepts the default

- **WHEN** foundation is ready and the user does not request another mode
- **THEN** BOOTSTRAP proceeds toward `init --mode image2-only` and offline Image2 readiness
- **AND** it discloses the later provider authorization boundary

#### Scenario: User chooses local HTML

- **WHEN** the user selects `html-only`
- **THEN** BOOTSTRAP requires base/local readiness only and does not solicit Image2 credentials

#### Scenario: User chooses HTML then refinement

- **WHEN** the user selects `html-then-image2`
- **THEN** BOOTSTRAP establishes base readiness and explains the later Image2 readiness/authorization requirement

## MODIFIED Requirements

### Requirement: BOOTSTRAP Step 1 contains a failure-to-fix section for every base doctor check

BOOTSTRAP Step 1 SHALL contain a labeled failure-to-fix section for every stable default env-check
name, including Node/npm/packages, exact `playwright@1.61.1`, exact direct `echarts@6.1.0`, paired
Chromium, bundled HTML fonts, offline runtime smoke, framework files, and advisory Git where present.
Each blocking section SHALL explain required versus found state, provide a copy-pasteable local repair,
and rerun base doctor. Exact ECharts repair SHALL direct lockfile-aligned project-root installation and
SHALL not suggest CDN/browser script use. Image2-only checks SHALL remain in a distinct provider-
readiness subsection and SHALL affect only `image2-only` production, required refinement, or another
explicit Image2 action; they SHALL not change base READY.

#### Scenario: ECharts is missing or mismatched

- **WHEN** base doctor reports the ECharts check failed
- **THEN** BOOTSTRAP provides an exact `echarts@6.1.0` project-root/lockfile repair and rerun command
- **AND** does not route to provider credentials or remote chart loading

#### Scenario: Image2 is absent for html-only

- **WHEN** every base check passes, the selected mode is `html-only`, and Image2 configuration is absent
- **THEN** BOOTSTRAP proceeds with local HTML creation

#### Scenario: Image2 is absent for the default mode

- **WHEN** base checks pass but selected/default `image2-only` lacks Image2 presence readiness
- **THEN** BOOTSTRAP gives the bounded offline credential/endpoint repair before provider production
- **AND** it does not run a live probe or claim production authorization

### Requirement: BOOTSTRAP gate behavior is preserved

Step 1 SHALL distinguish gate scope. FOUNDATION NOT READY (Node.js or npm missing/unsupported) SHALL
block all later framework work. Base NOT READY SHALL block any mode-owned action that needs the failed
local dependency. Base warnings remain non-blocking. Image2 NOT READY SHALL block `image2-only`
provider production and the provider-dependent portion of `html-then-image2`, but SHALL not revoke base
READY or block `html-only`/other local work. The Agent SHALL re-run the same readiness mode that failed
before entering its protected scope.

#### Scenario: Foundation failure still blocks

- **WHEN** base doctor reports `FOUNDATION NOT READY`
- **THEN** the Agent SHALL NOT proceed to Step 2
- **AND** SHALL present the inline Node/npm fix and require base doctor to confirm READY

#### Scenario: Base NOT READY blocks its local scope

- **WHEN** base doctor reports NOT READY because a selected action needs unavailable Chromium or HTML fonts
- **THEN** the Agent SHALL list each base failure with its inline fix
- **AND** SHALL NOT enter that protected local action until base doctor confirms READY

#### Scenario: Warnings allow continuation

- **WHEN** base doctor reports only advisory warnings and no hard failure
- **THEN** the Agent explains the affected optional behavior and MAY continue to Step 2

#### Scenario: Image2 failure has mode-bounded scope

- **WHEN** base doctor is READY but offline Image2 readiness is NOT READY
- **THEN** the Agent MAY continue `html-only` or other local work
- **AND** SHALL repair and rerun Image2 readiness before whole-page generation or required refinement submit

### Requirement: Image2 first-time credential setup is self-contained in BOOTSTRAP

BOOTSTRAP Step 1 SHALL provide self-contained Image2 presence setup when the selected/default mode is
`image2-only`, when `html-then-image2` approaches required refinement, or when a user explicitly enters
optional refinement/whole-page maintenance. It SHALL give the `.env` location,
`doctor --image2`, `IMAGE2_API_KEY`/`IMAGE2_BASE_URL` repair, and the distinction between offline
presence, disclosed live diagnostics, and exact production authorization. Init or mode selection SHALL
not count as a provider authorization.

For `html-only`, BOOTSTRAP SHALL proceed after base readiness without soliciting credentials; an
explicit later refinement choice receives the existing exact-plan authorization explanation. For
`image2-only`, guidance SHALL describe whole-page Image2 as the primary renderer reached through normal
pilot/build, not modern visual-slot refinement. Historical markerless compatibility MAY retain its
maintenance label, but uses the same bounded credential authority.

#### Scenario: Fresh user starts an Image2-primary deck

- **WHEN** base readiness passes and the user accepts `image2-only`
- **THEN** BOOTSTRAP provides offline credential presence setup before provider-backed pilot/build
- **AND** does not perform a live request or record production authorization

#### Scenario: Fresh user starts an HTML-only deck

- **WHEN** base readiness passes and the user selects `html-only`
- **THEN** BOOTSTRAP proceeds without asking for Image2 credentials or live probes

#### Scenario: User reaches required refinement

- **WHEN** `html-then-image2` reaches its provider-dependent refinement step
- **THEN** BOOTSTRAP/controller explains offline readiness and exact authorization before submission

#### Scenario: User declines a live probe

- **WHEN** the user declines the disclosed provider diagnostic submit
- **THEN** no live flag runs and offline/base readiness facts remain unchanged

### Requirement: BOOTSTRAP stays in sync with env-check check names

When `env-check.mjs` adds or changes a stable base check name, BOOTSTRAP Step 1 SHALL update the
matching labeled base repair in the same change. Exact ECharts SHALL remain a base check and repair
alongside Playwright/Chromium/fonts. Checks emitted only by `--image2`, `--smoke`, or
`--probe-vendors` SHALL remain under Image2 readiness and SHALL be described as applicable to
`image2-only`, required/optional refinement, or explicit historical maintenance rather than as
globally optional legacy checks. `env-check` remains the check-name/ownership authority; prose SHALL
match its owning readiness group.

#### Scenario: Base ECharts check is added

- **WHEN** the stable default report includes exact ECharts readiness
- **THEN** BOOTSTRAP's base section set includes the same named check and executable remediation

#### Scenario: Image2-only check appears

- **WHEN** a check is emitted only in Image2 mode
- **THEN** it is absent from the base prerequisite list and documented under Image2 readiness
- **AND** its blocking scope is tied to the selected Image2-dependent action
