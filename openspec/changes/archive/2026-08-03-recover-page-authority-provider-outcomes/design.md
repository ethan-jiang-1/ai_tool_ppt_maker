## Context

The v7 real Page Authority Pilot persisted three exact submissions. Each was
then reconciled to terminal `unknown`; there are no accepted raw bytes. A
direct smoke request succeeds, so the environment is available, but the old
adapter erased response-bound facts needed to distinguish a real transport
uncertainty from a response the framework can conclusively reject. The
terminal partial Pilot therefore routes to `pilot-review`, where raw coverage
correctly fails, but the lifecycle has no legal successor route.

The existing progressive raw plan, attempt records, batch/grant lineage,
materialization provenance, and raw owner remain authoritative. This change
must not rewrite historical v7 attempts or make a diagnostic projection an
evidence source.

## Goals / Non-Goals

**Goals:**

- Preserve `unknown` only for outcomes the client cannot prove after submit.
- Treat a fully received invalid response as terminal `known_failure` without
  exposing its contents.
- Return one legal successor-Pilot action when a terminal partial Pilot cannot
  be reviewed because its selected coverage is missing.
- Keep exact plan/batch identity, grant closure, and visual-quality gates.

**Non-Goals:**

- Retrying historical submissions, editing existing attempts, or looking up a
  provider result with an invented endpoint.
- Adding a provider response store, generic retry command, fallback provider,
  or a force option.
- Changing source, raw-contract, authorization, accepted-evidence, or delivery
  schemas.
- Automatically migrating any run bundle or hand-editing `_generated/`.

## Decisions

### 1. Classify at the existing adapter boundary

The adapter already owns the only direct `fetch` result. It will classify only
two response-complete conditions as Page Authority known failures:

- a received non-success HTTP response, represented by a fixed classification
  and numeric status; and
- a fully read successful response whose JSON envelope cannot be decoded,
  represented by a fixed invalid-response classification.

The adapter will reject a non-success response before reading its body. A
successful response whose body read itself fails remains unknown because the
framework cannot prove a complete result. Existing valid-PNG and invalid-media
decoding remains unchanged.

The error object carries only a fixed classification and optional status to the
existing progressive owner. The owner emits that bounded fact in its current
`known_failure` result; it persists no new field. This uses one source of
truth, does not retain provider content, and preserves the current
materialization-before-success ordering.

### 2. Evaluate Pilot review coverage before exposing its action

The raw owner will share a small direct check over the current plan's selected
Pilot IDs and current materialization map. `nextAction` uses it before routing
a terminal partial Pilot to review. If coverage is incomplete and paid debt
remains, it returns existing `plan_progressive_pilot` with its normal
`confirm`/exact-ID semantics. `prepareProgressiveRawPilotEvidence` uses the
same check and fails with the same owner action before publishing anything.

No special "retry" record is introduced. The standard successor batch
construction retains the terminal predecessor, increments generation, derives
the current debt scope, and requires a fresh grant. This removes the current
dead-end review branch instead of adding another controller or recovery state.

### 3. Keep CLI and inspection as projections

`ppt_flow image2 generate` returns the existing outcome shape plus an optional
bounded `provider_failure` object for a response-known failure. Media outcomes
retain their existing `provider_media` shape. `pilot-review` delegates the raw
owner action to the registered producer envelope; `state`/status obtains the
same action through read-only workflow inspection. Neither consumer parses
transport prose, response content, or makes a successor scope itself.

Under `human-centered-gates.md`, a missing/unreadable outcome stays a hard-stop
that protects provider-cost recoverability. A successor paid scope stays a
confirm because it is a new bounded cost decision. The existing user-approved
workflow can perform the resulting mechanical plan and authorization operations
only with exact owner-issued hashes.

## Risks / Trade-offs

- [A 5xx response might have generated an image despite failure] -> HTTP
  semantics provide a definitive failed response to this caller; bytes never
  arrived, the old grant closes, and only a new authorization can submit again.
- [A partial Pilot loses an otherwise useful sample] -> The coverage evaluator
  requires every selected tuple, preserving the existing review integrity rule.
- [Diagnostic leaks provider content] -> Classifications are closed constants;
  only validated numeric status may be output, and tests use sentinel strings
  to assert they never escape.
- [A transport error is prematurely terminalized] -> `fetch` and body-read
  exceptions remain `unknown`, preserving reconciliation before any successor.

## Migration Plan

1. Release the adapter classification and raw-owner coverage transition with
   focused tests.
2. Historical attempts stay byte-identical; their terminal status remains a
   direct input to current debt evaluation.
3. A designated run re-enters only through the owner-issued successor planning
   action, a newly derived batch, and its new exact grant.
4. Rollback requires no state migration because no schema or retained response
   data is added.

## Open Questions

None.
