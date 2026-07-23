# Pipeline Script Ownership

Use `ppt_flow.mjs` or `unified_pipeline.mjs` for public orchestration.

| Stage | HTML-first owner | Output |
|---|---|---|
| 1 | `stage1_build_inputs.mjs` | validated structured `slide_plan.json` |
| 2 | `stage2_render_html.mjs` | immutable self-contained HTML pages |
| 3 | `stage3_compose_slides.mjs` | measured verified final-slide PNGs and preview evidence |
| 4 | `stage4_build_pptx.mjs` | provider-neutral PPTX assembly v2 |
| 5 | `stage5_inject_notes.mjs` | stable-ID notes and receipt v3 |

The HTML branch accepts no provider/browser/package/path overrides. Explicit whole-page legacy retains `stage2_generate_images.mjs` and `stage3_lock_headers.mjs` behind its branch adapter; those scripts are not HTML prerequisites.
