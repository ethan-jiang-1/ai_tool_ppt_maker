## ADDED Requirements

### Requirement: Image2 capability failures retain owner-scoped CLI recovery

When a direct or delegated current `style-master` or `image2` operation
resolves or revalidates the selected Image2 provider profile, runtime identity,
final prompt budget, or stored-plan currency, the CLI producer SHALL preserve
the earliest independent owner failure and emit it through the existing
secret-safe diagnostic envelope.

A missing, pending, malformed, unconfirmed, unsafe, unreadable, or otherwise
invalid selected provider-profile source SHALL be `source_validation` with the
existing non-human `edit_source` action and the resolver's bounded declared
reason kind. The producer MAY project a source through existing `source` and
`next.inspect` fields only when the owner supplies one exact safe locator; it
SHALL NOT reveal source prose, a fallback source, selection origin, digest,
credential, base URL, or inferred capability.

An absent, malformed, or plan-mismatched `IMAGE2_PROVIDER_PROFILE_ID` SHALL be
`environment` with the existing `repair_environment` action. A final exact
Style Master or Page Image prompt that exceeds its selected operation budget
SHALL be `source_validation` with `edit_source`, not `provider` or `internal`.
The budget diagnostic MAY project only bounded profile/operation identifiers
and measured/limit/unit facts through existing subject/reason values. Because
the overflow can combine capability profile and authored configuration inputs,
the producer SHALL omit `source` and `next.inspect` unless the owner supplies
one exact safe locator; it SHALL NOT invent a locator from an available source
file.

When valid current profile/compiler facts make an unsubmitted stored plan
stale, the producer SHALL retain `artifact` classification and the existing
lifecycle-owner successor or fresh-plan / Generated Image Rebuild action. It
SHALL not translate valid staleness into profile-source repair, environment
repair, provider retry, or generic internal failure. An exact unresolved
submitted attempt SHALL retain its existing reconciliation or abandonment
precedence instead of receiving the stale-plan action.

This requirement adds no command, route, diagnostic-envelope field, action
value, Controller branch, retry, waiver, fallback, truncation, provider probe,
or alternate provider operation.

#### Scenario: Invalid profile source points to source ownership

- **WHEN** a current Style Master or Page Image checkpoint receives a missing,
  pending, malformed, unconfirmed, unconfined, or unreadable selected provider
  profile
- **THEN** the CLI emits the existing `source_validation` / `edit_source`
  recovery with the owner's bounded reason kind before provider work
- **AND** it projects only an exact safe owner locator when one is supplied and
  does not fall back, infer capability, or expose source prose or secrets

#### Scenario: Runtime profile mismatch remains environment repair

- **WHEN** authorization, generation, or exact-run diagnosis finds
  `IMAGE2_PROVIDER_PROFILE_ID` absent, malformed, or different from the bound
  profile identifier
- **THEN** the CLI emits the existing `environment` / `repair_environment`
  recovery before a grant, attempt, provider initialization, or live probe
- **AND** it does not direct source mutation, reveal runtime configuration, or
  infer identity from credentials, base URL, route, or model

#### Scenario: Exact budget overflow has no speculative locator

- **WHEN** final compiled Style Master or Page Image prompt bytes measure above
  the selected operation's positive limit in its declared exact unit
- **THEN** the CLI emits the existing bounded `source_validation` /
  `edit_source` recovery with only safe profile/operation/measurement facts
- **AND** it omits `source` and `next.inspect` without one exact owner locator
  and does not blame the provider, truncate, reroute, retry, or offer a waiver

#### Scenario: Valid compiler or profile drift keeps owner action

- **WHEN** current valid source, profile, and compiler facts make an
  unsubmitted Style Master or Page Image plan stale
- **THEN** the CLI preserves `artifact` classification and the existing exact
  Style Master successor or Page Image fresh-plan / rebuild owner action
- **AND** it neither patches history nor replaces that action with source,
  environment, provider, retry, fallback, or internal recovery
