## ADDED Requirements

### Requirement: Stage 3 publishes an ID-addressed final-image manifest

Stage 3 SHALL resolve a `verified` raw input by formal slide ID, render engine, and `raw-render` kind through the Stage 2 manifest/compatibility adapter and SHALL write new final images with position-independent ID-addressed names. It SHALL atomically maintain `_generated/header_locked/_manifest.json` with exactly one current entry per processed `(slide_id, render_engine, "final-slide")` key. Each entry SHALL record artifact kind, engine, the final output path and SHA-256, raw input path and SHA-256, resolved render mode, the header fields/config or deterministic header fingerprint that governs the output, and generation time. Full-page passthrough outputs SHALL be registered under the same contract.

Legacy position-prefixed raw or final filenames SHALL remain locatable through an explicit adapter, but only provenance-complete entries SHALL be `verified`. Stage 3 SHALL NOT infer current identity or select among files from a directory glob when a manifest mapping is available, and SHALL NOT consume a merely `legacy-located` raw input as current.

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

### Requirement: Target versions rebuild Stage 3 locally from verified raw inputs

This change SHALL NOT materialize Stage 3 final images across versions. After a verified expensive raw render is materialized into a target version, Stage 3 SHALL recompute the local final/header-lock output and atomically publish a target-owned `final-slide` manifest entry using current source/header inputs. This keeps cheap output derivation and provenance local to the target. A missing or unverified raw input SHALL stop Stage 3 for that ID and report the upstream `needs_render` prerequisite; Stage 3 SHALL NOT invoke a remote renderer.

#### Scenario: Verified raw image is recomposited after reorder

- **WHEN** a retained reordered slide has a verified target-owned raw image and unchanged current header inputs
- **THEN** target Stage 3 recomputes and publishes the final image locally
- **AND** does not copy a source-version final image as current

#### Scenario: Header input changed

- **WHEN** a retained slide's title or header configuration changes
- **THEN** target Stage 3 uses the new header fingerprint for its local rebuild
- **AND** the previous version's final artifact remains isolated

#### Scenario: Legacy-located raw image blocks final publication

- **WHEN** the adapter can locate a raw file but cannot verify its current kind, engine, fingerprint, and bytes
- **THEN** Stage 3 does not publish a current final manifest entry for that input
- **AND** reports that the raw render must be explicitly rebuilt or otherwise proven
