## 1. Registry Relationship Schema

- [x] 1.1 Add optional `relationships` parsing to `page_authority_visual_language.mjs`: top-level optional key, per-record keys `provider_clause` (text-guard protected), `authorities`, `recipe_ids`, `composition_ids`, and `reading_order` limited to `bottom-to-top | left-to-right`. Preserve strict rejection of unknown keys, duplicate values, unsupported order, and unknown relationship recipe/composition references; a registry without `relationships` still parses.
- [x] 1.2 Add the two seed relationship records to `bundle_layout.mjs`: `layer-stack` with `bottom-to-top` and `causal-flow` with `left-to-right`. Bind both to the only current seed recipe/composition pair, `editorial-systems` / `centered-constellation`, and both selected-workflow authorities, with reviewed provider clauses.

## 2. Source And Selection

- [x] 2.1 Relax `VISUAL BRIEF` parsing in `page_authority_source.mjs` from exactly-4 keys to allow only an optional trailing `relationship` key (lower-kebab plain string type id). Existing 4-key sources must retain byte-equivalent visual-brief receipt semantics; malformed, out-of-place, non-plain, invalid-id, or extra relationship input hard-stops at the source span.
- [x] 2.2 Extend `resolvePageAuthorityVisualLanguageSelection`: validate a declared relationship (registered, authority-eligible, compatible with selected recipe/composition); when valid, add its reviewed facts to `semantic`, `projection`, and `provider_clauses`; when absent, omit relationship members from all three objects so legacy selected-language digests remain unchanged.

## 3. Digest And Raw Contract Flow

- [ ] 3.1 Update `isPageAuthorityProviderClausesShape` and Pure/Framed raw-contract validation to accept exactly two closed variants: legacy `recipe`/`composition`/`motifs`, or those fields plus non-empty `relationship`. Require relationship presence to match the projection and its SHA-256 to equal `visual_language.relationship.provider_clause_sha256`. All malformed combinations hard-stop before authorization, request construction, plan materialization, or provider work.
- [ ] 3.2 Compile the selected relationship clause through both workflow adapters into the plan-bound raw contract and provider request. Prove that a selected relationship deterministically changes `registry_semantic_digest` → Style Master context digest → raw-contract digest and authorization scope while preserving `slide_id`; prove an absent relationship preserves existing values.

## 4. Focused Contract Tests

- [ ] 4.1 Add pure Node visual-language/source tests: registry parse with and without `relationships`; text-guard rejection of a bad relationship clause; unknown relationship reference and unsupported reading-order rejection; source position/type/id rejection; both seed types resolving for both selected-workflow authorities plus compatible, incompatible, and authority-ineligible selections; reading-order projection; deterministic digest change with stable slide_id; and exact omission-based four-key backward compatibility.
- [ ] 4.2 Extend focused Pure and Framed raw-plan tests: selected relationship clauses reach the raw contract and serialized provider request; both accepted shapes validate; absent, unexpected, empty, and SHA-mismatched relationship clauses short-circuit before source/raw-plan materialization or provider work; registry drift cannot change plan-bound clause text.
- [ ] 4.3 Add focused Style Master context coverage proving that unselected relationships preserve its digest and selected relationships change it without exposing provider clause text or identity-reference paths.

## 5. Validation And Closeout

- [ ] 5.1 Run the focused visual-language/source, Pure/Framed raw-contract, and Style Master test files without provider calls; fix regressions.
- [ ] 5.2 Run `npm test`, `openspec validate add-page-authority-relationship-visual-semantics --strict`, and `git diff --check`; confirm no `deck_*` production artifact or `_generated/` file was used as a fixture or edited.
