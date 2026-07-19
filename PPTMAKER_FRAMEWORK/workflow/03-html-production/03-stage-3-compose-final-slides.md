---
stage: workflow/03-html-production
depends_on:
  - workflow/03-html-production/02-stage-2-render-html-pages.md
feeds_into:
  - workflow/03-html-production/04-stage-4-build-the-pptx-container.md
---

# Stage 3: Compose Verified Final Slides

Open pages sequentially in the pinned Chromium profile, deny every routed resource/navigation/socket, prove bundled font glyph use, verify exact geometry and leaf markers, measure text/SVG bounds, reject overlap/overflow/blank pixels, and capture deterministic 2000 x 1125 PNGs.

Final slides are immutable raw-byte-SHA objects with composition fingerprints and receipts. Effective output updates the delivery manifest and review/contact-sheet evidence; forced fallback is review-only and cannot satisfy delivery.
