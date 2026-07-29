# Workflow

New authoring uses the exact `page-authority-image2-v2` /
`image2-page-authority-v2` pair. Before provider work, a human records one
version workflow: `framed` or `pure`. The workflow is source- and state-bound;
it is never inferred from a slide, artifact, directory, or deck type.

```text
01-content + 02-visual-system
              |
03-framed-image XOR 04-pure-image
              |
          05-delivery
              |
          06-iteration
```

1. Establish source truth, run-bundle identity, and one version workflow.
2. Author and validate the v2 Page Authority source with stable slide IDs.
3. Configure the closed visual-language and reference systems.
4. Run only the selected Framed or Pure workflow's semantic rules and typed raw
   plan; authorize and review nonzero provider work through the shared raw owner.
5. Have the selected workflow publish the common final-slide manifest.
6. Use `05-delivery` for final projection, slide-canvas PPTX assembly, source-owned
   notes injection, and delivery review.
7. Use `06-iteration` to choose the smallest owner-valid refresh or structural
   vNext path.

Framed Text Frame-only work is provider-free only when exact accepted raw
evidence and frame preset remain current. Pure visible display work, and Framed
preset/underlay/visual changes, rebuild raw. Notes-only work belongs to
delivery. `slide_id` is stable cross-version identity; `position` belongs only
to the current snapshot. Structural work, including a Framed/Pure switch, is
previewed and exact-hash applied before any target materialization.
`_generated/` is never edited by hand.

The exact v1 `page-authority-image2-v1` / `image2-page-authority` mixed pair is
bounded compatibility for existing runs. Other historical source/state pairs
are observable only through the provider-free adoption transaction. Neither
route becomes a new authoring workflow or silently coerces a version to v2.
