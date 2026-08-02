## Context

See [proposal.md](proposal.md) for motivation. The current framework already
computes every fact this fix needs: `page_authority_visual_language.mjs` returns
both `projection` (IDs + SHA) and `provider_clauses` (text) per slide, and the
identity resolver returns the `role_clause` text on
`identity_reference.provider_reference`. The two adapters choose to drop the
text fields before building the raw contract, and the source scanner has no
scene field at all. The submit factory sends `prompt: JSON.stringify(request)`,
so anything the raw contract carries reaches the model; nothing else is
required at the transport boundary.

## Goals / Non-Goals

**Goals:**

- Make the resolved clause text, identity role clause, and per-slide scene reach
  the provider prompt through the existing receipt-bound contract.
- Keep the scene under the same deterministic text guard that protects registry
  clauses, so no free prose or text-bearing instruction reaches the model.
- Preserve hash consistency and the exact-key Framed contract validation.

**Non-Goals:**

- Add a CLI command, state field, authorization boundary, retry policy, or new
  diagnostic producer.
- Change the provider submit factory, request envelope schema, registry schema,
  or evidence/authorization record shape.
- Change framed semantics (`text_free: true`) or pure display behavior.

## Decisions

### 1. Carry text additively in the raw contract, keep projection for binding

`pureRawContract` and `framedRawContract` add three top-level fields:

```js
{
  visual_language: { ...projection, negative_constraints: [...] }, // unchanged
  provider_clauses: { recipe, composition, motifs: [...] },         // text, NEW
  visual_identity_role_clause: <string | null>,                    // text, NEW
  visual_scene: <string | null>,                                   // guarded, NEW
  ...
}
```

The existing `visual_language.projection` stays so the authorization scope,
work-plan SHAs, and acceptance digests keep binding the same identity facts.
The new text fields ride along in the same `raw_contract`; because
`createTargetProviderRequest` wraps the contract opaquely and the submit
factory stringifies the whole request, the text reaches the prompt with no
transport change. This is additive, so existing fixtures and hashes remain
valid except where the exact-key validator must admit the new fields.

### 2. Defer scene text-guard validation to the adapter, not the source parser

`01-content` deliberately does not import from `02-visual-system`, so the
source parser stores `visual_scene` as raw inline text and does not guard it.
The adapter (`03-framed-image` / `04-pure-image`) already imports
`normalizePageAuthorityTextGuard`; it normalizes the scene at raw-contract
compilation time. This keeps the module-layer boundary intact and places the
guard exactly where the text enters the provider-facing contract. A guard
failure propagates as the existing text-guard error and stops the provider-free
planning checkpoint with a bounded source-repair action.

### 3. Extend the Framed exact-key validator, leave Pure as-is

Framed enforces `FRAMED_RAW_CONTRACT_KEYS` via `hasExactKeys`; the three new
fields are added to that set with type checks (`provider_clauses` object-or-null,
`visual_identity_role_clause` string-or-null, `visual_scene` string-or-null).
Pure has no canonical-shape validator today; adding one is out of scope, and the
pure lifecycle integration tests already prove the additive fields serialize
through the plan.

### 4. Treat guard violation as the existing planning hard-stop

The text guard is a deterministic source-integrity check. It fires during
provider-free `image2 plan`, returns a bounded source-repair diagnostic, and
never authorizes a provider submission. This matches the current `guide`/`hard-stop`
classification: the Agent mechanically repairs the guarded field and reruns the
named checkpoint; no waiver, force path, or silent fallback is introduced.

## Risks / Trade-offs

- [Scene text carries text-bearing instructions] -> The scene passes the same
  forbidden-token guard as registry clauses, so "caption", "title", "label",
  "letter" and similar tokens are rejected; decks author scene as composition
  and mood, not as drawn lettering.
- [ASCII-only guard blocks Chinese scene terms] -> Scene is authored in ASCII
  English; Chinese display terms live in the display fields and speaker notes,
  which are not guarded scene text.
- [Additive fields could drift from the projection] -> Both derive from the same
  resolved `slide.visual_language` object at contract time, and the work-plan
  SHA binds the whole contract, so a divergence would fail the existing
  authorization-scope equality check.

## Migration Plan

1. Add failing focused tests: scene parse (present/absent/empty/duplicate),
   clause/scene presence in Pure and Framed contracts, guard normalization, and
   guard failure at planning.
2. Add the scene field to the source parser; add the three fields to both raw
   contracts and to the Framed exact-key validator.
3. Run the focused suites, the core tier, and strict OpenSpec validation. No
   production bundle is rewritten; rollback removes the additive fields and the
   scene field with no state or receipt migration.

## Open Questions

None. Both defects and the fix boundary are established; implementation may
choose exact field ordering but may not add a transport, state, or provider
change.
