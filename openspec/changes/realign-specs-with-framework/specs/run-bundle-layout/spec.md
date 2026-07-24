## MODIFIED Requirements

### Requirement: Production-mode transition scratch is isolated and layout-validated
The general cross-pipeline transition adapter's canonical version-local `_scratch/` owner set SHALL admit only `_scratch/production-mode-transition/`. Its immediate entries SHALL be exactly `candidate-run/`, `plan.json`, and `apply-journal.json`; their internals remain scratch-local and deletable. The only target-visible receipt is `_generated/qa/production_mode_transition.json`. `bundle_layout.mjs` SHALL validate those exact entries, their path confinement, the target QA receipt placement, and artifact ownership without admitting them at the version root, another version, `_generated/` outside that QA receipt, or `_state/`. It SHALL reject any other cross-pipeline scratch owner and SHALL not recognize retired scratch artifacts as a candidate, plan, journal, or receipt authority.

#### Scenario: Transition scratch remains version-local
- **WHEN** a source version has a valid production-mode-transition candidate and journal
- **THEN** bundle layout accepts only its declared owner under that source version's `_scratch/`
- **AND** the same names at the version root or a target version fail structure validation

#### Scenario: Unexpected cross-pipeline scratch owner is rejected
- **WHEN** a source version contains a cross-pipeline scratch owner other than `production-mode-transition`
- **THEN** layout reports an ownership violation
- **AND** it does not adopt any artifact from that owner as transition authority

## ADDED Requirements

### Requirement: Whole-page run identity is explicit
A whole-page run SHALL declare `production.pipeline: whole-page-image2-v1` in its canonical source. Layout validation SHALL not treat absent source metadata as a whole-page identity.

#### Scenario: Whole-page run has an explicit marker
- **WHEN** layout validates a canonical whole-page source with the current marker
- **THEN** it applies whole-page ownership rules

#### Scenario: Whole-page marker is absent
- **WHEN** layout validates a source without a production marker
- **THEN** it reports the marker as invalid
- **AND** it does not apply a whole-page compatibility layout

## REMOVED Requirements

### Requirement: Legacy migration scratch is temporary and version-local
**Reason**: `_scratch/html-migration/` and its projected-run compatibility layout are removed.

**Migration**: Current cross-pipeline work uses only the existing `_scratch/production-mode-transition/` owner.
