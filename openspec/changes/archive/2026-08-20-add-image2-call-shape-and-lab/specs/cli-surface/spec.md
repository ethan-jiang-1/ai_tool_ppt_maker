## MODIFIED Requirements

### Requirement: Run-bound readiness and live probing are separate commands

The direct CLI SHALL expose exact-run readiness and live provider probing
through separate `preflight` and `probe` commands, distinct from the offline
`doctor`. `preflight <run-dir> --operation <op>` SHALL evaluate exact-run
readiness with zero network and zero write for one declared operation
(`framed-local-refresh`, `raw-generation`, or `full-build`). `probe <run-dir>`
SHALL run one live confirmed-Call-Shape connectivity probe bound to the exact
run. It SHALL NOT accept `--smoke` or `--probe-vendors`.

`doctor` SHALL remain the global offline check with no `--run-dir`,
`--operation`, `--smoke`, or `--probe-vendors` flags. A retired
`doctor --run-dir ...` form SHALL return an owner-issued exact replacement
(`preflight` or `probe`), not unknown-command prose. A retired
`doctor --run-dir ... --smoke|--probe-vendors` form SHALL name `probe <run-dir>`
or Lab rather than those flags.

#### Scenario: A retired doctor form names its replacement

- **WHEN** a caller invokes `doctor --run-dir <run-dir> --operation <op>` or
  `doctor --run-dir <run-dir> --smoke|--probe-vendors`
- **THEN** it returns the exact `preflight <run-dir> --operation <op>` or
  `probe <run-dir>` invocation, and the smoke/vendors form also names Lab when
  the intent is candidate discovery
- **AND** it does not run a partial or ambiguous check

#### Scenario: Preflight does not become a second readiness authority

- **WHEN** `preflight` evaluates an exact run's operation readiness
- **THEN** it reuses the existing identity/readiness evaluator with zero
  network and zero write
- **AND** it does not invent a new readiness or authorization surface

## ADDED Requirements

### Requirement: Probe submits the confirmed Call Shape exactly once

`probe <run-dir>` SHALL resolve the exact run's confirmed page-image Call Shape
and `IMAGE2_PROVIDER_PROFILE_ID` match, then submit that value exactly once
through the shared executor, retrieve via the bound `result_protocol`, and
validate the PNG with the current production inspector. Success SHALL report
connectivity of the declared Call Shape only, not prompt-budget proof,
authorization, or permission to generate. Probe SHALL NOT read `_lab/`.

A missing, pending, malformed, unconfirmed, mismatched, or illegal Call Shape
SHALL hard-stop before any fetch. The owner-issued next action SHALL point at
Image2 Lab. Probe SHALL NOT invent a blank reference image. When the confirmed
Call Shape uses `edits`, probe SHALL use the current exact version's already
selected immutable Style Master bytes; absence is the same hard-stop.

Entering the probe playbook with a confirmed profile is the Work Request for
that one submit. The probe CLI SHALL be non-interactive and SHALL NOT clone
`image2 authorize`.

#### Scenario: Confirmed probe retrieves inspector-valid PNG

- **WHEN** `probe` receives an exact run with a confirmed Call Shape and
  matching runtime profile id
- **THEN** it performs exactly one shared-executor submit and reports
  connectivity only
- **AND** it creates no grant, attempt, receipt, or profile write

#### Scenario: Pending probe points at Lab with zero fetch

- **WHEN** `probe` cannot resolve a confirmed page-image Call Shape
- **THEN** it hard-stops before any POST
- **AND** the next action names the Lab CLI/playbook rather than `--smoke`

#### Scenario: Edits probe without Style Master hard-stops

- **WHEN** the confirmed Call Shape is `edits` and the exact version has no
  selected immutable Style Master
- **THEN** probe hard-stops before fetch
- **AND** it does not generate a connectivity-only blank PNG

### Requirement: Retired Image2 live flags emit a migration diagnostic

`env-check`, `doctor`, and `probe` forms that pass `--smoke` or
`--probe-vendors` SHALL fail closed with a usage migration diagnostic naming
`ppt_flow probe <run-dir>` for confirmed-Call-Shape connectivity and the Lab
CLI for candidate discovery. They SHALL NOT silently become offline checks,
silently alias to flagless `probe <run-dir>`, start a hardcoded generations
POST, or walk a vendor list.

#### Scenario: env-check --smoke names the replacement

- **WHEN** a caller invokes `env-check --smoke` or `env-check --probe-vendors`
- **THEN** the result is usage naming `probe <run-dir>` or Lab
- **AND** zero Image2 network calls occur

#### Scenario: probe --vendors does not walk channels

- **WHEN** a caller invokes `probe <run-dir> --probe-vendors` or `--smoke`
- **THEN** the result is the same class of usage migration diagnostic
- **AND** it does not POST once per vendor

### Requirement: Lab CLI uses the registered diagnostic envelope

The standalone Lab CLI SHALL use the same secret-safe diagnostic envelope as
other direct Harness CLIs on failure, and a structured success document that
includes `trial_id` and `trial_sha256`. It SHALL NOT leak provider body,
prompt, stack, or secrets. Adding Lab SHALL follow the closed-inventory rule
for a standalone executable: declared owner, grammar, effect class, output
mode, test ownership, and a stated non-overlap reason versus `probe` and
`image2 generate`.

#### Scenario: Lab failure is owner-issued JSON

- **WHEN** Lab hard-stops on admission, schema, or executor failure
- **THEN** stderr's last non-empty line is one diagnostic envelope
- **AND** the next action is bounded and secret-safe

#### Scenario: Lab does not overlap probe or generate

- **WHEN** the executable inventory is audited after Lab is added
- **THEN** Lab is the unconfirmed-candidate live owner
- **AND** probe remains confirmed-Call-Shape connectivity and generate remains
  authorized production
