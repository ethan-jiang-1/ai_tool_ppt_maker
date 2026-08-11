## REMOVED Requirements

### Requirement: New slide IDs are short spoken mnemonic pairs

**Reason**: The accepted requirement retains a named historical-ID scenario.
The replacement describes current mnemonic authoring and ordinary undeclared-ID
rejection only.
**Migration**: Replace it with the current mnemonic-identity requirement below.

## ADDED Requirements

### Requirement: New slide IDs use the current spoken mnemonic identity

The Agent or MD Controller SHALL name each newly authored slide from its
durable narrative role as exactly two semantic BlockCase blocks under the
existing mnemonic syntax, uniqueness, spoken-key, reserved-word, and
near-confusion rules. Newly initialized sources SHALL declare the current
unversioned `identity.scheme: mnemonic`; its presence means every current ID in
the file has mnemonic syntax. The identity scheme is never a production-mode,
migration, or Controller-routing signal.

#### Scenario: A new source has current mnemonic identity

- **WHEN** a new source is initialized with mnemonic slide IDs
- **THEN** it declares `identity.scheme: mnemonic` and validates the existing
  two-block rules
- **AND** it does not write a version-suffixed identity marker

#### Scenario: New ID is mnemonic and Agent-owned

- **WHEN** an insertion has no valid mnemonic ID
- **THEN** deterministic validation retains the existing request for one Agent-owned mnemonic
- **AND** it does not synthesize a historical identity form

#### Scenario: An undeclared ID is rejected before receipt creation

- **WHEN** a current source contains an ID outside the mnemonic syntax
- **THEN** source validation rejects it before creating a receipt
- **AND** it does not retain, rewrite, or route the ID through another identity scheme

## MODIFIED Requirements

### Requirement: Structural plans bind one replacement Page Image Workflow without acceptance inheritance

Structural preview and exact-plan apply SHALL bind the target version to one
explicit `framed` or `pure` `page-image-workflow` selection. A workflow change,
mixed policy, `hybrid` value, or per-slide authority override remains structural
work and SHALL not mutate an existing version in place. Apply retains the
existing clean-target/no-acceptance-inheritance behavior without emitting or
accepting an alternate historical pipeline marker.

#### Scenario: A structural plan selects one current workflow

- **WHEN** an exact structural plan creates a target version
- **THEN** it binds one declared current `framed` or `pure` workflow
- **AND** it does not reuse source, state, raw, or review evidence from another
  contract

#### Scenario: A workflow switch creates a clean target

- **WHEN** a structural plan changes a current version between Framed and Pure
- **THEN** it creates the existing clean target with fresh current evidence
- **AND** it does not inherit old source or review acceptance

#### Scenario: Per-slide workflow policy is rejected before apply

- **WHEN** a structural plan contains a slide-specific workflow override
- **THEN** preview retains the existing source/structural repair result
- **AND** apply creates no target or provider work
