## ADDED Requirements

### Requirement: Stage 3 publishes an ID-addressed final-image manifest

Stage 3 SHALL resolve raw input by formal slide ID through the Stage 2 manifest/compatibility adapter and SHALL write new final images with position-independent ID-addressed names. It SHALL atomically maintain `_generated/header_locked/_manifest.json` with exactly one current entry per processed slide ID. Each entry SHALL record the final output path and SHA-256, raw input path and SHA-256, resolved render mode, the header fields/config or deterministic header fingerprint that governs the output, and generation time. Full-page passthrough outputs SHALL be registered under the same contract.

Legacy position-prefixed raw or final filenames SHALL remain readable through an explicit adapter, but Stage 3 SHALL NOT infer current identity or select among files from a directory glob when a manifest mapping is available.

#### Scenario: Body-lock output records complete provenance

- **WHEN** Stage 3 overlays the header for slide `UXGap`
- **THEN** its manifest entry maps `UXGap` to the final image
- **AND** binds the output bytes to the raw-image SHA, resolved mode, and header fingerprint

#### Scenario: Full-page passthrough is registered

- **WHEN** slide `PPTGo` resolves to `full-page`
- **THEN** Stage 3 registers its passthrough final image and byte SHA in the same manifest
- **AND** downstream assembly does not need a separate filename rule for that mode

#### Scenario: Reorder preserves final artifact

- **WHEN** an unchanged slide is reordered and its raw-image SHA, render mode, and header fingerprint remain current
- **THEN** its ID-addressed Stage 3 artifact remains reusable
- **AND** its old position is not part of the manifest identity or fingerprint

### Requirement: Cross-version final-image reuse verifies the Stage 3 chain

A final image SHALL be materialized from a source version only when stable ID, current resolved mode, current header fingerprint/profile, recorded raw-input SHA, and recorded final-output SHA all match verified source bytes. The target version SHALL receive its own atomically written manifest entry and source-version lineage. A failed check SHALL leave the target entry missing for normal Stage 3 rebuilding.

#### Scenario: Verified final image is retained after reorder

- **WHEN** a retained reordered slide has identical raw and header inputs and both recorded byte hashes verify
- **THEN** the target version receives the final image without recompositing it

#### Scenario: Header input changed

- **WHEN** a retained slide's title or header configuration changes
- **THEN** its header fingerprint differs and the previous final image is not materialized as current
