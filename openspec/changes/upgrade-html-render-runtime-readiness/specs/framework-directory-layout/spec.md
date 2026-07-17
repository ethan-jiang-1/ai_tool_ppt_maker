## ADDED Requirements

### Requirement: scripts/fonts is the canonical distributed-font and license root

`PPTMAKER_FRAMEWORK/scripts/fonts/` SHALL be the canonical soft-bundle root for framework-distributed font binaries used by the HTML runtime, original and local CSS snapshots, integrity/coverage inventory, provenance, copyright notices, and license texts. The tree MAY contain family-specific and license subdirectories beneath `scripts/fonts/`; it SHALL NOT add a sixth top-level `PPTMAKER_FRAMEWORK/` directory and SHALL NOT define or write font assets inside a `deck_*` run bundle.

The active fonts README SHALL distinguish required HTML-runtime WOFF2 assets from the existing optional Stage-3 canvas/system-font fallback behavior. Every active path reference SHALL resolve to `scripts/fonts/`, and tests SHALL reject a second canonical font-distribution location.

#### Scenario: Maintainer locates distributed HTML fonts

- **WHEN** a maintainer follows framework documentation for the HTML runtime font profile
- **THEN** the binaries, CSS snapshots, inventory, provenance, and license files are all discoverable under `PPTMAKER_FRAMEWORK/scripts/fonts/`
- **AND** no remote-font or run-bundle path is presented as canonical

#### Scenario: Framework root layout remains unchanged

- **WHEN** the distributed font tree is added
- **THEN** `PPTMAKER_FRAMEWORK/` still has exactly the existing five top-level subdirectories
- **AND** all new font subdirectories are descendants of `scripts/fonts/`

#### Scenario: Stage 3 and HTML font contracts are not conflated

- **WHEN** a reader opens `scripts/fonts/README.md`
- **THEN** it identifies the checked-in WOFF2 profile as required for HTML runtime readiness
- **AND** separately explains that legacy `@napi-rs/canvas` font resolution may require supported OTF/TTF assets or its existing system fallback

#### Scenario: Duplicate font authority is rejected

- **WHEN** an active framework document or runtime helper defines another canonical directory for distributed HTML fonts/licenses
- **THEN** documentation/layout coherence validation fails
