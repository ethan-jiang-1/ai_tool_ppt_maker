# Environment Check Specification (delta)

## MODIFIED Requirements

### Requirement: Doctor operations are backed by real owner readiness

The accepted doctor operation set SHALL contain only operations with real,
targeted owner readiness checks. The current set SHALL be exactly
`framed-local-refresh`, `raw-generation`, and `full-build`; the hidden
`image2-raw` alias SHALL be removed (the sole current name is
`raw-generation`), and `assembly-notes` SHALL NOT remain an accepted or
help-documented operation until an owner implements real, bounded, secret-free
readiness checks for it. An unknown or retired operation SHALL fail with the
existing bounded usage diagnostic naming the accepted set. Every accepted
operation SHALL map to the targeted checks of its owning capability and SHALL
NOT fall through to an unrelated generic profile.

The internal profile identifier used by raw-generation readiness SHALL be
`raw-generation`, not the retired `image2-raw` display name. Profile identifiers
emitted by the readiness report SHALL be current workflow vocabulary only; no
report, JSON field, or diagnostic SHALL expose `image2-raw` as a profile name.

#### Scenario: The hidden raw alias is rejected

- **WHEN** an Agent passes `--operation image2-raw`
- **THEN** env-check returns the bounded usage failure naming the accepted set
- **AND** it does not silently treat the alias as `raw-generation`

#### Scenario: A hollow assembly operation is not accepted

- **WHEN** an Agent passes `--operation assembly-notes`
- **THEN** env-check returns the bounded usage failure naming the accepted set
- **AND** it does not report a generic common-profile result as notes/assembly
  readiness

#### Scenario: Readiness report uses only current profile names

- **WHEN** a raw-generation readiness report is emitted in text or JSON form
- **THEN** its profile identifiers use current workflow vocabulary
- **AND** it does not emit the retired `image2-raw` display name
