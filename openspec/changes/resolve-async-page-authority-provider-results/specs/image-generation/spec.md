## ADDED Requirements

### Requirement: Page Authority resolves provider-accepted async image tasks

When an exact authorized Page Authority provider submit receives a successful
JSON response that contains a stable task identifier but no immediate image,
Image Generation SHALL resolve that task within the same submission. It SHALL
poll the provider task resource using the same resolved credential and base
URL, without submitting another image request, creating another grant,
changing the raw plan, or creating a background worker or durable task store.

The poll SHALL be bounded. A successful synchronous inline-image response
SHALL retain its current behavior without a task poll. Task identifiers,
provider response content, response headers, prompts, credentials, and image
data SHALL not enter CLI output, diagnostics, raw evidence, or durable state.

#### Scenario: Accepted task reaches a completed inline result

- **WHEN** a current authorized Page Authority submit returns a stable task ID
  and a later task poll reports a completed result with inline image bytes
- **THEN** the adapter uses those bytes as the result of the original
  submission
- **AND** no second provider submit, authorization, or batch is created

#### Scenario: Synchronous inline provider result remains direct

- **WHEN** a current authorized Page Authority submit returns inline image
  bytes without a task ID
- **THEN** the adapter accepts the result through the existing direct path
- **AND** it does not poll a task resource

#### Scenario: Polling cannot become an unbounded recovery path

- **WHEN** an accepted task remains incomplete beyond the bounded poll budget
  or its poll transport becomes unreadable
- **THEN** the original attempt follows the existing unresolved/unknown
  lifecycle and exact reconciliation action
- **AND** the system does not resubmit the request, create a replacement
  grant, or expose the task ID

### Requirement: Async Page Authority results retain verified-media and terminal failure semantics

Image Generation SHALL apply the existing Page Authority exact PNG validation
to a completed async task result before raw materialization, provenance, or a
`succeeded` attempt is possible. A completed task that reports failure, has an
unusable response, or lacks valid exact `2000x1125` PNG media SHALL follow the
existing secret-safe `known_failure` outcome. A received non-success task poll
response SHALL retain its bounded HTTP failure classification.

#### Scenario: Completed async PNG follows the existing success chain

- **WHEN** a completed task result contains a valid `2000x1125` PNG
- **THEN** the original authorized attempt materializes through the existing
  raw evidence and provenance chain
- **AND** it does not create a separate async evidence format

#### Scenario: Completed task with no usable image terminalizes safely

- **WHEN** a task poll reaches a terminal result without usable image media
- **THEN** the original authorized attempt terminalizes as `known_failure`
- **AND** the CLI exposes only the existing bounded result classification and
  nearest owner action

#### Scenario: Async failure does not leak provider data

- **WHEN** task polling receives a failed task, a non-success response, or
  malformed completed response
- **THEN** CLI output and diagnostics exclude the task ID, provider response
  body, headers, prompt, credentials, image bytes, and image data URLs
- **AND** a later retry remains available only through the existing
  owner-derived successor authorization path
