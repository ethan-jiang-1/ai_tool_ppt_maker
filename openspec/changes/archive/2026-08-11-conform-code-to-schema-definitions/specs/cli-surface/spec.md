## REMOVED Requirements

### Requirement: Run-scoped CLI accepts only current Page Image Workflow identity

**Reason**: The accepted requirement embeds a superseded contract and its
named-format scenario. A current requirement must describe only the declared
contract and ordinary undeclared-value handling.
**Migration**: Replace it with the schema-inventory-owned current requirement
below.

### Requirement: Explicit artifact view preserves the machine CLI contract
**Reason**: Its historical-format artifact-view branch would retain a
compatibility reader, which the clean cutover prohibits.
**Migration**: Current artifact view validates only the schema-declared current
contract through the ordinary locator and owner validators.

## ADDED Requirements

### Requirement: Run-scoped CLI validates the current Page Image Workflow identity

Every run-scoped CLI operation SHALL first verify the exact local Harness
binding through the existing locator evaluator, then require the exact current
schema-declared Page Image source pipeline and production-mode pair. Every
direct CLI failure diagnostic SHALL use the inventory-declared
`schema: pptmaker-cli-diagnostic`; producer and consumer validation SHALL
reject an absent, numeric-version, or undeclared diagnostic schema. A missing,
invalid, or undeclared contract value remains an owner-issued hard failure
before any read that depends on production authority, mutation, or provider
work. The CLI SHALL not scan for, decode, convert, or export a known
historical contract.

#### Scenario: CLI receives an undeclared source/state marker

- **WHEN** a run-scoped operation encounters a source or state selector absent
  from the current serialization inventory
- **THEN** it returns the existing owner-issued current-contract failure before
  dependent work
- **AND** it does not create a compatibility inspection or migration path

#### Scenario: An inactive production request is fenced before work

- **WHEN** a CLI request names a run other than the active current binding
- **THEN** it retains the existing non-writing execution-version mismatch failure
- **AND** it does not retarget the request or inspect historical artifacts

#### Scenario: An undeclared production request is fenced before work

- **WHEN** a CLI request supplies an undeclared production contract
- **THEN** it fails exact-current validation before dependent work
- **AND** it does not classify the value, create a migration, or initialize a provider

### Requirement: Current artifact view preserves the machine CLI contract

On a current supported Page Image run, artifact view SHALL retain its existing
provider-free, derived navigation behavior and machine-oriented success shape.
It SHALL validate only the declared current locator and lineage before rebuilding
the navigation tree; an undeclared marker stops through ordinary owner
validation without an artifact read, compatibility report, or migration.

#### Scenario: Artifact view is explicitly requested for a current run

- **WHEN** an Agent invokes artifact view for an exact current Pure or Framed run
- **THEN** it returns the existing run-scoped derived navigation result without a
  provider request or lifecycle transition
- **AND** ordinary status/state observations remain unchanged unless separately invoked

#### Scenario: Artifact view does not expose canonical artifact paths

- **WHEN** the current view contains immutable owner artifacts
- **THEN** it retains the existing bounded derived navigation paths
- **AND** it does not serialize canonical source locators as lifecycle selectors

#### Scenario: Artifact view receives an unsupported run

- **WHEN** artifact view encounters an undeclared source/state marker
- **THEN** it fails before navigation-tree work through the ordinary current owner
- **AND** it does not alias, adopt, or migrate the run
