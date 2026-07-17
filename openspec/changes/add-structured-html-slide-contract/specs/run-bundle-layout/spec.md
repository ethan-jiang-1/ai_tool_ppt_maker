## ADDED Requirements

### Requirement: Structured source control remains inside the existing run-bundle topology

Opt-in HTML-first source and its asset-control manifests SHALL live in the existing canonical source/backbone/version layers governed by `bundle_layout.mjs`. This change SHALL not create a second order file, write HTML pages/screenshots/PPTX into `_generated/`, or add Image2 refinement directories.

#### Scenario: Structured source uses canonical version paths

- **WHEN** a run bundle opts into `html-first-v1`
- **THEN** its structured source remains under the canonical version source/control locations
- **AND** bundle self-check accepts the layout without a new top-level directory

#### Scenario: Generated outputs remain absent

- **WHEN** the structured contract is parsed and validated
- **THEN** no `_generated/html_production`, screenshot, PPTX, or Image2 candidate output is created

### Requirement: Derived contract artifacts are rebuildable

Any resolved plan, catalog, diagnostic, or fingerprint receipt produced by the contract SHALL be rebuildable from source/control files and SHALL not become an order or content source of truth.

#### Scenario: Deleting derived contract output is safe

- **WHEN** a derived structured-plan receipt is deleted
- **THEN** the next validation rebuilds it from canonical source/control inputs
- **AND** no source or slide order is lost
