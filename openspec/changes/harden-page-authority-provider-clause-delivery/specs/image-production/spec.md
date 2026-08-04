## ADDED Requirements

### Requirement: Page Authority raw contracts validate canonical provider-clause delivery

Both supported Page Authority workflow adapters (pure and framed) SHALL compile a canonical raw contract
that carries text-guard-protected provider clauses as a validated shape, and SHALL validate that contract
during provider-free planning — before any authorization or provider work. A raw contract with a malformed
canonical shape, or with missing/malformed provider clauses despite a resolved visual language, SHALL
hard-stop at plan time and SHALL NOT be silently accepted.

The provider request serialized from a validated raw contract SHALL carry the actual provider clause text
(recipe, composition, motifs) within the provider prompt, not only recipe/composition/motif identifiers and
digests. The raw contract SHALL remain the single source of provider clause text for the request; the submit
path SHALL NOT reverse-look-up or re-assemble clauses from source or registry at submit time.

#### Scenario: Pure raw contract with canonical provider clauses validates

- **WHEN** a pure raw contract carries a canonical shape with provider clauses resolving to
  `{ recipe: string, composition: string, motifs: string[] }`
- **THEN** planning accepts the contract
- **AND** the serialized provider request contains the exact provider clause text in its prompt

#### Scenario: Pure raw contract with malformed shape hard-stops before provider work

- **WHEN** a pure raw contract violates its canonical shape or carries malformed provider clauses despite a
  resolved visual language
- **THEN** planning rejects the contract before authorization or any provider call
- **AND** no provider request is produced for that slide

#### Scenario: Framed raw contract rejects malformed provider clauses

- **WHEN** a framed raw contract carries `provider_clauses` that are null or not the validated
  `{ recipe, composition, motifs }` text shape despite a resolved visual language
- **THEN** planning rejects the contract before authorization or any provider call
- **AND** the rejection does not depend on provider-side lookup of clause digests

#### Scenario: Serialized provider body preserves provider clause text after accepted binding

- **WHEN** an accepted raw plan binds the provider request and a submit serializes it for the provider
- **THEN** the serialized body prompt includes the exact provider clause text for recipe and composition
- **AND** the request digest and authorization scope cover the provider clause text as part of the raw contract
