## Context

See proposal.md — Why. Empirically the provider clause text already reaches the serialized provider body:
`framedRawContract` / `pureRawContract` carry `provider_clauses` as a top-level raw-contract field,
`createTargetProviderRequest` wraps the whole contract, and `targetPageAuthoritySubmitFactory` serializes
the request into the provider `prompt`. What is missing is a locked contract: pure has no canonical raw
contract validation at all (it only hashes), framed validates `provider_clauses` as `object-or-null` (not
the `{recipe, composition, motifs}` text shape), and no regression test asserts the text inside the
serialized body.

Current code facts:
- `compilePureTargetRawPlanCandidate` hashes `pureRawContract(slide)` without validating it
  (`04-pure-image/index.mjs`).
- `validateFramedRawContractAgainstProfile` is the framed canonical validator and already runs at plan time
  before authorization; its public `validateFramedRawContract` wrapper is the established direct test seam
  (`03-framed-image/index.mjs`).
- Provider clause text is text-guard validated at visual-language resolution time
  (`02-visual-system/internal/page_authority_visual_language.mjs`), so raw-contract validation verifies
  structure without rewriting or re-guarding text.
- Both adapters already import from `shared/image2/page_authority_target_runtime.mjs`.

## Goals / Non-Goals

**Goals:**
- Pure and framed raw contracts share one validated canonical provider-clause text shape: an exact record with
  non-empty `recipe` and `composition` strings plus a `motifs` array of non-empty strings (the array may be empty).
- The serialized provider body is provably carrying the exact recipe, composition, and motif text from both
  supported workflows in regression tests.
- Raw contract remains the single source of provider clause text for the request — no submit-time
  reverse-lookup.

**Non-Goals:**
- No change to the provider request transport, authorization, or idempotency contract.
- No provider-clause rewrite, composition, or fallback logic.
- No new diagnostic output fields or CLI surface.
- No Style Master or page-raw deadline/dotenv behavior change.

## Decisions

### D1: Add a shared canonical provider-clause shape predicate in `page_authority_target_runtime.mjs`

Define and export `isPageAuthorityProviderClausesShape(value)` returning true only for a non-null, non-array
record with exactly `recipe`, `composition`, and `motifs`; `recipe` and `composition` are non-empty after trim,
and every motif is non-empty after trim. The predicate is read-only and accepts the frozen resolver records
already carried by raw contracts. Both adapters import it, so the text-shape contract has a single definition
and cannot diverge between Pure and Framed.

*Alternatives:* duplicate the ~6-line check in each adapter — rejected because the two adapters would drift
and the check is exactly the contract this change is locking.

### D2: Pure raw contract validation mirrors the framed validator, without a render profile

Add and export `validatePureRawContract(rawContract)` in `04-pure-image/index.mjs`, matching the existing
Framed validator's bounded result seam: `{ ok: true, raw_contract_sha256 }` on success and
`{ ok: false, code: "pure_raw_contract_invalid", message }` for a canonical-shape failure. It validates the exact Pure top-level key set,
`schema === TARGET_RAW_CONTRACT_SCHEMA`, non-empty `slide_id`, `workflow === PURE_IMAGE_WORKFLOW`, a resolved
`visual_language` record, `provider_clauses` passing `isPageAuthorityProviderClausesShape`,
`visual_identity_role_clause` string-or-null, `visual_scene` string-or-null, `visual_identity` object-or-null,
`display` record, and `body` string-or-null. `compilePureTargetRawPlanCandidate` invokes it immediately after
constructing each raw contract and before hashing, request construction, authorization-scope derivation, or
source/raw-plan materialization, and uses the returned digest for `raw_contracts_by_slide` rather than hashing
the contract a second way.

*Rationale:* framed already hard-stops malformed contracts pre-grant; pure should offer the same invariant.
No render profile exists for pure, so the validator checks the standalone canonical shape only.

*Alternative:* validate inline in the plan loop — rejected; a named exported validator is directly testable and
matches the established Framed adapter pattern without adding a controller, state record, or transport check.

### D3: Strengthen framed `provider_clauses` validation to the canonical text shape

In `validateFramedRawContractAgainstProfile`, replace the `object-or-null` check with
`isPageAuthorityProviderClausesShape`. The existing Framed validator already requires a resolved
`visual_language`, so null or malformed clauses are an immediate contract violation, not an `unknown` outcome.
The public `validateFramedRawContract` wrapper remains the test seam; no new Framed transport surface is added.

### D4: Regression tests assert the text inside the serialized provider body

- Extend the Pure submit-factory test in `tests/shared/image2/test_style_master_raw_binding.mjs` to parse
  `providerBody.prompt` and assert exact `raw_contract.provider_clauses` values.
- Add Pure validator coverage in `tests/04-pure-image/test_pure_workflow.mjs` for a plan-produced valid
  contract and null, wrong-key, empty-text, and non-string motif failures. The valid provider-free plan test
  also asserts that its stored raw-contract digest equals the validator result. Invalid-shape coverage proves
  the validator boundary. A test-local wrapper around the existing trusted resolver then returns a selection
  with `provider_clauses: null` while retaining its projection, so `buildPureTargetRawPlan` proves compiler
  wiring: it fails before source/raw-plan materialization. This is test-only fault injection, not a new
  production adapter seam.
- Extend `tests/03-framed-image/test_framed_plan_lifecycle.mjs`, which already imports the public
  `validateFramedRawContract`, with the same malformed clause cases and the same resolver-wrapper fault
  injection. `buildFramedTargetRawPlan` must reject before it materializes source/raw-plan state.
- For each workflow, use a plan with the default registry's supported non-empty `connected-nodes` motif and
  invoke `targetPageAuthoritySubmitFactory` with a fake `fetch`. Parse its actual HTTP `body.prompt` JSON and
  compare the recipe, composition, and ordered motif strings to the plan-bound raw contract. After plan
  creation, replace the temporary registry's `connected-nodes` provider clause with a different
  text-guard-safe value before invoking the submit factory; this distinguishes plan-bound delivery from a
  submit-time registry reread or reassembly. The Framed generation callback alone is not the transport seam
  because it receives an already-constructed request, not the serialized body. Keep existing raw-contract
  object-level assertions and add body-level assertions for both workflows; both levels are required by the
  modified requirement.

### D5: Reuse the existing plan checkpoint as a JS-owned integrity hard-stop

The direct source of record is the adapter-owned raw contract compiled from the trusted visual-language
selection; the shared predicate is the one evaluator for its provider-clause subrecord. The existing plan
checkpoint is insufficient today because Pure hashes without validation and Framed admits any object or null.
This change reuses that checkpoint rather than adding state, a controller branch, a retry, or a waiver.

An invalid contract is a JS-owned `hard-stop`, not a human quality `confirm`: it protects the invariant that no
provider request or authorization scope is derived from an unvalidated provider prompt. The validators return
bounded `{ ok: false, code, message }` results; each compiler preserves that code through its existing
`PureImageWorkflowError` or `FramedImageWorkflowError`. The safe recovery is to repair the malformed
source/resolver or adapter defect and rerun the same planning checkpoint. The negative resolver-wrapper tests
prove the failure short-circuits before source/raw-plan state materialization, while the valid plan tests prove
canonical current resolver output remains unblocked.

## Verification Strategy

- **Unit:** the shared predicate is exercised through the exported Pure and existing Framed validators, including
  malformed shapes and an empty `motifs` array that remains valid.
- **Integration:** existing temporary-bundle workflow tests prove valid Pure and Framed plan compilation; an
  isolated fixture for each workflow selects the seeded `connected-nodes` motif, and the real submit factory
  with fake `fetch` parses the actual JSON body to compare the prompt's raw-contract clause values after a
  post-plan temporary-registry drift, without a network call. Test-local wrappers of the existing resolver
  inject null clauses to prove both plan compilers fail before materialization without adding a production
  test seam.
- **E2E:** no mock E2E is added. The public CLI, controller topology, state records, authorization, and provider
  protocol are unchanged; the adapter and fake-transport integration seams are the smallest evidence boundary.

## Risks / Trade-offs

- [Risk: an existing supported fixture has a noncanonical clause object] → Mitigation: the visual-language
  resolver already emits the exact text record; run the protected core suite and change only a genuinely supported
  contract through a later explicit spec change, never by silently widening the validator.
- [Risk: strengthening framed validation from `object-or-null` to exact keys rejects a future clause variant]
  → Mitigation: the exact shape is the current resolver output and is already the text-guard-protected
  contract; any extension becomes an explicit spec change.
- [Risk: the provider-body regression test is brittle if the request schema evolves] → Mitigation: assert on
  the exact `raw_contract.provider_clauses` values flowing through `JSON.stringify(request)`, which is the
  observable contract the spec locks.
- [Risk: equal pre- and post-plan registry text can let a submit-time reread evade a body equality test] →
  Mitigation: replace the temporary registry's `connected-nodes` clause with a different text-guard-safe
  value after plan creation and before fake submission; the serialized body must still match the stored plan
  request exactly.
- [Risk: a zero-motif fixture can prove recipe/composition delivery while leaving motif delivery untested] →
  Mitigation: body-level fixtures select the bundled `connected-nodes` motif and compare its ordered clause
  text after serialization.
- [Risk: direct validator tests could pass while an adapter bypasses the validator] → Mitigation: use a
  test-local resolver wrapper to feed a null clause record into each actual plan compiler and assert its
  bounded invalid result plus absence of source/raw-plan materialization.

## Migration Plan

Framework-internal change only; no data migration. Valid existing contracts preserve their bytes and hashes.
Existing accepted selections and historical attempt records remain readable; a newly compiled malformed contract
fails through the existing plan checkpoint rather than being patched in place. No `deck_*` production artifact is
a fixture or migration target.
