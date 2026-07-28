# Review And Versioning Contract

## Three Human Views

| Checkpoint | Human evidence | Decision / consequence |
|---|---|---|
| Raw visual review | Pure raw pages; Framed text-free underlays with a non-publishing frame-safe-zone guide | `proceed|repair|redirect` for exact raw tuples |
| Final visual projection | Composed final-slide contact sheet after Stage 3 | presentation evidence only |
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

No final manifest consumes unaccepted raw evidence. A final visual projection is not a delivery
decision, and no delivery decision exists before both PPTX and notes receipts exist.

## Raw Acceptance Coverage

A raw visual review record covers one nonempty, lexically ordered set of exact raw tuples:

```text
{ slide_id, raw_sha256, raw_image_contract_digest, raw_generation_profile_digest }
```

Only `proceed` covers a tuple. Every raw entry consumed by a final-slides manifest points to a current
`proceed` record with the same tuple, raw-review projection SHA/profile, and source epoch. Missing,
partial, stale, or mismatched coverage hard-stops Stage 3. The final delivery digest includes the
canonical coverage map.

Within one version, a Framed text-only refresh preserves raw coverage only when raw bytes, raw image
contract, raw generation profile, raw-review projection/profile, and source epoch stay current. The new
local execution ID is audit provenance, not a freshness input. Any changed raw image, raw contract,
generation profile, review projection/profile, source marker, mode, or version invalidates affected
coverage.

## Ordinary Structural Versioning

Structural edits to a Page Authority deck use one hash-bound transaction; raw materialization is part
of `apply`, never a later copy/import loophole:

1. Preview resolves stable IDs against one source snapshot and writes the target candidate plus exact
   plan hash. Its `raw_materialization` map names every retained ID as either `materialize` with the
   source raw tuple, source raw-manifest digest, normalizer/reference evidence digest, and source path
   proof, or `needs_raw_generation` with its reason. The map is covered by the outer plan hash.
2. Before creating a target, apply revalidates source snapshot/candidate hashes and every declared
   `materialize` input. Drift in a declared materialization row rejects apply before any target becomes
   visible. Rows explicitly declared as raw debt remain valid provider-free debt.
3. Apply atomically creates the target source/state and its target-owned raw manifest. A materialized
   entry contains copied verified bytes, source provenance, and status `unreviewed`; a debt entry is
   `needs_raw_generation`. No final-slide artifact is copied. Apply never calls a provider.
4. Source raw acceptance does not transfer. The target obtains a new raw review before either a
   materialized raw entry or fresh raw entry can reach Stage 3. Reorder alone may preserve raw
   eligibility but always requires a target final projection and delivery review.
5. After apply, no general raw-import/materialization command exists. Raw bytes may enter a target only
   through the recorded apply transaction or a later explicit, receipt-bound provider generation.

Framed text refresh inside one version is not structural versioning: it reuses valid raw coverage under
the rule above, recompiles the frame, and then requires final visual projection, PPTX, notes, and a new
delivery decision. Pure text always changes the raw contract and requires new raw work.
