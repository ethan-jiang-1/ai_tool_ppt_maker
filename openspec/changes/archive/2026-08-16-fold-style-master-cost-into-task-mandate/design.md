## Context

See `proposal.md` for motivation and `specs/playbook-execution/spec.md` for the
new requirement. The accepted spec `openspec/specs/playbook-execution/spec.md`
already says an active Task Mandate covers "ordinary in-scope provider cost"
(`### Requirement: Page Image Workflow gates have one direct recovery and review
path`). The 8/10 change `align-task-mandate-exact-grants` applied that to Page
Image Pilot/Expansion authorize nodes but explicitly left Style Master candidate
authorization as a human cost gate. This change closes that gap using the same
node-shape template the 8/10 change established.

Current `create-deck.md` Style Master authorize nodes still carry
`decisions: [authorize, revise, decline]` and a Step 2 GATE that records the
decision "against that exact cost". The Page Image authorize nodes (migrated on
8/10) instead carry no `decisions` and `exit: [evidence:exact-batch-grant-recorded]`.
`md_controller_reader.mjs` already accepts that shape, so no reader change is
needed.

One material gap: the Page Image `evidence:exact-batch-grant-recorded` is produced
by a state-owned handoff — `state.mjs` exports
`recordTargetProgressiveAuthorizeCliHandoff`, called by the `image2 authorize`
route in `ppt_flow.mjs` (`~:3079`), which validates the plan/batch/grant facts
and records `kind: cli` evidence before completing the node. Style Master has no
equivalent producer. `style-master authorize` (`ppt_flow.mjs` `~:3455`) calls
`authorizeStyleMasterCandidates` and prints output without touching Controller
state. This change therefore adds a Style Master authorize handoff so the new
node shape can actually complete.

## Goals / Non-Goals

**Goals:**

- Convert both Style Master authorize nodes to the 8/10 Page Image authorize
  node shape (no `decisions`, `exit` = typed `cli` grant evidence), and add the
  state-owned evidence producer that completes them.
- Keep the Style Master `review` node as the sole human visual decision.
- Bring `checkpoint-intake`'s "remote-cost boundary" prose into conformance with
  the existing mandate policy (a conformance fix, not a new spec requirement).

**Non-Goals:**

- No change to `style-master-generation` JS spec or the grant mechanism itself;
  the authorize operation only gains a post-success Controller handoff.
- No change to `prompt_budget`: it is the selected model/route's real prompt
  byte limit (a machine fact, not a spending question) and is fully out of
  scope — not renamed, not softened, not reworded.
- No automation of quality gates (`review-target-*-style-master`, Pilot review,
  Complete Page Review, delivery review).
- No new Controller node, State schema record, waiver, retry, or fallback.

## Decisions

### D1: Reuse the 8/10 authorize-node shape, keep node IDs stable

`authorize-target-framed-style-master` and
`authorize-target-pure-style-master` change to:

```yaml
node: authorize-target-framed-style-master
method_module: 02-visual-system
production_workflows: [framed]
draft_route: true
requires: [plan-target-framed-style-master]
produces: [target-framed-style-master-candidate-authorization]
entry: []
exit: [evidence:style-master-grant-recorded]
```

- Remove `decisions: [authorize, revise, decline]` and the
  `exit: [user_decision_recorded]` line.
- Step guidance becomes one CLI step: run
  `ppt_flow style-master authorize <run-dir> --plan-hash <sha256>` and retain the
  grant digest. Drop the "record authorize/revise/decline against that exact
  cost" GATE.
- `generate-target-*-style-master` `entry` changes from
  `[node_decision:authorize-target-*-style-master:authorize]` to
  `[node_evidence:authorize-target-*-style-master:style-master-grant-recorded]`,
  mirroring Page Image generate nodes' `node_evidence` entry.

Node IDs stay identical, so `controller-manifest.json` and
`test_md_controller_reader.mjs` node lists do not change.

**Alternative considered**: keep the human `authorize` decision but mark it
`guide`. Rejected — a `guide` still presents a confirmable cost branch; the
policy intent is that ordinary cost is not a human decision at all. The 8/10
template already removes the decision entirely, and consistency with Page Image
is worth more than a bespoke Style Master variant.

### D2: Add a state-owned Style Master authorize CLI handoff

Add `recordStyleMasterAuthorizeCliHandoff(deckDir, { runVersion, runDir, planHash,
grantHash, expectedStateSha })` to `state.mjs`, with a
`STYLE_MASTER_AUTHORIZE_CLI_EVIDENCE_KEY = "style-master-grant-recorded"`. It
mirrors `recordTargetProgressiveAuthorizeCliHandoff`:

1. Revalidate the direct facts: the supplied `planHash` matches the current
   Style Master plan, and `grantHash` matches the grant bound to that plan —
   reusing the existing Style Master scope/store evaluator (no new authority).
2. Derive the target node from the resolved workflow:
   `authorize-target-framed-style-master` or `authorize-target-pure-style-master`.
3. Record `setNodeEvidence(targetNode, "style-master-grant-recorded", { kind:
   "cli", note })` and `setNodeStatus(targetNode, "completed")`, then
   `writeState` + `appendHistory` with a `style_master_authorize_cli_handoff`
   history type.

Idempotency mirrors Page Image: a retry after a CAS race replays the same
evidence; a same-execution source refinement or successor supersedes only prior
typed CLI grant evidence while retaining the immutable Style Master plan/grant
lineage; a grant at a non-matching node never completes a sibling.

The `style-master authorize` route in `ppt_flow.mjs` calls this handoff after
`authorizeStyleMasterCandidates` succeeds and injects `controller_handoff` into
its output, exactly as `image2 authorize` does.

**Alternative considered**: let the Agent record `kind: agent` evidence after
`style-master authorize`. Rejected — that makes the grant completion
Agent-asserted rather than state-validated, contradicting the 8/10 precedent and
`agent-assistance-and-control.md` ("never hand-write a receipt ... merely to
make the workflow appear unblocked"). The handoff is the smallest state-owned
producer that keeps the completion attributable to a real grant.

### D3: Ownership boundary

- **MD/Agent** owns candidate-count choice and the mechanical
  `plan → authorize → generate` sequence under the mandate, and decides whether
  the current Work Request still covers the requested refinement.
- **JS/CLI** owns the immutable grant CAS, plan/grant digest binding, the
  handoff validation, and diagnostics.
- **Human** owns `review-target-*-style-master` `proceed | repair | redirect`
  and any explicit spending limit.

The direct authority is the State Task Mandate plus the style-master grant
record; the change adds no second authority.

### D4: Policy classification

- `human-centered-gates.md`: Style Master candidate authorization moves from
  `confirm` to `guide` (mandate-covered ordinary cost). `review-*-style-master`
  stays `confirm` (reversible visual-quality choice). Identity/integrity,
  stale-plan, and `image2_prompt_budget_overflow` stay `hard-stop` (they protect
  authorization/attributable-execution invariants, not money).
- `agent-assistance-and-control.md`: cost/receipt/evidence are Agent/Harness
  bookkeeping under the mandate, not human homework; the human decision shrinks
  to the visual review. The handoff is the one direct evaluator for the grant
  fact, reused across the authorize gate and completion.
- `simple-reliable-control.md`: net simplification = delete one repeated
  cost-confirm branch; no retry/fallback/parallel success store is added.

### D5: Verification strategy

- **Unit/integration**: `tests/shared/state/test_md_controller_reader.mjs`
  confirms the no-`decisions` + `exit:[evidence:...]` node shape parses and the
  `node_evidence` entry resolves. Add state tests for the new handoff:
  deterministic grant-evidence recording, idempotent replay, refinement
  supersede, unmatched-node non-completion, and invalid plan/grant short-circuit.
  Existing `tests/contracts/test_process_style_master_cli.mjs` /
  `test_process_style_master_lifecycle_integration.mjs` already exercise
  `style-master authorize` as machine authorization; extend them to assert the
  new `controller_handoff` output and node completion.
- **Controller/CLI**: grep for any test asserting the Style Master authorize
  nodes' `decisions:[authorize,revise,decline]` or `user_decision_recorded` exit
  and update the assertion to the new shape. Run the playbook/controller
  validation that consumes `create-deck.md`.
- **E2E**: `tests_e2e/shared/workflow/test_mock_target_workflow_journey.mjs`
  already covers the mock target journey (Style Master + Pilot + budget failure).
  Confirm the Style Master authorize leg emits no human-cost diagnostic and
  completes the authorize node under the mandate.
- **Validation**: `openspec validate --strict` on the change, `git diff --check`,
  and the repository's documented baseline (`npm test`).

## Risks / Trade-offs

- [Removing the Style Master cost gate could let candidate generation run away]
  → candidate count stays bounded at 0..4 and Agent-chosen; the grant remains
  mechanically required; the human still sees every candidate under review.
- [Weakening a "genuinely new consequential design direction" boundary] → the
  design direction is decided at `review-*-style-master` (proceed/repair/
  redirect), not by authorizing a candidate count. Cost goes to the mandate,
  direction stays human.
- [The new handoff could complete the wrong node or replay incorrectly] → mirror
  the Page Image handoff's validation and idempotency exactly; state tests prove
  unmatched-node non-completion, replay, and supersede.
- [The playbook YAML/decision change breaks node validation] → the 8/10 change
  already proved the target shape is accepted by `md_controller_reader.mjs`;
  node IDs are unchanged, so manifest and reader node lists stay valid. The
  reader test is the guard.

## Migration Plan

None. This adds a Controller handoff and changes MD Controller guidance plus one
accepted spec requirement; no run bundle, State schema, profile source, or
`_generated/` bytes are touched. Rollback before archive is an ordinary revert of
`create-deck.md`, `state.mjs`, `ppt_flow.mjs`, and the spec delta. After archive,
the main `playbook-execution` spec carries the new requirement; the playbook text
and the new handoff are the runtime surfaces.
