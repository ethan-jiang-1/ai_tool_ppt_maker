## Why

The archived command-surface change made setup, work, and orientation discoverable,
but two commitments from its [source plan](../../../../_backlog/_done/_closed_plans/command-surface-and-entry-seam-reconciliation.md) remain only implicit: a novice needs a
consistent explanation of a failure, and an Agent needs one explicit precedence
rule before it chooses inspection, location, or pre-install recovery.  Without
those contracts, correct producer diagnostics can still be presented vaguely or
be displaced by an improvised recovery path.

## What Changes

- Establish one non-persistent diagnostic-recovery handoff in the Agent
  contract.  It consumes the current valid producer-owned CLI failure envelope
  before considering any new inspection or discovery action.
- Require every novice diagnostic translation to contain exactly four stable
  parts: what happened, what it affects, what the Agent can mechanically do,
  and the one real human action or confirmation required.  The fourth part
  explicitly says that no human decision is needed when the producer permits a
  fully mechanical repair.
- Define the ordered recovery selection rule: retain a current valid failure
  envelope; otherwise inspect a known exact run with `state --json`; otherwise
  request the supported locator; use direct `env-check` only when the main
  entry is unavailable or the framework is pre-install.  The recovery entry is
  not a generic fallback, run locator, Controller starter, or production
  readiness substitute.
- Carry the same consumer rule into novice-facing command guidance and the
  generated run-bundle diagnostic guidance, with focused contract tests for
  precedence, secret-safe translation, and human versus mechanical boundaries.

This change preserves the existing producer schema, diagnostic categories,
owner-issued `next`, controller lifecycle, command grammar, and Page Authority
authorization/evidence contracts.  It adds no CLI, runtime dispatcher,
persisted route, retry policy, or inferred run selection.

The change applies `openspec/policies/human-centered-gates.md` without
reclassifying a producer outcome: a deterministic repair remains a `guide`, a
real cost or reversible-risk decision remains `confirm`, and identity,
integrity, authorization, or unrecoverable diagnostic ambiguity remains a
`hard-stop`.  Its four-part explanation names the existing protected invariant
and safe action; it never offers a waiver or force path.

It applies `openspec/policies/agent-assistance-and-control.md` and
`openspec/policies/simple-reliable-control.md` by reusing the current direct
authorities: producer envelope, state owner, run-bundle locator, and direct
pre-install environment check.  The Agent performs only the producer-permitted
mechanical action and reruns the named checkpoint.  A human is asked only for
the one decision the current owner reserves.  The design deliberately avoids a
second diagnostic classifier, recovery controller, durable record, hidden
fallback, or retry menu.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `framework-charter`: define the canonical, non-persistent diagnostic-recovery
  handoff and its ordered authority boundary in active Agent guidance.
- `commands-reference`: make the orientation/"I am stuck" presentation describe
  the bounded four-part result and route it to the canonical handoff without
  exposing protocol mechanics.
- `node-specification`: require MD consumers and generated run-bundle guidance
  to preserve producer control while rendering the four parts and applying the
  recovery precedence.

## Impact

- **Framework source:** `PPTMAKER_FRAMEWORK/charter/AGENT_CONTRACT.md`,
  `PPTMAKER_FRAMEWORK/COMMANDS.md`, `PPTMAKER_FRAMEWORK/charter/NODE-SPEC.md`,
  and the existing generated deck-guide source in `bundle_layout.mjs` (plus a
  narrow shared reference only if needed to prevent duplicated wording).
- **Tests:** focused static/process contracts under `tests/` verify the exact
  presentation/routing rule and the generated guide.  No test invokes a live
  provider; no production `deck_*` or `dpt_*` directory is read or changed.
- **Control ownership:** MD/Agent owns the conversational explanation and route
  selection; JS/CLI remains the sole producer of envelope fields and next
  actions.  This is a consumer-policy change, not an MD-to-JS schema change.
- **Run-bundle contract:** `compatible`.  Newly initialized bundles gain clearer
  generated guidance; existing bundles require no migration and no state,
  receipt, grant, attempt, history, or projection field changes.
