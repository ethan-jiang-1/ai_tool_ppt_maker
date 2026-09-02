# Conventions

Use `page-image-workflow` for new source; the version-level `framed` or `pure`
selection and its State record are owned by `../../charter/NODE-SPEC.md` and the
`node-specification` capability. Each slide has a
mnemonic `slide_id`; it inherits the one version-level workflow.

Provider calls require explicit authorization and a receipt-bound raw scope.
Local Framed composition, notes refresh, inspection, and structural preview do
not imply provider authorization. Structural apply is source-only; unresolved
raw work is reported as `needs_render`.

An unsupported source/state pair is byte-preserving and stops at the generic
`repair-current-protocol-identity` action. Do not rename, infer, or manually repair
it as normal work.
