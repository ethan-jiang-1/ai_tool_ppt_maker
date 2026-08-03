## ADDED Requirements

### Requirement: Page Authority provider requests have a current inspection projection

During provider-free Page Authority plan creation, Image Generation SHALL
materialize one deterministic local inspection projection for the exact current
selected-workflow provider request of every ordered raw-work item. The
projection SHALL bind the current progressive plan hash, source-receipt digest,
source epoch, workflow, provider-profile digest, and ordered raw-contract
tuples. Each item SHALL identify its formal slide ID, raw-contract digest,
canonical provider-request digest, and the exact prompt text that the selected
adapter would submit for that request.

The inspection projection SHALL be a rebuildable derived artifact only. The
raw work plan and immutable progressive records remain the authority for
authorization, submission, reconciliation, materialization, and evidence; no
operation SHALL accept the inspection projection as a substitute for any of
those records. Its contents SHALL exclude credentials, authorization headers,
environment values, provider response bodies, and image data URLs. A current
plan replay MAY replace the projection deterministically, while source,
workflow, profile, or raw-contract drift SHALL replace rather than preserve a
stale current-plan projection.

#### Scenario: Provider-free planning publishes exact request inspection

- **WHEN** a current Pure or Framed Page Authority plan is created without a
  provider submission
- **THEN** the system writes one local inspection projection whose items follow
  the plan order and whose request digests match the requests later supplied to
  the selected adapter
- **AND** it does not resolve credentials, invoke a provider, create a grant,
  or materialize raw bytes

#### Scenario: Plan drift invalidates an inspection projection

- **WHEN** a source, workflow, generation profile, or raw contract changes and
  a new current Page Authority plan is created
- **THEN** the replacement inspection projection binds the new plan and request
  digests
- **AND** the system does not describe the prior projection as current or use
  it to authorize or submit the new plan

#### Scenario: Inspection excludes transport secrets and media

- **WHEN** planning runs with configured provider credentials and selected
  image references
- **THEN** the local inspection projection contains neither the credential
  values, authorization header, environment values, provider response content,
  nor image data URLs
- **AND** the exact prompt text remains available only in that local inspection
  projection

### Requirement: Page Authority accepts only verified provider PNG media

Image Generation SHALL accept a Page Authority provider result only after the
selected adapter has verified that the returned bytes fully decode as a PNG
with exact dimensions `2000x1125`. The adapter SHALL perform that verification
before the progressive raw owner can materialize bytes, create provenance, or
publish a `succeeded` attempt. The system SHALL not resize, transcode, or
otherwise repair an invalid provider result.

An empty result, invalid PNG, or dimension mismatch SHALL terminalize the
already submitted item through the existing `known_failure` lifecycle. The
direct terminal outcome SHALL report only bounded media facts: the required
PNG format and dimensions plus a non-secret actual format/dimension or invalid
media classification. It SHALL not expose provider response content, raw
returned bytes, raw-byte digest, prompt text, or a new retry/force route.

#### Scenario: Exact provider PNG materializes normally

- **WHEN** a selected Pure or Framed adapter receives a valid `2000x1125` PNG
  result for an authorized current item
- **THEN** the system follows the existing materialization, provenance, and
  `succeeded` lifecycle
- **AND** no additional provider authorization is introduced

#### Scenario: Invalid provider PNG becomes a known failure before evidence

- **WHEN** a provider result is empty, malformed, or not a PNG
- **THEN** the system terminalizes that item as `known_failure` with bounded
  media facts
- **AND** it writes no accepted raw bytes, raw-byte provenance, or `succeeded`
  attempt for that item

#### Scenario: Wrong dimensions are not repaired

- **WHEN** a provider returns a valid PNG whose width or height differs from
  `2000x1125`
- **THEN** the system reports the expected and actual dimensions as bounded
  known-failure facts
- **AND** it does not resize the image or make it current raw evidence

#### Scenario: Known media failure preserves the existing successor lifecycle

- **WHEN** an authorized item terminalizes as a provider-media `known_failure`
- **THEN** later legal work is derived through the existing remaining-scope or
  successor-batch action
- **AND** the system does not reopen the old grant, infer a retry, or create a
  second recovery controller
