## ADDED Requirements

### Requirement: BOOTSTRAP presents production mode before mode-specific readiness

After foundation repair, BOOTSTRAP SHALL explain the three production modes, identify
`image2-only` as the new-deck default, and let the Agent carry an explicit user selection into
`ppt_flow init --mode`. It SHALL describe `html-only` as the local deterministic route,
`html-then-image2` as local HTML delivery plus required authorized visual-slot refinement, and
`image2-only` as first-class whole-page Image2 production. The explanation SHALL not claim that HTML
is permanently text-only or that Image2-primary is legacy maintenance.

The Agent SHALL run `doctor --mode <mode>` before init and the readiness profile protecting each later
action. Environment repair is
mechanical and SHALL proceed through the existing checker/fix/rerun path; semantic mode selection and
provider authorization remain human-owned. A mode choice SHALL not itself authorize a live probe or
production request.

#### Scenario: New user accepts the default

- **WHEN** foundation is ready and the user does not request another mode
- **THEN** BOOTSTRAP proceeds toward `init --mode image2-only` and offline Image2 readiness
- **AND** it discloses the later provider authorization boundary

#### Scenario: User chooses local HTML

- **WHEN** the user selects `html-only`
- **THEN** BOOTSTRAP requires common/HTML readiness only and does not solicit Image2 credentials

#### Scenario: User chooses HTML then refinement

- **WHEN** the user selects `html-then-image2`
- **THEN** BOOTSTRAP establishes common/HTML readiness and explains deferred Image2 readiness/authorization

## RENAMED Requirements

- FROM: `### Requirement: BOOTSTRAP Step 1 contains a failure-to-fix section for every base doctor check`
- TO: `### Requirement: BOOTSTRAP Step 1 covers every selected doctor-profile check`
- FROM: `### Requirement: BOOTSTRAP stays in sync with env-check check names`
- TO: `### Requirement: BOOTSTRAP stays in sync with environment readiness profiles`

## MODIFIED Requirements

### Requirement: BOOTSTRAP Step 1 covers every selected doctor-profile check

BOOTSTRAP Step 1 SHALL contain a labeled failure-to-fix section for every stable check in the common,
HTML, and Image2 profiles. Common repair covers Node/npm/common packages/framework files and advisory
checks. HTML repair covers exact `playwright@1.61.1`, exact direct `echarts@6.1.0`, paired Chromium,
bundled HTML fonts, and offline runtime smoke. Image2 repair covers credentials, endpoint, and the
in-framework whole-page generator. Each selected blocking section SHALL explain required versus found
state, provide a copy-pasteable local repair, and rerun the same profile. Exact ECharts repair SHALL
direct lockfile-aligned project-root installation and SHALL not suggest CDN/browser script use.

#### Scenario: ECharts is missing or mismatched

- **WHEN** an HTML doctor profile reports the ECharts check failed
- **THEN** BOOTSTRAP provides an exact `echarts@6.1.0` project-root/lockfile repair and rerun command
- **AND** does not route to provider credentials or remote chart loading

#### Scenario: Image2 is absent for a fresh deck

- **WHEN** common/HTML checks pass, the selected mode is `html-only`, and Image2 configuration is absent
- **THEN** BOOTSTRAP proceeds with local HTML creation without treating provider setup as a blocker

#### Scenario: Image2 is absent for the default mode

- **WHEN** common checks pass but selected/default `image2-only` lacks Image2 presence readiness
- **THEN** BOOTSTRAP gives the bounded offline credential/endpoint repair before provider production
- **AND** it does not run a live probe or claim production authorization

### Requirement: BOOTSTRAP gate behavior is preserved

Step 1 SHALL distinguish gate scope. FOUNDATION NOT READY (Node.js or npm missing/unsupported) SHALL
block all later framework work. Common NOT READY blocks every mode; HTML NOT READY blocks only HTML
production; Image2 NOT READY blocks `image2-only` provider work and the provider-dependent portion of
`html-then-image2`. For `html-then-image2`, missing Image2 presence before HTML work is deferred guide
output rather than a current hard failure. Warnings remain non-blocking. The Agent SHALL rerun the same
profile that failed before entering its protected scope.

#### Scenario: Foundation failure still blocks

- **WHEN** base doctor reports `FOUNDATION NOT READY`
- **THEN** the Agent SHALL NOT proceed to Step 2
- **AND** SHALL present the inline Node/npm fix and require base doctor to confirm READY

#### Scenario: NOT READY blocks but offers clear path

- **WHEN** the selected HTML profile reports NOT READY because Chromium or HTML fonts are unavailable
- **THEN** the Agent SHALL list each HTML failure with its inline fix
- **AND** SHALL NOT enter HTML production until the same profile confirms READY

#### Scenario: Warnings allow continuation

- **WHEN** base doctor reports only advisory warnings and no hard failure
- **THEN** the Agent explains the affected optional behavior and MAY continue to Step 2

#### Scenario: Image2 failure has bounded scope

- **WHEN** common readiness is READY but offline Image2 readiness is NOT READY
- **THEN** the Agent MAY continue `html-only` or other local work
- **AND** SHALL repair and rerun Image2 readiness before whole-page generation or required refinement submit

### Requirement: Image2 first-time credential setup is self-contained in BOOTSTRAP

BOOTSTRAP Step 1 SHALL provide self-contained Image2 presence setup when the selected/default mode is
`image2-only`, when `html-then-image2` approaches required refinement, or when a user explicitly enters
historical whole-page maintenance. An `html-only` refinement request first changes mode and then uses
the required-refinement path. BOOTSTRAP SHALL give the `.env` location,
`doctor --mode image2-only` (with `doctor --image2` retained as a compatibility alias),
`IMAGE2_API_KEY`/`IMAGE2_BASE_URL` repair, and the distinction between offline
presence, disclosed live diagnostics, and exact production authorization. Init or mode selection SHALL
not count as a provider authorization.

For `html-only`, BOOTSTRAP SHALL proceed after common/HTML readiness without soliciting credentials; an
explicit later refinement request first receives the mode switch to `html-then-image2`, then the
existing exact-plan authorization explanation. For
`image2-only`, guidance SHALL describe whole-page Image2 as the primary renderer reached through normal
pilot/build, not modern visual-slot refinement. Historical markerless compatibility MAY retain its
maintenance label, but uses the same bounded credential authority.

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

#### Scenario: Legacy deck requires Image2 maintenance

- **WHEN** a historical markerless deck enters explicit compatibility maintenance
- **THEN** the Agent can discover the same scoped offline setup without relabeling the new primary flow as legacy

#### Scenario: User declines a legacy live probe

- **WHEN** the user declines the disclosed provider diagnostic submit
- **THEN** no live flag runs and offline/current-profile readiness facts remain unchanged

### Requirement: BOOTSTRAP stays in sync with environment readiness profiles

When `env-check.mjs` adds, moves, or changes a stable check name/profile, BOOTSTRAP Step 1 SHALL update
the matching labeled repair in the same change. Exact ECharts SHALL remain an HTML check and repair
alongside Playwright/Chromium/fonts, not an Image2-only blocker. Checks emitted only by Image2 profiles,
`--smoke`, or
`--probe-vendors` SHALL remain under Image2 readiness and SHALL be described as applicable to
`image2-only`, required refinement after the explicit mode switch, or historical maintenance rather than as
globally optional legacy checks. `env-check` remains the check-name/ownership authority; prose SHALL
match its owning readiness group.

#### Scenario: Base ECharts check is added

- **WHEN** the stable default/HTML report includes exact ECharts readiness
- **THEN** BOOTSTRAP's HTML section includes the same named check and executable remediation

#### Scenario: Image2-only check appears

- **WHEN** a check is emitted only in Image2 mode
- **THEN** it is absent from the base prerequisite list and documented under Image2 readiness
- **AND** its blocking scope is tied to the selected Image2-dependent action
