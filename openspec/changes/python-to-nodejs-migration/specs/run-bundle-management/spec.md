## ADDED Requirements

### Requirement: Bundle layout is the directory constitution

`bundle_layout.mjs` SHALL be the single source of truth for run-bundle directory structure. All other scripts SHALL import path constants from it. It SHALL support `--init` (scaffold), `--check` (validate), `--new-version` (create clean downstream version), and `--self-check` (drift alarm for CI).

#### Scenario: Init creates whitelist-clean bundle

- **WHEN** `bundle_layout --init deck_test` runs
- **THEN** `bundle_layout --check deck_test/3_versions/v1` passes with zero violations

#### Scenario: Check catches ad-hoc directory

- **WHEN** a run bundle has a manually created `deck_test/random_dir/` not in the whitelist
- **THEN** `bundle_layout --check` reports it as an unexpected entry and exits non-zero
