# Node Specification

Markdown playbooks are the workflow authority. `state.yaml` stores only the
current execution pointer and Page Image evidence; it does not define a
second workflow.

## Controller declaration

Controllers declare the Page Image pipeline they can consume. New
authoring uses `page-image-workflow`, and target nodes declare one or both
`production_workflows: [framed|pure]`. The selected workflow route is
`03-framed-image XOR 04-pure-image -> 05-delivery -> 06-iteration`; `05` nodes
apply to both workflows without semantic branching. An undeclared source/state pair
is a byte-preserving `repair-current-protocol-identity` hard-stop.

Controller metadata is a closed grammar at the Markdown parser boundary.
Controller frontmatter permits only `playbook`, `description`,
`supported_pipelines`, and `includes`. A shared-node frontmatter permits the
node keys plus literal `shared: true`; a fenced node permits only `node`,
`method_module`, `requires`, `entry`, `exit`, `produces`, `decisions`,
`production_workflows`, `adapter`, and optional literal `draft_route: true`.
`method_module` is the only lifecycle-location declaration. An unknown,
duplicate, `phase`, `lifecycle_phase`, or retired mode declaration fails with
its exact file and line before Controller indexing, draft routing, or handoff.

Node IDs are global kebab-case. Entry and exit conditions must be explicit,
ordered, and satisfiable from current source/state evidence. A node cannot use
its own completion as an entry condition.

## State contract

For each selected target `vN`, `_state/state.yaml` records:

```yaml
pipeline: page-image-workflow
production_identity:
  by_version:
    3_versions/v1:
      workflow: framed # or pure
      source_epoch: 1
```

Fresh authoring drafts have no production-identity record until the human has
explicitly selected `framed|pure` and State accepts the exact source. Project
metadata has no production-protocol mirror. Target evidence records
source receipt, workflow, authorization, accepted raw evidence, final manifest,
and delivery references. Unknown or retired node/evidence records fail closed.

## Inspection

Inspection returns one Page Image Workflow action for an exact target pair or one
workflow-selection confirm for a fresh draft. An undeclared, partial, hybrid, or
mismatched pair returns the owner-issued `repair-current-protocol-identity` action.
Inspection never produces an alternate cursor, approval, provider request, or
adapter.

## Diagnostic recovery consumer

MD consumes a valid final CLI failure envelope through the canonical
[Diagnostic Recovery Handoff](AGENT_CONTRACT.md#diagnostic-recovery-handoff).
The producer's bounded category, causal facts, and exact supported `next`
remain the control authority; MD never copies the producer schema, parses raw
stderr, or invents a retry, shell invocation, authorization, or classification.

For a user-facing diagnostic, MD gives the contract's four parts in order: what
happened, what it affects, what the Agent can mechanically do, and the one
human action or confirmation required. It says that no human action is required
when the current owner permits fully mechanical work, and stops when the owner
requires a human. A non-zero process without a valid final envelope remains an
external/interrupted boundary; only the canonical next applicable read-only
discovery branch may follow.

## Structural requests

Structural controller nodes resolve a snapshot `position` selector to stable
`slide_id`, preview the exact `plan_sha256`, and apply only that confirmed
plan. Target work reports `needs_render` as raw-generation debt; it never turns
a structural transaction into a provider call.
