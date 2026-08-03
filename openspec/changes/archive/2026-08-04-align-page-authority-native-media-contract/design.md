## Context

See [proposal.md](proposal.md) for the production evidence and motivation. The
current v2 profile and provider ingress validator conflate an established
`2000x1125` request parameter with the provider's actual `2048x1136` PNG
response. That false equality is repeated in the provider adapter, inspection
projection, raw-owner media facts, Framed underlay validation, and the bounded
CURRENT assembly validator.

The selected v7 workflow is Pure. Its v5 predecessor proves that native PNGs
can pass through raw evidence, final image files, and PPTX delivery. Existing
v7 immutable attempts and grants are evidence, not input to be edited.

## Goals / Non-Goals

**Goals:**

- Restore a single exact native raw-media contract for Page Authority Image2.
- Preserve provider bytes through Pure finalization and delivery.
- Retain bounded failure diagnostics and the existing authorization/owner
  lifecycle.
- Make changed profile digests drive the existing owner-issued rebuild path.

**Non-Goals:**

- Do not change the established `2000x1125` HTTP request parameter, probe a
  new size, add a provider fallback, or infer a new endpoint behavior.
- Do not resize, crop, transcode, or mutate provider bytes to manufacture
  compliance.
- Do not alter Style Master media, the Framed local capture canvas, historic
  run-bundle records, grants, attempts, receipts, or `_generated/` by hand.
- Do not add a CLI flag, durable migration record, retry policy, or a second
  controller/recovery path.

## Decisions

### Separate the request parameter from the returned-media contract

The provider adapter will retain the historically successful request size
`2000x1125`, but the Page Authority raw generation profile and ingress
validator will use exact `2048x1136` PNG as the expected response. The
provider-request inspection and the direct CLI's bounded expected/actual media
facts will make their respective non-secret contract facts visible without
exposing a prompt, credential, header, body, image bytes, or response.

This uses the direct provider and PNG facts rather than assuming a request
parameter is a byte-level promise. Changing the request to an unproven native
size was rejected because it would spend a new live call to test a parameter
when the already successful request needs no repair.

### Reuse one shared media evaluator at each byte boundary

A small shared Page Authority media-contract module will own immutable request,
native raw, and workflow-final media facts plus PNG decode/dimension checks.
The provider adapter, inspection/runtime guard, direct CLI media diagnostics,
raw-owner failure projection, Framed underlay validation, target
finalization/delivery, and bounded CURRENT assembly will consume that owner
rather than repeat literals.

The contract is a public `shared/image2` interface, registered in the
framework architecture and source-test ownership manifests. It exposes typed
final-media validation so `05-delivery` does not branch on Pure/Framed
semantics; workflow-specific identity preservation stays inside the contract
owner rather than creating another delivery classifier.

Raw ingress checks one provider response before materialization. Finalization
checks a distinct final byte boundary: Pure must equal its accepted raw bytes;
Framed keeps the existing local compositor output contract. This is not a
second competing gate: both use the same evaluator on different authoritative
bytes. A malformed or wrong-sized byte remains an integrity `hard-stop` under
`human-centered-gates.md`; a valid native byte follows the already authorized
owner action. No confirm or waiver is introduced.

### Preserve workflow ownership through final publication

Pure finalization publishes the exact accepted raw buffer, so it can assert
same bytes, same digest, and native dimensions before manifest publication.
Framed still receives the verified native underlay, then produces its normal
local text-frame composition at the existing render-profile output size. Its
composition is not a provider normalization and no sibling workflow is called.

Target delivery validates final bytes using the manifest workflow before it
writes derived images or starts PPTX construction. The historical bounded
CURRENT v1 assembly uses the same workflow-specific media facts. PPTX placement
remains full-slide, and source PNG bytes remain the bytes embedded in delivery;
there is no raster conversion or new visual-placement policy.

### Rebuild via the existing profile-digest boundary

The profile digest and raw-contract digests will change for newly built plans.
The existing plan compiler/owner derives the replacement plan and then offers
its normal Pilot/authorization action. There is no migration writer: old plans,
batches, grants, attempts, raw materializations, final artifacts, and receipts
remain immutable. The nearest legal action after profile drift is one owner
replan, followed by its current authorized action.

This follows `agent-assistance-and-control.md`: the runtime remains the writer,
the Agent performs the already authorized deterministic replan/recovery work,
and Markdown remains a projection. It follows `simple-reliable-control.md` by
removing the false duplicate size assumption rather than adding a fallback,
state record, or user-operated remediation step.

## Risks / Trade-offs

- [A provider later returns another native size] -> The one exact decoder reports
  bounded `known_failure` before materialization; it does not silently accept a
  family of dimensions.
- [Framed's 16:9 local compositor receives a slightly different-aspect underlay]
  -> Its existing underlay placement and final canvas remain explicit workflow
  behavior; focused Framed regression tests prove it accepts verified native raw
  bytes without treating them as a repair target.
- [An existing current plan has the obsolete profile digest] -> The owner
  generates a new plan and a new authorization scope; no old grant is reopened.
- [PPTX library behavior changes image packaging] -> Delivery tests inspect the
  source file hash and the packaged image media for the native Pure case.

## Migration Plan

1. Update the shared contract and all consumers, then run focused adapter,
   raw-owner, finalization, delivery, and process tests.
2. Run the repository suite and strict OpenSpec validation before any live
   provider work.
3. Rebuild the specified v7 plan through its existing owner. The old plan and
   terminal attempts remain readable historical records.
4. Continue only owner-issued Pilot, authorization, generate, review, and
   delivery actions. Record every material real-run event in the backlog plan
   and active change task before the next action.

Rollback is a framework-code rollback only. It does not delete or rewrite any
run-bundle record; an owner-created new plan remains the recovery boundary.
