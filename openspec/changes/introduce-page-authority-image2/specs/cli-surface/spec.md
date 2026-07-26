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
