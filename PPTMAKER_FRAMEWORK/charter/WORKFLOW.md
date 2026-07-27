# Workflow

The sole current production protocol is `page-authority-image2-v1` with
`image2-page-authority` state. Each stable slide ID selects either `pure-image2`
or `framed-image2`.

1. Establish source truth and run-bundle identity.
2. Author Page Authority source and validate it locally.
3. Configure the closed visual-language, reference, and Text Frame systems.
4. Plan and explicitly authorize raw generation only when raw work is needed.
5. Review raw evidence, finalize Page Authority slides, assemble PPTX, inject notes,
   and record the delivery decision.
6. Classify later changes by the authoritative owner: raw rebuild, Framed-local
   refresh, notes-only refresh, or structural versioning.

`slide_id` is stable cross-version identity; `position` belongs only to the current
snapshot. Structural work is previewed and exact-hash applied before any target
materialization. `_generated/` is never edited by hand.

Historical source/state pairs are observable only through the provider-free adoption
transaction. They never resume a retired production lifecycle.
