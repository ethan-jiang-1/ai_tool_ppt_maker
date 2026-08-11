## REMOVED Requirements

### Requirement: PPTX assembly consumes the replacement final-slide manifest

**Reason**: The accepted requirement contains a named historical-media
scenario. The replacement admits only the declared current final and delivery
contracts.
**Migration**: Replace it with the current final-delivery requirement below.

## ADDED Requirements

### Requirement: PPTX assembly consumes the current final-slide manifest

PPTX Assembly SHALL accept only the declared current `final-page-list`, its
receipt-bound final PNG media, and the declared `delivery-package` media
representation published by shared delivery. Shared delivery SHALL retain the
existing JPEG derivation, dimensions, and ordering rules. Assembly SHALL reject
an undeclared contract before PPTX creation and SHALL not read or adapt a
historical manifest or media representation.

#### Scenario: Assembly receives current final media

- **WHEN** ordered current final-page and delivery-package facts validate
- **THEN** assembly produces the PPTX from their bound media
- **AND** it uses no alternate or version-suffixed artifact contract

#### Scenario: Current Page Image final slides are assembled as JPEG media

- **WHEN** current ordered final-page media validates
- **THEN** assembly retains the established JPEG media assembly behavior
- **AND** it binds only declared current delivery facts

#### Scenario: Stale JPEG delivery media is rebuilt before assembly

- **WHEN** current final-page facts are valid but derived JPEG media is stale
- **THEN** the existing delivery owner rebuilds it before assembly
- **AND** it does not use an older media contract

#### Scenario: JPEG derivation failure protects the existing delivery

- **WHEN** JPEG derivation cannot establish current bound media
- **THEN** assembly stops without replacing current delivery authority
- **AND** it does not create a fallback representation

#### Scenario: Undeclared media cannot become assembly input

- **WHEN** assembly receives media with an undeclared contract marker
- **THEN** it rejects the input before PPTX creation
- **AND** it does not transcode or adopt it
