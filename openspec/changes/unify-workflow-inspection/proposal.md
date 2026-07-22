## Why

Workflow readiness and the next legal action are currently derived independently by controllers, generic node state, domain transactions, `status`, `state --json`, and CLI routing. This makes an Agent reconstruct mode, hashes, authorization, and recovery protocol from repeated projections, while BUG-033 has not yet isolated its earliest direct failure. A read-only shared inspection contract is needed before later changes can safely retire duplicate control.

## What Changes

- Introduce a `workflow-inspection` capability with a versioned, read-only workflow projection over existing direct owners, including the run-bundle layout owner. It reports an identity-bound checkpoint, `ready|guide|confirm|hard-stop` posture, earliest bounded root cause, one typed ordered `primary_action` (including an explicit terminal action), non-primary observations, optional allowed continuation, protected invariant, and attributable evidence summary.
- Make `status --json` and `state --json` expose the same canonically serialized nested `workflow_inspection` projection for an unchanged checkpoint. `state --json` also retains an explicit immutable durable-state payload as its only raw-state document so an observation projection cannot overwrite or duplicate raw state; compatible outer card fields remain available. Human-readable status/state and resume guidance consume the same primary action instead of independently deriving one.
- Require inspection to be zero-write, zero-network, uncached, and non-healing. It does not replace raw state, direct owner authority, gate classification, or mutation-time source/CAS/authorization/receipt revalidation.
- Establish canonical journey baselines and a durable-state ledger for HTML, Image2, resume, refresh, structural change, visual-slot refinement, migration/recovery, and the BUG-033 single-page probe. The probe records actual earliest owner diagnostics without hand-writing state, authorization, receipts, generated assets, or PPTX output.
- Add focused control-contract tests for prerequisite short-circuiting, one primary action, wrong-owner no-mutation, same-check rerun, zero-write/zero-network inspection, raw-state compatibility, and parity between the two JSON observation surfaces.
- Keep Image Production graph, directory ownership, `image2-refinement` durable record key, adapter implementation, production-mode enums, transition, authorization, and recovery contracts unchanged. Those changes remain explicitly deferred to Changes 2 and 3.

## Capabilities

### New Capabilities

- `workflow-inspection`: Read-only, versioned workflow readiness projection that composes existing direct owners into one bounded primary action without becoming a state or mutation authority.

### Modified Capabilities

- `cli-surface`: `status` and `state --json` publish the shared inspection projection without changing their producer-owned diagnostics or write behavior.
- `node-specification`: State-facing observation and controller-consumer requirements preserve raw durable state while consuming the shared projection for readiness and next-action presentation.
- `playbook-execution`: Resume and human-facing controller guidance consume the common inspection result rather than creating a second readiness or recovery evaluator.

## Impact

This is framework repository maintenance affecting the MD-to-JS control protocol in `PPTMAKER_FRAMEWORK/`, its `status`/`state` CLI observation surfaces, playbook guidance, and focused unit/integration/E2E fixtures. Direct Sources of Record remain the existing mode, source, artifact/review, authorization, transaction, and recovery owners; Markdown, metadata mirrors, status, and inspection remain projections.

The change follows `openspec/policies/human-centered-gates.md`: existing owners continue to classify `guide`, `confirm`, and `hard-stop`; confirmation still requires a human reason and hard-stops retain their protected invariant and owner recovery. It follows `agent-assistance-and-control.md` and `simple-reliable-control.md` by consolidating repeated inspection into one prerequisite-first evaluator and one nearest legal action, while leaving semantic decisions to humans and mechanical checks to direct owners. No new blocking rule, persistent control state, provider call, authorization path, force/waive bypass, or recovery authority is introduced.
