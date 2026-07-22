## ADDED Requirements

### Requirement: Production-mode transition scratch is isolated and layout-validated

The canonical version-local `_scratch/` owner set SHALL admit
`_scratch/production-mode-transition/` only for the general cross-pipeline transition adapter. Its
immediate entries SHALL be exactly `candidate-run/`, `plan.json`, and `apply-journal.json`; their internals
remain scratch-local and deletable. The only target-visible receipt is
`_generated/qa/production_mode_transition.json`. `bundle_layout.mjs` SHALL validate those exact entries,
their path confinement, the target QA receipt placement, and artifact ownership without admitting them at
the version root, another version, `_generated/` outside that QA receipt, `_state/`, or legacy
`_scratch/html-migration/`. The legacy migration scratch owner and the production-mode transition owner
shall neither widen nor validate each other's artifact names as authority.

#### Scenario: Transition scratch remains version-local

- **WHEN** a source version has a valid production-mode-transition candidate and journal
- **THEN** bundle layout accepts only its declared owner under that source version's `_scratch/`
- **AND** the same names at the version root or a target version fail structure validation

#### Scenario: Legacy scratch cannot be adopted

- **WHEN** both `_scratch/html-migration/` and `_scratch/production-mode-transition/` exist
- **THEN** layout validates each immediate-entry contract independently
- **AND** no legacy artifact is accepted as a production-mode-transition plan, journal, or receipt
