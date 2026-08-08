# Workflow

New authoring uses the exact `page-image-workflow-v1` /
`image2-page-workflow-v1` pair. Before provider work, a human records one
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
2. Author and validate the Page Image Workflow source with stable slide IDs and its closed Provider Content Schema.
3. Configure the closed visual-language and reference systems.
4. Run only the selected Framed or Pure workflow's semantic rules and typed raw
   plan; authorize and review nonzero provider work through the shared raw owner.
5. Have the selected workflow publish the common final-slide manifest.
6. Use `05-delivery` for final projection, slide-canvas PPTX assembly, source-owned
   notes injection, and delivery review.
7. Use `06-iteration` to choose the smallest owner-valid refresh or structural
   vNext path.

Framed header-overlay refresh is provider-free only when compiled provider input,
protected geometry, raw contract, and local header profile remain exact. Any
provider-visible or header-literal change rebuilds raw. Notes-only work belongs to
delivery. `slide_id` is stable cross-version identity; `position` belongs only
to the current snapshot. Structural work, including a Framed/Pure switch, is
previewed and exact-hash applied before any target materialization.
`_generated/` is never edited by hand.

A v2 source/state pair is a byte-preserving
unsupported-protocol hard-stop. Normal observation and production commands do
not infer a workflow, decode it, or modify it; export is the only immediate
action.
