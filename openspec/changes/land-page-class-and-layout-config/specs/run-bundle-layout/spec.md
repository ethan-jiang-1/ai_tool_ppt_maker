## MODIFIED Requirements

### Requirement: Run-Bundle Layout owns the Pure visual-system source location

Run-Bundle Layout SHALL reserve the four-document Page Image presentation
package at `2_backbone/visual-style/page-image-presentation/`:
`page-class-catalog.yaml`, `deck-defaults.yaml`,
`pure-deck-visual-system.yaml`, and `framed-header-profiles.yaml`. Each file
uses the matching version-level `overrides/visual-style/page-image-presentation/`
location under the normal override-first/backbone-default rule. The package is
version-resolved editable source: it SHALL not be stored in `_generated/`,
Style Master immutable history, Page Image lifecycle storage, receipts, grants,
State, or delivery artifacts.

`pure-deck-visual-system.yaml` remains the source of Pure-only presentation
facts; Framed header facts remain only in `framed-header-profiles.yaml`. The
catalog and deck defaults are not a location for page literals, geometry,
provider prompts, generated projection, evidence, or state. Removing or
changing a source document SHALL not mutate existing lifecycle authority. A
subsequent owner operation re-evaluates the complete resolved package; it does
not recover a value from a prior plan, inspection projection, or accepted image.

#### Scenario: A new bundle receives a Pure visual-system source seed

- **WHEN** a new Run Bundle is initialized
- **THEN** its backbone visual-style directory contains the four canonical
  Page Image presentation source records
- **AND** each is source input rather than derived Page Image state or media

#### Scenario: A version override changes only that version's Pure source input

- **WHEN** a version provides a valid override for one Page Image presentation
  package document
- **THEN** current planning resolves that version's complete package with the
  override at the matching path
- **AND** sibling versions and immutable artifacts remain unchanged
