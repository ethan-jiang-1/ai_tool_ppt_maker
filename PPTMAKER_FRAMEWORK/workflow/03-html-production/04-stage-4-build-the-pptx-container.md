---
stage: workflow/03-html-production
depends_on:
  - workflow/03-html-production/03-stage-3-compose-final-slides.md
feeds_into:
  - workflow/03-html-production/05-stage-5-inject-speaker-notes.md
---

# Stage 4: Build The PPTX Container

Consume exactly one verified provider-neutral `final-slide` per current plan ID in plan order. Do not glob filenames or inspect producer-private HTML/Image2 schemas. HTML delivery requires current reset-bound content/visual review evidence and effective-only final slides.

Publish assembly schema v2 atomically with ordered IDs, final-slide fingerprints/SHAs, PPTX SHA, delivery digest, and current HTML reset ID. Explicit whole-page legacy uses its explicit artifact adapter and cannot bypass an HTML gate through artifact mode.
