# Simple Reliable Control Policy

This policy is the PPT Maker Harness's charter companion for keeping quality control
short, recoverable, and understandable to an Agent. It applies to new or
modified gates, validators, readiness checks, controller handoffs, diagnostic
surfaces, persistent control state, retries, and recovery paths.

It is guidance, not a runtime contract. `AGENTS.md`, `openspec/config.yaml`,
accepted specifications, executable contracts, and runtime truth remain
authoritative for concrete behavior. This policy does not invalidate accepted
behavior or authorize a rewrite; gaps are reduced through normal OpenSpec
changes.

## Core Principle

**Quality control SHALL be simpler than the work it validates.**

Reliability comes from a short, visible loop:

```text
direct fact -> one deterministic check -> earliest root cause
  -> one legal next action -> rerun the same checkpoint
```

"Simple" means few authority translations, visible branches, early failure,
and bounded feedback. It does not mean fewer necessary checks. A checker may
read several required direct facts, but it SHALL NOT derive pass/fail by
chaining projections, summaries, caches, and competing validators when a
canonical source already owns the fact.

## Quality-Control Rules

- **Direct facts first.** Read the owning Source of Record. Markdown,
  summaries, caches, and diagnostic projections are not competing authority.
- **One truth path.** Inspect, preflight, gate, submit, and audit checks for
  the same fact SHALL reuse one evaluator or checker result where practical.
- **Prerequisites before implications.** If identity, schema, parent artifact,
  receipt, or authorization is invalid, report that earliest root cause and
  short-circuit dependent symptoms. Independent facts may still be reported.
- **Smallest actionable root set.** Primary feedback contains only the facts
  needed to repair the current failure. Durable diagnostics may retain bounded
  detail without making the Agent parse a cascade.
- **Strict authority, tolerant presentation.** Be strict about canonical
  bytes, schema, identity, provenance, authorization, and required structure.
  Formatting preferences are advisory or parsed tolerantly unless an accepted
  contract makes them semantically necessary.
- **Fail clearly.** If the checker cannot determine a result reliably, fail
  closed or report `unknown`; do not guess through a longer fallback chain.
- **Same-check repair.** Repair through the owning interface and rerun the same
  checkpoint. Recovery is either repair-and-rerun or explicit terminalization
  followed by one new legal attempt.
- **One next action.** Every independent root cause gets one nearest legal
  action. Do not offer a menu of competing recovery routes.
- **Test the control itself.** Focused negative tests SHALL cover prerequisite
  short-circuiting, bounded diagnostics, fail-closed behavior, wrong-owner
  mutation prevention, and successful same-check reruns.

## Blocking-Rule Burden

A new blocking rule is presumed unjustified unless it protects at least one of:

- deterministic authority existence, parseability, or required structure;
- identity, receipt, ledger, trace, provenance, authorization, or integrity;
- a semantic section required by an accepted contract and not represented by a
  more direct structured surface.

Before adding a blocking rule, validator, persistent field, controller step,
retry, fallback, or recovery command, the proposal/design SHALL state:

1. which direct Source of Record owns the fact;
2. which real failure the existing checkpoint cannot catch;
3. what duplicate rule, special case, hidden state, or user step is removed,
   merged, or deliberately avoided;
4. the one nearest legal action after failure; and
5. the focused test that proves valid work is not blocked or the wrong owner
   mutated.

If these answers are not concrete, reuse the existing checkpoint, downgrade
the rule to advice, or reduce scope. An added layer must remove or consolidate
complexity; additive control without net simplification is not the default.

## State And Recovery Discipline

Persist only irreplaceable facts that cannot be reliably rebuilt from existing
direct authority and must survive another invocation. Every new field needs an
owner, writer, readers, freshness/invalidation rule, and removal path. Derived
status, UI summaries, and duplicated gate conclusions remain projections.

Recovery SHALL be explicit and auditable. It SHALL NOT depend on watchers,
daemons, unbounded retries, inferred intent, chat memory, or a parallel success
store. Missing canonical intent, identity, progress, or result is a visible
contract failure, not permission to infer or silently fall back.

## Precedence And Review

When this policy conflicts with accepted behavior, accepted behavior continues
to apply and the difference becomes an OpenSpec change candidate. When deciding
whether to add control complexity, reviewers SHALL use this policy before
adding another layer and SHALL prefer deletion, reuse, tolerant parsing, or a
shorter feedback path. `human-centered-gates.md` still owns `guide`, `confirm`,
and `hard-stop` classification; `agent-assistance-and-control.md` owns
responsibility handoff and concrete control-path shaping; capability specs own
commands, schemas, permissions, and other runtime contracts.
