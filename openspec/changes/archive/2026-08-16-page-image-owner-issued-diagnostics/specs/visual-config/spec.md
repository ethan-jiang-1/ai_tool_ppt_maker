# Visual Config Specification (delta)

## ADDED Requirements

### Requirement: Visual Language failures carry owner-issued bounded facts

A Visual Language source failure SHALL emit its facts through the
problem-fact contract owned by `diagnostic-facts`: the registered reason
code, the Visual Language owner, the physical source locator when known, the
logical registry path of the offending record/field, and bounded
`actual`/`expected` values that never include a complete visual clause.
Registry-level structural validity — YAML parseability, declared contract,
record shape, and schema conformance — SHALL remain a whole-source property:
a structurally invalid record anywhere in the selected registry is a
registry-level source defect naming the exact record, and the registry SHALL
not be trusted as a closed source until it repairs.

The registered sentence "an unselected registry record SHALL not invalidate
a page" SHALL govern record content semantics: clause content-authority and
forbidden-token evaluation apply only to records selected by a page. An
unselected record whose clause violates content-authority rules SHALL NOT
block the page; a selected record with such a violation SHALL fail as the
selection-isolated defect of that record and its selecting pages. This
paragraph is the normative adjudication of selected-record invalidation; the
resolver SHALL NOT keep whole-registry semantic validation as the de facto
rule.

#### Scenario: An unselected invalid clause does not block the page

- **WHEN** a registry contains an unselected recipe whose provider clause
  contains a forbidden token while the selected recipe is valid
- **THEN** the page resolves with its selected recipe
- **AND** no registry-level diagnostic is emitted for the unselected record

#### Scenario: A selected invalid clause fails as a selection defect

- **WHEN** the page selects a recipe whose provider clause contains a
  forbidden token
- **THEN** resolution fails with the Visual Language owner, the exact record
  logical path, and a bounded reason
- **AND** it does not blame the page source field or the operation owner

#### Scenario: A structurally invalid record is a registry-level defect

- **WHEN** any record in the selected registry is schema-invalid or
  unparseable
- **THEN** resolution fails as a registry-level source defect naming that
  record
- **AND** it does not treat the record as selection-isolated or infer a
  replacement

### Requirement: Presentation package failures name the exact broken source

The four-file presentation package remains one closed package whose
full-package validation precedes projection, including rejection of a
malformed Pure sibling for a Framed run. A package-load failure SHALL name
the exact broken package file (physical source) and a bounded reason, and
SHALL NOT be relocated to `slide-specifications.md` or the operation owner.
A per-slide presentation projection failure SHALL retain its presentation
reason code and SHALL locate the repair owner: a header-field conflict names
the Page Source header/class field, while a source/package defect names the
presentation package file.

#### Scenario: A missing workflow file names the package source

- **WHEN** `pure-deck-visual-system.yaml` is missing from the selected
  presentation package
- **THEN** the failure names that exact package source with a bounded reason
- **AND** it does not point at `slide-specifications.md` or `VISUAL BRIEF`

#### Scenario: A forbidden header field names the source field

- **WHEN** a Framed opening profile rejects a non-null `SUBTITLE`
- **THEN** the failure names the Page Source `SUBTITLE`/`PAGE CLASS` repair
- **AND** it does not relocate the defect to `VISUAL BRIEF`

### Requirement: Source diagnostic precedence is deterministic

When more than one source failure is present, the diagnostic SHALL prefer
the earliest independent failure under this fixed order: (1) whole-source
structural validation of the selected Visual Language registry and the
selected presentation package, (2) Page Source field-level parse failures in
source order, (3) per-slide selection failures in the resolution order
identity reference, visual-language selection, presentation projection. The
precedence SHALL NOT change the root owner/reason/locator of the selected
failure, and secondary independent failures MAY be reported as bounded
issues.

#### Scenario: Registry and page field failures coexist

- **WHEN** a structurally invalid registry and a Page Source field error are
  both present
- **THEN** the diagnostic names the registry-level root cause first
- **AND** the Page Source field fact may appear as a bounded secondary issue
