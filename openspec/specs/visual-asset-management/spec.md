# Visual Asset Management Specification

## Purpose

Define Page Authority reference registry loading, confined path resolution, and
deterministic byte fingerprints. The registry supplies reference eligibility to
raw profiles and does not become a second source or provider authority.

## Requirements

### Requirement: Asset manifest loading parses YAML with graceful missing-file handling

The Page Authority reference registry loader SHALL parse its registered YAML source
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
- **THEN** the resolved path remains inside its allowed Page Authority registry root

### Requirement: Asset SHA-256 computation is deterministic

Reference fingerprints SHALL hash exact bytes and use deterministic ordering for
multiple selected roles. A missing or changed required reference shall fail current
raw-profile compilation rather than being silently substituted.

#### Scenario: Fingerprints are stable

- **WHEN** the same selected reference bytes are fingerprinted twice
- **THEN** both digests are identical

### Requirement: Current reference registry is Page Authority-confined

Current asset/reference resolution SHALL use the Page Authority registry, byte
fingerprints, role restrictions, and confined paths. It SHALL NOT become a general
catalog, arbitrary file-path ingress, or provider authority.

#### Scenario: A reference profile is compiled

- **WHEN** Page Authority builds a raw profile
- **THEN** it includes only registered reference roles and fingerprints
