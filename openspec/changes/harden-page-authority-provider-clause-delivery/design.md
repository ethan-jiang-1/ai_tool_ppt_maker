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
  before authorization (`03-framed-image/index.mjs`).
- Provider clause text is text-guard normalized at visual-language resolution time
  (`02-visual-system/internal/page_authority_visual_language.mjs`), so runtime guard re-normalization in the
  raw contract is unnecessary.
- Both adapters already import from `shared/image2/page_authority_target_runtime.mjs`.

## Goals / Non-Goals

**Goals:**
- Pure and framed raw contracts share one validated canonical provider-clause text shape
  `{recipe: string, composition: string, motifs: string[]}`, rejected at plan time when malformed.
- The serialized provider body is provably carrying the provider clause text in regression tests.
- Raw contract remains the single source of provider clause text for the request — no submit-time
  reverse-lookup.

**Non-Goals:**
- No change to the provider request transport, authorization, or idempotency contract.
- No provider-clause rewrite, composition, or fallback logic.
- No new diagnostic output fields or CLI surface.
- No Style Master or page-raw deadline/dotenv behavior change.

## Decisions

### D1: Add a shared canonical provider-clause shape predicate in `page_authority_target_runtime.mjs`

Define and export `isPageAuthorityProviderClausesShape(value)` returning true only for a frozen-safe plain
object with exactly `recipe` (non-empty string), `composition` (non-empty string), and `motifs` (array of
non-empty strings). Both adapters import it, so the text-shape contract has a single definition and cannot
diverge between pure and framed.

*Alternatives:* duplicate the ~6-line check in each adapter — rejected because the two adapters would drift
and the check is exactly the contract this change is locking.

### D2: Pure raw contract validation mirrors the framed validator, without a render profile

Add `validatePureRawContract(rawContract)` in `04-pure-image/index.mjs` and call it in
`compilePureTargetRawPlanCandidate` before hashing/authorization. It validates the canonical shape:
`schema === TARGET_RAW_CONTRACT_SCHEMA`, non-empty `slide_id`, `workflow === PURE_IMAGE_WORKFLOW`,
`visual_language` plain object, `provider_clauses` passing `isPageAuthorityProviderClausesShape`, plus
`visual_identity_role_clause` string-or-null, `visual_scene` string-or-null, `visual_identity` object-or-null,
`display` plain object, `body` string-or-null. It returns the raw contract SHA, mirroring
`validateFramedRawContractAgainstProfile`'s return shape, so the plan loop uses one pattern.

*Rationale:* framed already hard-stops malformed contracts pre-grant; pure should offer the same invariant.
No render profile exists for pure, so the validator checks the standalone canonical shape only.

*Alternative:* validate inline in the plan loop — rejected; a named validator is directly unit-testable and
matches the framed pattern.

### D3: Strengthen framed `provider_clauses` validation to the canonical text shape

In `validateFramedRawContractAgainstProfile`, replace the `object-or-null` check with
`isPageAuthorityProviderClausesShape` and require it non-null whenever a `visual_language` is resolved
(which the validator already requires). A resolved visual language with null/malformed clauses is a contract
violation, not an `unknown` outcome.

### D4: Regression tests assert the text inside the serialized provider body

- Extend the submit-factory test in `tests/shared/image2/test_style_master_raw_binding.mjs` (pure path) to
  parse `providerBody.prompt` and assert the exact `raw_contract.provider_clauses` text is present.
- Add a plan-level pure test asserting malformed contracts hard-stop before authorization.
- Add/extend framed tests asserting malformed `provider_clauses` are rejected by
  `validateFramedRawContractAgainstProfile`.
- Keep raw-contract object-level assertions (existing) and add body-level assertions; both levels are
  required by the spec scenarios.

## Risks / Trade-offs

- [Risk: a legitimate fixture or hand-built receipt has `projection` without `provider_clauses`, and the new
  pure validator breaks it] → Mitigation: the spec scopes rejection to "resolved visual language with
  malformed/missing clauses"; run the full regression suite (including contract fixtures) and relax only if
  a real supported input is affected.
- [Risk: strengthening framed validation from `object-or-null` to exact keys rejects a future clause variant]
  → Mitigation: the exact shape is the current resolver output and is already the text-guard-protected
  contract; any extension becomes an explicit spec change.
- [Risk: the provider-body regression test is brittle if the request schema evolves] → Mitigation: assert on
  the exact `raw_contract.provider_clauses` values flowing through `JSON.stringify(request)`, which is the
  observable contract the spec locks.

## Migration Plan

Framework-internal change only; no data migration. Existing accepted selections and historical attempt
records remain readable. No `deck_*` production artifact is a fixture or migration target.
