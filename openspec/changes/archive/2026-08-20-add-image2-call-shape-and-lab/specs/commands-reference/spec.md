## ADDED Requirements

### Requirement: COMMANDS maps two Image2 live questions to distinct owners

COMMANDS.md SHALL map three presentation goals without exposing Call Shape
field tables or grant internals:

- whether the confirmed Image2 Call Shape can still retrieve a PNG →
  `probe-image-channels` / `ppt_flow probe <run-dir>`
- which candidate Call Shape can retrieve a PNG → Image2 Lab playbook / Lab CLI
- official page image production → existing `image2 generate` path, which does
  not read `_lab/`

It SHALL NOT document `--smoke` or `--probe-vendors` as current live work. It
SHALL state that an empty `_lab/` does not block drawing when a confirmed or
named-default Call Shape exists.

#### Scenario: Novice asks if drawing still works

- **WHEN** a user asks whether the already confirmed Image2 setup can still
  get a PNG
- **THEN** COMMANDS names probe, not Lab and not env-check live flags
- **AND** it does not present probe success as generate authorization

#### Scenario: Novice asks how to call this vendor

- **WHEN** a user asks to discover a working Image2 Call Shape
- **THEN** COMMANDS names the Lab playbook and CLI
- **AND** it does not send that work into create-deck
