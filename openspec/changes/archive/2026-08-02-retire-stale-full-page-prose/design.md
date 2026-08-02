## Context

See [proposal.md](proposal.md) for motivation. The existing coherence audit
already reads active framework guidance and main specifications, and it reports
three Pure Pilot descriptions that use retired production vocabulary. The raw
evidence, bindings, decision action, and Controller route are already current;
only their labels are stale.

## Goals / Non-Goals

**Goals:**

- Make the three active Pure Pilot descriptions use one precise Page Authority
  expression: `Pure raw page bytes`.
- Preserve every existing evidence, binding, gate, and sibling-workflow
  boundary while restoring a passing process-document audit.

**Non-Goals:**

- Change the Pure raw lifecycle, Pilot/Expansion decision rules, provider work,
  CLI, state, authorization, generated output, or run-bundle topology.
- Add an exception, migration bridge, validator, retry, route, Controller node,
  or persistent record.

## Decisions

### 1. Use one direct raw-evidence term

Replace each stale phrase with `Pure raw page bytes` (or the grammatical
equivalent `Pure raw page evidence` where no byte object is being presented).
This identifies the current Pure artifact without suggesting a legacy
production mode. Reusing the current raw-evidence vocabulary is preferable to
inventing a new generic label, because the owning raw interface already defines
the bytes and their bindings.

### 2. Keep the change textual and workflow-neutral

The three affected sentences retain their current meaning: Pure evidence is
shown only for Pure work, bindings remain current, and owner-issued Pilot
decisions remain unchanged. No YAML node, executable invocation, state shape,
or source-of-record changes. This keeps MD Controller ownership and raw-owner
evidence ownership exactly where they are.

### 3. Reuse the existing direct audit

The existing process-document coherence test is the one current checkpoint for
active terminology. Following `simple-reliable-control.md`, this change fixes
the smallest reported root set and reruns that same checkpoint; it creates no
second terminology scanner, exception registry, fallback, or recovery path.

## Risks / Trade-offs

- [A replacement still matches a retired-token rule] -> use the existing audit
  immediately after editing and keep archive/spec prose free of active-surface
  retired literals.
- [Text repair accidentally changes evidence semantics] -> retain the existing
  wording about exact Pilot scope, current bindings, and owner-issued decisions;
  add no behavior-bearing clauses.
- [A broad cleanup obscures the cause] -> limit edits to the three reported
  locations and the one owning capability requirement.

## Migration Plan

1. Update the two `playbook-execution` specification scenarios and the matching
   `create-deck` Controller step.
2. Run the focused process-document audit, strict OpenSpec validation, core
   regression, and `git diff --check`.
3. Sync the delta spec before archiving. Rollback reverts only terminology and
   leaves all run-bundle bytes and control artifacts untouched.

## Open Questions

None.
