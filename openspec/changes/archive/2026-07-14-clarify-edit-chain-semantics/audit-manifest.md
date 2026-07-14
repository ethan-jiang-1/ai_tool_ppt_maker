# Active Terminology Audit Manifest

Checked on 2026-07-14 for change `clarify-edit-chain-semantics`.

## Compatibility registries

- [x] `openspec/config.yaml`: every former alias is paired with its canonical English name in the same table row.
- [x] `PPTMAKER_FRAMEWORK/charter/WORKFLOW.md`: every former alias is paired locally; Structural Versioning Path is explicitly outside the three peer refresh paths.
- [x] `PPTMAKER_FRAMEWORK/reference/glossary.md`: every former alias is paired locally and defined by ownership/stale artifact.
- [x] `PPTMAKER_FRAMEWORK/scripts/change-classifier.md`: every former alias is paired locally; operational examples below the registry use canonical terms only.
- [x] Governing main capability requirements pair any compatibility alias locally with its canonical English term.

## Active operational guidance

- [x] Root/framework entry docs and charter guidance use canonical terms or natural-language intent.
- [x] `COMMANDS.md` and all iteration controllers separate intent route, Structural Versioning Path, and resolved refresh path.
- [x] Production/setup/iteration/reference Markdown contains no bare editing-path alias.
- [x] Code comments and behavior-test descriptions contain no bare editing-path alias.
- [x] The tracked project `deck-guide.md` contains neutral smallest-refresh-path language and required no edit.
- [x] Main specs for `framework-charter`, `commands-reference`, `pipeline-orchestration`, `playbook-execution`, and `cli-surface` are synced to canonical terminology.

## Semantic closure

- [x] Add/delete/reorder enters Structural Versioning Path before affected-slide refresh.
- [x] Header text/Stage-3-owned overlay style may use Header Text & Style Refresh only when the raw-image contract is unchanged.
- [x] Full-page headers, image-owned body text/data, safe-zone changes, and render-mode changes use Generated Image Rebuild.
- [x] Raw `unified_pipeline --only` is documented as scope-only; existing-image rebuild examples add `--force-images` or use the public forced visual-refresh route.
- [x] Full-page title guidance preserves pilot, header review, and reviewed-image reuse.
- [x] Structural Versioning Path is not presented as a fourth peer refresh path.

## Historical exclusions

- [x] `PPTMAKER_FRAMEWORK/reference/version-log.md` remains unchanged as a historical record.
- [x] Archived OpenSpec changes remain unchanged as historical records.
- [x] Unrelated migrate/import A/B/C strategy choices remain valid and are not treated as editing-path aliases.
