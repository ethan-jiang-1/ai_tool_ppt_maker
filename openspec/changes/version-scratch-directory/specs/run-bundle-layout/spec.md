## Purpose

Define the canonical **run bundle** (`deck_{NAME}/`) directory layout: tier tree, per-directory roles, structure gradient (上严下松 / upper-strict lower-loose), and GREP-friendly placement discoverability (Where Map). Machine SSOT remains `PPTMAKER_FRAMEWORK/scripts/bundle_layout.mjs`. This capability is the run-bundle counterpart to `framework-directory-layout` (which covers **only** the soft bundle `PPTMAKER_FRAMEWORK/`). Do **not** merge the two.

Ops that scaffold or validate a deck (`--init`, `--check`, `--new-version`, `--self-check`) remain under `run-bundle-management`. Entry docs that mirror or point at this layout remain under `framework-charter`. Agent placement behavior remains under `playbook-execution`.

## ADDED Requirements

### Requirement: Run-bundle layout is distinct from framework-directory-layout

The run-bundle folder ontology (`deck_{NAME}/` tiers, version leaf, `_scratch/`, `_generated/`, `_state/`, `_lessons/`, …) SHALL be specified under this capability (`run-bundle-layout`). `framework-directory-layout` SHALL continue to describe only `PPTMAKER_FRAMEWORK/` and SHALL NOT be extended to define `deck_*` trees. Requirements authors SHALL NOT place run-bundle folder-definition requirements exclusively under soft-bundle layout.

#### Scenario: Soft-bundle layout capability stays soft-bundle-only

- **WHEN** a reader opens `openspec/specs/framework-directory-layout/spec.md`
- **THEN** its requirements address `PPTMAKER_FRAMEWORK/` paths
- **AND** do not define `deck_*/3_versions/` or `_scratch/` as soft-bundle folders

### Requirement: Canonical run-bundle tree and directory roles

A conformant run bundle SHALL be rooted at `deck_{NAME}/` and SHALL embody the three-tier gradient plus control surfaces: `1_upstream_raw_material/` (shared raw materials), `2_backbone/` (shared metaphor/formula/constraints/outline/manuscript/visual-style), `3_versions/v{n}/` (version leaf = `--run-dir`, holding `slide-specifications.md`, `overrides/`, `_generated/`, `_scratch/`), plus deck-root `_state/` (playbook progress) and `_lessons/` (non-secret retained lessons). `bundle_layout.mjs` `renderTree()` SHALL remain the machine-authoritative tree text. Directory roles:

| Path | Role |
|------|------|
| `deck_{NAME}/` | **run bundle** root (strictest layer) |
| `3_versions/v{n}/` | **`--run-dir`** — version leaf the pipeline operates on |
| `_scratch/` | version-local temp / `.bak` / drafts — not SSOT; deletable |
| `_generated/` | pipeline derived artifacts — never hand-edit; rebuildable |
| `2_backbone/visual-style/style_master.jpg` | shared visual anchor |
| `_generated/preview/*contact_sheet*` | pilot / 小样 preview |
| `_state/` | playbook progress pointer |
| `_lessons/` | non-secret hard-won notes |

#### Scenario: renderTree lists version _scratch

- **WHEN** Agent inspects `renderTree()` output
- **THEN** the tree text includes `_scratch/` under the version directory

#### Scenario: --run-dir is the version leaf not the deck root

- **WHEN** docs or glossary define `--run-dir`
- **THEN** the path is `deck_*/3_versions/v{n}/`
- **AND** it is distinguished from the run-bundle root `deck_*/`

### Requirement: Structure gradient upper-strict lower-loose

Run-bundle layout SHALL follow **stricter toward the root, looser toward the leaves** (上严下松 / structure gradient): deck root admits only constitutionally named control files and first-class directories; mid-tier dirs remain whitelist-bound; a version dir admits source + `overrides/` + `_generated/` + `_scratch/`; `_scratch/` internals are not filename-whitelisted. Agents SHALL NOT invent sibling temp dirs (`_tmp/`, `backup/`, `_bak/`) or place version-scoped backups at the deck root. Temp sinks **down** into `_scratch/`; it SHALL NOT escape **up** to the deck root.

#### Scenario: Gradient discoverable by token

- **WHEN** Agent searches for `structure gradient` or `上严下松` under the soft bundle
- **THEN** glossary Where Map and/or charter text state root is strictest and `_scratch/` is the loose temp outlet

### Requirement: Glossary Where Map is the GREP placement index

`PPTMAKER_FRAMEWORK/reference/glossary.md` SHALL begin with a **Where Map** section that agents can discover via `rg` on canonical tokens. The map SHALL list high-frequency placement objects with columns for term, path, role/means, and do-not. Definition headings for those objects SHALL use the **exact searchable token** as the heading text (e.g. `### _scratch/`, `### style_master.jpg`, `### --run-dir`) so a code agent grepping the soft bundle lands on the definition. The map SHALL include at least: `run bundle`, `soft bundle`, `--run-dir`, `_scratch/`, `_generated/`, `style_master.jpg`, `contact_sheet` / `pilot`, `_state/`, `_lessons/`. An also-search alias line MAY map colloquial terms (`bak`, `temp`, `小样`, `style master`) to canonical tokens. `_scratch/` SHALL be defined as the official version-local temp outlet (not SSOT; not pipeline output; not deck root). `--run-dir` SHALL be explicitly distinguished from run bundle.

#### Scenario: rg _scratch hits glossary definition

- **WHEN** Agent runs a search for `_scratch` under `PPTMAKER_FRAMEWORK/`
- **THEN** `reference/glossary.md` contains a Where Map row and/or a `### _scratch/` definition stating path `3_versions/v{n}/_scratch/` and temp/bak role

#### Scenario: rg style_master hits placement path

- **WHEN** Agent searches for `style_master.jpg` under `PPTMAKER_FRAMEWORK/`
- **THEN** glossary Where Map or heading states path under `2_backbone/visual-style/`

#### Scenario: run bundle distinguished from --run-dir

- **WHEN** Agent reads glossary entries for `run bundle` and `--run-dir`
- **THEN** run bundle is `deck_{NAME}/` and `--run-dir` is `3_versions/v{n}/`
- **AND** the text states they are not the same path
