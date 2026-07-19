---
stage: workflow/03-html-production
depends_on:
  - workflow/03-html-production/04-stage-4-build-the-pptx-container.md
---

# Stage 5: Inject Speaker Notes

Resolve notes from canonical source by stable slide ID and apply them to the current assembly order. Reorder/delete operations therefore cannot shift notes to another slide.

HTML-first publishes notes receipt schema v3 over the common assembly lineage, PPTX bytes, delivery digest, and current reset ID. Notes-Only Refresh may reuse a fully current eligible assembly; stale or pre-reset receipts fail closed.
