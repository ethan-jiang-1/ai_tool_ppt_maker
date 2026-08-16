# Visual Asset Management Specification

## Purpose

Define Page Image Workflow reference registry loading, confined path resolution, and
deterministic byte fingerprints. The registry supplies reference eligibility to
raw profiles and does not become a second source or provider authority.

## Requirements

### Requirement: Asset manifest loading parses YAML with graceful missing-file handling

The Page Image Workflow reference registry loader SHALL parse its registered YAML source
with strict structure validation. A missing optional registry returns an empty
profile set; invalid bytes produce a bounded diagnostic naming the registry path.

#### Scenario: Missing registry remains empty

- **WHEN** no optional reference registry exists
- **THEN** the loader returns an empty profile set without inferring a path

### Requirement: Asset file resolution checks override first, then backbone

Registered reference resolution SHALL use the current confined lookup precedence
for a declared reference and reject absolute, escaping, or unregistered paths.

#### Scenario: Registered reference is resolved

- **WHEN** a current profile selects a registered reference role
- **THEN** the resolved path remains inside its allowed Page Image Workflow registry root

### Requirement: Asset SHA-256 computation is deterministic

Reference fingerprints SHALL hash exact bytes and use deterministic ordering for
multiple selected roles. A missing or changed required reference shall fail current
raw-profile compilation rather than being silently substituted.

#### Scenario: Fingerprints are stable

- **WHEN** the same selected reference bytes are fingerprinted twice
- **THEN** both digests are identical

### Requirement: Current reference registry is Page Image Workflow-confined

Current asset/reference resolution SHALL use the Page Image Workflow registry, byte
fingerprints, role restrictions, and confined paths. It SHALL NOT become a general
catalog, arbitrary file-path ingress, or provider authority.

#### Scenario: A reference profile is compiled

- **WHEN** Page Image Workflow builds a raw profile
- **THEN** it includes only registered reference roles and fingerprints

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

### Requirement: Reference issues bind the physical registry locator

When the reference loader knows the exact registry path, every parse,
validation, and clause-normalization issue it produces SHALL carry that
physical source locator through the problem-fact contract owned by
`diagnostic-facts`, together with its logical registry path, the registered
reason code, and bounded `actual`/`expected` values that never include a
complete role clause. An invalid registry or role failure SHALL therefore
name its actual registry file, and SHALL retain that owner and locator when
the Page Source aggregator absorbs it; it SHALL NOT be rewritten to
`slide-specifications.md` or `VISUAL BRIEF`, and SHALL NOT lose
`actual`/`expected` facts.

#### Scenario: Invalid role clause names the registry file

- **WHEN** a selected profile's role clause violates the visual-clause
  normalization contract
- **THEN** the failure carries the exact registry physical path, the logical
  record path, and the bounded reason
- **AND** the aggregated diagnostic retains the same owner and locator

#### Scenario: Invalid registry bytes name the registry path

- **WHEN** a registry file cannot be parsed or validated
- **THEN** the bounded diagnostic names that registry path and does not
  fall back to a prior profile or another source
