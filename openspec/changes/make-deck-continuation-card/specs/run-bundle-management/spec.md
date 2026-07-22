## MODIFIED Requirements

### Requirement: Init creates an optional portable run-bundle locator

`initBundle` and `ppt_flow init` SHALL create `<deck-root>/RUN_BUNDLE.md` only if it is absent.
The producer SHALL write a closed `pptmaker-run-bundle-v1` frontmatter record containing a
normalized absolute `deck_root`, normalized absolute `framework_root`, and normalized POSIX
`framework_relation` measured from those actual init roots. The body SHALL give a plain-language
handoff invitation and state that current workflow facts are state/status-owned.

The manifest is static and local-only: it SHALL not include current version/mode/node/gate,
digest, command menu, or authority. `deck-guide.md` SHALL continue to receive its operating
guide seed rather than this locator content. Existing cards and guides are create-if-absent;
status, build, and structure check never rewrite either. `checkBundle --check <run-dir>
--structure-only` remains a zero-write exact-version check and neither validates attachment
provenance nor selects a deck or version.

#### Scenario: External deck receives direct local anchors
- **WHEN** init creates a legal `deck_*` outside the framework tree
- **THEN** `RUN_BUNDLE.md` names that exact absolute deck root and framework root
- **AND** its relation is measured rather than hard-coded

#### Scenario: Existing bundle is not silently migrated
- **WHEN** an existing bundle has no card or has a user-owned existing card
- **THEN** ordinary commands retain its bytes unchanged
- **AND** legacy structure validation remains compatible
