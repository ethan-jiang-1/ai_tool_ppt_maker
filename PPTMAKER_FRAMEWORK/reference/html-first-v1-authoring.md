# HTML-first v1 structured source — validation-only authoring

`production.pipeline: html-first-v1` is an opt-in structured-source contract. In this framework change it supports local parsing, config/catalog/font preflight, structural source editing, and canonical Stage 1 plan projection only. It does not enable style-master generation, header approval, pilot/build/refresh delivery, browser rendering, screenshots, or PPTX production.

## Canonical source and validation routes

Use exactly `3_versions/vN/slide-specifications.md`. A marked run must not contain any sibling matching `slide-specifications*.md`, including backups. Keep backups under the version `_scratch/` directory.

The three general write-free validation routes are:

```bash
node PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs validate <run-dir>
node PPTMAKER_FRAMEWORK/scripts/03-html-production/stage1_build_inputs.mjs --validate --spec <run-dir>/slide-specifications.md
node PPTMAKER_FRAMEWORK/scripts/03-html-production/unified_pipeline.mjs --run-dir <run-dir> --stage 1 --dry-run
```

Only literal unified Stage 1 without `--dry-run` may publish the rebuildable `_generated/slide_plan.json`:

```bash
node PPTMAKER_FRAMEWORK/scripts/03-html-production/unified_pipeline.mjs --run-dir <run-dir> --stage 1
```

Do not pass `--input`, a second `--spec`, `--out`, `--style-dir`, `--color-palette`, or `--deck-system` for marked direct validation. HTML-first controls always resolve from the canonical run context.

## Marker and slide body

Leading frontmatter must contain the direct mapping below. Do not use anchors, aliases, merges, or tags to construct it.

```yaml
production:
  pipeline: html-first-v1
```

Every physical slide block has exactly one body field. The label, opener, and closer are case-sensitive, unindented, have no trailing spaces, and are adjacent:

````markdown
**SLIDE BODY**:
```yaml
schema_version: 1
family: hero
hero_statement: One explicit statement
```
````

The owned YAML is one closed YAML 1.2 core document. It permits JSON-like mappings, sequences, strings, booleans, null, and finite numbers. It rejects comments, directives/document markers, aliases/anchors/merges, explicit tags, duplicate or unknown keys, unquoted timestamp-like strings, and multiple documents. Put explanatory prose outside the fence.

`TITLE`, optional `KICKER`/`SUBTITLE`, narrative `VISUAL TYPE`, the exact `CONCEPT` bullets `MUST communicate` and `MUST NOT`, and speaker notes remain Markdown-owned. Do not add whole-page-only top-level `render` or per-slide `RENDER MODE`, `IMAGE PROMPT`, or `VISUAL ASSETS` fields to a marked source.

The checked-in example is [the validation fixture](../../tests/fixtures/html-first-v1/source/slide-specifications.md).

## V2 local asset catalogs

HTML-first reads these optional layers by stable asset ID:

- backbone: `2_backbone/visual-style/assets/asset-manifest.yaml`
- sparse version override: `3_versions/vN/overrides/visual-style/assets/asset-manifest.yaml`

Both manifests use `version: 2`. A newly initialized whole-page bundle contains an empty v1 manifest; before opting in, either convert it to:

```yaml
version: 2
assets: {}
```

or delete it when the structured source references no assets. A present v1 manifest is not silently reinterpreted.

Register bytes under the canonical `assets/icons/`, `assets/svg/`, or `assets/reference/` subtree. Each entry declares exact type, metadata, and lowercase SHA-256. Version entries add or replace by ID; an unregistered same-path version file does not override a backbone entry.

SVG is a passive CSS-free subset: one SVG-namespace root, bounded structure, local fragment references only, no DTD/PI beyond an optional XML declaration, scripts, foreign objects/namespaces, style/CSS, animation, event attributes, external/data URLs, or broken/duplicate fragment IDs. SVG used as an inline icon or `icon-composition` fallback must also contain no `<text>`. See the checked-in [catalog fixture](../../tests/fixtures/html-first-v1/catalog/asset-manifest.yaml).

## Local fallback and two-pass selection binding

Every declared `primary_visual` has a real local fallback:

- `asset`: one registered SVG/PNG/JPG;
- `icon-composition`: 1–3 unique registered, text-free SVG icons;
- `abstract-pattern`: `gradient-field`, `line-grid`, or `soft-orbs` where that family permits it.

Optional-visual families omit `primary_visual` when unused; do not write an empty or `none` fallback.

Selection is intentionally two-pass:

1. Author and validate with `selection: null`; run canonical Stage 1 and review the resulting `visual_contract_fingerprint`.
2. After a reviewed local asset exists in the v2 catalog, bind exactly `{asset_id, accepted_for, output_sha256}` and rerun validation/Stage 1.

Fallback integrity is always checked first. Valid selected bytes with a different `accepted_for` are `stale` and use fallback; missing or digest-invalid selected bytes are `broken` and block publication.

## Structural edits and isolated production routes

`ppt_flow slides` preview validates projected source bytes against the current run's effective palette/catalog/font controls. Apply copies version-owned source/overrides to a hidden staged vNext and validates that real staged run before rename. Preview/apply are remote-free and do not publish `_generated/slide_plan.json`.

HTML-first preview, build, local refresh, notes, and structural materialization remain local and provider-free. Whole-page Image2 style-master and generation operations belong only to an explicit `whole-page-image2-v1` / `image2-only` run; optional modern visual-slot refinement uses only `ppt_flow image2` after current delivery and exact authorization. Do not remove the marker to route structured source into the whole-page Image2 pipeline.

After a material `VISUAL TYPE`, `MUST communicate`/`MUST NOT`, primary-visual brief, or geometry change, review and re-bind affected selections. After a material global visual-direction change, update the structured `html_first.image_language` tokens and propagate the changed intent into affected slide concept/brief fields where human review says the page contract changed; do not rely on free-form `deck_system.txt` prose to enter fingerprints implicitly.
