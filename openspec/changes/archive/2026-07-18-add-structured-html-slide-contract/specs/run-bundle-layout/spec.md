## ADDED Requirements

### Requirement: Structured source control remains inside the existing run-bundle topology

Opt-in HTML-first source SHALL remain the canonical `3_versions/vN/slide-specifications.md`. Shared assets/v2 catalog SHALL remain under `2_backbone/visual-style/assets/`; sparse version assets/v2 catalog SHALL remain under `3_versions/vN/overrides/visual-style/assets/`. Every plan/diagnostic `run` path SHALL be a normalized POSIX path relative to this deck/run-bundle root, never an absolute path or a version-relative `../../` traversal. `bundle_layout.mjs` SHALL apply the existing canonical assets-entry whitelist to both layers while permitting the sparse version subtree; manifest semantics and byte integrity remain owned by `visual-asset-management`. The existing physical slide-block order SHALL remain the sole order source. This change SHALL not add another source/control directory, write HTML pages/screenshots/PPTX, or add Image2 refinement directories.

#### Scenario: Structured source uses canonical version paths

- **WHEN** a run bundle opts into `html-first-v1`
- **THEN** its structured source remains under the canonical version source/control locations
- **AND** bundle self-check accepts the layout without a new top-level directory

#### Scenario: Sparse version assets use the canonical assets shape

- **WHEN** a version-local v2 manifest and registered bytes live under `overrides/visual-style/assets/`
- **THEN** bundle self-check applies the same allowed immediate asset entries as the backbone assets directory
- **AND** it does not treat an unregistered same-path file as an override authority

#### Scenario: Generated outputs remain absent

- **WHEN** `ppt_flow validate` validates the structured contract before Change 3
- **THEN** no generated file or directory is created or changed
- **AND** no legacy page prompt, `_generated/html_production`, screenshot, PPTX, or Image2 candidate output is created

#### Scenario: Stage 1-only writes one rebuildable projection

- **WHEN** canonical `unified_pipeline --run-dir <run-dir> --stage 1` without `--dry-run` processes a valid structured contract
- **THEN** it atomically replaces only the existing `_generated/slide_plan.json` projection
- **AND** it creates no legacy page prompt/twin or downstream production output

### Requirement: Derived contract artifacts are rebuildable

Any resolved plan, merged catalog, diagnostic, or fingerprint evidence produced by the contract SHALL be rebuildable from canonical `slide-specifications.md`, the one effective visual config, v2 manifests and registered asset bytes, checked-in `PPTMAKER_FRAMEWORK/scripts/contracts/html-family-geometry-v1.json`, and the verified framework font authority. The existing `_generated/slide_plan.json` MAY carry the resolved plan but SHALL not become an order/content/selection source of truth.

#### Scenario: Deleting derived contract output is safe

- **WHEN** a derived structured-plan receipt is deleted
- **THEN** the next canonical write-enabled unified Stage 1 rebuilds it from canonical source/control/framework inputs
- **AND** no source or slide order is lost
