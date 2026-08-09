## MODIFIED Requirements

### Requirement: Explicit artifact view preserves the machine CLI contract

On a current supported Page Image run, `image2 artifact-view <run-dir>` SHALL
perform no provider work and rebuild only the canonical Human Navigation Path
tree. Its success result SHALL identify the short navigation index locator,
the short navigation root, and the exact run/workflow scope; it SHALL not
print raw prompt prose, credentials, provider responses, original
content-addressed artifact locators, or a broad dump of owner records.

Existing success JSON for `status`, `state`, `style-master`, and the other
`image2` operations SHALL retain their current machine-oriented schema. The
artifact-view success result SHALL retain its existing view locator field for
the new short index and add only the short navigation-root field. The command
SHALL not add a short-hash selector, change any exact SHA-256 argument grammar,
provide a direct lifecycle/authorization/review command, or write any
`_state/` file including the Page Production task projection.

Current protocol identity remains the earliest prerequisite. For an unsupported
or unresolved scope, the command SHALL preserve the existing bounded
owner-issued diagnostic and SHALL not write the navigation tree, initialize a
provider, read legacy media, or mutate source/state/generated authority.

#### Scenario: Artifact view is explicitly requested for a current run

- **WHEN** an Agent invokes `image2 artifact-view` for an exact current Pure or Framed run
- **THEN** the CLI rebuilds and returns the run-scoped short navigation index and root without a
  provider request or lifecycle transition
- **AND** the complete `_state/` tree and ordinary `status`/`state` observations remain unchanged
  unless separately invoked

#### Scenario: Artifact view does not expose canonical artifact paths

- **WHEN** the current view contains available artifacts held below SHA-named immutable owner
  directories
- **THEN** the CLI success result and its human navigation index expose only their derived short
  physical paths
- **AND** they do not serialize the source artifact locators or add a navigation path as a CLI
  lifecycle selector

#### Scenario: Artifact view receives an unsupported v2 run

- **WHEN** `image2 artifact-view` is requested for a `page-authority-image2-v2` source/state pair
- **THEN** the CLI returns the existing `unsupported-protocol/export` boundary before reading
  artifacts or writing the navigation tree
- **AND** it does not create an alias, compatibility report, adoption path, or short-path
  migration for the unsupported run
