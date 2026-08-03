## Why

The Page Authority Image2 ingress rule introduced by the archived provider-boundary
change treats `2000x1125` as the only valid provider PNG. Production evidence now
shows that this is an incorrect assumption: two complete v5 raw batches and the
25 v5 final pages are `2048x1136`, and the repaired v7 provider invocation returned
the same native PNG. The current validator safely rejected that result, but it
blocks a historically proven delivery path before raw materialization.

This repair is needed before another authorized v7 submission. It restores the
provider's actual native media contract while retaining exact byte validation and
never disguising provider bytes with a resize or transcode.

## What Changes

- **BREAKING**: Make `2048x1136` PNG the canonical native Page Authority Image2
  raw-output contract, including the generated raw profile and ingress
  validator. The inspection projection explicitly distinguishes that native
  response contract from the historically proven `2000x1125` provider request
  parameter; the provider submission retains that established request.
- Keep strict decode-and-dimension validation before raw evidence publication.
  Empty, malformed, and every non-native PNG remain bounded `known_failure`
  outcomes; the system does not crop, resize, or transcode provider bytes.
- Preserve native bytes through the Pure workflow's final publication and make
  final-manifest and PPTX assembly validation accept the resulting native media.
  The Framed workflow keeps its separate local compositor output contract rather
  than normalizing its provider underlay.
- Treat the changed profile digest as a normal rebuild boundary: existing
  immutable plans, batches, grants, attempts, evidence, and generated artifacts
  are not rewritten. A current target must obtain a fresh owner plan and existing
  authorization path before the next provider submission.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `image-generation`: Page Authority's exact selected Image2 raw-media profile,
  request-versus-response inspection projection, ingress validation, and bounded
  media diagnostics change from the unsupported `2000x1125` output assumption
  to the proven native PNG.
- `image-production`: Pure Page Authority finalization preserves accepted native
  raw bytes and publishes a current manifest that carries the correct media facts.
- `pptx-assembly`: Page Authority assembly validates and places the allowed native
  final PNG without changing its bytes, stable identity, or ordinal annotation.
- `cli-surface`: The direct generate media outcome continues to be bounded and
  secret-safe, while reporting the selected native response contract rather than
  treating the HTTP request parameter as returned-media evidence.

## Impact

Affected framework sources are the Page Authority Image2 runtime and raw-owner
boundary, direct CLI media diagnostics, shared artifact/finalization and delivery
code, the Page Authority PPTX assembler, their OpenSpec specifications, and focused
framework tests. No new
provider endpoint, credential source, CLI command, durable retry state, or
controller authority is introduced.

The one media-contract module is registered as a public `shared/image2`
interface and owned by the existing source-test manifest. This permits the
root provider adapter, selected workflow adapters, and delivery to consume one
contract without importing a private implementation or making delivery a second
workflow classifier.

The run-bundle impact is a rebuild boundary, not an automatic migration: profile
and contract digests change for future plans, while existing deck records remain
immutable. The existing owner remains the only writer and the existing explicit
provider-authorization gate remains in force. Per
`openspec/policies/human-centered-gates.md`, malformed or mismatched bytes remain
an integrity `hard-stop`; a valid native PNG follows the existing authorized path.
Per `agent-assistance-and-control.md` and `simple-reliable-control.md`, the repair
reuses the one direct byte decoder and existing owner path, removes the false
dimension rejection, and leaves one nearest recovery action: rebuild the plan and
rerun the same authorized workflow checkpoint.
