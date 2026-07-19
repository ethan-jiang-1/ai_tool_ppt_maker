# Scripts — Capability ownership

All scripts are Node.js 22+ ESM. The public `ppt_flow` surface has 14 commands (14 个命令); the executable inventory has 13 direct `.mjs` entries, including `stage2_render_html.mjs` and `stage3_compose_slides.mjs`.

CLI producer envelope and return categories are specified by `openspec/specs/cli-surface/spec.md`; this README only points to that authority and does not copy its schema.

| Capability | HTML-first owner | Legacy owner |
|---|---|---|
| Stage 1 | `stage1_build_inputs.mjs` structured projection | same script legacy branch |
| Stage 2 | `stage2_render_html.mjs` self-contained HTML pages | `stage2_generate_images.mjs` whole-page Image2 |
| Stage 3 | `stage3_compose_slides.mjs` measured PNG final slides | `stage3_lock_headers.mjs` header compatibility |
| Stage 4 | `stage4_build_pptx.mjs` provider-neutral final-slide adapter | same CLI legacy artifact mode |
| Stage 5 | `stage5_inject_notes.mjs` notes-v3 | markerless notes compatibility |
| orchestration | `unified_pipeline.mjs`, `ppt_flow.mjs` branch adapters | isolated legacy adapter |

HTML direct CLIs accept only canonical `--run-dir`, optional `--only`, explicit `--variant`, `--dry-run`, and `--help`; they derive all paths internally. They never load provider credentials or browser/package overrides.

## Deep seams

- `html_slide_renderer.mjs`: opaque validated-run page/composition seam.
- `html_object_store.mjs`: raw-byte-SHA objects and current manifests/locks.
- `html_preview.mjs`: reset-bound review plans/contact sheets.
- `html_review_evidence.mjs`: inspect/recover/publish gate/delivery/reset seam.
- `render_artifacts.mjs`: provider-neutral final-slide contract.
- `state.mjs` + `md_controller_reader.mjs`: schema-v3 state, controller manifest and migration map.

Do not expose private paths, reset/owner IDs, browser internals, provider data, or source prose in diagnostics. `_generated/` and `_scratch/` are rebuildable/transactional, never hand-edited.
