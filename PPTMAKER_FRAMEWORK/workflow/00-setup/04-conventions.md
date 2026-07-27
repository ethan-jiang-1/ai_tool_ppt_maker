# Conventions

Use `page-authority-image2-v1` for new source and `image2-page-authority` in
current state. Each slide has a mnemonic `slide_id` and one Page Authority
owner: `pure-image2` or `framed-image2`.

Provider calls require explicit authorization and a receipt-bound raw scope.
Local Framed composition, notes refresh, inspection, and structural preview do
not imply provider authorization. Structural apply is source-only; unresolved
raw work is reported as `needs_render`.

Historical source/state data is read only through the legacy observer. Do not
rename, migrate, or manually repair it as part of normal work.
