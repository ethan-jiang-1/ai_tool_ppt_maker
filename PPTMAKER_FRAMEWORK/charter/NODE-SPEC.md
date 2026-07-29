# Node Specification

Markdown playbooks are the workflow authority. `state.yaml` stores only the
current execution pointer and Page Authority evidence; it does not define a
second workflow.

## Controller declaration

Controllers declare the Page Authority pipelines they can consume. New v2
authoring uses `page-authority-image2-v2` /
`image2-page-authority-v2`, and target nodes declare one or both
`production_workflows: [framed|pure]`. The selected workflow route is
`03-framed-image XOR 04-pure-image -> 05-delivery -> 06-iteration`; `05` nodes
apply to both workflows without semantic branching. The exact v1 pair remains
an existing-run compatibility route.

Node IDs are global kebab-case. Entry and exit conditions must be explicit,
ordered, and satisfiable from current source/state evidence. A node cannot use
its own completion as an entry condition.

## State contract

For each selected target `vN`, `_state/state.yaml` records:

```yaml
pipeline: page-authority-image2-v2
production_mode:
  by_version:
    3_versions/v1:
      mode: image2-page-authority-v2
      workflow: framed # or pure
      source_epoch: 1
```

Fresh v2 authoring drafts have no mode record until the human has explicitly
selected `framed|pure` and the source receipt is bound. The metadata mirror is
display-only. It never selects a route or repairs state. Target evidence records
source receipt, workflow, authorization, accepted raw evidence, final manifest,
and delivery references. Unknown or retired node/evidence records fail closed.

## Inspection

Inspection returns one v2 workflow action for an exact target pair, one
workflow-selection confirm for a fresh v2 draft, or one bounded v1 compatibility
action for an exact v1 pair. An explicitly supplied historical pair returns one
provider-free adoption or repair/export action. Inspection never produces a
historical cursor, approval, provider request, or adapter.

## Structural requests

Structural controller nodes resolve a snapshot `position` selector to stable
`slide_id`, preview the exact `plan_sha256`, and apply only that confirmed
plan. Target work reports `needs_render` as raw-generation debt; it never turns
a structural transaction into a provider call.
