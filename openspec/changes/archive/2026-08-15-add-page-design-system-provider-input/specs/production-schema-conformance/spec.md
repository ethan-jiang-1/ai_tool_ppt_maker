## ADDED Requirements

### Requirement: Page Design System bindings remain schema-declared and workflow-symmetric

The active serialization inventory and current Page Image stage declarations
SHALL declare the Page Design System's exact ownership boundary. The inventory
SHALL register the resolver's local `page-image-design-system-binding` under a
dedicated `layout-config` wire-schema group with role
`version-design-system-binding`, separate from the existing
`version-presentation-source` group; that in-memory source/configuration
binding is neither a `shared_contracts` entry nor a stage artifact envelope.
Adapter raw contracts retain nullable
`page_design_system` text/digest facts; Page Image Core and
ordinary/progressive raw-plan bindings retain nullable
`page_design_system_sha256`; and each declared `image2-request` contains one
top-level `design_system` text-or-null field. The declarations SHALL identify
the source/configuration producer, adapter compiler, plan and derived-request
consumers, invalidation input, and Pure/Framed applicability without becoming a
runtime resolver, lifecycle controller, or alternate provider authority.
These declarations and the conformance evaluator describe only current
production shapes. A bounded progressive cutover validator may recognize one
exact former immutable plan for reconciliation/head-lineage purposes, but it
does not make that former plan conforming, current, or eligible for a declared
provider-work contract.

The provider-facing declaration SHALL exclude source paths, source origin,
SHA-256 values, plan identifiers, authorization facts, and lifecycle facts from
`design_system`. It SHALL retain the existing workflow-specific exclusions:
Pure receives no Framed composition or local-header facts, and Framed retains
its protected-composition and local-header/request boundary. The inventory and
stage declarations SHALL NOT classify the Pure-only deck visual-system object
as the shared Page Design System.

The opt-in static conformance sweep SHALL verify synthetic valid Pure and
Framed request chains with matching nullable bindings, exact text/digest
pairing, and provider-facing text/null only. It SHALL report a direct static
schema mismatch for a missing, extra, asymmetric, or digest-mismatched binding;
a missing provider field; a path, origin, digest, authorization, or lifecycle
field in provider-facing `design_system`; cross-workflow fact leakage; or a
request whose declared full canonical size bound is violated. It SHALL also
report a direct mismatch when active source emits the local binding schema
without its `layout-config` wire-schema declaration. This static check remains
provider-free and non-runtime; the source resolver and selected adapter remain
the owning runtime validators.

#### Scenario: A declared Pure and Framed chain carries one shared binding

- **WHEN** conformance inspects synthetic valid current Pure and Framed
  page-derived request chains with the same non-null Page Design System text
- **THEN** it finds the declared raw-contract text/digest pair, matching nullable
  core and plan digest, and the exact provider-facing text field in both chains
- **AND** it finds no provider-facing lineage facts or cross-workflow leakage

#### Scenario: Provider-facing lineage leakage fails static conformance

- **WHEN** a synthetic `image2-request` adds a Page Design System path,
  source-origin field, SHA-256, authorization fact, or lifecycle fact to its
  `design_system` representation
- **THEN** the conformance sweep reports the direct declared-schema mismatch
- **AND** it does not call a provider, mutate a Bundle, or become a runtime
  gate

#### Scenario: Nullable binding shape drift fails static conformance

- **WHEN** a synthetic raw contract, Core binding, ordinary plan, progressive
  plan, or derived request omits its required nullable Page Design System field
  or contains an asymmetric text/digest pair
- **THEN** the conformance sweep reports the direct shape mismatch
- **AND** it does not infer a value, patch a record, or accept a former plan as
  a current conforming plan

#### Scenario: Local binding declaration cannot disappear

- **WHEN** active Visual Config source emits
  `page-image-design-system-binding` but the serialization inventory omits its
  dedicated `layout-config` `version-design-system-binding` wire-schema
  declaration
- **THEN** the conformance sweep reports the direct undeclared-contract
  mismatch
- **AND** it does not treat local-only scope as an inventory exception, create
  a runtime gate, or mutate a Bundle
