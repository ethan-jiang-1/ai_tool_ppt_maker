## Why

`generateOneImage` silently accepts calls without a `styleReferencePath` — no log, no indication that the image will be generated without visual style anchoring. BUG-003 identified this as a framework-level gap (item 4 of 4 in the report): while the script-level fixes (items 1–3, removing the unintended `style_master.jpg` reference from `_gen_agent.mjs`) were already applied, the framework itself should make the absence of a style reference visible. Without this, callers — whether production pipelines or scratch experiments — are left guessing about whether their images will carry deck visual style.

## What Changes

- `generateOneImage` in `image_api_client.mjs`: when `styleReferencePath` is not provided, log a single informational line: `"No style reference — generating without visual style anchoring"`.
- Update BUG-003 bug report with resolution notes and archive as BUG-013 in `_backlog/_done/_fixed_bugs/` (renamed to avoid conflict with an unrelated archived BUG-003).

## Capabilities

### New Capabilities

*(none)*

### Modified Capabilities

- `image-generation`: `generateOneImage` SHALL log when proceeding without a style reference, making the absence visible to the caller.

## Impact

- **Code**: `PPTMAKER_FRAMEWORK/scripts/image_api_client.mjs` — one `console.log` line in `generateOneImage`.
- **Output**: callers that intentionally omit a style ref (e.g., `generate_style_master.mjs`, scratch experiments) will see one extra log line; no behavioral change.
- **Tests**: existing tests for `generateOneImage` continue to pass (the log line is purely additive, no API contract change).
