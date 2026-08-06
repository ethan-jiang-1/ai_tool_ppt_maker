## REMOVED Requirements

### Requirement: Framework layout has no retired production owner

**Reason**: The capability identity and root name use the retired Framework term.
**Migration**: Use `harness-directory-layout` for current production ownership.

#### Scenario: Directory ownership is located after the rename

- **WHEN** a maintainer audits current production owners
- **THEN** it uses `harness-directory-layout`

### Requirement: Framework source and production data stay separate

**Reason**: The capability identity and root name use the retired Framework term.
**Migration**: Use `harness-directory-layout` for Harness-source separation.

#### Scenario: Source-domain separation is located after the rename

- **WHEN** a maintainer identifies the source domain
- **THEN** it uses the active Harness directory capability

### Requirement: Framework layout exposes target sibling workflow ownership

**Reason**: The capability identity and root name use the retired Framework term.
**Migration**: Use `harness-directory-layout` for target sibling ownership.

#### Scenario: Target workflow ownership is located after the rename

- **WHEN** target workflow layout is inspected
- **THEN** the active Harness directory capability supplies the contract
