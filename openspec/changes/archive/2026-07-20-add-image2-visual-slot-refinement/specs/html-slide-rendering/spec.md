## MODIFIED Requirements

### Requirement: Valid structured slides produce inert self-contained HTML pages

The renderer module SHALL retain its existing closed canonical `buildHtmlPages(validatedRun, request)` and `composeHtmlSlides(validatedRun, request)` seams, opaque validated-run context, and canonical/migration-preview publication restrictions. It SHALL additionally expose one public review-only visual-slot candidate composition operation. That operation accepts only a framework-validated run, stable slide/slot identity, candidate ID, SHA-bound in-memory raster bytes, and bounded media evidence; it resolves current source geometry internally. It SHALL reject filesystem paths, manifest/profile/provider fields, caller-supplied boxes, publication-root overrides, and delivery variants. It SHALL publish only review-labeled immutable artifacts and SHALL never modify effective HTML-page/final-slide or delivery manifests. Phase 3 SHALL not import Phase 4 or discover candidate directories.

Canonical/migration contexts and ordinary `dryRun` keep their existing authority: candidate comparison is neither canonical delivery nor migration preview, and a caller cannot forge another scope. Family adapters, catalog/source validation, fingerprinting, locks, and delivery manifest construction remain internal.

#### Scenario: Page is complete without a server
- **WHEN** a valid HTML-first plan slide is prepared
- **THEN** the emitted HTML contains every dependency needed for local rendering
- **AND** opening it requires no network, provider, style master, or source re-interpretation

#### Scenario: Phase 4 requests a candidate comparison
- **WHEN** Phase 4 supplies a verified candidate value for one eligible slide/slot
- **THEN** Phase 3 produces a review-only comparison using the resolved HTML geometry
- **AND** current delivery manifest pointers remain unchanged

#### Scenario: Caller supplies a candidate path
- **WHEN** a caller attempts to pass a filesystem path or manifest override to candidate composition
- **THEN** the operation rejects it before reads or writes

#### Scenario: Caller forges a migration publication root
- **WHEN** a caller supplies a path, unbranded context, or canonical context relabeled as migration preview
- **THEN** rendering fails before lock or object creation
- **AND** no alternate publication authority is created
