# Harness Script Layout Specification

## Purpose

Define executable ownership, import boundaries, and provider-free architecture
verification for scripts supplied by the PPT Maker Harness.
## Requirements
### Requirement: Page Image Core is a shared deep module at one explicit seam

The Harness SHALL expose one shared Page Image Core seam for the two selected
workflow adapters. Its Interface SHALL accept only normalized current source
content, visual selection, Style Master selection, generation profile, and
Header Rendering Policy, and SHALL return typed, immutable page-image facts
needed for policy-specific compilation and evidence binding. Its
Implementation SHALL hide common content normalization, literal-policy
validation, canonical byte construction, and lineage facts from callers.

The Framed and Pure adapters are the two concrete adapters at that seam. The
shared runtime may consume their already-typed plans/evidence, but it SHALL not
interpret workflow semantics or compile provider prompts. This seam SHALL be
the test surface for shared Page Image behavior; no caller shall reimplement
its content or byte-binding rules.

#### Scenario: Shared content compilation has one owner

- **WHEN** Framed and Pure compile equivalent Provider Content Schema and
  visual direction
- **THEN** both receive the same shared Page Image Core semantic facts
- **AND** their adapters add only their distinct Header Rendering Policy facts

### Requirement: Current adapters preserve sibling locality and declared imports

`03-framed-image` SHALL be the sole current owner of the deterministic local
header renderer and its private browser/font/capture seam. `04-pure-image`
SHALL be the sole owner of Pure final publication. Neither sibling SHALL import
the other or its private modules, and neither SHALL create a second renderer,
delivery route, prompt compiler, or recovery route.

Active adapter, shared-runtime, controller-observation, and process modules
SHALL NOT import or dispatch an undeclared adapter, marker decoder,
source/receipt initializer, evidence reader, converter, migration, or
compatibility implementation. A current architecture guard SHALL reject such
an import before it can become a production route.

#### Scenario: Shared seam does not create a sibling import

- **WHEN** architecture validation inspects a current Framed or Pure module
- **THEN** it permits only the explicit shared Page Image Core seam and owned
  private dependencies
- **AND** it rejects an import of the sibling adapter, undeclared
  implementation, or sibling private module

### Requirement: Framed runtime is confined to the current header-overlay adapter

The retained browser capture, font, denied-network, timeout, and cleanup
primitives SHALL be reachable only through the current Framed header-overlay
adapter. They SHALL not become a general text/body renderer, a second deck
rendering entrypoint, or a delivery path. Pure SHALL not import that private
runtime.

#### Scenario: Framed finalization uses only its private runtime seam

- **WHEN** a current Framed page is finalized
- **THEN** the selected adapter uses its private header-overlay runtime seam
- **AND** neither Pure nor shared delivery gains a browser-rendering route

### Requirement: Cross-owner derived-raster conversion has one registered public seam

The Harness SHALL expose a registered public shared interface for deterministic
PNG-to-derived-raster conversion when that conversion is used by more than one
target method module. The interface SHALL be listed by the architecture guard
and its source/test owner SHALL declare the interface and focused tests in the
repository ownership manifest. A target method module SHALL import that
registered interface rather than a private shared implementation path.

The shared raster interface SHALL operate only on decoded PNG layouts and
derived canvas pixels. It SHALL not own workflow semantics, provider work,
selection, evidence, manifests, persistent state, or delivery publication.

#### Scenario: Framed and delivery use the registered shared raster interface

- **WHEN** architecture validation inspects Framed capture and shared delivery
  imports for derived PNG rendering
- **THEN** it recognizes the common raster interface as a registered public
  shared seam
- **AND** the interface and its focused tests have exactly one declared owner

#### Scenario: An unregistered raster helper cannot become a cross-owner import

- **WHEN** a target method module imports a shared raster helper that is not
  registered as a public interface
- **THEN** architecture validation rejects the import before it becomes a
  production route
- **AND** it does not treat a file's presence or a test's existence as public
  seam admission

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
