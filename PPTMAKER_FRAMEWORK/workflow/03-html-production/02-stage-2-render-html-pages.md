---
stage: workflow/03-html-production
depends_on:
  - workflow/03-html-production/01-stage-1-resolve-slide-plan.md
feeds_into:
  - workflow/03-html-production/03-stage-3-compose-final-slides.md
---

# Stage 2: Render HTML Pages

Build one inert, self-contained HTML document per selected slide through the closed component registry. Embed only page-used verified fonts/assets, generate charts as validated Node-side SVG, escape authored strings, install fixed CSP, and reject executable or external resources.

Pages are raw-byte-SHA-addressed immutable objects. The current pages manifest carries scope and reset lineage, drops stale/deleted entries, and may be incomplete after a scoped rebuild. No style master, provider credential, arbitrary browser option, or network request is accepted.
