## MODIFIED Requirements

### Requirement: Public CLI exposes one production-mode surface
`ppt_flow init` SHALL accept no production-mode choice or exact `--mode image2-page-authority`, and
default an omitted mode to `image2-page-authority`. It SHALL reject legacy init modes. The closed state grammar SHALL retain existing
same-pipeline and cross-pipeline transition behavior and SHALL add Page Authority operations only through
the Page Authority receipt and authorization boundaries. Help and successful init/mode results SHALL
include normalized run version, selected mode, derived pipeline, and nearest next action.

Unknown mode values, missing/corrupt authority, selected-run execution mismatch, mode/source mismatch,
pre-current state, retired Controller identity, or CAS conflict SHALL use the existing final JSON
diagnostic producer and fail before readiness, provider credentials, generated paths, or writes. The
diagnostic SHALL name the owner's one bounded typed next action and never a hand-edited state recipe.

#### Scenario: Init defaults to Page Authority
- **WHEN** `ppt_flow init` is called without `--mode`
- **THEN** v1 records `image2-page-authority` and source declares `page-authority-image2-v1`
- **AND** the result reports `framed-image2` as the new-deck default

#### Scenario: Invalid mode is supplied
- **WHEN** init or a mode transition receives an unknown mode
- **THEN** CLI returns `USAGE` through the registered diagnostic envelope before creating or changing a bundle

#### Scenario: Legacy transition has no generic CLI bypass
- **WHEN** a caller requests a Page Authority transition through a generic in-place mode setter
- **THEN** CLI returns the owner-issued transition guidance without source, state, or generated mutation
- **AND** it does not infer an adoption

#### Scenario: Same-pipeline legacy transition remains available
- **WHEN** the exact run changes from `html-only` to `html-then-image2` with current expected state
- **THEN** CLI reports the old/new mode and unchanged `html-first-v1` pipeline
- **AND** it does not submit provider work

#### Scenario: Legacy cross-pipeline transition remains deferred
- **WHEN** the exact run requests `image2-only` from an HTML mode
- **THEN** CLI reports current versioned-transition guidance and makes no state, source, or generated mutation

#### Scenario: Published same-pipeline target registration is retried
- **WHEN** the exact same-pipeline target is visible but prior mode registration was interrupted
- **THEN** state registration commits or reports the already-current target record idempotently
- **AND** it does not copy source gates, node completion, or generated evidence

#### Scenario: State operation flags are mixed
- **WHEN** a caller combines mode transition, mirror repair, registration, JSON, gate, or delivery-review forms
- **THEN** CLI returns `USAGE` before state, metadata, source, or target mutation

### Requirement: Page Authority direct commands are receipt-bound
CLI SHALL expose Page Authority validation, raw-generation, local Framed refresh, assembly, and notes
operations only through canonical `--run-dir` source/state resolution and the resolved receipt. It SHALL
reject direct prompt, provider style, output-path, or legacy artifact override arguments. Any hard
failure SHALL use the existing secret-safe diagnostic envelope; no provider body, prompt, or credential
shall be emitted.

#### Scenario: Direct provider ingress is rejected
- **WHEN** a Page Authority command receives a raw prompt, style override, output override, or legacy image path
- **THEN** CLI returns `USAGE` before readiness, provider, or generated-artifact work
- **AND** it identifies the receipt-bound command path

### Requirement: Doctor exposes production-scoped readiness without hidden live work
The root grammar SHALL accept `ppt_flow doctor --mode image2-page-authority` and a Page Authority
run-bound operation selection. `--run-dir` SHALL inspect the exact authoritative mode and fail closed on
unusable state/drift; explicit `--mode` supports pre-init checks. For an unbound Page Authority mode,
doctor reports independent `framed-runtime` and `image2-raw` profiles without an aggregate source-ready
claim. Existing `--image2` remains the compatibility alias for the legacy `image2-only` profile and is
mutually exclusive with other selectors. `--smoke` and `--probe-vendors` remain mutually exclusive and
live only when explicitly selected; neither authorizes production generation.

#### Scenario: Page Authority doctor is unbound
- **WHEN** `doctor --mode image2-page-authority` runs without run-dir, operation, or live flags
- **THEN** it reports independent offline Frame and raw profiles without a combined readiness claim
- **AND** it makes no network request

#### Scenario: Page Authority doctor resolves a local operation
- **WHEN** `doctor --run-dir <run-dir> --operation framed-local-refresh` targets a valid Page Authority run
- **THEN** it checks only the `framed-runtime` profile
- **AND** it does not require provider credentials or probe a vendor

#### Scenario: Doctor selectors conflict
- **WHEN** mode, run-dir, operation, or the compatibility `--image2` selector is combined incompatibly
- **THEN** doctor returns `USAGE` before environment or provider inspection

### Requirement: CLI surface preserves command names
The `ppt_flow` CLI SHALL expose exactly 14 top-level commands: `doctor`, `init`, `status`, `approve`,
`style-master`, `validate`, `pilot`, `build`, `refresh`, `new-version`, `test`, `state`, `slides`, and
`image2`. Page Authority work SHALL use receipt-bound forms under this existing surface; no top-level
Page Authority or migration command is added. Help SHALL not advertise legacy modes as fresh-init
choices.

#### Scenario: Help lists the complete current surface
- **WHEN** `ppt_flow --help` runs
- **THEN** the 14 current command names are listed exactly once
- **AND** no extra Page Authority top-level command is advertised

#### Scenario: Existing init invocation uses the new default
- **WHEN** an Agent runs `ppt_flow init deck_demo --deck-type keynote --style dark-executive`
- **THEN** a run bundle is created using the compatible invocation shape and `image2-page-authority`
- **AND** the resulting source default is `framed-image2`
