# Human-Centered Control Policy

Control outcomes guide a human and Agent through recoverable work; they are not
repeated permission prompts. They do not erase the boundaries that preserve
identity, integrity, security, attributable execution, or recovery.

## Task Mandate

A clear human Work Request establishes one Task Mandate for normal in-scope
work needed to finish that goal, including provider work, recovery, and ordinary
costs. The Harness records exact execution scope, cost, and evidence as
bookkeeping; the Agent SHALL NOT ask the human to reconfirm the same task for
each plan, batch, repair, review, or provider submission.

Ask again only when proposed work changes to a different Deck or goal, exceeds
an explicit human limit, or needs a genuinely new content or design choice not
covered by the Work Request. A plan-level Guided Checkpoint is a collaboration
aid, not a runtime authority or a new Task Mandate.

## Outcomes

| Outcome | Use it when | Required behavior |
| --- | --- | --- |
| `guide` | A deterministic repair or advisory can safely proceed. | Explain the condition and have the Agent perform the in-scope repair or recommendation. No new human permission is needed. |
| `confirm` | A reversible quality or process risk needs a human choice not already covered by the Task Mandate. | Show the impact in presentation terms, recommend repair first, and offer one explicit continuation with a bounded human reason. Do not re-confirm a choice the human already made. |
| `hard-stop` | Identity, integrity, security, attributable execution, or recoverability is uncertain. | Reject only the unsafe operation, name the protected invariant, and give the Agent's safe recovery route. No waiver or force option may bypass it. |

## Protected Invariants

- Target version, reset epoch, plan identity, and compare-and-swap ownership are exact.
- State, confined paths, bytes, and hashes must be valid and attributable.
- A live or uncertain writer is never overwritten by a continuation.
- Provider work must be attributable to the active Task Mandate and its exact
  runtime execution record.
- Derived artifacts and state are repaired only through their owning interfaces.

## Continuations

A continuation is an auditable, version-scoped waiver of a new reversible risk.
It is not required merely because the Harness is recording execution evidence
or normal cost for work already covered by a Task Mandate. A continuation
must carry a normalized human reason and the current bounded identity/evidence
facts. A waiver is not approval, and it never changes whether evidence is
complete. Runtime record fields and CLI schemas remain owned by their capability
specifications.

Every confirmable control response presents what changed, the recommended
repair, the explicit continuation, and the next action after either choice. A
hard-stop response presents the invariant and safe recovery action, while the
Agent continues any legal read-only diagnosis and preparation; it never simply
reports that the work is blocked.

## Related Control Policy

`agent-assistance-and-control.md` governs how a controller, checker, and
recovery path should be shaped. It does not change this policy's outcome
classification, waiver semantics, or protected invariants.

For a change that invokes both policies, apply them in this order: classify
the outcome and non-bypassable invariant here; shape the direct control and
recovery path in `agent-assistance-and-control.md`; then use the owning
capability specification for the concrete command, state, and permission
contract.
