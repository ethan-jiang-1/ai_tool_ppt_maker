## MODIFIED Requirements

### Requirement: Framework root subdirectories follow type-based organization

The `PPTMAKER_FRAMEWORK/` root SHALL contain exactly five subdirectories: `workflow/` (methodology), `scripts/` (Node implementation), `charter/` (constitution), `reference/` (appendices), and `playbook/` (workflow controllers). Phase-numbered directories SHALL NOT exist at framework root. Within `scripts/`, Node ownership SHALL mirror the established `00-setup` through `05-iteration` lifecycle through the interfaces and import rules owned by `framework-script-layout`; this nested organization SHALL NOT add another framework-root directory or change MD Controller ownership.

#### Scenario: Human lists root subdirectories

- **WHEN** a human runs `ls PPTMAKER_FRAMEWORK/`
- **THEN** they see exactly `workflow/`, `scripts/`, `charter/`, `reference/`, and `playbook/`
- **AND** numbered ownership remains nested under workflow and scripts rather than at root

#### Scenario: Maintainer navigates from method to code and tests

- **WHEN** a maintainer starts from `workflow/03-html-production/`
- **THEN** active guidance points to `scripts/03-html-production/` and `tests/03-html-production/`
- **AND** the owning Phase interface is discoverable without filename-memory navigation

### Requirement: Framework ownership separates complete HTML delivery from future refinement

The Constitution and Agent Contract SHALL state that MD Controller/human review owns the decision to approve content/visual output and whether to consider a later professional upgrade; JS owns deterministic HTML rendering/evidence; and no provider adapter belongs to ordinary create/build/iteration. Completing HTML delivery SHALL be a terminal valid user outcome with no pending refinement node or false incomplete state.

Active architecture guidance SHALL place HTML delivery under Phase 3, markerless whole-page Image2 maintenance under Phase 5 legacy ownership, and future visual-slot refinement under the reserved Phase 4 owner. During Change 4, Phase 4 SHALL be documented as README-only/non-executable and SHALL expose no JS interface or adapter.

#### Scenario: User ends after PPTX delivery

- **WHEN** HTML PPTX/notes are current and the user declines or is not offered unavailable refinement
- **THEN** the workflow is complete
- **AND** state has no pending Image2 execution or authorization

#### Scenario: Maintainer searches for Image2 ownership

- **WHEN** active charter guidance distinguishes current legacy maintenance from future refinement
- **THEN** legacy whole-page behavior points to Phase 5
- **AND** Phase 4 is explicitly unavailable rather than presented as an executable path

## ADDED Requirements

### Requirement: Charter makes source and test ownership navigable

Active framework guidance SHALL explain that `workflow/`, `playbook/`, `scripts/`, `tests/`, and `tests_e2e/` use the same Phase ownership vocabulary while retaining different roles. It SHALL direct maintainers to the owning Phase `index.mjs` interface and mirrored test directory, and SHALL forbid cross-Phase private imports, a generic `scripts/lib/`, and business rules in test helpers.

#### Scenario: Coding Agent changes a Phase 3 behavior

- **WHEN** the Agent follows active framework maintenance guidance
- **THEN** it is directed to the Phase 3 interface, its private implementation, and the mirrored Phase 3 tests
- **AND** it is not instructed to add another flat root script or test
