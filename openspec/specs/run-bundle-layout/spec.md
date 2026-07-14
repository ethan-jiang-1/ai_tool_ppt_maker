## Purpose

Define the canonical **run bundle** (`deck_{NAME}/`) directory ontology: three-tier tree, per-directory roles, structure gradient (上严下松 / upper-strict lower-loose), and GREP-friendly placement index (Where Map in `reference/glossary.md`).

Counterpart to `framework-directory-layout` (soft bundle `PPTMAKER_FRAMEWORK/` only). Do not merge the two.

Machine authority for tree text and path constants: `PPTMAKER_FRAMEWORK/scripts/bundle_layout.mjs` (`renderTree()`). CLI scaffold/validate behavior is owned by `run-bundle-management` on the same module.

## Requirements

### Requirement: Canonical run-bundle tree and directory roles

A conformant run bundle SHALL be rooted at `deck_{NAME}/` and SHALL include: `1_upstream_raw_material/` (shared raw materials), `2_backbone/` (shared metaphor/formula/constraints/outline/manuscript/visual-style), `3_versions/v{n}/` as the version leaf (`--run-dir`) holding `slide-specifications.md`, `overrides/`, `_generated/`, and `_scratch/`, plus deck-root `_state/` (playbook progress) and `_lessons/` (non-secret retained lessons).

Directory roles SHALL include at least:

- `deck_{NAME}/` — run bundle root (strictest layer)
- `3_versions/v{n}/` — `--run-dir` (not the deck root)
- `_scratch/` — version-local temp / `.bak` / drafts; not SSOT; deletable
- `_generated/` — pipeline derived; never hand-edit; rebuildable
- `2_backbone/visual-style/style_master.jpg` — shared visual anchor
- `_generated/preview/*contact_sheet*` — pilot / 小样 preview
- `_state/` — playbook progress
- `_lessons/` — non-secret hard-won notes

`bundle_layout.mjs` `renderTree()` SHALL list these first-class paths (including version `_scratch/`) as the machine-authoritative tree text.

#### Scenario: renderTree lists version _scratch

- **WHEN** Agent inspects `renderTree()` output
- **THEN** the tree text includes `_scratch/` under the version directory

#### Scenario: --run-dir is not the deck root

- **WHEN** glossary or entry docs define `--run-dir`
- **THEN** the path is `deck_*/3_versions/v{n}/`
- **AND** it is distinguished from `deck_*/`

### Requirement: Structure gradient upper-strict lower-loose

Run-bundle layout SHALL follow **stricter toward the root, looser toward the leaves** (上严下松 / structure gradient): deck root admits only constitutionally named control files and first-class directories; mid-tier dirs remain whitelist-bound; a version dir admits source + `overrides/` + `_generated/` + `_scratch/`; `_scratch/` internals are not filename-whitelisted. Temporary files SHALL sink down into `_scratch/` and SHALL NOT be placed at the deck root or in invented dirs named `_tmp/`, `backup/`, or `_bak/`.

#### Scenario: Gradient names root strictest and scratch loosest

- **WHEN** Agent reads the structure-gradient / 上严下松 definition under this capability or its Where Map
- **THEN** the text states the deck root is the strictest layer
- **AND** version `_scratch/` is the official loose temp outlet

### Requirement: Glossary Where Map is the GREP placement index

`PPTMAKER_FRAMEWORK/reference/glossary.md` SHALL provide a **Where Map** section discoverable via `rg` on canonical tokens. The map SHALL use columns for term, path, means, and do-not. Definition headings for placement objects SHALL use the exact searchable token as heading text (for example `### _scratch/`, `### style_master.jpg`, `### --run-dir`). The map SHALL include at least: `run bundle`, `soft bundle`, `--run-dir`, `_scratch/`, `_generated/`, `style_master.jpg`, `contact_sheet` / `pilot`, `_state/`, `_lessons/`. An also-search line MAY map colloquial aliases (`bak`, `temp`, `小样`, `style master`) to canonical tokens. `_scratch/` SHALL be defined as the official version-local temp outlet. `--run-dir` SHALL be distinguished from run bundle.

#### Scenario: rg _scratch hits Where Map definition

- **WHEN** Agent searches for `_scratch` under `PPTMAKER_FRAMEWORK/`
- **THEN** `reference/glossary.md` contains a Where Map row and/or `### _scratch/` stating path `3_versions/v{n}/_scratch/`

#### Scenario: run bundle distinguished from --run-dir in glossary

- **WHEN** Agent reads glossary entries for `run bundle` and `--run-dir`
- **THEN** run bundle is `deck_{NAME}/` and `--run-dir` is `3_versions/v{n}/`
- **AND** the text states they are not the same path

### Requirement: Run-bundle root admits an agent-agnostic generated entry control

The canonical strict deck root SHALL admit `AGENTS.md` as a named control file alongside `CLAUDE.md` and `deck-guide.md`. `AGENTS.md` SHALL be a short agent-agnostic pointer to the guide, not a second workflow or directory ontology. `bundle_layout.mjs` constants, deck-root whitelist, module tree comment, and `renderTree()` SHALL agree on this control file.

Legacy run bundles without `AGENTS.md` SHALL remain structurally valid. A manually added unknown root file remains invalid; adding `AGENTS.md` to the whitelist SHALL NOT loosen other root rules.

#### Scenario: Canonical tree shows both Agent entry controls

- **WHEN** Agent inspects `renderTree()`
- **THEN** deck root includes `AGENTS.md` and `CLAUDE.md`
- **AND** both point conceptually to `deck-guide.md`

#### Scenario: Legacy deck remains valid

- **WHEN** an existing conformant run bundle lacks `AGENTS.md`
- **AND** structure validation runs
- **THEN** absence of that optional compatibility control alone does not fail validation

### Requirement: Visual-style directory optionally includes assets subdirectory

The canonical `2_backbone/visual-style/` directory MAY contain an `assets/` subdirectory. When present, it SHALL contain `asset-manifest.yaml`, `svg/`, `reference/`, and `icons/`. `renderTree()` SHALL include this subtree in its output regardless of whether a given deck has populated it — the tree describes the canonical structure, not runtime state. The whitelist `_ALLOWED_IN_VISUAL_STYLE` SHALL include `assets` as an allowed entry so that decks with assets pass validation. A new whitelist `_ALLOWED_IN_ASSETS` SHALL define the allowed contents of the `assets/` directory. Decks without an `assets/` directory SHALL pass `checkBundle()` without error — the directory is optional infrastructure.

#### Scenario: renderTree shows assets directory

- **WHEN** Agent inspects `renderTree()` output
- **THEN** the tree includes `assets/` under `visual-style/`
- **AND** includes `asset-manifest.yaml`, `svg/`, `reference/`, and `icons/`

#### Scenario: Assets directory is whitelisted in visual-style

- **WHEN** `checkBundle()` validates a deck with an `assets/` directory under `visual-style/`
- **THEN** the `assets/` directory itself passes validation (is in the whitelist)
- **AND** only canonical entries inside `assets/` are accepted

#### Scenario: Deck without assets directory passes validation

- **WHEN** `checkBundle()` validates a deck that has no `assets/` directory under `visual-style/`
- **THEN** validation passes without error
- **AND** no "missing assets directory" message is emitted

#### Scenario: Unexpected entry in assets directory is flagged

- **WHEN** a run bundle has a manually created unexpected file in `visual-style/assets/`
- **THEN** `checkBundle()` reports it as an unexpected entry

### Requirement: Path resolvers provide assets directory access

`bundle_layout.mjs` SHALL export `assetsDir(runDir)` resolving to the assets directory path (via `resolveBackboneAsset`, checking override first). It SHALL also export `resolveAssetPath(runDir, relpath)` resolving a relative path from the assets directory. Both SHALL follow the existing override-first-then-backbone resolution pattern.

#### Scenario: assetsDir resolves to backbone by default

- **WHEN** `assetsDir(runDir)` is called on a version with no asset overrides
- **THEN** the returned path is `{deckRoot}/2_backbone/visual-style/assets/`

#### Scenario: resolveAssetPath follows override-first pattern

- **WHEN** `resolveAssetPath(runDir, "svg/diagram.svg")` is called
- **AND** a version override exists at `3_versions/v{n}/overrides/visual-style/assets/svg/diagram.svg`
- **THEN** the override path is returned, not the backbone path

