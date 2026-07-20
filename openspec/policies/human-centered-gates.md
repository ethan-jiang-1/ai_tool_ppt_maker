# Human-Centered Gate Policy

Gates guide people through recoverable work. They do not erase the boundaries
that preserve identity, integrity, security, authorization, or recovery.

## Outcomes

| Outcome | Use it when | Required behavior |
| --- | --- | --- |
| `guide` | A deterministic repair or advisory can safely proceed. | Explain the condition and run or recommend the repair. No human risk acceptance is needed. |
| `confirm` | A reversible quality or process risk belongs to the human. | Show what changed, recommend repair first, and offer one explicit continuation that records a bounded human reason. |
| `hard-stop` | Identity, integrity, security, authorization, or recoverability is uncertain. | Reject the operation, name the protected invariant, and provide the safe recovery route. No waiver or force option may bypass it. |

## Protected Invariants

- Target version, reset epoch, plan identity, and compare-and-swap ownership are exact.
- State, confined paths, bytes, and hashes must be valid and attributable.
- A live or uncertain writer is never overwritten by a continuation.
- Provider work requires the existing explicit authorization boundary.
- Derived artifacts and state are repaired only through their owning interfaces.

## Continuations

A continuation is an auditable, version-scoped waiver of a reversible risk. It
must carry a normalized human reason and the current bounded identity/evidence
facts. A waiver is not approval, and it never changes whether evidence is
complete. Runtime record fields and CLI schemas remain owned by their capability
specifications.

Every confirmable gate response presents: what changed, the recommended repair,
the explicit continuation, and the next action after either choice. A hard-stop
response instead presents the invariant and its safe recovery action.

## Related Control Policy

`agent-assistance-and-control.md` governs how a controller, checker, and
recovery path should be shaped. It does not change this policy's outcome
classification, waiver semantics, or protected invariants.
