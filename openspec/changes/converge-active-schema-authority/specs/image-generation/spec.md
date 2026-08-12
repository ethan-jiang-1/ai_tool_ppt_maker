## ADDED Requirements

### Requirement: Framed render identity is one current compiler contract

The Framed render profile SHALL bind one declared current compiler identity,
canonical geometry invariant, external runtime/font facts, and deterministic
render-profile digest. It SHALL contain no numeric compiler version or retained
compiler history. A change to any current compiler identity, canonical geometry,
or external reproducibility fact SHALL continue to change the digest and follow
the existing selected-profile invalidation and raw-rebuild path.

#### Scenario: Current Framed compilation is stable

- **WHEN** the same current Framed input and external runtime facts compile
  twice
- **THEN** both render profiles have the same declared compiler identity and
  deterministic digest
- **AND** neither profile contains a numeric compiler marker or retained
  alternative identity

#### Scenario: Current compiler input changes invalidate raw work

- **WHEN** the declared current compiler identity, canonical geometry, or a
  reproducibility fact consumed by the profile changes
- **THEN** the render-profile digest changes and the existing raw-rebuild path
  applies
- **AND** the owner does not select or support another compiler identity
