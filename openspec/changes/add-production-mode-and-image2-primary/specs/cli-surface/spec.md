## ADDED Requirements

### Requirement: Public CLI exposes one production-mode surface

`ppt_flow init` SHALL accept exact `--mode html-only|html-then-image2|image2-only` and default to
`image2-only`. The CLI SHALL expose a state-owned operation for inspecting and changing the exact run
version's production mode; same-pipeline HTML transitions SHALL delegate to the state owner, while
cross-pipeline requests SHALL return typed `transition_required` guidance without an in-place edit.
Help and successful init/mode results SHALL include normalized run version, selected mode, derived
pipeline, and nearest next action.

Unknown mode values, missing/corrupt authority, mode/source mismatch, or CAS conflict SHALL use the
existing one-final-JSON diagnostic producer and SHALL fail before branch-specific readiness, provider
credentials, generated paths, or writes. CLI return audits SHALL cover every new success and non-zero
path without copying the diagnostic schema into MD consumers.

#### Scenario: Init omits mode

- **WHEN** `ppt_flow init` is called without `--mode`
- **THEN** stdout reports `image2-only`, its whole-page pipeline, and the Image2-primary next action

#### Scenario: Invalid mode is supplied

- **WHEN** init or a mode transition receives an unknown mode
- **THEN** CLI returns `USAGE` through the registered diagnostic envelope before creating or changing a bundle

#### Scenario: Same-pipeline transition succeeds

- **WHEN** the exact run changes from `html-only` to `html-then-image2` with current expected state
- **THEN** CLI reports the old/new mode and unchanged `html-first-v1` pipeline
- **AND** it does not submit provider work

#### Scenario: Cross-pipeline transition is deferred

- **WHEN** the exact run requests `image2-only` from an HTML mode
- **THEN** CLI reports typed versioned-transition guidance and makes no state/source/generated mutation

### Requirement: Public production commands route from canonical mode policy

For run-scoped `doctor`, `validate`, `pilot`, `approve`, `style-master`, `build`, `refresh`, `image2`,
`state`, and `status`, `ppt_flow` SHALL inspect the exact version-scoped production mode before
branch-specific parsing/readiness and SHALL verify its source pipeline. It SHALL then delegate to the
existing owning adapter: HTML commands for both HTML modes, normal whole-page pilot/build for
`image2-only`, and modern `image2 *` refinement only for `html-then-image2` or explicitly optional
`html-only` entry. Whole-page `image2-only` SHALL reject modern refinement commands as not applicable;
it SHALL NOT redirect them to whole-page generation.

Mode-inapplicable but future-reserved behavior MAY return successful typed guidance only when no
protected invariant is at risk. Unknown identity, pipeline drift, active ownership conflict, invalid
provenance, or missing provider authorization SHALL remain a non-waivable hard failure through the
existing producer-owned envelope.

#### Scenario: Image2-primary pilot routes normally

- **WHEN** `ppt_flow pilot` targets a consistent `image2-only` version
- **THEN** it delegates to whole-page Image2 pilot generation with existing cost/provenance gates
- **AND** it does not invoke HTML composition or modern refinement

#### Scenario: HTML-only build stays local

- **WHEN** `ppt_flow build` targets a consistent `html-only` version with current gates
- **THEN** it delegates to the existing local HTML delivery path without Image2 credentials

#### Scenario: Modern Image2 is inapplicable to whole-page mode

- **WHEN** `ppt_flow image2 plan` targets `image2-only`
- **THEN** CLI returns typed not-applicable guidance that points to normal pilot/build
- **AND** it creates no refinement state or provider attempt

#### Scenario: Provider authority is missing

- **WHEN** an Image2-primary operation reaches a chargeable submit boundary without existing authorization/readiness
- **THEN** CLI hard-stops before submit and names the authorized recovery action
- **AND** no force or quality waiver bypasses provider authority
