## MODIFIED Requirements

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

The `page-image-reference-generation` operation MAY include exactly one
`transport` mapping with `http_operation` (`generations` | `edits`),
`encoding` (`json` | `multipart`), positive integer `width` and `height`,
`dimension_multiple` (`1` | `16`), and `completion` (`sync` | `async-poll`).
Omitted `transport` SHALL resolve to `generations`, `json`, width `2000`,
height `1125`, `dimension_multiple` `1`, and `completion` `async-poll`.
Width and height SHALL be divisible by `dimension_multiple`. The only legal
pairings are `generations`+`json` and `edits`+`multipart`. `style-master-text-generation`
SHALL NOT declare `transport`. The source SHALL contain no vendor-product name
as a schema key.

The source and resolved binding SHALL contain no API key, credential, base URL,
authorization, State fact, provider response, remote probe result, filesystem
path, or inferred model/route capability. The binding's canonical digest SHALL
cover every confirmed source capability fact, including the resolved transport
vector, while its origin/path remains diagnostic-only. Missing, pending,
malformed, unknown, mixed, unconfirmed, or illegal-combo facts SHALL produce
one non-bypassable source-repair hard-stop at the consuming provider-free
planning checkpoint without a binding or digest; the owner SHALL not guess from
`.env`, a model alias, inspection, prior plan, or remote failure.

#### Scenario: Confirmed profile resolves two explicit operations

- **WHEN** the selected confined source has the exact confirmed shape
- **THEN** the validator returns one path-free immutable binding with both
  operation profiles and one canonical digest over all confirmed facts
- **AND** neither operation inherits a route, model, limit, or unit from the
  other or from runtime environment values

#### Scenario: Omitted page-image transport resolves to the current default

- **WHEN** a confirmed `page-image-reference-generation` operation omits
  `transport`
- **THEN** the resolved binding uses generations, JSON, `2000x1125`, multiple 1,
  and async-poll
- **AND** that default remains a legal explicit declaration

#### Scenario: Illegal transport pairing is rejected before a binding

- **WHEN** a confirmed source declares `edits` with `json`, `generations` with
  `multipart`, a vendor-named field, or a size not divisible by
  `dimension_multiple`
- **THEN** the source validator hard-stops before a generation profile, plan,
  grant, attempt, or network request
- **AND** it does not infer a substitute combo

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
