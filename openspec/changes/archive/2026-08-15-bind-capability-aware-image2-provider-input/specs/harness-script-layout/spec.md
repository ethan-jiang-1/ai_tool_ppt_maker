## ADDED Requirements

### Requirement: Image2 capability resolution has one declared shared deterministic seam

The Harness SHALL expose one registered public shared Image2 seam for confined
provider-profile resolution and exact final-prompt budget evaluation. Style
Master and Page Image current owners SHALL consume that seam rather than retain
an adapter-local profile parser, budget counter, route/model default, or
transport-time prompt compiler. The seam SHALL return deterministic
source/profile or measurement facts only; it SHALL not own Controller routing,
State, credentials, provider initialization, submission, lifecycle mutation,
or a second source of capability truth.

The architecture guard SHALL verify the seam's declared public import boundary,
the absence of duplicate adapter/transport implementations, and the
zero-static-npm-dependency pre-install `00-setup` boundary. Direct pre-install
environment checking MAY use the import-safe runtime-ID grammar helper but
SHALL not statically import YAML/profile parsing or a production adapter.

#### Scenario: Both operation families use the declared seam

- **WHEN** architecture validation inspects current Style Master and Page Image
  planning/preflight imports
- **THEN** it finds the declared shared capability resolver/evaluator seam and
  no adapter-local or transport-side capability implementation
- **AND** it does not admit a model alias, fixed budget, or second parser as
  current capability authority

#### Scenario: Pre-install setup remains import-safe

- **WHEN** architecture validation inspects direct `00-setup/env-check.mjs`
- **THEN** it permits the zero-dependency runtime-ID grammar path without a
  static YAML/profile resolver or production-adapter import
- **AND** pre-install startup remains independent of `node_modules` and
  provider initialization
