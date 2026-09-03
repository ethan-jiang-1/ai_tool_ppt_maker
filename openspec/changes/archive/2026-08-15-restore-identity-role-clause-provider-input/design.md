## Context

The current identity resolver already produces all required facts as one
immutable pair:

- `projection` carries path-free lineage fields, including reference and role-
  clause digests; and
- `provider_reference` carries the confined reference locator, verified byte
  digest, and exact normalized `role_clause`.

Page Image Core carries that selection without becoming its authority. Both
selected adapters then place the clause in
`visual_identity_role_clause` and the projection in `visual_identity`, but
their provider compilers serialize only `visual_identity`. The current raw
validators accept `visual_identity` as any object and accept the clause as an
independent string-or-null, so they do not prove null pairing, exact projection
shape, or clause/digest consistency before the clause becomes load-bearing.

The shared target runtime treats compiled provider input as opaque canonical
bytes, and the submitter attaches the already bound Style Master plus a second
per-page identity image when one exists. The provider-input compiler
architecture guard requires compilation to remain in the selected Pure and
Framed adapters. These are constraints to preserve, not seams to redesign.

## Goals / Non-Goals

**Goals:**

- Restore the exact registered role clause to Pure and Framed provider-facing
  identity records.
- Keep lineage digests and physical locators out of provider-facing identity
  while preserving them in existing receipt, Core, raw-plan, authorization,
  and evidence bindings.
- Make identity projection, clause, digest, and null pairing a deterministic
  fail-closed raw-contract invariant before plan publication.
- Keep Pure and Framed provider identity shapes identical without moving
  compilation into Page Image Core or shared runtime.
- Preserve historical records and use the existing exact-plan invalidation and
  Generated Image Rebuild path for current identity-bearing work.

**Non-Goals:**

- Change the reference registry schema, resolver output shape, source schema,
  State, Task Mandate, grant, attempt, review, or delivery record schemas.
- Rewrite provider prompts in runtime or submit, add provider transport fields,
  or change deck-wide versus per-page `reference_transport` semantics.
- Change a production deck's role-clause wording or use a `deck_*` run bundle
  as a Harness test fixture.
- Add a profile-level prose clause, general hash-leak audit, model-specific
  guarantee, automatic visual-consistency evaluator, retry, waiver, or new
  human Gate.

## Decisions

### D1: Preserve the resolver pair and make its ownership explicit

Visual Asset Management remains fact authority for registered profile/role
membership, path confinement, reference-byte verification, clause
normalization, subject compatibility, and the two identity digests. Its current
`projection` plus `provider_reference` output remains unchanged.

That unchanged output is a scope gate, not an assumption apply may silently
relax. If implementation evidence requires a different resolver shape or a
`visual-config` change, implementation pauses and this proposal, both affected
delta specs, design, and tasks are revised and revalidated before that broader
surface is edited.

The selected adapter is accountable for the raw-contract and provider-input
semantics. It receives the resolver facts through Page Image Core, validates
the raw pair, and compiles provider-facing bytes. Page Image Core is a carrier
and binding owner, not a registry reader or provider compiler. Submit remains
an exact-byte transport owner. Complete Page Review remains decision authority
for visual acceptance.

| Fact or action | Authority / owner | Not owned here |
|---|---|---|
| Registered role clause, reference bytes, compatibility | Visual Asset Management registry and resolver | Provider prompt shape, lifecycle acceptance |
| Path-free lineage projection | Resolver, carried by Page Image Core | Physical reference lookup at submit time |
| Raw identity pair and provider identity bytes | Selected Pure or Framed adapter | Registry mutation, human visual judgment |
| Exact prompt and image attachment | Existing target submitter | Semantic reconstruction or prompt rewrite |
| Visual consistency decision | Complete Page Review | Local digest validation |

Alternative: change the resolver to emit the final provider identity. Rejected
because it would move provider compilation policy into Visual Asset Management
and blur its existing registry/verification responsibility.

### D2: Cut directly to the semantic provider shape

For identity-present pages, canonical provider input uses exactly:

```json
{
  "profile": "amber-agent",
  "role": "guide",
  "subject_class": "amber-light-form",
  "identity_subject_count": "one",
  "subject_restrictions": "none",
  "role_clause": "one warm amber light-form gently leads, open palm, book held close, attentive head tilt"
}
```

The adapter copies the first five semantic fields from the validated lineage
projection and copies `role_clause` from the validated raw clause. It does not
copy either SHA or a locator. With no identity, the builder returns `null`.

This is a clean cut for the derived cross-boundary provider-input surface. An
additive intermediate shape that retained SHA fields was rejected because it
would preserve a known ownership error, change exact provider bytes twice, and
force two invalidation/rebuild cycles with no compatibility benefit. Historical
raw records remain readable and immutable; compatibility does not require new
requests to retain the defective provider-facing shape.

No protocol suffix or compiler version is added. The canonical provider-input
digest remains the existing exact binding and changes naturally when the
semantic identity bytes change.

### D3: Strengthen each adapter's existing raw validator

Pure extends `validatePureRawContract`; Framed extends its existing raw-
contract validation path. Each adapter adds an adapter-private identity-facts
check with the same rules:

1. `visual_identity` is `null` exactly when
   `visual_identity_role_clause` is `null`.
2. A present projection has exactly the seven resolver-owned fields.
3. Profile, role, and subject class are lower-kebab identifiers; both SHA
   fields are lowercase 64-character digests; count is exactly `one`; and the
   restriction is a supported source-contract value.
4. The role clause is non-empty and its exact UTF-8 SHA-256 equals
   `role_clause_sha256`.

Clause normalization and profile compatibility are not recomputed in the
adapter. They remain resolver-owned; the adapter proves that the exact clause
it will send is the one bound by the resolver projection. It does not reread
the registry or accept a caller-supplied replacement projection.

Validation runs before raw-contract hashing, compiled-input construction,
derived publication, authorization-scope derivation, or plan publication. It
uses the existing `pure_raw_contract_invalid` and
`framed_raw_contract_invalid` bounded failures rather than adding a CLI schema
or second diagnostic owner.

Alternative: add one shared identity compiler/validator under Page Image Core
or target runtime. Rejected because provider-input compilation is explicitly
adapter-owned and two consumers alone do not justify a new shared authority.
The checks are small; symmetric tests are the drift guard.

### D4: Use adapter-local deterministic provider-identity builders

Pure adds a private builder beside its compiler. Framed places one adapter-
internal builder where both `compileFramedProviderInput` and
`validateFramedProviderInputContract` can use the same expected mapping. The
Framed exact validator compares `request.visual.identity` with that derived
semantic record, so a missing or altered clause, returned digest/path, extra
field, or non-canonical serialization fails before plan publication.

The builder assumes a successfully validated raw contract and performs no I/O,
lookup, normalization, fallback, or mutation. This makes provider compilation
a deterministic projection rather than another source reader.

Pure does not gain a new public compiled-input validator solely for symmetry;
its existing compiler boundary, canonical serialization, raw validator, and
integration tests are sufficient. Framed retains its stronger exact validator
because it already owns additional protected-composition invariants.

### D5: Reuse the existing hard-stop and same-check recovery loop

Under `human-centered-gates.md`, malformed or inconsistent identity facts are
a non-bypassable `hard-stop`: semantic identity, digest integrity, exact plan
attribution, and recoverability are uncertain. There is no `confirm`, force,
or waiver path.

The direct source is the resolver-produced identity pair carried into the raw
contract. The existing planning checkpoint cannot currently catch the failure
because it validates only object/string types. This change replaces that loose
admission with one exact check at the same checkpoint; it adds no controller
step, persistent result, retry, fallback, or human-operated repair.

The nearest legal action is to repair the owning registry/resolver/adapter
defect and rerun the same provider-free plan operation under the existing Task
Mandate. Focused negative tests prove the failure occurs before State, derived
publication, plan, grant, attempt, or provider effects. This is the shortest
loop required by `agent-assistance-and-control.md` and
`simple-reliable-control.md`.

### D6: Leave transport and per-page reference attachment unchanged

`page_image_target_runtime.mjs` continues to bind opaque compiled bytes, and
the `ppt_flow.mjs` submit factory continues to use those bytes as the prompt
and attach the plan-bound identity reference only for an identity-bearing
page. Neither surface reads `role_clause`, projection fields, or the registry.

Fake-transport integration tests will mutate registry text after planning and
prove that submit still sends the plan-bound compiled bytes. They will also
prove identity pages attach Style Master plus identity reference, while no-
identity pages attach only Style Master. This verifies transport without a
network call or a transport implementation change.

The existing deck-wide/per-page meaning of the
`reference_transport.identity_reference` descriptive field remains out of
scope; actual per-page attachment behavior is the only fact needed here.

### D7: Invalidate through existing exact bindings, without data rewriting

The semantic identity changes canonical provider-input bytes for identity-
bearing pages. Existing plan and lifecycle owners already bind
`compiled_provider_input_sha256`; recompilation therefore produces drift and
the existing raw-rebuild path. The implementation must verify this behavior
rather than add a compiler epoch, migration flag, state edit, or compatibility
branch.

Every selected-workflow stored-plan read used by authorization, generation,
and review calls the existing `resolveTargetStoredPlanContext` seam. That seam
recompiles the current adapter candidate and compares its typed raw-plan hash
with the retained plan before returning provider requests. A pre-change
projection-only plan therefore fails as stale before authorization or submit.
Progressive operations derive their `expected_plan` from the same current
stored-plan context, and the progressive owner compares it with the current
scope head before a grant or attempt. These existing guards are the cutover
mechanism; no deploy-time writer or plan migration is added.

Existing plans, batches, grants, attempts, generated media, and review records
remain immutable history. They are not patched or rebound to the new bytes.
Affected current runs create a fresh exact plan and follow existing
authorization, generation, and Complete Page Review. Source and State remain
unchanged unless a separate owner-authorized source edit occurs; a Harness
compiler fix alone does not advance `source_epoch`.

The observed `deck_ai_sdlc_bpm_keynote/3_versions/v8` pilot is migration evidence,
not a test fixture or apply target. After implementation, its four-page pilot
may be rerun operationally through the normal run-bundle workflow, preserving
the two no-identity controls and current registry wording so contract recovery
can be distinguished from later deck-specific prompt changes.

## Risks / Trade-offs

- **The clause may improve but not guarantee visual consistency.** Local tests
  prove semantic delivery and lineage only. Complete Page Review continues to
  judge the raster result and Style Master adherence independently.
- **Adapter-local checks can drift.** Keep the shape small, use the same field
  order in deterministic builders, and add symmetric positive/negative tests
  plus the existing architecture guard. A shared compiler would create a
  larger ownership problem than this duplication.
- **Tighter validation may reveal malformed retained fixtures.** Current
  resolver output already satisfies the target shape. Fix unsupported test
  fixtures or real resolver defects; do not widen the validator silently.
- **Exact bytes and remote rebuild cost change for current identity pages.** A
  one-step clean cut avoids a second invalidation. Existing records remain
  auditable, and new provider work still requires the existing exact plan and
  authorization path.
- **Provider-facing identity repeats subject restrictions already visible in
  some workflow-specific fields.** The repetition is intentional because the
  identity record must be self-contained and identical across workflows; the
  values are copied from one validated projection and tested for equality.

## Migration Plan

1. Land resolver contract tests first to lock the existing paired output and
   prove no resolver-shape migration is needed.
2. Add failing Pure and Framed identity-present and negative raw-contract tests.
3. Implement adapter-local validation and semantic identity builders, then
   update the Framed exact compiled-input comparison.
4. Add invalidation and fake-transport tests, including no-identity controls.
5. Run focused suites, architecture/contracts verification, the core test
   command, the broad Vitest sweep, and strict OpenSpec validation.
6. Do not rewrite any production run bundle. After the Harness change is
   implemented and reviewed, affected run owners replan and rebuild through
   the normal Page Image workflow.

Rollback removes the validator/builder changes for future compilation only; it
does not rewrite plans or generated evidence produced under either exact byte
contract. Forward repair through a fresh exact plan is the normal recovery.

## Verification Strategy

- **Unit:** use an OS-temporary synthetic non-`amber-agent` profile and locally
  owned fixture PNG bytes for Visual Asset tests, avoiding production deck data
  and the doctrine-specific amber model-sheet check. Verify deterministic
  clause/reference digests, confined bytes, invalid clauses, incompatible
  subject facts, and stable paired output. Exercise each adapter raw validator
  with null asymmetry, missing/extra keys, malformed
  IDs/digests/count/restriction, clause tamper, and digest mismatch.
- **Integration:** build representative temporary Pure and Framed bundles with
  identity and no-identity pages. Assert raw facts, canonical provider shape,
  absence of SHA/path, Framed protected composition, exact derived request
  bytes, compiled-input drift after a clause change, and stored-plan rejection
  when a retained plan contains the former projection-only compiled identity.
- **Transport:** use the existing fake-fetch seam to prove exact prompt bytes
  and per-page image attachment after post-plan registry drift; no live
  provider request is needed.
- **Architecture:** retain and run the guard that confines provider-input
  compilation to selected adapters; add no shared-runtime compiler marker.
- **E2E:** no new E2E suite is required because public CLI routing, MD
  Controller flow, State, authorization, and provider protocol are unchanged.
  Existing core and broad regression runs cover those retained boundaries.
- **Human:** a later run-bundle pilot judges actual cross-page identity and
  Style Master adherence. That review is operational validation, not evidence
  that substitutes for the Harness contract tests.
