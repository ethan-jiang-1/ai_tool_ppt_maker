---
title: Example — Page Image Version Evolution
stage: workflow/01-content
position: example
type: reference
summary: How source ownership, stable IDs, and receipt evidence evolve across versions.
depends_on:
- workflow/01-content/06-iterate-with-version-discipline.md
feeds_into:
- workflow/06-iteration/README.md
agent_action: reference
---

# Example — Page Image Version Evolution

This example follows one Framed Page Image Workflow version so its evidence owner stays clear.
It focuses on why evidence becomes stale and which current owner must rebuild
it. Switching the version to Pure is always a separate structural vNext.

## v1: Establish Source And Visual Language

- Twelve slides use mnemonic IDs and Page Image source fields.
- Every slide has a reviewable claim and a registered visual brief.
- Framed slides use Provider-rendered body content plus a local transparent header overlay; Pure slides use Provider-rendered headers too.

## v2: Framed Header Revision

- `PainGo` changes only its title and subtitle.
- The compiled provider input changes, so the edit uses Generated Image Rebuild.
- Final, assembly, notes, and delivery evidence are rebuilt for the current version.

## v3: Raw Contract Revision

- `ProofGo` changes its visual brief and reference profile.
- The source uses Generated Image Rebuild: plan, authorization when nonzero work is
  selected, generation, raw review, finalization, and delivery review.

## v4: Structural Simplification

- Two filler slides are removed and the recommendation block is reordered.
- Preview shows position, stable ID, title, before/after, and an exact plan hash.
- Confirmed apply publishes a clean target. It may materialize permitted
  target-owned raw bytes, but it never copies acceptance, authorization, final,
  notes, or delivery evidence.

## Cross-Version Rules

1. Fix source, never `_generated/`.
2. Rebuild the smallest stale Page Image owner.
3. Show current artifacts before human decisions.
4. `needs_render` is a target raw-generation debt, never authorization.
