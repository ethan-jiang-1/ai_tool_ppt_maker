---
stage: workflow/01-content
depends_on:
  - workflow/01-content/02-build-narrative-arc-blocks.md
feeds_into:
  - workflow/01-content/04-choose-layout-families.md
---

# Specify Page Image Slides

Do not start by hand-writing page order. Read the current Story Outline and
Design Constraints, select from the current Visual Language registry, then prepare
one Agent-authored page-grouping candidate. Preview it with `ppt_flow slides
narrative-plan <run-dir> --candidate <path>` and present the resulting page plan
to the Deck Author. After that content and structure confirmation, materialize only
the matching plan with `slides apply-plan <run-dir> --plan <path> --apply
--plan-sha256 <hash>`.

When a Story Outline, Design Constraints document, or candidate is malformed,
repair that direct input and run a new preview; never hand-edit a derived plan.
When the plan is stale because any bound source, candidate bytes, identity, target,
or hash changed, it is a hard-stop: regenerate the candidate and present the new
exact plan before materialization. Neither operation creates provider work.

Each slide heading carries a 5–8 character mnemonic ID with exactly two BlockCase
chunks. Author the header literals, closed `SLIDE BODY.items`, one closed fenced
`VISUAL BRIEF`, and speaker notes for that stable ID.

Set `production.workflow: framed|pure` once in the version frontmatter; every
slide inherits it. Both policies bind Provider-rendered body content; Framed
adds only a transparent local header overlay. Do not add a slide-specific workflow field; a
Framed/Pure switch is a Structural Versioning Path decision.

For a page whose narrative role may benefit from it, the Agent may recommend
one `PAGE CLASS`: `opening`, `transition`, or `closing`. The author chooses
whether to write it; omission silently means `standard`. It is neither inferred
from position/content nor a confirmation, acceptance, or authoring gate. Page
Class is the only per-page presentation selector, never a per-page workflow.

Do not put visual selections in Design Constraints, or page class, geometry, and
density policy in either narrative source. Do not author arbitrary markup,
coordinates, local rendering controls, free-form provider prompts, or hand-edited
derived artifacts. Validate after each meaningful edit; source order controls the
snapshot while IDs preserve slide-local identity.
