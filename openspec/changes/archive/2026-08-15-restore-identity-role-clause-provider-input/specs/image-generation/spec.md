## ADDED Requirements

### Requirement: Page Image provider identity preserves registered semantics and separated lineage

For a current Page Image slide with a selected `VISUAL IDENTITY`, the selected
Pure or Framed adapter SHALL retain both the exact normalized registered role
clause and one path-free identity lineage projection in its raw contract. The
projection SHALL contain exactly `profile`, `role`, `reference_sha256`,
`role_clause_sha256`, `subject_class`, `identity_subject_count`, and
`subject_restrictions`. Profile, role, and subject-class values SHALL be
non-empty lower-kebab identifiers; both digest values SHALL be lowercase
64-character SHA-256 values; identity-subject count SHALL be exactly `one`;
and subject restrictions SHALL be the supported value already bound to the
current source receipt and identity resolution.

Before hashing the raw contract, constructing provider input, publishing a raw
plan, deriving authorization scope, or performing provider work, the selected
adapter SHALL validate that the identity projection and role clause are either
both `null` or both present, that the projection has the exact shape and value
types above, and that `role_clause_sha256` equals the SHA-256 of the exact
normalized UTF-8 role-clause text. Missing, extra, malformed, asymmetric, or
digest-mismatched identity facts SHALL produce a non-bypassable integrity
hard-stop at the existing provider-free planning checkpoint. Recovery SHALL
repair the owning source, resolver, or adapter defect and rerun that same
checkpoint; no waiver, fallback identity, partial plan, authorization, or
provider request SHALL be created.

When identity is present, the adapter-owned canonical provider input SHALL
contain one `visual.identity` record with exactly `profile`, `role`,
`subject_class`, `identity_subject_count`, `subject_restrictions`, and the exact
`role_clause` from the validated raw contract. It SHALL contain no identity
reference path, `reference_sha256`, `role_clause_sha256`, or other
lineage-only field. When identity is absent, the canonical provider input SHALL
contain `visual.identity: null` and SHALL carry no identity role clause for
that page. Pure and Framed SHALL use the same provider-facing identity shape,
while retaining their existing workflow-specific contracts.

The current transport SHALL submit the exact immutable adapter-owned provider
input and the already bound per-page identity reference bytes without rereading
the registry or adding, removing, or rewriting identity text. A change to the
registered role clause SHALL change the affected compiled provider-input
digest and route prior exact plans, grants, generated pages, and review evidence
through the existing Generated Image Rebuild path. Deterministic contract
validity SHALL not establish visual compliance or acceptance; Complete Page
Review remains the authority for the actual provider result.

#### Scenario: Pure compiles an exact semantic identity

- **WHEN** a valid current Pure slide selects a registered identity role
- **THEN** its raw contract retains the exact clause and lineage projection,
  and its canonical provider input contains the six semantic identity fields
  including that exact clause
- **AND** the provider-facing identity contains no SHA-256 field or physical
  path

#### Scenario: Framed compiles the same identity shape without weakening its own contract

- **WHEN** a valid current Framed slide selects a registered identity role
- **THEN** its canonical provider input uses the same six-field semantic
  identity shape as Pure
- **AND** its existing protected composition, source restriction, exclusive
  header reservation, and canonical-byte invariants remain required

#### Scenario: A page without identity remains explicitly null

- **WHEN** a valid current Pure or Framed slide has no selected
  `VISUAL IDENTITY`
- **THEN** its raw identity projection and role clause are both `null`, and its
  canonical provider input contains `visual.identity: null`
- **AND** no identity clause or per-page identity reference bytes are added for
  that slide

#### Scenario: A mismatched clause and projection stop before plan publication

- **WHEN** a raw contract has only one of identity projection or role clause,
  or the exact clause digest differs from `role_clause_sha256`
- **THEN** the selected adapter hard-stops at provider-free planning before it
  hashes or publishes a current plan or authorization scope
- **AND** it creates no provider request, fallback identity, waiver, state
  mutation, or partial derived publication

#### Scenario: Projection shape drift is rejected

- **WHEN** an identity projection has a missing or extra key, a non-lowercase
  digest, an unsupported count or restriction, or a malformed identifier
- **THEN** provider-free planning rejects the raw contract at the same adapter
  checkpoint
- **AND** a valid sibling page or historical projection cannot substitute for
  the invalid identity

#### Scenario: Transport preserves the adapter-owned identity bytes

- **WHEN** an authorized identity-bearing Pure or Framed item reaches the
  current provider submitter
- **THEN** the submitted prompt is byte-for-byte the adapter's bound canonical
  provider input and the bound per-page identity reference is attached
- **AND** submit does not reread the registry, reconstruct the identity, or add
  a digest or path to the prompt

#### Scenario: Role-clause drift invalidates exact generated work

- **WHEN** a registered role clause changes and the affected slide is compiled
  again with otherwise unchanged current inputs
- **THEN** its compiled provider-input digest changes and prior exact raw work
  is not current for that request
- **AND** the existing owner preserves historical evidence and returns the
  fresh-plan, authorization, generation, and review path rather than patching
  derived artifacts

#### Scenario: A retained projection-only plan cannot submit after the compiler cutover

- **WHEN** a current stored identity-bearing plan was compiled with the former
  projection-only provider identity and is presented for authorization or
  generation under the semantic-identity compiler
- **THEN** current-plan preflight rejects the retained plan as stale before a
  grant, attempt, or provider request can use it
- **AND** the owner preserves the retained records for audit and returns the
  existing fresh-plan and Generated Image Rebuild route

#### Scenario: A valid prompt still requires visual review

- **WHEN** a provider result was produced from a locally valid semantic
  identity contract
- **THEN** Complete Page Review still determines whether the profile is
  visually consistent and acceptable
- **AND** the clause/digest check alone does not assert provider compliance or
  accept the generated page
