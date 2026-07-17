## ADDED Requirements

### Requirement: Visual configuration exposes renderer-neutral HTML contract tokens

The visual configuration SHALL support versioned HTML-first tokens for body typography, spacing, cards, charts, callouts, and the ten family geometries. Tokens SHALL be deterministic, serializable, and independent of browser CSS or Image2 prompts. Existing legacy canvas/header fields SHALL remain available and unchanged for legacy pipeline markers.

#### Scenario: Structured plan resolves shared tokens

- **WHEN** an HTML-first source selects a family and references the visual configuration
- **THEN** the resolved plan contains the family geometry and required typography/spacing/component tokens
- **AND** the legacy canvas profile is not rewritten

#### Scenario: Invalid token fails before rendering

- **WHEN** a required token is missing, malformed, or outside its declared domain
- **THEN** contract validation fails with the token path and expected domain
- **AND** no browser or provider work is started

### Requirement: HTML token changes have explicit contract version evidence

The resolved visual contract SHALL include a visual-config schema/version identifier in its fingerprint inputs. A token change SHALL invalidate the affected contract evidence without changing legacy fingerprints that do not consume HTML-first tokens.

#### Scenario: Token change changes HTML contract evidence

- **WHEN** an HTML-first family token changes while source content is unchanged
- **THEN** its `visual_contract_fingerprint` changes
- **AND** legacy pipeline evidence remains governed by its existing config contract
