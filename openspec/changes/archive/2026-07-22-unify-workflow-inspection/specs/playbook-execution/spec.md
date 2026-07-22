## ADDED Requirements

### Requirement: Controller resume guidance consumes workflow inspection
For fresh, resume, and iteration observation, the MD Controller SHALL obtain workflow readiness and the nearest legal action from `workflow_inspection` after it resolves the relevant controller intent. Playbooks SHALL retain ownership of semantic routing, artifact presentation, and human interaction; they SHALL not recreate a mode, gate, authorization, transaction, or recovery evaluator from Markdown, metadata, generated artifacts, or conversation context.

#### Scenario: Resume presents the shared primary action
- **WHEN** a compatible durable execution resumes with a blocking prerequisite
- **THEN** the Controller presents workflow inspection's primary action and owner context before later candidates
- **AND** it does not infer an alternate controller or recovery command

#### Scenario: Controller presents an allowed confirmation
- **WHEN** workflow inspection reports a confirm posture with an owner-provided continuation
- **THEN** the Controller presents the required human reason and the action after each allowed choice
- **AND** it does not treat the continuation as approval or evidence completion

#### Scenario: Controller respects a hard-stop
- **WHEN** workflow inspection reports a hard-stop
- **THEN** the Controller explains the protected invariant and routes through the owner recovery action
- **AND** it does not offer force, waive, source-marker replacement, or state editing
