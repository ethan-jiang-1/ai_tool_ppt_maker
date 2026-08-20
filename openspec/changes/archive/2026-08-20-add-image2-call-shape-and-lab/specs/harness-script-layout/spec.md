## MODIFIED Requirements

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
SHALL not statically import YAML/profile parsing, a production adapter, the
Call Shape validator beyond grammar-safe helpers, or the provider executor.

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
  static YAML/profile resolver, production-adapter, or executor import
- **AND** env-check still makes zero Image2 network calls

## ADDED Requirements

### Requirement: Image2 Call Shape validator and executor have one declared seam each

The Harness SHALL expose one registered public shared Call Shape validator
seam and one registered public shared Image2 provider executor seam under
`scripts/shared/image2/`. Production generate, `ppt_flow probe`, and Image2 Lab
SHALL wrap that executor. The executor SHALL NOT accept a run directory, parse
a profile, or write State, grants, attempts, or receipts.

The architecture guard SHALL reject a second Call Shape parser, a second
submit/poll/result decoder, an unregistered retrieve dialect becoming a
production route, and a Lab CLI placed as a twentieth method-stage directory.
The Lab CLI SHALL be a registered executable in that shared directory.

#### Scenario: Three wrappers share one executor

- **WHEN** architecture validation inspects generate, probe, and Lab live
  submit paths
- **THEN** each imports the declared executor seam
- **AND** none retains a private POST/poll/Base64 decoder

#### Scenario: A second decoder is rejected

- **WHEN** a module implements an unregistered Image2 retrieve dialect or a
  duplicate Call Shape parser
- **THEN** architecture validation rejects it before it becomes a production
  route
- **AND** Lab cannot mark that dialect proven
