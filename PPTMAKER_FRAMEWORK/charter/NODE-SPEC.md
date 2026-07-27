# Node Specification

Markdown playbooks are the workflow authority. `state.yaml` stores only the
current execution pointer and Page Authority evidence; it does not define a
second workflow.

## Controller declaration

Every controller declares `supported_pipelines: [page-authority-image2-v1]`.
Image-production nodes use `method_module: 04-image-production` and
`adapter: page-authority-image2`. A node may declare
`production_modes: [image2-page-authority]`; no other current mode exists.

Node IDs are global kebab-case. Entry and exit conditions must be explicit,
ordered, and satisfiable from current source/state evidence. A node cannot use
its own completion as an entry condition.

## State contract

For each current `vN`, `_state/state.yaml` records:

```yaml
pipeline: page-authority-image2-v1
production_mode:
  by_version:
    3_versions/v1:
      mode: image2-page-authority
      source_epoch: 1
```

The metadata mirror is display-only. It never selects a route or repairs state.
Current evidence is limited to Page Authority raw authorization/review and
delivery review. Unknown or retired node/evidence records fail closed.

## Inspection

Inspection returns one Page Authority lifecycle action for a current pair. An
explicitly supplied historical pair returns one provider-free adoption or
repair/export action. Inspection never produces a historical cursor, approval,
provider request, or adapter.

## Structural requests

Structural controller nodes resolve a snapshot `position` selector to stable
`slide_id`, preview the exact `plan_sha256`, and apply only that confirmed
plan. Target work reports `needs_render` as raw-generation debt; it never turns
a structural transaction into a provider call.
