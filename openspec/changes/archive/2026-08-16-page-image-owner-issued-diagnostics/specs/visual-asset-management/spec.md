# Visual Asset Management Specification (delta)

## ADDED Requirements

### Requirement: Reference issues bind the physical registry locator

When the reference loader knows the exact registry path, every parse,
validation, and clause-normalization issue it produces SHALL carry that
physical source locator through the problem-fact contract owned by
`diagnostic-facts`, together with its logical registry path, the registered
reason code, and bounded `actual`/`expected` values that never include a
complete role clause. An invalid registry or role failure SHALL therefore
name its actual registry file, and SHALL retain that owner and locator when
the Page Source aggregator absorbs it; it SHALL NOT be rewritten to
`slide-specifications.md` or `VISUAL BRIEF`, and SHALL NOT lose
`actual`/`expected` facts.

#### Scenario: Invalid role clause names the registry file

- **WHEN** a selected profile's role clause violates the visual-clause
  normalization contract
- **THEN** the failure carries the exact registry physical path, the logical
  record path, and the bounded reason
- **AND** the aggregated diagnostic retains the same owner and locator

#### Scenario: Invalid registry bytes name the registry path

- **WHEN** a registry file cannot be parsed or validated
- **THEN** the bounded diagnostic names that registry path and does not
  fall back to a prior profile or another source
