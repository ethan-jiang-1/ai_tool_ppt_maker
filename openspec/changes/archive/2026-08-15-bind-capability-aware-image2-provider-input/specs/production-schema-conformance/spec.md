## ADDED Requirements

### Requirement: Image2 capability profile bindings remain schema-declared

The active serialization inventory and applicable `layout-config`, Style
Master generation-profile, Page Image generation-profile, plan,
`image2-request`, and provider-request declarations SHALL describe the current
Image2 capability boundary. They SHALL declare the unversioned local resolved
profile binding, its exact two operations, the closed prompt-budget units,
positive data-driven limits, full profile digest, operation capability
projection, and existing generation-profile digest closure through plans,
authorizations, requests, attempts, provenance, and invalidation.

The declaration SHALL identify the canonical Run Bundle source/configuration
producer and runtime consumers without making the inventory a source parser,
route catalog, provider probe, lifecycle controller, or second capability
authority. It SHALL distinguish `IMAGE2_PROVIDER_PROFILE_ID` as non-secret
runtime environment identity from the source profile; API keys and base URLs
SHALL remain outside persisted profile bindings and schema examples.
Inspection SHALL be declared only as a non-authoritative projection of bound
profile identity, operation, budget, measurement, and digests.

The opt-in provider-free conformance sweep SHALL accept ordinary synthetic
profiles whose limits include 4,000, 16,000, and a third arbitrary positive
safe integer under each closed unit. It SHALL reject an unknown operation/unit,
non-positive or special-kind limit, missing profile digest, generation-profile
projection not closed into its plan/request binding, capability stored in
State/inspection as authority, or credentials/base URL stored in the profile.
Runtime source and lifecycle validators remain the owning checks.

#### Scenario: Declared operations close into existing lifecycle digests

- **WHEN** conformance inspects valid synthetic Style Master and Page Image
  profile-bound chains
- **THEN** it finds each operation capability inside its generation profile and
  the existing downstream plan/request/attempt digest closure
- **AND** it finds no duplicate capability authorization, State ledger,
  credential, base URL, or inspection-owned route selection

#### Scenario: Arbitrary limits do not become schema branches

- **WHEN** synthetic valid profiles use limits 4,000, 16,000, and 12,347 with
  a declared closed unit
- **THEN** the static contract accepts all three as ordinary positive data
- **AND** it reports a mismatch if any number is represented as a special
  profile kind, schema variant, or fallback branch

#### Scenario: Provider secret leakage fails conformance

- **WHEN** a synthetic source/binding or persisted generation profile contains
  an API key, credential value, base URL, or provider response as capability
  evidence
- **THEN** the conformance sweep reports the direct schema/ownership mismatch
- **AND** it does not decode the secret, contact a provider, or mutate a Bundle

### Requirement: Compact provider requests have one declared bytes authority

The active `image2-request` and workflow-specific adapter declarations SHALL
describe one exact canonical prompt authority: the selected adapter's compact
UTF-8 serialization and matching `compiled_provider_input` digest. Pure SHALL
declare only its semantic instruction, Page Design System, provider-rendered
content, visual projection, and selected presentation profile. Framed SHALL
declare only its exact reservation instruction, Page Design System,
provider-rendered content, subject restrictions, normalized protected
composition, and visual projection. Both SHALL retain the semantic identity
role clause and their existing content/literal policies.

Provider-facing declarations SHALL exclude generation profiles, raw contracts,
profile identifiers/digests, presentation provenance, source paths/origins,
authorization/lifecycle facts, and structured lineage fields from prompt
shape. Local request wrappers and lifecycle declarations MAY retain those facts
outside `canonical_utf8` to establish attribution. The submitter SHALL be
declared as an opaque consumer of the exact compiled prompt and selected model,
not a prompt projector, compiler, or inspection reader.

The request declaration SHALL retain the 32,768 UTF-8-byte compiler safety
ceiling and add the selected operation's exact `{ limit, unit, measured }`
admission projection over the final canonical prompt. The static sweep SHALL
validate synthetic valid Pure and Framed requests, byte equality between
authorized compiled input and transport prompt, exact Framed instruction and
composition facts, and absence of a second derived prompt authority. It SHALL
reject lineage leakage, cross-workflow fields, transport-side prompt
derivation, an ambiguous count unit, or a request admitted above either bound.

#### Scenario: Valid Pure and Framed compact shapes remain distinct

- **WHEN** conformance inspects synthetic valid Pure and Framed request chains
- **THEN** each request contains its declared semantic-only workflow shape and
  the exact compiled bytes/digest submitted by transport
- **AND** Pure contains no Framed restriction/composition while Framed contains
  no Pure presentation profile or local-header literal

#### Scenario: Metadata leakage fails static conformance

- **WHEN** a synthetic provider prompt contains a generation profile, raw
  contract, profile digest, provenance, path/origin, authorization fact, or
  other declared lineage-only field
- **THEN** the conformance sweep reports the direct compact-request mismatch
- **AND** it does not sanitize, truncate, or transform the prompt into a
  conforming replacement

#### Scenario: Transport cannot create a second prompt

- **WHEN** a synthetic transport implementation submits bytes derived from a
  raw contract, inspection, or generation profile rather than the exact
  compiled input
- **THEN** the architecture guard detects the competing prompt authority
- **AND** the guard remains provider-free and creates no runtime gate or
  lifecycle mutation

#### Scenario: Exact budget declaration measures final prompt

- **WHEN** conformance inspects exact-boundary and one-over synthetic compact
  prompts containing ASCII, CJK, and emoji under each supported unit
- **THEN** it accepts only final prompt measurements at or below both declared
  bounds
- **AND** it rejects a source-length estimate, ambiguous `chars`, token count,
  or outer HTTP-body measurement as the request contract

### Requirement: Capability compiler cutover has no active legacy authority

Active Harness source, tests, operational guidance, and accepted specifications
SHALL use only the compact provider-input and confirmed capability-profile
contracts for current planning, authorization, and submission. They SHALL NOT
contain an old prompt/profile reader, dual writer, transport-side compact
projection, record patcher, automatic migration, fallback profile, or former-
plan submission fixture.

Immutable historical records MAY continue to validate their own direct digest
lineage for audit, exact unresolved-attempt reconciliation, and successor-head
predecessor binding. That validation SHALL NOT parse or normalize the former
prompt/profile shape, expose it as a current typed plan, or permit new batch,
grant, attempt, provider work, review, finalization, or delivery. The existing
bounded progressive historical bridge retains only its already declared
omission/reconciliation scope and SHALL NOT grow to own this compiler/profile
cutover.

The provider-free active-surface conformance sweep SHALL plant and detect a
transport compact-projection branch, hardcoded 4K/16K selection, inferred
default profile, and former-plan submission path while accepting normative text
that explicitly forbids those categories. Archived changes, Backlog records,
Run Bundles, research data, and generated outputs remain outside that sweep.

#### Scenario: Former prompt reader is rejected from active source

- **WHEN** a focused negative control plants a current-path reader or
  transport projection for the metadata-heavy provider prompt
- **THEN** the conformance sweep reports the exact active path and authority
  category
- **AND** restoring the input passes without reading a production Bundle or
  contacting a provider

#### Scenario: Historical digest evidence remains non-current

- **WHEN** a direct immutable historical record retains its internally bound
  former generation-profile or compiled-input digest
- **THEN** audit/reconciliation may preserve that exact digest lineage under
  its existing owner
- **AND** no active admission path parses the former shape, grants new work, or
  treats it as selected capability evidence
