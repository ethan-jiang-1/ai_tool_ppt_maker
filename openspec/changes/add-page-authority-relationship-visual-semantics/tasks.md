## 1. Registry Relationship Schema

- [ ] 1.1 Add optional `relationships` parsing to `page_authority_visual_language.mjs`: top-level optional key, per-record keys `provider_clause` (text-guard protected), `authorities`, `recipe_ids`, `composition_ids`, `reading_order` (bounded vocabulary); a registry without `relationships` still parses.
- [ ] 1.2 Add the two seed relationship records (`layer-stack`, `causal-flow`) to the seed registry in `bundle_layout.mjs` with reading orders and compatible recipe/composition ids.

## 2. Source And Selection

- [ ] 2.1 Relax `VISUAL BRIEF` parsing in `page_authority_source.mjs` from exactly-4 keys to allow an optional trailing `relationship` key (plain string type id); existing 4-key sources parse identically; malformed/out-of-place relationship hard-stops.
- [ ] 2.2 Extend `resolvePageAuthorityVisualLanguageSelection`: validate a declared relationship (registered, authority-eligible, compatible with selected recipe/composition); when valid, add it to `semantic`, `projection`, and `provider_clauses`; when absent, relationship projection is null with unchanged digests.

## 3. Digest And Raw Contract Flow

- [ ] 3.1 Confirm the relationship projection flows through the existing raw contract (`visual_language` + `provider_clauses`) and deterministically changes `registry_semantic_digest` → projection digest → raw contract digest while preserving `slide_id` lineage; add an assertion-level check.

## 4. Pure Node Contract Tests

- [ ] 4.1 Add pure Node visual-language relationship tests (no browser/Canvas/PPTX/provider): registry parse with and without `relationships`; text-guard rejection of a bad relationship clause; selection resolution for compatible and incompatible relationships; reading-order projection; deterministic digest change with stable slide_id; null-projection backward compatibility.

## 5. Validation And Closeout

- [ ] 5.1 Run the focused visual-language/source contract test files and fix regressions without real provider calls.
- [ ] 5.2 Run the regression suite and `openspec validate add-page-authority-relationship-visual-semantics --strict`; confirm no `deck_*` production artifact or `_generated/` file was used as a fixture or edited.
- [ ] 5.3 Before implementation completes, sample-review a set of provider outputs for the two relationship types; record findings without making aesthetics a default development gate.
