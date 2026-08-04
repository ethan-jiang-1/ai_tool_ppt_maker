## Context

See proposal.md — Why. Current data flow: source `VISUAL BRIEF` (strictly `recipe,
composition, motifs, negative_constraints` in fixed order, parsed by
`01-content/internal/page_authority_source.mjs`) → `resolvePageAuthorityVisualLanguageSelection`
(`02-visual-system/internal/page_authority_visual_language.mjs`) validates recipe/composition/motif
registration, authority eligibility, and compatibility → returns `{projection, provider_clauses, audit}` →
receipt slide `visual_language` → raw contract (`visual_language` projection + `provider_clauses` text) →
`raw_contract_sha256` → provider request → authorization scope → plan identity.

The registry is strict: top-level `schema, revision, text_guard, recipes, compositions, motifs`, each record
validated with exact keys and text-guard-protected clauses. The source `VISUAL BRIEF` parser enforces exact
key count and positional order. The raw contract keeps its existing top-level schema, but its provider-clause
validator currently accepts only the legacy three-key record; the selected relationship is therefore an explicit
second closed variant that the shared validator and both workflow adapters must validate before hashing.

## Goals / Non-Goals

**Goals:**
- A small, closed relationship model (two seed types: `layer-stack`, `causal-flow`) on top of the existing
  registry, with verifiable reading-order projection and deterministic digest impact.
- Backward compatible: registries without `relationships`, and slides without a relationship, behave exactly
  as before.

**Non-Goals:**
- No new drawing/icon/SVG channel; no HTML-first/ECharts revival; no generic diagram editor or animation.
- No per-slide free-form relationship geometry or entity layout authored in source — only a registry-bound
  relationship type id.
- No real-provider/browser/aesthetic assertions in the `npm test` core tier.

## Decisions

### D1: `relationships` is an optional additive registry section

Add `relationships` as an optional top-level registry key. The registry parser currently requires every key
in `TOP_LEVEL_KEYS`; introduce an optional-keys path so a deck whose registry predates this change (no
`relationships`) still parses. The seed registry in `bundle_layout.mjs` gains the section.

*Rationale:* non-breaking for existing decks, and matches "closed but extensible registry" — the section is
just another reviewed record set.

*Alternative:* make it required and migrate deck registries — rejected: it would break every existing deck and
violates the run-bundle `compatible` contract.

### D2: relationship record carries clause, eligibility, compatibility, reading order

Each record: `provider_clause` (text-guard protected, same parser as recipe/composition/motif),
`authorities`, `recipe_ids`, `composition_ids`, `reading_order`. Reading order is a bounded vocabulary (e.g.
`bottom-to-top`, `left-to-right`) recorded in the registry, not free text in source. For this change, the
closed vocabulary is exactly `bottom-to-top | left-to-right`; `layer-stack` seeds the former and `causal-flow`
seeds the latter. Each relationship recipe/composition id must reference a record already registered in the same
registry; unlike motifs, no reverse membership field is added to recipe or composition records. Both seed
relationships are eligible for `pure-image2` and `framed-image2`, matching the current seed recipe and composition.

This change deliberately defines no structured primitive or bounds projection. The reviewed provider clause is
the sole provider-facing relationship realization, and reading order is the sole structured relationship fact;
this preserves the bounded registry model without creating a geometry or diagram vocabulary.

*Rationale:* the registry is the reviewed, versioned authority for what a relationship means visually; the
provider-clause text and reading-order projection are deterministic facts a contract test can assert.

### D3: source declares only the relationship type id

`VISUAL BRIEF` gains an optional trailing `relationship` key (lower-kebab plain string id). The strict positional parser
relaxes from exactly-4 keys to 4-or-5 keys with `relationship` in the 5th (optional) slot. Source never
authors reading order or geometry.

*Rationale:* keeps authoring minimal through an explicit relationship type and bounded reading-order projection,
while retaining the closed-source guarantee.

### D4: relationship enters semantic and projection digests

`resolvePageAuthorityVisualLanguageSelection` validates the relationship (registered, authority-eligible,
compatible with selected recipe/composition) and, when valid, includes it in `semantic`
(`relationship: {id, provider_clause_sha256}`) and `projection`
(`relationship: {id, reading_order, provider_clause_sha256}`), plus `provider_clauses.relationship` (text).
Because `registry_semantic_digest` is computed from `semantic`, the relationship deterministically changes the
projection digest → raw contract digest, while `slide_id` is untouched. When absent, relationship projection
members are omitted rather than encoded as `null`; consumers treat absence as no relationship. This is required
to preserve the exact pre-change semantic/projection/provider-clause objects and therefore the source receipt,
Style Master context, and raw-contract digests of existing 4-key sources.

*Rationale:* the existing digest chain gives the verifiable contract test for free; no new identity scheme or
legacy plan invalidation is introduced. The relationship-bearing provider-clause shape is a closed variant, so
the existing shared validator and both workflow adapters must be updated together before a plan can be built.
When a projection selects a relationship, its provider-clause member must be present and its SHA-256 must equal
the projected `provider_clause_sha256`; when no relationship is projected, no relationship clause is permitted.

### D5: pure Node contract tests

Extend visual-language contract tests with pure Node coverage: registry parse with and without
`relationships`, text-guard rejection of a relationship clause, selection resolution for a compatible and an
incompatible relationship, reading-order projection, deterministic digest change with stable slide_id, and
omission-based backward compatibility. Add focused adapter tests that accept the selected relationship clause,
reject malformed legacy and relationship-bearing variants before plan materialization, and prove the exact
plan-bound provider body carries the relationship clause. Add a Style Master context assertion: its digest is
unchanged when no relationship is selected and changes when a relationship is selected. The visual-language/source
group is pure Node with no browser/Canvas/PPTX/provider; adapter seams reuse their existing offline fixtures and
perform no browser, PPTX, or provider work.

## Risks / Trade-offs

- [Risk: relaxing the strict 4-key VISUAL BRIEF parser weakens source validation] → Mitigation: the 5th key
  is positional and type-checked; a malformed or out-of-place `relationship` still hard-stops with a bounded
  error, and existing 4-key sources are byte-identical.
- [Risk: relationship clause diverges from what the provider renders] → Mitigation: per the bug, provider
  output stays a reviewed production artifact, not the authority for structure; reading order and clause come
  from the reviewed registry. A sampled provider review is production evidence only when separately authorized;
  it is not a default local-development gate.
- [Risk: two seed relationship types under-specify the model] → Mitigation: the schema is the contract; adding
  relationship types later is an additive registry + selection change, not a re-architecture.

## Migration Plan

None. Optional additive section; existing deck registries and 4-key sources keep their pre-change receipt,
Style Master context, raw-contract and plan digests. A source that selects a relationship is a semantic image
change and follows the existing Generated Image Rebuild and explicit provider-authorization path. No `deck_*`
artifact is a fixture or migration target; no generated file is edited.
