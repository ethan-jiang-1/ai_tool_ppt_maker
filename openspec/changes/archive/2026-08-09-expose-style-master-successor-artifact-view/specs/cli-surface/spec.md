## MODIFIED Requirements

### Requirement: Explicit artifact view preserves the machine CLI contract

On a current supported Page Image run, `image2 artifact-view <run-dir>` SHALL
perform no provider work and rebuild only the canonical human artifact
reference view. Its success result SHALL identify that view's local locator and
the exact run/workflow scope; it SHALL not print raw prompt prose, credentials,
provider responses, or a broad dump of owner records.

When current source facts and a valid Style Master successor plan establish a
replacement candidate scope while the predecessor selection is stale, and the
plan's immutable predecessor identity matches that stale selection, the command
SHALL return its normal provider-free success projection and the owner-issued
current successor action as `next_action`. That success SHALL retain its
ordinary `run_dir`, `workflow`, and `artifact_view` fields; a normal
accepted-selection view SHALL retain its existing shape without this pending
successor action. The command SHALL not translate that bounded successor state
into an internal error, claim that a new selection or raw plan exists, or
require a provider request to rebuild the view. If the owner projection cannot
validate required source, scope, plan, predecessor, candidate-media, or
provenance facts, the command SHALL preserve the existing bounded owner-issued
hard-stop and SHALL not write the view.

Existing success JSON for `status`, `state`, `style-master`, and the other
`image2` operations SHALL retain their current machine-oriented schema. The
artifact view SHALL not add a short-hash selector, change any exact SHA-256
argument grammar, provide a direct lifecycle/authorization/review command, or
write any `_state/` file including the Page Production task projection.

Current protocol identity remains the earliest prerequisite. For an unsupported
or unresolved scope, the command SHALL preserve the existing bounded
owner-issued diagnostic and SHALL not write the view, initialize a provider,
read legacy media, or mutate source/state/generated authority.

#### Scenario: Artifact view is explicitly requested for a current run

- **WHEN** an Agent invokes `image2 artifact-view` for an exact current Pure or Framed run
- **THEN** the CLI rebuilds and returns the run-scoped human artifact view without a provider
  request or lifecycle transition
- **AND** the complete `_state/` tree and ordinary `status`/`state` observations remain unchanged
  unless separately invoked

#### Scenario: Artifact view exposes a successor plan before authorization

- **WHEN** a current Pure or Framed scope has a validated Style Master
  successor plan after visual/source drift made its predecessor selection stale
- **THEN** `image2 artifact-view` returns the normal view success and its one
  owner-issued current successor `next_action`, while retaining its ordinary
  run/workflow/view fields
- **AND** it does not report an internal failure, select a candidate, publish
  raw work, consume authorization, or initialize a provider

#### Scenario: A pending successor cannot turn invalid candidate evidence into a view

- **WHEN** a pending Style Master successor names succeeded candidate media
  whose immutable bytes or provenance no longer validate
- **THEN** `image2 artifact-view` returns the existing Style Master owner
  hard-stop before writing the view
- **AND** it does not show a partial candidate list, initialize a provider, or
  mutate selection, raw, authorization, or attempt state

#### Scenario: Artifact view receives an unsupported v2 run

- **WHEN** `image2 artifact-view` is requested for a `page-authority-image2-v2` source/state pair
- **THEN** the CLI returns the existing `unsupported-protocol/export` boundary before reading
  artifacts or writing the view
- **AND** it does not create an alias, compatibility report, or adoption path
