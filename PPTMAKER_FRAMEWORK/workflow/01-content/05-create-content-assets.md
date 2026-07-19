---
stage: workflow/01-content
depends_on:
  - workflow/01-content/04-choose-layout-families.md
feeds_into:
  - workflow/01-content/06-iterate-with-version-discipline.md
---

# Create Content Assets

Prefer structured text, metrics, chart data, and local passive assets over prose descriptions of a desired page image. Register optional SVG/PNG/JPEG files in the schema-v2 asset catalog with stable ID, confined path, type, description, usage guidance, and exact SHA-256.

Bind IDs from `primary_visual.fallback` or typed icon fields. Keep generated/rejected history out of `1_upstream_raw_material/`; source assets belong in backbone or version overrides, and generated HTML/PNG objects remain rebuildable.

Charts are typed data records rendered locally through the closed ECharts adapter. Accurate text stays in source and is rendered with bundled fonts.
