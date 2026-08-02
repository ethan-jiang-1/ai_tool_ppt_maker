## Context

See [proposal.md](proposal.md) for motivation. The current framework already has
the necessary direct authorities: cli-surface owns a bounded final failure
envelope, node-specification owns its MD consumer behavior, the state owner
returns an exact-run inspection action, the run-bundle locator resolves a human
supplied card/path, and direct env-check is pre-install recovery only. The gap
is presentation and selection: these facts are documented separately, so a
novice-facing answer can lose its explanation shape or an Agent can begin from
the wrong recovery source.

## Goals / Non-Goals

**Goals:**

- Give every diagnostic answer one predictable four-part shape while preserving
  producer control over the actual action.
- Make the source-selection order explicit and testable without changing an
  existing owner operation.
- Keep the routine non-persistent and usable both from repository guidance and
  a freshly initialized, already-located run bundle.

**Non-Goals:**

- Add a diagnostic parser, new CLI command, generic dispatcher, retry policy,
  recovery Controller, state field, or new authorization boundary.
- Reclassify guide, confirm, or hard-stop, modify CLI envelope schema, or alter
  state/projection write behavior.
- Make a run-bundle guide locate a deck or use direct env-check for normal work.

## Decisions

### 1. Keep one canonical routine in the Agent Contract

AGENT_CONTRACT.md will gain a compact named diagnostic-recovery handoff. It is
the only document that owns the full recovery decision tree. COMMANDS.md will
describe the user outcome and point Agent readers to that handoff; the generated
deck guide will retain only the already-located envelope-consumption portion.

This is preferable to a new playbook/diagnostic-recovery.md: existing playbooks
are Controller/lifecycle documentation, while this routine must be ephemeral,
context-free, and incapable of recording state. It is also preferable to
duplicating a routing table in every playbook, which would create drift and a
second control source.

### 2. Render four parts from bounded facts, not a new interpretation layer

The routine will use the final valid envelope and existing owner inspection
result as direct facts:

| Part | Permitted basis | Boundary |
| --- | --- | --- |
| What happened | Sanitized summary, category, and bounded reason | No raw stderr, stack, provider body, prompt, or secret. |
| What it affects | Producer subject/source/lineage or inspected exact-run scope | Missing scope remains unknown; the Agent does not infer it. |
| What the Agent can mechanically do | Exact producer next only when it permits mechanical work | No synthesized shell command, retry, authorization, or mutation. |
| One human action or confirmation | Current requires_human / existing confirmation boundary, or explicit no-action-needed | One decision only; no waiver, menu, or implicit approval. |

The producer remains the control authority. The four-part rendering is a strictly
derived explanation layer, so it does not alter cli-surface schema or create a
second diagnostic classification.

### 3. Express precedence as a short decision tree

The contract will state this tree literally:

    current valid CLI failure envelope -> consume producer next
    otherwise, startable main entry + known exact run -> state --json
    otherwise, startable main entry + no exact run -> supported locator
    otherwise, pre-install or unavailable main entry -> direct env-check

A valid current envelope wins because it is the most recent producer fact and
already names the legal action. Without it, state is the exact-run owner;
without a run, the locator is the sole safe discovery source. Direct env-check
is intentionally last: it is only feasible when normal entry is unavailable,
and it cannot substitute for normal run-bound readiness. A missing/invalid
envelope is an external-interruption boundary, not permission to parse prose; it
can only fall through to an applicable read-only discovery branch.

This gives the shortest direct fact -> one action -> same checkpoint loop
required by simple-reliable-control.md. It deletes the accidental choice between
generic inspection, guessed run selection, and ad hoc env-check recovery rather
than adding a new fallback engine.

### 4. Preserve gate posture and responsibility boundaries

The routine reads, rather than changes, the producer's current control fact.
For a guide, the Agent performs the legal mechanical repair and the fourth part
says no human decision is required. For confirm, the Agent explains the existing
scoped decision/cost and stops. For a hard-stop, it names the protected
invariant and the owner-safe recovery route; no force or waiver is invented.

MD/Agent owns explanation and route selection. JS/CLI owns the envelope, field
meanings, exact invocation, and any write. No durable writer or reader is
introduced, so there is no migration, invalidation, or projection to maintain.

### 5. Test documentation contracts and generated guidance, not a fictional NL runtime

There is no framework natural-language response runtime to unit-test. Focused
tests will therefore validate the canonical contract's four ordered parts,
precedence branches, and forbidden alternatives; extend the current intent-route
and generated bundle-guide coverage to prove the user and runtime surfaces point
to the same owner boundaries. Tests use static framework files and temporary
initialized bundles only.

Unit/contract coverage is required. A small integration-style init-bundle test
is required because it verifies generated guide output. Mock or real E2E is not
warranted: no public executable behavior, provider adapter, or persisted
workflow state changes; real provider work remains out of scope.

## Risks / Trade-offs

- [Four labels become scripted or verbose] -> Keep each label concise and
  permit bounded plain language underneath; the contract constrains meaning and
  order, not a canned message.
- [A summary accidentally exposes producer internals] -> Use only sanitized
  envelope facts and focused negative tests for raw stderr/secret/retry leakage.
- [The precedence tree is treated as a hidden retry chain] -> State explicitly
  that each branch is a selection boundary, not an automatic mutation or
  fallback; direct env-check remains recovery-only.
- [Repository and generated guidance drift] -> Treat the Agent Contract as
  canonical and verify the generated guide retains only the scoped consumer rule
  after bundle location.

## Migration Plan

1. Add failing focused contract tests for the four-part routine, each precedence
   branch, and absence of persistence/second recovery policy.
2. Add the canonical Agent Contract section; update the novice command surface,
   MD consumer specification/guidance, and generated guide source to reference
   it without copying producer schema.
3. Run focused contracts plus the core tier and strict OpenSpec validation. No
   existing run bundle is rewritten; rollback removes guidance only and leaves
   all authority files unchanged.

## Open Questions

None. The four parts and recovery order are fixed by the retained source plan;
implementation may choose concise prose but may not add a fifth decision path.
