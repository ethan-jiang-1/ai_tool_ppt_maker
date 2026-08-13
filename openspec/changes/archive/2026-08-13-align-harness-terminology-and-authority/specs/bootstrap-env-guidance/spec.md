## ADDED Requirements

### Requirement: Public initialization guidance has one supported command entry

Active user and Agent onboarding SHALL name `ppt_flow init` as the supported
public command for creating a Run Bundle. It MAY identify
`bundle_layout.mjs --init` as the layout owner's lower-level interface, but
SHALL not present it as a competing user startup route, a different Run Bundle
contract, or an alternative workflow initializer.

#### Scenario: A new Deck Author starts a Run Bundle

- **WHEN** onboarding guidance directs a new Deck Author to create a Run Bundle
- **THEN** it presents the current `ppt_flow init` route
- **AND** any layout-owner reference preserves the same current initialization
  contract without requiring the person to choose an initializer
