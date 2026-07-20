# HTML-first visual assets

Register optional local assets in `asset-manifest.yaml` schema v2 with a stable ID, confined relative path, kind, and exact SHA-256.

- `svg/` stores passive SVG assets.
- `reference/` stores registered PNG/JPEG/WebP assets.
- `icons/` stores registered typed-block icons.

Bind registered IDs from structured slide YAML through `primary_visual.fallback` or a typed block's `icon` field. Do not add legacy `VISUAL ASSETS` fields. An empty catalog is valid.
