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

### Requirement: Current adapters preserve sibling locality and no legacy imports

`03-framed-image` SHALL be the sole current owner of the deterministic local
header renderer and its private browser/font/capture seam. `04-pure-image`
SHALL be the sole owner of Pure final publication. Neither sibling SHALL import
the other or its private modules, and neither SHALL create a second renderer,
delivery route, prompt compiler, or recovery route.

Active adapter, shared-runtime, controller-observation, and process modules
SHALL NOT import or dispatch a v2 adapter, marker decoder, source/receipt
initializer, evidence reader, converter, or migration implementation. A
current architecture guard SHALL reject such an import before it can become a
production route.

#### Scenario: Shared seam does not create a sibling import

- **WHEN** architecture validation inspects a current Framed or Pure module
- **THEN** it permits only the explicit shared Page Image Core seam and owned
  private dependencies
- **AND** it rejects an import of the sibling adapter, v2 implementation, or
  sibling private module

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
