## ADDED Requirements

### Requirement: Soft-bundle layout does not define run-bundle trees

`framework-directory-layout` SHALL describe only `PPTMAKER_FRAMEWORK/` (five type-based subdirectories and root entry markdown). It SHALL NOT define `deck_*` run-bundle tiers, `_scratch/`, `_generated/` version leaves, or run-bundle structure gradient. Run-bundle folder ontology is owned by capability `run-bundle-layout`.

#### Scenario: Soft-bundle layout stays soft-bundle-only

- **WHEN** a reader opens `openspec/specs/framework-directory-layout/spec.md`
- **THEN** its requirements address `PPTMAKER_FRAMEWORK/` paths
- **AND** do not define `deck_*/3_versions/` or version `_scratch/` as soft-bundle folders
