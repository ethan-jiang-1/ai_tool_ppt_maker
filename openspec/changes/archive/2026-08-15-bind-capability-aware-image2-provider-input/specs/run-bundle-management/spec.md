## ADDED Requirements

### Requirement: Current Image2 provider profile source is explicit and non-secret

The Run Bundle source validator SHALL resolve the canonical version override
before the backbone Image2 provider profile. It SHALL recognize the exact
pending source shape only to return its bounded source-repair result, and SHALL
emit one immutable path-free binding only from one exact confirmed source shape.
A present invalid override SHALL hard-stop as the selected source and SHALL NOT
fall back to backbone. The selected source SHALL be one confined regular UTF-8
YAML file using direct mappings/scalars without aliases, anchors, tags, merge
keys, duplicate keys, symlinks, or version/revision markers.

A confirmed source SHALL contain exactly the unversioned source schema,
non-empty lower-kebab `profile_id` and `endpoint_profile`,
`owner_declaration: { authority: deck-author, status: confirmed }`, and an
`operations` mapping with exactly `style-master-text-generation` and
`page-image-reference-generation`. Each operation SHALL contain exactly a
non-empty lower-kebab `route_id`, one non-empty provider `model`, and
`prompt_budget: { limit, unit }`; `limit` SHALL be a positive safe integer and
`unit` SHALL be exactly `unicode-code-points`, `utf16-code-units`, or
`utf8-bytes`. No numeric limit is a reserved profile kind or code-path selector.

The source and resolved binding SHALL contain no API key, credential, base URL,
authorization, State fact, provider response, remote probe result, filesystem
path, or inferred model/route capability. The binding's canonical digest SHALL
cover every confirmed source capability fact while its origin/path remains
diagnostic-only. Missing, pending, malformed, unknown, mixed, or unconfirmed
facts SHALL produce one non-bypassable source-repair hard-stop at the consuming
provider-free planning checkpoint without a binding or digest; the owner SHALL
not guess from `.env`, a model alias, inspection, prior plan, or remote failure.

#### Scenario: Confirmed profile resolves two explicit operations

- **WHEN** the selected confined source has the exact confirmed shape
- **THEN** the validator returns one path-free immutable binding with both
  operation profiles and one canonical digest over all confirmed facts
- **AND** neither operation inherits a route, model, limit, or unit from the
  other or from runtime environment values

#### Scenario: Invalid override cannot reveal backbone fallback

- **WHEN** a profile override is present but malformed, unconfirmed,
  unconfined, unreadable, or uses an unknown field or budget unit
- **THEN** the source validator hard-stops at that selected override before
  provider-facing planning
- **AND** it does not select the backbone source, repair the file, infer a
  capability, or write lifecycle evidence

#### Scenario: Arbitrary positive budgets remain ordinary data

- **WHEN** confirmed profiles use prompt limits 4,000, 16,000, or another
  positive safe integer for either operation
- **THEN** the same source contract accepts each value as ordinary limit data
- **AND** no value changes the source schema, operation identity, or resolver
  branch

#### Scenario: Pending source has no partial authority

- **WHEN** a selected source retains `status: pending` or combines pending null
  fields with confirmed operation facts
- **THEN** provider-facing planning returns the one profile-source repair
  hard-stop before a plan, grant, attempt, or provider initialization
- **AND** it does not treat partial facts, a prior profile, or environment
  identity as confirmation

### Requirement: Initialization seeds a neutral Image2 provider profile source

Fresh Run Bundle initialization SHALL create the canonical backbone
`image2-provider-profile.yaml` as one direct unversioned YAML source with
exactly the source schema, nullable `profile_id`, nullable `endpoint_profile`,
`owner_declaration: { authority: deck-author, status: pending }`, and exactly
the nullable `style-master-text-generation` and
`page-image-reference-generation` operation entries. The pending seed SHALL
contain no model, route, prompt limit, count unit, endpoint URL, credential,
example provider, inferred default, or confirmed owner decision.

Initialization and `new-version` SHALL treat the file as source only. A new
version SHALL retain the deck-level backbone source and copy a matching source
override only through the existing overrides copy path; neither operation SHALL
create a resolved profile binding, generation profile, Style Master/Page Image
plan, grant, attempt, provider request, or derived inspection.

Current topology validation SHALL preserve an otherwise valid existing Bundle
whose profile source is absent and SHALL NOT write or infer a replacement.
Provider-facing planning for that Bundle remains separately required to return
the Image2 profile owner's one source-repair hard-stop before plan publication.
Initialization and validation SHALL NOT migrate, inspect for, or translate a
former capability convention.

#### Scenario: Init creates a pending non-authorizing profile

- **WHEN** `init` creates a new current Run Bundle
- **THEN** its backbone visual-style directory contains the exact neutral
  pending Image2 profile source
- **AND** the seed contains no route capability, provider secret, authorization,
  lifecycle evidence, or provider work

#### Scenario: Existing Bundle absence remains byte-preserving

- **WHEN** current topology validation examines an otherwise valid existing
  Bundle without `image2-provider-profile.yaml`
- **THEN** validation preserves the Bundle and reports no inferred profile
- **AND** later provider-facing planning must use the owning source-repair path
  rather than a default, migration, or model-alias guess

#### Scenario: New version copies source without evidence

- **WHEN** a Work Version with a canonical Image2 profile override is copied to
  a successor
- **THEN** the successor receives that override only through the ordinary source
  copy rules and continues to see the shared backbone source
- **AND** it begins with no inherited profile-bound plan, grant, attempt,
  provider bytes, review, or delivery authority
