# PPT Maker Harness Framed runtime fonts

This is the sole canonical distribution root for the Harness's required Framed-runtime WOFF2 assets, CSS snapshots, inventory, provenance, copyright notices, and licenses.

`source-sans-3/` contains the normal variable Latin face. `noto-sans-sc/` contains an immutable official Google Fonts CSS/WOFF2 snapshot for Simplified Chinese (`Hans`). `inventory.json` is the machine-readable integrity and coverage authority. Runtime code uses only local relative URLs and does not download fonts.

This contract is separate from Page Image finalization ownership. `@napi-rs/canvas` keeps its existing OTF/TTF or supported system-font fallback behavior; these WOFF2 files do not replace or alter that canvas contract.

The fixed sentinel corpus proves only the checked-in bilingual smoke text. It does not promise arbitrary deck coverage, pixel fit, Traditional Chinese, Japanese, Korean, or full CJK support.
