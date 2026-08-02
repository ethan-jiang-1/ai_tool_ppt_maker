## ADDED Requirements

### Requirement: Pure raw contract carries slide body text

The Pure raw contract SHALL carry the slide's `body` text (the parsed `**BODY**`
source value, or `null` when absent) alongside `display`. The provider submitter
SHALL receive the body text in the request so it can be painted into the page
alongside the display fields. Framed raw contracts SHALL NOT carry body text
(Framed slides reject BODY at parse time).

#### Scenario: Pure body reaches the request

- **WHEN** a Pure slide has a non-null `body` value
- **THEN** its raw contract includes `body` with the slide's body text
- **AND** the provider request carries that text for painting

#### Scenario: Pure body absent is null

- **WHEN** a Pure slide has no BODY field
- **THEN** its raw contract has `body` `null`
- **AND** the rest of the contract is unchanged
