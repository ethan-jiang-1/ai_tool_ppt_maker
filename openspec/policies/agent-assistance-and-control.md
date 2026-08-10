# Agent Assistance And Control Policy

This policy keeps agent-facing workflow changes helpful without turning them
into a second runtime authority. It applies when an OpenSpec change touches a
controller handoff, deterministic check, CLI recovery path, state record, or
diagnostic used to decide what happens next.

A clear human Work Request supplies one Task Mandate for normal in-scope work.
The Agent uses it to navigate, prepare, execute, and record that work; it does
not convert each provider call, evidence record, or ordinary cost into another
human permission prompt.

The cross-cutting complexity rule is defined by
`openspec/policies/simple-reliable-control.md`: quality control must be simpler
than the work it validates. This policy applies that rule to responsibility
handoff, direct authority, evaluator reuse, diagnostics, durable state, and
recovery. If a proposed control layer cannot show net simplification, prefer
deletion, reuse, tolerant parsing, or a shorter feedback path.

## Authority

This policy is guidance beneath `AGENTS.md`, `openspec/config.yaml`, accepted
capability specifications, executable contracts, and current runtime truth. It
does not extend a Task Mandate to a different goal, relax a hard stop, create a
new re-entry route, or make a conversation an evidence record.

Existing accepted behavior remains authoritative. When a changed surface does
not yet meet this policy, improve that surface locally with tests instead of
performing an unverified broad rewrite.

## Policy Boundary

`human-centered-gates.md` owns the visible decision posture at a quality or
workflow boundary: `guide`, `confirm`, `hard-stop`, the meaning of a waiver,
and the invariants a continuation cannot cross. It does not prescribe how a
checker is structured or who performs routine legal work.

This policy owns the shape of that control path: responsibility handoff,
direct sources of truth, evaluator reuse, diagnostic focus, durable-state
discipline, and explicit recovery. It does not classify an outcome, authorize
a waiver, alter evidence completeness, or define runtime record fields.

When both policies apply, first use the gate policy to determine the outcome
and protected invariant. Then use this policy to keep the implementation and
feedback path direct, bounded, and owned by the existing runtime authority.

## Ownership Matrix

Each question has one policy owner. The policies constrain implementation but
do not replace the capability specification or executable contract that owns
the concrete runtime behavior.

| Question | Policy owner | Boundary |
| --- | --- | --- |
| Is this a `guide`, `confirm`, or `hard-stop`? Which invariant is protected? | `human-centered-gates.md` | This policy cannot recategorize the outcome. |
| May a person continue, and what does that continuation mean? | `human-centered-gates.md` | A capability spec defines the concrete validation and persistence rules. |
| Does the active Work Request already cover normal execution and cost? | The human's Task Mandate | The Agent records exact runtime scope automatically and does not request it again. |
| Which source, evaluator, actor handoff, diagnostic, and recovery path establish the result? | This policy | The chosen path must remain inside the gate policy's allowed outcome. |
| Which flags, record fields, byte checks, and permissions implement the result? | Owning capability specification and executable contract | Neither policy creates a runtime schema, mutation permission, or bypass. |

## Responsibility Boundary

- The human decides new content meaning, reversible risk acceptance, and any
  genuinely new consequential direction not already covered by the Task Mandate.
- The Agent translates ordinary presentation feedback into scope, impact,
  evidence, a recommended next action, and all normal in-scope mechanical work.
- The owning runtime module evaluates deterministic facts and records durable
  state through its sanctioned writer.

Do not ask a person to replay routine commands or repair a deterministic,
reversible condition that the Agent can legally handle. Provider scope, cost,
receipts, and evidence are Agent/Harness bookkeeping under the Task Mandate,
not human homework. Conversely, do not extend a request to a different goal,
waive an integrity boundary, or invent a missing recovery capability; after a
new human decision, return remaining legal mechanical work to the Agent.

## Agentic Orientation And Refinement

A human may say "this page is not working" without naming a source field,
workflow node, or rebuild path. The Agent SHALL read the relevant direct facts
and collaboration projections, identify the smallest Page Source, Page Class
Profile, Deck Baseline, or workflow scope, and present one recommended legal
next action in presentation language.

An incomplete checkpoint is not a request for the human to debug the system.
The Agent continues legal diagnosis, candidate preparation, and deterministic
repair under the Task Mandate, then asks only for a new content/design decision
or an explicit scope limit. This guidance does not make a projection a source
of record or let the Agent infer an unrelated intent.

## Direct Control Paths

Every control path should use the smallest direct fact set that can establish
the decision:

1. Read the owning source of record.
2. Translate the human's request into the smallest relevant scope without
   treating that interpretation as authority for a different goal.
3. Reuse one evaluator for the same fact across inspect, gate, and submit
   paths where practical.
4. Stop at the earliest actionable failed prerequisite.
5. Return a bounded root cause and the nearest legal next action in language
   the human can act on.
6. Repair through the owner, then rerun the same checkpoint.

Markdown guidance, status cards, cached summaries, and diagnostics are useful
projections. They are not competing pass/fail authorities when a canonical
state record, manifest, receipt, or byte binding already owns the fact.
Their evidence is shown to help the human and Agent understand the work, not to
ask the human to manually recreate a runtime authorization or record.

Presentation preferences should normally be advisory or parsed tolerantly.
New blocking checks need to protect canonical structure, identity, provenance,
authorization, a required artifact, or an invariant already required by an
accepted specification.

## Durable State And Recovery

Persist only facts that cannot be reliably reconstructed from direct authority
and are needed across invocations. For every new durable field, name its owner,
writer, readers, freshness rule, and removal or invalidation path.

Recovery is explicit and auditable: repair and rerun the visible check, or
terminalize the failed attempt before starting a new legal one. Do not add
hidden fallback chains, unbounded retries, inferred intent, or a parallel
success store. Never hand-write a receipt, approval, trace, hash, or state
record merely to make the workflow appear unblocked.

`human-centered-gates.md` remains the authority for classifying a visible
outcome as `guide`, `confirm`, or `hard-stop`. This policy additionally
requires the implementation to preserve a short, direct path to that outcome.

## Change Admission

Before adding a blocking rule, persistent field, validator, recovery branch,
or controller step, the proposal or design must answer:

1. Which direct source of record owns the fact?
2. Which protected invariant or real failure cannot be handled by the existing
   evaluator?
3. What redundant check, special case, opaque feedback, or user-operated step
   is removed, merged, or deliberately avoided?
4. What is the one nearest legal action after each independent failure?
5. Which focused negative test proves the new control neither mutates the
   wrong authority nor blocks a valid path?

If these answers are not concrete, reduce the scope or reuse an existing
owner. A new helper, mode, state record, or retry path is not justified solely
because it makes a hypothetical future recovery easier.
