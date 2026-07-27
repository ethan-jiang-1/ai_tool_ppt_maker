---
stage: workflow/01-content
depends_on:
  - workflow/01-content/04-choose-layout-families.md
feeds_into:
  - workflow/01-content/06-iterate-with-version-discipline.md
---

# Create Content Assets

Prefer structured text, metrics, chart data, and local passive assets over prose descriptions of a desired page image. Register optional SVG/PNG/JPEG files in the schema-v2 asset catalog with stable ID, confined path, type, description, usage guidance, and exact SHA-256.

Bind registered IDs only through current Page Authority reference fields or typed icon fields. Keep generated/rejected history out of `1_upstream_raw_material/`; source assets belong in the backbone or version overrides, and Page Authority raw/final evidence remains rebuildable.

Charts are typed source records. Accurate text stays in source and is owned by the selected Pure or Framed Page Authority path.
