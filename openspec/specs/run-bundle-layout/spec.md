## Purpose

Define the canonical **run bundle** (`deck_{NAME}/`) directory ontology: three-tier tree, per-directory roles, structure gradient (上严下松 / upper-strict lower-loose), and GREP-friendly placement index (Where Map in `reference/glossary.md`).

Counterpart to `framework-directory-layout` (soft bundle `PPTMAKER_FRAMEWORK/` only). Do not merge the two.

Machine authority for tree text and path constants: `PPTMAKER_FRAMEWORK/scripts/shared/run-bundle/bundle_layout.mjs` (`renderTree()`). CLI scaffold/validate behavior is owned by `run-bundle-management` on the same module.
## Requirements

### Requirement: Structure gradient upper-strict lower-loose

Run-bundle layout SHALL follow **stricter toward the root, looser toward the leaves** (上严下松 / structure gradient): deck root admits only constitutionally named control files and first-class directories; mid-tier dirs remain whitelist-bound; a version dir admits source + `overrides/` + `_generated/` + `_scratch/`; `_scratch/` internals are not filename-whitelisted. Temporary files SHALL sink down into `_scratch/` and SHALL NOT be placed at the deck root or in invented dirs named `_tmp/`, `backup/`, or `_bak/`.

#### Scenario: Gradient names root strictest and scratch loosest

- **WHEN** Agent reads the structure-gradient / 上严下松 definition under this capability or its Where Map
- **THEN** the text states the deck root is the strictest layer
- **AND** version `_scratch/` is the official loose temp outlet

### Requirement: Run-bundle root admits an agent-agnostic generated entry control
The canonical strict deck root SHALL admit RUN_BUNDLE.md and AGENTS.md alongside CLAUDE.md and deck-guide.md without loosening any other root name. RUN_BUNDLE.md is a static locator manifest; deck-guide.md is the operating guide; AGENTS.md and CLAUDE.md are short pointers to locator then guide. None claims current run version, mode, node, gate, digest, next action, or approval. The root-control validator is shared by structure checking and locator verification and neither reads state nor selects a version.

An older bundle may physically lack a newer locator or Agent card without failing structure-only validation. That tolerance is layout-only: it SHALL not establish current source/state identity, select a run, permit resume, or trigger a write. State-aware commands classify unsupported protocol separately and return one bounded owner-issued typed next action.

#### Scenario: Optional historical card is not execution authority
- **WHEN** an existing bundle lacks RUN_BUNDLE.md or AGENTS.md
- **THEN** structure validation may report its layout without mutation
- **AND** no state/resume command treats that absence or presence as current run authority
### Requirement: Page Authority artifacts have canonical rebuildable owners
Run-Bundle Layout SHALL declare canonical Page Authority ownership for the visual-language/reference
sources, resolved receipt, raw manifest, raw-review projection and coverage, final manifest, and final
projection under the existing deck/version topology. Raw, final, and review outputs SHALL remain
rebuildable derived artifacts under the version leaf; source/state ownership SHALL not be inferred from
their paths, names, or presence.

A raw-review projection SHALL be stored as its actual PNG bytes in that version's derived review
owner. Its coverage record SHALL reference the current source epoch, projection PNG SHA-256, the shared
projection/capture-profile digest, the selected workflow's typed review-contribution digest, and the
exact covered raw byte identities. A Framed contribution SHALL in turn bind its canonical render
profile and generic safe-zone guides. These identities SHALL NOT be collapsed into one ambiguous
renderer-profile field, inferred from a filename, copied into metadata mirrors, or replaced by a final
projection path.

Source state SHALL own only the version-scoped acceptance reference, not a duplicate provider payload,
page layout proof, workflow contribution artifact, or second evidence ledger.

#### Scenario: Derived Page Authority evidence can be rebuilt
- **WHEN** a current Page Authority derived raw, final, or review artifact is deleted
- **THEN** layout validation identifies its canonical rebuild owner
- **AND** no user edits the derived file or treats it as source authority

#### Scenario: Review profile identities remain distinct

- **WHEN** a Framed raw-review projection is materialized
- **THEN** coverage separately binds the shared projection/capture profile and the Framed workflow contribution that includes its render profile
- **AND** neither identity is inferred from the projection path or substituted for the provider generation profile

### Requirement: Current generated ownership is Page Authority-only
Canonical run-bundle layout SHALL assign current raw, review, final, projection, PPTX, and notes artifacts to v2 Page Authority owners. Foreign generated trees SHALL not be selected as current artifacts or execution authority.

#### Scenario: A current path is resolved
- **WHEN** a Page Authority operation resolves generated paths
- **THEN** it receives v2 Page Authority owner paths and no foreign owner path
