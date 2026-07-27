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

### Requirement: Legacy adoption candidates remain source-local and non-derived
Run-Bundle Layout SHALL reserve `_scratch/production-mode-transition/candidate-run/` as the only
candidate root for a legacy adoption. In addition to the existing target selection, intake, source,
identity ledger, and target-owned overrides, an adoption candidate SHALL contain one regular
`adoption-matrix.json`. The matrix is source control for the transaction only; it is not a generated
artifact, a target raw manifest, or a second version ledger. The candidate root SHALL reject symlinks,
arbitrary external paths, old migration overlays, and any legacy prompt, image, raw manifest, review,
provider authorization, execution record, PPTX/notes receipt, or delivery record.

The visible Page Authority target SHALL contain only canonical target source/control files, normal empty
derived owners, and the target-local transition receipt. It SHALL not copy the candidate matrix, source
scratch, source generated tree, or any legacy production material. Layout observation SHALL keep the
transition scratch readable for exact preview/recovery while never treating a scratch or generated path
as Page Authority source authority.

#### Scenario: Adoption candidate has one closed matrix owner
- **WHEN** layout checks a source version with a prepared legacy adoption candidate
- **THEN** it permits the exact matrix file under the existing candidate root
- **AND** it rejects a matrix, prompt, or image placed in an arbitrary scratch or target generated path

#### Scenario: Published target has no legacy artifact owner
- **WHEN** a legacy adoption target becomes visible
- **THEN** layout recognizes only Page Authority source/control and normal rebuildable derived owners
- **AND** it does not classify copied legacy raw/final/review/delivery material as valid target topology

### Requirement: Page Authority artifacts have canonical rebuildable owners
Run-Bundle Layout SHALL declare canonical Page Authority ownership for the visual-language/reference
sources, resolved receipt, raw manifest, raw review projection and coverage, final manifest, and final
projection under the existing deck/version topology. Raw/final/review outputs SHALL be rebuildable
derived artifacts under the version leaf; source/state ownership SHALL not be inferred from their paths,
names, or presence.

A raw-review projection SHALL be stored as its actual PNG bytes in that version's derived review owner;
its coverage record references the PNG SHA-256 and canonical renderer profile digest, not a filename,
metadata mirror, or final-projection path. Source state owns only the version-scoped acceptance reference,
not a duplicate provider payload or a second evidence ledger.

#### Scenario: Derived Page Authority evidence can be rebuilt
- **WHEN** a current Page Authority derived raw/final/review artifact is deleted
- **THEN** layout validation identifies its canonical rebuild owner
- **AND** no user edits the derived file or treats it as source authority

### Requirement: Current generated ownership is Page Authority-only
Canonical run-bundle layout SHALL assign current raw, review, final, projection, PPTX, and notes
artifacts to Page Authority owners. Historical generated trees are diagnostic-only observer input and
shall not be selected as current artifacts.

#### Scenario: A current path is resolved
- **WHEN** a Page Authority operation resolves generated paths
- **THEN** it receives Page Authority owner paths and no retired owner path
