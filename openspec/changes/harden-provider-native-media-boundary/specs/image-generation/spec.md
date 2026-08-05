## MODIFIED Requirements

### Requirement: Page Authority provider requests have a current inspection projection

During provider-free Page Authority plan creation, Image Generation SHALL
materialize one deterministic local inspection projection for the exact current
selected-workflow provider request of every ordered raw-work item. The
projection SHALL bind the current progressive plan hash, source-receipt digest,
source epoch, workflow, provider-profile digest, and ordered raw-contract
tuples. Each item SHALL identify its formal slide ID, raw-contract digest,
canonical provider-request digest, and the exact prompt text that the selected
adapter would submit for that request.

The projection SHALL separately expose the non-secret transport request as
model plus `2000x1125` request size, and the selected raw profile SHALL bind a
PNG provider-media contract that requires CRC-valid bytes and positive native
dimensions. A requested size SHALL NOT be treated as evidence that returned
bytes have those dimensions, and the profile SHALL NOT assert a fixed received
width or height before provider media is inspected.

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

#### Scenario: Request size and native result remain distinct

- **WHEN** the projection describes a current Page Authority Image2 request
- **THEN** it reports the established `2000x1125` transport request and a PNG response contract with no predeclared received dimensions
- **AND** it does not infer returned media dimensions from the request size

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
selected adapter has verified that the returned bytes fully decode as a
CRC-valid PNG with positive native integer dimensions. The adapter SHALL
perform that verification before the progressive raw owner can materialize
bytes, create provenance, or publish a `succeeded` attempt. It SHALL retain
the exact returned bytes and actual decoded dimensions in accepted raw evidence
and provenance, and SHALL NOT resize, transcode, crop, or otherwise repair a
valid provider result solely to satisfy a request or historical native size.

An empty result, malformed or CRC-invalid PNG, or PNG with non-positive native
dimensions SHALL terminalize the already submitted item through the existing
`known_failure` lifecycle. The direct terminal outcome SHALL report only the
bounded invalid-media classification and existing next legal action. It SHALL
not expose provider response content, raw returned bytes, raw-byte digest,
prompt text, or a new retry/force route.

#### Scenario: Default-size native provider PNG materializes normally

- **WHEN** a selected Pure or Framed adapter receives a valid `2048x1136` PNG
  result for an authorized current item
- **THEN** the system follows the existing materialization, provenance, and
  `succeeded` lifecycle with those exact provider bytes and dimensions
- **AND** no additional provider authorization is introduced

#### Scenario: Non-default native provider PNG materializes normally

- **WHEN** a selected Pure or Framed adapter receives a CRC-valid PNG with positive native dimensions that differ from `2048x1136`
- **THEN** the system follows the existing materialization, provenance, and `succeeded` lifecycle with its exact provider bytes and actual dimensions
- **AND** it does not resize the media, terminalize the item, or introduce another provider authorization

#### Scenario: Invalid provider PNG becomes a known failure before evidence

- **WHEN** a provider result is empty, malformed, CRC-invalid, or not a PNG
- **THEN** the system terminalizes that item as `known_failure` with a bounded invalid-media classification
- **AND** it writes no accepted raw bytes, raw-byte provenance, or `succeeded`
  attempt for that item

#### Scenario: Known media failure preserves the existing successor lifecycle

- **WHEN** an authorized item terminalizes as a provider-media `known_failure`
- **THEN** later legal work is derived through the existing remaining-scope or
  successor-batch action
- **AND** the system does not reopen the old grant, infer a retry, or create a
  second recovery controller
