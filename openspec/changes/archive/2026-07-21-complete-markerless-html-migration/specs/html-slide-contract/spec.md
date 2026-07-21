## ADDED Requirements

### Requirement: Migration candidate inputs are a closed receipt-bound overlay

The HTML contract SHALL expose one migration-candidate validation entry reachable only from the closed migration adapter. It SHALL accept the current source run plus its exact confined `_scratch/html-migration/projected-run/` candidate root, not caller-supplied source, palette, asset, or publication paths. The candidate source is authoritative for proposed slide content; effective visual inputs use the ordered precedence `candidate overrides > source-version overrides > deck-root backbone`. The candidate root may supply only the normal version-local override shapes already owned by run-bundle layout; it SHALL not emulate a deck root, supply metadata/state, or alter normal public HTML validation.

The entry SHALL use the same parser, structured-body validator, visual-config validator, asset-catalog validator, preflight, and plan builder as canonical HTML validation. It SHALL return one normalized receipt projection, serialized through the existing canonical sorted `base_receipts` and `candidate_receipts` arrays, covering candidate source/overrides and every inherited source-version/backbone input that influenced the plan, with paths confined relative to the real deck root. Revalidation SHALL reject an arbitrary candidate root, a symlink escape, receipt drift, or a forged overlay before renderer context issuance. It SHALL not create a second plan/freshness authority.

Preparation SHALL preserve every retained formal slide ID verbatim. It SHALL add `identity.scheme: mnemonic-v1` only when all retained IDs already satisfy that scheme; otherwise the candidate omits that marker and retains compatible legacy identity validation. Legacy `IMAGE PROMPT` fields SHALL not appear in the candidate structured source. Any retained prompt reference is authoring-only support and SHALL not enter the structured plan, receipt-derived visible contract, or staged target.

#### Scenario: Candidate palette shadows inherited controls

- **WHEN** a prepared candidate has `overrides/visual-style/color_palette.json`
- **THEN** migration validation uses that palette ahead of a source-version override and backbone palette
- **AND** the receipt set binds every selected candidate and inherited control input

#### Scenario: Candidate asset overlay is receipt-bound

- **WHEN** a candidate sparse asset override adds or replaces one referenced asset ID
- **THEN** the structured plan resolves that candidate asset ahead of inherited catalogs
- **AND** its manifest and bytes are included in the candidate validation receipts

#### Scenario: Arbitrary migration input path is rejected

- **WHEN** a caller attempts to validate a source, palette, asset, or candidate root outside the exact migration projected root
- **THEN** validation fails before source-plan or renderer publication
- **AND** no alternate public validation path is created

#### Scenario: Legacy identity remains stable through preparation

- **WHEN** a markerless source has retained stable IDs that do not all satisfy `mnemonic-v1`
- **THEN** preparation preserves those IDs and omits the mnemonic marker
- **AND** it does not rewrite IDs merely to make the candidate parse
