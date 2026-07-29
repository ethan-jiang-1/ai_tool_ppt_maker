# Conventions

Use `page-authority-image2-v2` for new source and
`image2-page-authority-v2` after source receipt binding. Each slide has a
mnemonic `slide_id`; it inherits the one version-level `framed` or `pure`
workflow. Do not write `page_authority_default` or `PAGE AUTHORITY` for a v2
slide.

Provider calls require explicit authorization and a receipt-bound raw scope.
Local Framed composition, notes refresh, inspection, and structural preview do
not imply provider authorization. Structural apply is source-only; unresolved
raw work is reported as `needs_render`.

An exact v1 source/state pair is bounded compatibility only. Historical
source/state data is read only through the legacy observer. Do not rename,
migrate, or manually repair it as part of normal work.
