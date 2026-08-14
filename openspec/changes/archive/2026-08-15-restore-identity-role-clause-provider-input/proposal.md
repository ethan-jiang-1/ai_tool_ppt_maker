## Why

Registered identity roles already provide verified reference bytes, an exact
`role_clause`, and lineage digests, but the current Pure and Framed compilers
drop the clause text and serialize only the digest projection into provider
input. This leaves the provider-facing identity contract semantically
incomplete and has produced visibly divergent representations of the same
profile in current Page Image pilot work.

The defect is in the reusable Harness boundary, not in one deck's prompt
wording. The fix must restore the existing semantic intent while preserving
receipt, authorization, exact-byte transport, and human visual acceptance
ownership.

## What Changes

- Define one exact provider-facing identity shape for Pure and Framed. It
  contains `profile`, `role`, `subject_class`, `identity_subject_count`,
  `subject_restrictions`, and the exact registered `role_clause`.
- Remove `reference_sha256`, `role_clause_sha256`, and physical paths from the
  provider-facing identity while retaining those facts in resolver, receipt,
  Page Image Core, raw-contract, plan, authorization, and evidence lineage.
- Strengthen both adapter raw-contract validators so identity/clause null
  pairing, exact projection shape, field types, and
  `sha256(role_clause) == role_clause_sha256` fail closed before provider-input
  construction, plan publication, authorization, or provider work.
- Keep deterministic provider-input compilation inside the selected Pure or
  Framed adapter. The shared runtime and submitter continue to transport exact
  adapter-owned bytes and attach the bound per-page reference image without
  rereading or rewriting identity semantics.
- Add symmetric identity-present, no-identity, tamper, digest-mismatch,
  canonical-byte, invalidation, and fake-transport coverage for both workflows,
  including the Framed exact compiled-input validator.
- **BREAKING (derived exact-byte contract):** newly compiled identity-bearing
  provider inputs have different canonical bytes and digests. Historical
  records remain immutable audit evidence, but prior plans, grants, and review
  evidence cannot authorize or establish current work for the new request;
  the existing owner must issue a fresh exact plan and Generated Image Rebuild.
- Do not modify registered deck role-clause wording, source/state schemas,
  `reference_transport` semantics, Page Image Core ownership, provider runtime,
  or human Complete Page Review authority.

The deterministic rejection is a `hard-stop` under
`openspec/policies/human-centered-gates.md`: it protects semantic identity,
digest integrity, exact plan attribution, and recoverability, and has no waiver
or force path. Under `openspec/policies/agent-assistance-and-control.md` and
`openspec/policies/simple-reliable-control.md`, the existing adapter planning
checkpoint remains the single evaluator and recovery loop: repair the owning
resolver/adapter defect, then rerun the same provider-free plan operation. No
new human decision, controller branch, state record, retry, fallback, or
parallel authority is introduced.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `image-generation`: require selected adapters to compile exact semantic
  identity text into immutable provider input, validate raw identity lineage
  before planning, exclude identity digests/paths from the provider-facing
  shape, preserve exact transport ownership, and invalidate prior exact work
  when the compiled identity bytes change.
- `visual-asset-management`: make the registered role clause, verified
  reference bytes, subject compatibility, and their deterministic projection
  digests an explicit paired contract that fails closed on mismatch.

## Impact

- **Harness source:**
  `ppt_maker_harness/scripts/02-visual-system/internal/page_image_reference_material.mjs`
  is contract-locked by tests and changes only if those tests expose a real
  resolver gap; the required adapter surfaces are
  `ppt_maker_harness/scripts/04-pure-image/index.mjs`,
  `ppt_maker_harness/scripts/03-framed-image/index.mjs`, and
  `ppt_maker_harness/scripts/03-framed-image/internal/framed_provider_input_contract.mjs`.
  Resolver output is expected to remain unchanged. If contract tests expose a
  resolver defect, only a bounded `visual-asset-management` correction is in
  scope. Any need to change the resolver output shape or `visual-config` is a
  scope discovery: implementation must stop, update this change's artifacts,
  and pass strict validation again before editing that surface.
- **OpenSpec:** this active change modifies the `image-generation` and
  `visual-asset-management` capability contracts under `openspec/changes/`;
  their accepted main specs change only through the normal archive workflow.
- **Tests:** focused Pure, Framed, Visual Asset, architecture, invalidation, and
  fake-transport tests under `tests/`; no live-provider test is required to
  prove the local contract. Human pilot review remains necessary to judge
  actual visual consistency.
- **E2E:** no `tests_e2e/` change is expected because public CLI routing, MD
  Controller flow, State, authorization, and provider protocol are unchanged.
- **Control owner:** JS-owned adapter validation and compilation. No MD
  Controller order, entry/exit, decision, CLI surface, or MD-to-JS protocol
  change.
- **Run-bundle contract impact:** `migration` for current identity-bearing raw
  work. Production `deck_*` directories are not source or fixtures and are not
  edited by this change. Affected runs retain old artifacts as history and use
  their existing owner-issued fresh-plan, authorization, generation, and review
  path; `_generated/` is never patched.
- **Dependencies and runtime:** no new package, provider transport/envelope
  field, state schema, retry path, or external runtime dependency. The only new
  provider-visible field is the intended `visual.identity.role_clause` inside
  the existing adapter-owned canonical prompt.
