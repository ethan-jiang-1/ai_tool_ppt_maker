# Review And Versioning Contract

## Three Different Human Views

| Checkpoint | What the human sees | Decision / consequence |
|---|---|---|
| Raw visual review | Pure raw pages; Framed text-free underlays with non-publishing frame-safe-zone guide | `proceed|repair|redirect` for exact raw triples |
| Final visual projection | Composed final slide contact sheet after Stage 3 | Presentation evidence, not a delivery decision |
| Delivery review | Final visual projection plus PPTX and notes receipts | `proceed|repair|redirect` for delivery completion |

The required order is fixed:

```text
Stage 1 composition receipt
  -> Stage 2 raw evidence
  -> raw review projection + raw acceptance coverage
  -> Stage 3 final-slides manifest / Framed composition
  -> final visual projection
  -> PPTX assembly
  -> notes injection
  -> delivery decision
```

No final manifest can consume unaccepted raw evidence. No delivery decision occurs before both PPTX and
notes receipts exist.

## Raw Acceptance Coverage

A raw visual review record covers one nonempty, lexically ordered set of exact triples:

```text
{ slide_id, raw_sha256, raw_image_contract_digest }
```

Only `proceed` covers a triple. A final-slides manifest has an explicit coverage map: every raw entry
must point to one current `proceed` review record with the same triple, review projection SHA, and
profile. Missing, partial, stale, changed, or mismatched coverage hard-stops before Stage 3. A final
delivery digest includes the canonical coverage map.

Coverage is version-scoped reserved evidence. A new local Framed Text Frame execution preserves it only
when the triple and raw review projection/profile stay current. A changed raw image, visual contract,
review projection/profile, source marker, mode, or version invalidates affected coverage. The execution
that wrote a review is audit provenance, not a freshness input by itself.

## Ordinary Structural Versioning

Structural edits within a Page Authority deck remain versioned, preview-first, and provider-free until
an explicit later authorization:

1. Preview resolves stable IDs against one source snapshot and publishes only a target candidate plus
   exact plan hash.
2. Apply creates a clean target version with no provider call and no copied final-slide artifact.
3. An unchanged retained slide is eligible for raw materialization only when its current raw contract,
   raw bytes, normalizer/reference evidence, and source raw-review triple all match exactly.
4. Materialized raw bytes carry source provenance but not current target acceptance. The target requires
   a new offline raw review before finalization; this makes reuse cheap without silently transferring a
   version-scoped human decision.
5. Inserted or raw-contract-changed slides report `needs_raw_generation`; this is provider debt, not an
   automatic remote request. Removed slides disappear from the target evidence set. Reorder alone never
   changes raw contract, but it still creates a new target final projection and delivery review.

Framed local text refresh within one version is not structural versioning and retains valid raw review
coverage under the rule above. Pure text always changes the raw contract and requires new raw work.
