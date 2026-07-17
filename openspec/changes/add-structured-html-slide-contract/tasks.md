## 1. Source Branch and Document Model

- [ ] 1.1 (`content-parsing`, `html-slide-contract`) Define the versioned `production.pipeline: html-first-v1` marker, fenced `SLIDE BODY` YAML grammar, owned source-control location, duplicate/conflict rules, and bounded source diagnostics without changing legacy parsing or new-deck defaults.
- [ ] 1.2 (`html-slide-contract`, `slide-identity-and-ordering`) Implement one structured slide-document parser/model that retains frontmatter, preamble, ordered blocks, speaker notes, epilogue, stable IDs, derived positions, and source locators while preserving non-owned Markdown bytes.
- [ ] 1.3 (`html-slide-contract`) Implement canonical YAML serialization and no-op/edited round-trip behavior limited to the owned fence and deterministic structured references; add fixtures proving legacy source remains byte-compatible.

## 2. Layout Families and Content Preflight

- [ ] 2.1 (`html-slide-contract`) Create the ten-family registry with discriminated names, typed block schemas, required/optional fields, canonical normalized slot geometry, capacity metadata, and fallback rules.
- [ ] 2.2 (`html-slide-contract`) Add deterministic unknown-field, missing-field, domain, cross-field, family, and geometry validation with bounded field-path diagnostics and no renderer/browser dependency.
- [ ] 2.3 (`html-slide-contract`) Implement grapheme-aware and declared word/line capacity preflight plus bilingual sentinel fixtures covering ASCII, Latin accents, punctuation/currency, numerals, Simplified Chinese, and CJK punctuation; label evidence as source capacity only.
- [ ] 2.4 (`visual-config`, `html-slide-contract`) Extend visual config with versioned renderer-neutral typography, spacing, card, chart, callout, and family geometry tokens while preserving legacy canvas/header fields and fingerprints.

## 3. Visual Contract and Asset Resolution

- [ ] 3.1 (`visual-asset-management`, `html-slide-contract`) Implement backbone-first and version-override asset catalog resolution by stable asset ID with path confinement, media metadata validation, SHA evidence, origin-layer retention, and legacy resolver compatibility.
- [ ] 3.2 (`html-slide-contract`, `visual-asset-management`) Implement `primary_visual` and selection resolution with `fallback|selected|stale|broken` states; validate selected and fallback bytes independently and fail closed on missing/unregistered/digest-invalid assets.
- [ ] 3.3 (`html-slide-contract`) Implement semantic and `visual_contract_fingerprint` canonical hashing that includes schema/config/family/content/asset contract inputs but excludes physical position and array order; retain an ordered plan digest separately.
- [ ] 3.4 (`run-bundle-layout`) Add only the canonical source/backbone/version control records required for opt-in structured plans; keep `_generated/` rebuildable, avoid a second order file, and add bundle self-check fixtures rejecting HTML pages, screenshots, PPTX, or Image2 refinement directories from this change.

## 4. Identity, Integration, and Guidance

- [ ] 4.1 (`slide-identity-and-ordering`) Integrate structured plans with the existing stable ID/spoken-key/order resolver and prove reorder/delete preserves identity, notes bindings, historical reservations, and per-slide fingerprints.
- [ ] 4.2 (`content-parsing`, `html-slide-contract`) Add opt-in authoring examples and diagnostics that distinguish legacy prompt source from structured source without advertising browser rendering or switching production defaults.
- [ ] 4.3 (`html-slide-contract`, `visual-asset-management`, `visual-config`) Add focused unit/integration tests for parser round-trip, family validation, bilingual capacity, asset layering, selection states, fingerprint stability, legacy isolation, and generated-artifact boundaries.
- [ ] 4.4 (`html-slide-contract`, `content-parsing`, `visual-asset-management`, `run-bundle-layout`, `slide-identity-and-ordering`) Run full regression tests, relevant structural E2E only where public identity/source boundaries cross, strict OpenSpec validation, and a final scope audit confirming no browser renderer, PPTX/default workflow, Image2 transport/refinement, workflow migration, or run-bundle state migration was implemented.
