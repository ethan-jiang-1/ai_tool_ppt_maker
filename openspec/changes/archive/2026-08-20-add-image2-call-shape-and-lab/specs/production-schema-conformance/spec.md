## ADDED Requirements

### Requirement: Image2 Call Shape value is one named shared contract

`serialization-contracts.yaml` SHALL declare the Image2 Call Shape value as a
named shared contract under `image2_provider_capability`, not as a twentieth
conceptual stage. The value SHALL contain exactly: non-empty `model`;
`prompt_budget` with positive safe-integer `limit` and unit
`unicode-code-points` | `utf16-code-units` | `utf8-bytes`; `transport` with
`http_operation` (`generations` | `edits`), `encoding` (`json` | `multipart`),
positive integer `width` and `height`, `dimension_multiple` (`1` | `16`), and
`completion` (`sync` | `async-poll`); and `result_protocol` from the closed
dialect set. Legal request pairings remain only `generations`+`json` and
`edits`+`multipart`, with width and height divisible by `dimension_multiple`.

The value SHALL NOT contain API key, base URL, `IMAGE2_PROVIDER_PROFILE_ID`,
`profile_id`, `endpoint_profile`, `route_id`, `owner_declaration`, vendor
product names as keys, JSONPath, URL templates, or user parsing scripts.
Authorization, idempotency, deadline, and no-second-submit rules are executor
invariants, not Call Shape fields.

One validator SHALL canonicalize and hash the value. Candidate and trial files
SHALL wrap that value in an envelope whose `schema` is
`pptmaker-image2-call-shape`. The envelope discriminator SHALL NOT be part of
the hashed value. Profile page-image operations SHALL embed the same canonical
value rather than a second field set.

This change SHALL register exactly one `result_protocol` member:
`json-inline-b64` (JSON submit; image bytes only from inline `bytes_base64` or
`b64_json`; `async-poll` uses `GET ${IMAGE2_BASE_URL}/tasks/{id}`; redirects
rejected). Unregistered dialects SHALL fail closed with zero fetch.

#### Scenario: Call Shape is not a production stage

- **WHEN** a maintainer inspects `serialization-contracts.yaml` after this
  change
- **THEN** Call Shape is declared under `image2_provider_capability`
- **AND** the nineteen conceptual stage names remain unchanged

#### Scenario: Envelope and value hash separately

- **WHEN** two candidate files share the same canonical value but different
  envelope context
- **THEN** their Call Shape hashes are identical
- **AND** neither file is accepted by filename alone without a schema
  discriminator

#### Scenario: Unknown result protocol never reaches the network

- **WHEN** a candidate or profile declares an unregistered `result_protocol`
  or a vendor-named retrieve field
- **THEN** validation hard-stops before fetch
- **AND** it does not treat JSONPath or a URL template as a dialect

### Requirement: Named default Call Shape is digest-identical to omitted fields

Omitted `transport` and omitted `result_protocol` SHALL canonicalize to one
named default Call Shape value: `generations`, `json`, width `2000`, height
`1125`, `dimension_multiple` `1`, `completion` `async-poll`, and
`result_protocol` `json-inline-b64`. An explicit declaration of that same
value SHALL be digest-identical to the omitted form. Lab and production SHALL
share that default constant.

#### Scenario: Omitted fields match the named default digest

- **WHEN** a confirmed page-image operation omits `transport` and
  `result_protocol`
- **THEN** the canonical Call Shape hash equals the named default constant
- **AND** an explicit declaration of the same fields produces the same hash
