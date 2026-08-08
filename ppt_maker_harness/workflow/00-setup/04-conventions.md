# Conventions

Use `page-image-workflow-v1` for new source and
`image2-page-workflow-v1` after source receipt binding. Each slide has a
mnemonic `slide_id`; it inherits the one version-level `framed` or `pure`
workflow. A version source records only its one workflow selection.

Provider calls require explicit authorization and a receipt-bound raw scope.
Local Framed composition, notes refresh, inspection, and structural preview do
not imply provider authorization. Structural apply is source-only; unresolved
raw work is reported as `needs_render`.

An unsupported source/state pair is byte-preserving and stops at the generic
export action. Do not rename, infer, or manually repair it as normal work.
