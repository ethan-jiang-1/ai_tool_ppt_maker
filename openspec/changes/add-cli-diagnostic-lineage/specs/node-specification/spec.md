## ADDED Requirements

### Requirement: CLI-to-MD diagnostics are actionable

The CLI-to-MD protocol SHALL treat failure envelopes as actionable control messages, not only as error notifications. When a CLI can identify why a command is blocked or failed, the envelope SHALL provide enough structured evidence for an MD Controller or agent to choose the next step without guessing. This evidence MAY be supplied through the `diagnostic` object defined by the CLI surface and SHALL be consistent with the top-level `message`, `hint`, and `where` fields.

For MD-facing failures, `diagnostic.md_next` SHALL favor source inspection and runnable commands over prose-only advice. If a deterministic repair is possible inside JS, the CLI SHALL repair or heal before returning failure. If human judgment is required, the CLI SHALL name the decision point and provide a default path when one exists. Diagnostics SHALL point users and MD Controllers to editable source files for corrections and SHALL NOT instruct them to hand-edit `_generated/` artifacts.

#### Scenario: MD Controller receives a gate block

- **WHEN** a CLI blocks execution on a missing or pending gate
- **THEN** the failure envelope tells the MD Controller which gate or node condition blocked execution
- **AND** `diagnostic.md_next` names the command or approval path that can unblock it
- **AND** the hint distinguishes an automatic rerun from a human review decision

#### Scenario: MD Controller receives a source-derived stage failure

- **WHEN** a pipeline stage fails because of invalid markdown-derived data
- **THEN** the envelope identifies the editable source file when known
- **AND** identifies the slide, field, or artifact lineage when known
- **AND** provides a rerun command appropriate to the affected stage or `ppt_flow` entry point

#### Scenario: Generated artifacts are not presented as edit targets

- **WHEN** the failing condition is observed in `_generated/`
- **THEN** the diagnostic lineage may include that generated artifact as evidence
- **AND** the recommended next step points to the source markdown, backbone, override, gate action, or rerun command
- **AND** it does not ask the MD Controller or user to hand-edit the generated file
