## Context

See [proposal.md](proposal.md) for the trigger. The current code has three incompatible notions of valid provider media: `fast-png` accepts CRC-valid provider PNGs, `@napi-rs/canvas` later attempts to rediscover PNG validity while making a Style Master JPEG, and Page Authority treats a fixed `2048x1136` result as part of the raw acceptance contract. Final manifest and delivery validation repeat the fixed-size assumption.

The direct source of record is the immutable provider byte response. The selected workflow adapter owns its first inspection; the progressive raw owner owns attempt/provenance publication; Style Master owns its derived JPEG; `05-delivery` consumes an already published final manifest. No new controller, state record, approval, authorization, or retry path is warranted.

## Goals / Non-Goals

**Goals:**

- Make one CRC-valid, positive-dimension provider PNG inspection result authoritative wherever Page Authority consumes raw or final media.
- Preserve byte identity for Pure, fixed local composition for Framed, and actual dimensions in provenance and final manifests.
- Generate a Style Master compatibility JPEG from verified pixels, even if a provider uses valid private PNG chunks.
- Retain the current malformed-media hard-stop and one nearest existing recovery action.

**Non-Goals:**

- Negotiate or probe provider sizing, add a provider allow-list, resize/crop provider bytes, change prompts, or reissue already consumed provider submissions.
- Backfill, rewrite, or migrate `deck_*` state, receipts, raw evidence, final evidence, or generated files.
- Change visual review, provider authorization, or any human confirmation boundary.

## Decisions

### Use decoded provider media as the single fact

The shared media contract will expose a tolerant provider-native PNG inspection: it copies non-empty bytes, uses CRC-checked decoding, validates positive safe dimensions, and returns the bytes plus actual dimensions. Page raw acceptance, Pure final validation, delivery assembly, and Framed raw validation will consume that result. Per-workflow final contracts will continue to express the required final behavior: Pure requires raw-byte identity; Framed requires its owned composition output. They will no longer require an upstream provider response to be one historical pixel size.

This is owned by JS because it is deterministic media/provenance validation. The request profile remains a request contract, with `2000x1125` retained for transport, but it must not claim a received size before bytes exist. Alternatives rejected:

- Keep `2048x1136` and preflight every provider: this adds paid or provider-specific control work and cannot prove a later response will match.
- Resize successful provider output: it breaks Pure byte identity and confuses evidence with a derived artifact.
- Permit size only for the current relay: it reintroduces a provider-specific branch rather than fixing the shared boundary.

### Decode Style Master PNG pixels before canvas JPEG encoding

Style Master candidate validation already performs CRC-checked PNG decoding. Compatibility projection will reuse an equivalent verified decode and place RGBA pixels directly on a canvas before JPEG encoding; JPEG output validation can continue to use the canvas decoder because the JPEG was locally encoded. This prevents `loadImage` from acting as a second PNG validity gate.

The selected immutable candidate stays the source of record. The derived JPEG remains rebuildable and cannot create, mutate, or roll back a selection. Stripping unknown chunks was rejected because it creates a second derived PNG policy, loses no-longer-needed bytes, and is narrower than the actual failure mode. Adding `sharp` or `jpeg-js` was rejected because existing dependencies already cover decoded pixels and local JPEG encoding.

### Carry actual dimensions through published final media

Raw provenance already records media dimensions. The implementation will remove fixed-result-dimension validation from raw profiles and shared final checks, then validate each final manifest entry against its actual recorded dimensions and decoded bytes. Pure entries take their dimensions from raw evidence and preserve exact bytes. Framed entries continue to produce the existing fixed composition canvas, independent of underlay dimensions. PPTX writes images to the widescreen slide canvas as today, so no source-byte transformation is required.

The final manifest is the direct delivery input. This changes validation, not the manifest's ownership or schema family. It avoids adding a separate compatibility projection or a parallel media ledger.

### Preserve the shortest control loop

The existing generate checkpoint remains the only remote boundary and the existing progressive owner remains the only attempt publisher. Invalid/undecodable/CRC-invalid/non-positive media is a `hard-stop`: it protects byte integrity, attributable provenance, and authorization consumption, and its only recovery is the existing owner-issued successor path. A committed Style Master selection whose JPEG is missing is a `guide`: exact accept replay can rebuild only the derived JPEG without human risk acceptance. The existing visual review remains the only `confirm` and keeps its human-owned decision and reason.

This follows `human-centered-gates.md`, `agent-assistance-and-control.md`, and `simple-reliable-control.md`: remove the duplicate size and decoder gates, use one evaluator, short-circuit invalid bytes before provenance, and retain one owner-issued action rather than adding preflight, fallback, or retry control paths.

## Risks / Trade-offs

- [Provider returns a valid but unusual aspect ratio] -> Preserve it as raw evidence; Pure delivers it unchanged and Framed composes it onto its owned canvas. Visual review remains the established quality check.
- [Different downstream code still assumes `2048x1136`] -> Search all framework consumers of the raw/final media contract and add regressions that exercise a non-default dimension through final manifest and PPTX assembly.
- [Pixel buffer/channel mismatch while making JPEG] -> Validate decode width, height, and RGBA buffer length before drawing; retain local JPEG signature and dimension verification.
- [Malformed private chunk hides corruption] -> CRC-checked decode remains mandatory; no chunk stripping or relaxed byte parsing is accepted.
- [Existing historical evidence] -> No migration runs. Existing `2048x1136` evidence continues to satisfy the generalized contract; all writes remain owner-owned and atomic.

## Migration Plan

1. Land shared evaluator and consumer changes with focused regressions before changing any production run.
2. Run the focused contract, Style Master, progressive raw, finalization/delivery, and CLI diagnostic suites, then the repository regression command.
3. Deploy as a compatible framework update. Existing valid runs need no action; a blocked Style Master may use its already-issued exact accept replay after the update, while a terminal raw batch follows its existing owner-issued successor workflow rather than reopening a grant.
4. Roll back by restoring the prior framework release only. Do not mutate deck state or generated artifacts to compensate.
