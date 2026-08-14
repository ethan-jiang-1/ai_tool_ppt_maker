## ADDED Requirements

### Requirement: Registered identity role resolution binds one paired semantic and lineage contract

For a selected Page Image identity role, Visual Asset Management SHALL resolve
only a registered profile and role whose reference path remains confined to
the profile directory, whose exact reference bytes match the registered
SHA-256, whose role clause passes the current visual-clause normalization
contract, and whose subject count and restriction are compatible with the
registered profile.

A successful resolution SHALL expose one immutable paired result:

- a path-free lineage projection containing exactly `profile`, `role`,
  `reference_sha256`, `role_clause_sha256`, `subject_class`,
  `identity_subject_count`, and `subject_restrictions`; and
- a provider-reference record containing the confined reference locator, the
  verified reference-byte SHA-256, and the exact normalized registered
  `role_clause` needed by the selected adapter and per-page reference
  attachment.

The projection's `reference_sha256` SHALL equal the SHA-256 of the resolved
reference bytes, and its `role_clause_sha256` SHALL equal the SHA-256 of the
exact normalized UTF-8 role clause in the paired provider-reference record.
The resolver SHALL remain the authority for registration, confinement,
compatibility, byte verification, clause normalization, and these projection
digests; it SHALL not become provider-input or lifecycle authority.

An unregistered profile or role, escaping or missing path, byte mismatch,
invalid clause, incompatible subject count or restriction, or inconsistent
paired digest SHALL fail current identity resolution before raw-profile or raw
plan compilation. The failure SHALL not infer another role, substitute bytes,
drop the semantic clause, or emit a partial identity projection.

#### Scenario: A registered role resolves paired identity facts

- **WHEN** a current slide selects a registered compatible identity role whose
  confined reference bytes match the registry
- **THEN** resolution returns the exact path-free lineage projection and the
  paired verified reference locator, byte digest, and normalized role clause
- **AND** both records describe the same registered profile and role without
  creating provider or lifecycle authority

#### Scenario: Clause and digest remain exact pairs

- **WHEN** a registered role clause is normalized during identity resolution
- **THEN** the provider-reference record retains that exact normalized text and
  the projection retains its exact SHA-256
- **AND** resolving unchanged registry data twice produces the same text and
  digest pair

#### Scenario: Changed reference bytes fail closed

- **WHEN** the confined selected reference file no longer matches its
  registered SHA-256
- **THEN** identity resolution fails before raw-profile or raw-plan compilation
- **AND** it does not substitute a different file, update the registered
  digest, or emit a partial projection

#### Scenario: Invalid identity semantics fail closed

- **WHEN** a selected profile or role is unregistered, its role clause is
  invalid, or its subject count or restriction is incompatible
- **THEN** identity resolution returns the owning bounded failure before
  provider-input compilation
- **AND** it does not infer a compatible role, omit the role clause, or use a
  prior successful resolution

#### Scenario: Escaping reference paths remain rejected

- **WHEN** a registered role locator is absolute, escapes its profile
  directory, or names unavailable bytes
- **THEN** resolution rejects the reference before any identity projection or
  provider reference is accepted
- **AND** no caller-supplied or compatibility path is used as fallback
