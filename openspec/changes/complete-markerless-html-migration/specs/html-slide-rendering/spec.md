## ADDED Requirements

### Requirement: Migration-preview context is issued from one validated candidate overlay

Only the migration adapter MAY request a migration-preview renderer context. It SHALL obtain that context from the HTML contract's closed candidate-overlay validation result, bind the anticipated target logical version and null reset ID, and publish only beneath the exact candidate's `_scratch/html-migration/projected-run/_generated/html_production/` owners. Callers SHALL not supply an alternate publication root, source, palette, asset catalog, receipt set, or logical target path.

The context SHALL bind the same effective candidate source, candidate overrides, inherited source-version overrides, and backbone receipts that preview plan/apply revalidation use. Candidate visual controls and assets SHALL therefore affect preview bytes exactly as they affect a hidden target constructed from the same inherited inputs after its candidate overlay is staged. Renderer output fingerprints SHALL remain independent of physical scratch/canonical publication paths and scope, while manifests and diagnostics remain scope-bound. Scratch output SHALL remain comparison evidence only and SHALL never be copied or relabeled as target output.

#### Scenario: Overlay preview equals hidden target inputs

- **WHEN** a candidate palette or asset override changes a complete migration preview
- **THEN** the migration context renders from that effective overlay
- **AND** apply can reproduce the same output only by revalidating and overlaying the same inputs in the hidden target

#### Scenario: Caller cannot forge an overlay context

- **WHEN** a caller passes a hand-built candidate path, receipt, publication root, or relabeled canonical context
- **THEN** context issuance fails before lock or object creation
- **AND** no scratch or canonical manifest is mutated
