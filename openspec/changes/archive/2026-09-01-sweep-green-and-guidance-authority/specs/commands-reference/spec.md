## MODIFIED Requirements

### Requirement: COMMANDS maps two Image2 live questions to distinct owners

COMMANDS.md SHALL map three presentation goals without exposing Call Shape
field tables or grant internals:

- whether the confirmed Image2 Call Shape can still retrieve a PNG → the
  novice-facing Common Requests section SHALL name this connectivity-check
  route in Deck-Author vocabulary only; the exact
  `probe-image-channels` / `ppt_flow probe <run-dir>` commands SHALL be
  declared in the same document's Agent-facing Agent Routing Reference section
- which candidate Call Shape can retrieve a PNG → Image2 Lab playbook / Lab CLI
- official page image production → existing `image2 generate` path, which does
  not read `_lab/`

The novice-facing Common Requests section SHALL NOT contain CLI program names,
flag spellings, `JSON`/`stderr` failure-envelope vocabulary, or
`diagnostic.`-prefixed field notation; exact command names and flags belong to
the Agent-facing sections. It SHALL NOT document `--smoke` or `--probe-vendors`
as current live work. It SHALL state that an empty `_lab/` does not block
drawing when a confirmed or named-default Call Shape exists.

#### Scenario: Novice asks if drawing still works

- **WHEN** a user asks whether the already confirmed Image2 setup can still
  get a PNG
- **THEN** the Common Requests row names the connectivity-check route in
  Deck-Author vocabulary, not Lab and not env-check live flags
- **AND** it does not present probe success as generate authorization, and the
  exact probe command names remain only in the Agent Routing Reference section

#### Scenario: Novice asks how to call this vendor

- **WHEN** a user asks to discover a working Image2 Call Shape
- **THEN** COMMANDS names the Lab playbook and CLI
- **AND** it does not send that work into create-deck

#### Scenario: The novice section stays free of implementation vocabulary

- **WHEN** the document-command audit and the diagnostic recovery handoff
  checkpoint scan the Common Requests section
- **THEN** they find no CLI program name, flag spelling, `JSON`/`stderr`
  envelope vocabulary, or `diagnostic.` field notation in that section
- **AND** the Agent Routing Reference section still declares the exact probe
  commands for Agent use
