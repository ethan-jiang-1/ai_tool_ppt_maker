## ADDED Requirements

### Requirement: Framed protected composition binds one exact bounded provider request

For every current Framed page, Page Image Core and the selected Framed adapter
SHALL retain the existing parsed source-owned `subject_restrictions` and bind
one selected profile's protected-composition facts into the immutable raw
contract, canonical provider-input bytes, raw-plan bindings, and C5 inspection
artifacts. The composition facts SHALL use `coordinate_space:
normalized-canvas`, identify one normalized canvas-relative reserved-header
region, and one normalized body-safe region that excludes it. The body-safe
region SHALL be the exact full-width rectangle below the reserved header:
`x: 0`, `y: reserved_header.y + reserved_header.height`, `width: 1`, and
`height: 1 - reserved_header.y - reserved_header.height`. They are derived only from the selected Framed
presentation projection; a slide, review projection, C5-derived file, or
caller SHALL NOT supply substitute coordinates, restrictions, or a profile.

The compiled request SHALL direct provider-rendered readable body content and
key subjects to the body-safe region, retain the full continuous provider
canvas, and contain no serialized local-header field or header-derived
`context_not_to_render` equivalent. Independently source-owned provider content
retains its own permitted literal even when its spelling matches a local header
literal. The raw contract retains the local-header facts only for deterministic
local rendering. This is a bounded provider avoidance instruction and review
guide, not a claim that the provider has a native region primitive or will obey
the instruction in its raster output. Pure
SHALL not receive Framed composition or the C6 Framed raw/request
subject-restriction binding. This SHALL not remove the existing parser-owned
source restriction from a Pure receipt or prevent its existing Visual Config
identity-resolution use.

A missing, malformed, cross-workflow, or digest-mismatched composition or
restriction binding is an integrity hard-stop for that plan materialization. It
SHALL return the existing nearest source/configuration repair action before C5
publication, authorization, provider initialization, grant, attempt, review,
or lifecycle reuse; it SHALL not read a prior derived file, raw contract, or
provider page as a fallback.

#### Scenario: A Framed request carries its exact selected composition

- **WHEN** a valid current Framed page reaches provider-free planning
- **THEN** its raw contract and canonical provider request bind the same
  selected normalized reserved-header region, body-safe region, and parsed
  source restrictions
- **AND** the request remains an exact adapter-owned byte sequence with no
  provider submission or new human decision

#### Scenario: A Framed request does not repeat local header literals

- **WHEN** a valid Framed page has a non-empty local title, kicker, or subtitle
- **THEN** its raw contract retains those facts for the deterministic local
  overlay while its canonical provider request contains no local-header field
  or header-literal context field
- **AND** independently source-owned provider content may retain a matching
  literal while the request otherwise carries only the selected non-text
  composition guidance

#### Scenario: An incomplete composition stops before provider work

- **WHEN** a selected Framed projection lacks a valid body-safe region or its
  source restriction binding differs from the current receipt
- **THEN** planning stops at the direct repair action before it publishes a
  current plan or authorizes provider work
- **AND** it does not substitute a prior geometry, silently omit restrictions,
  or create a partial C5 publication

#### Scenario: Pure remains isolated from Framed protection facts

- **WHEN** a valid current Pure page reaches its selected adapter
- **THEN** its raw contract and provider input contain no Framed reserved-header
  region, body-safe region, local header context, or C6 Framed
  subject-restriction binding
- **AND** its source receipt may retain the parser-owned restriction for its
  existing identity-resolution use while the request continues to use only the
  selected Pure projection

### Requirement: Framed composition evidence preserves one human review decision

The existing Complete Page Review SHALL remain the only acceptance decision for
Framed provider output. It SHALL continue to bind the exact provider page and
production-equivalent transparent-header composite to the composition-bound raw
lineage. Its existing Framed review contribution SHALL display exactly one
normalized `reserved_header` guide rectangle and one normalized `body_safe`
guide rectangle from that lineage. Provider-safe wording, a successful
deterministic contract check, or an observed provider result SHALL not establish
a general layout guarantee or accepted evidence without that review decision.

C6 SHALL NOT add a protected-area occupancy, collision, OCR, or other automated
observation. The two composition guides remain review context only: they SHALL
not submit provider work, set `repair` or `proceed`, create approval or waiver
state, replace Complete Page Review, or become a runtime dependency.

#### Scenario: A compliant-looking provider page still requires review

- **WHEN** a Framed provider page appears to respect its composition guidance
- **THEN** the existing Complete Page Review presents the exact provider and
  composite evidence and the two exact composition guides for the human's
  `proceed` or `repair` decision
- **AND** no prompt fact, diagnostic, or probe sample accepts the page itself

#### Scenario: Composition guides cannot control the lifecycle

- **WHEN** a Framed Complete Page Review includes the two composition guides
- **THEN** they remain context for the existing human review and repair path
- **AND** it creates no additional gate, state transition, retry, or provider
  authorization

## MODIFIED Requirements

### Requirement: Page Image Workflow compiles one auditable provider input per slide

For a current schema-declared `page-image-workflow` receipt, the selected
workflow adapter SHALL compile exactly one immutable provider input for each
slide from the canonical source receipt, selected visual language, accepted
Style Master facts, and current adapter policy. The compiled input SHALL carry
the declared `image2-request` schema and role, retain existing digest and
immutability rules, and use no version-suffixed or alternate protocol marker.

For Framed, the exact current input SHALL bind its selected normalized
protected composition and source restrictions, while omitting every
local-header field, header-derived `context_not_to_render` field, and
`protected_geometry` field. Independently source-owned provider content retains
its own permitted literal when its spelling matches a local header. For Pure,
the input remains limited to its selected Pure projection and does not receive
a Framed composition or C6 Framed restriction binding.

#### Scenario: A current provider input is compiled

- **WHEN** a valid current receipt reaches its selected adapter
- **THEN** it emits one immutable declared Image2 request per slide
- **AND** no historical receipt or protocol branch participates

#### Scenario: Framed compilation binds non-rendering header context

- **WHEN** a current Framed source reaches compilation
- **THEN** its compiled declared request binds the selected non-text protected
  composition and source restrictions without a local-header field or
  header-literal context
- **AND** independently sourced provider content may retain matching spelling,
  and the request does not create a second or historical contract

#### Scenario: Transport cannot rewrite an adapter input

- **WHEN** the current transport receives a compiled declared request
- **THEN** it submits the exact adapter-owned input under existing controls
- **AND** it does not rewrite its schema, role, or protocol value

### Requirement: Current raw contracts preserve content authority and literal policy

Current Page Image raw contracts SHALL separately record canonical source
authority, normalized Provider Content Schema, visual direction, generation
profile, Header Rendering Policy, compiled provider-input digest, and any
Framed local header-renderer input. A Framed contract SHALL additionally retain
one selected protected-composition binding and source restrictions without an
exact local-header-literal mirror or `protected_geometry` field. They SHALL
preserve exact literals and explicit presentation-adaptable permissions without
granting the provider semantic authorship.

Before hashing or authorizing a raw contract, the selected adapter SHALL
validate the complete current contract shape. Unknown content roles, unbound
provider bytes, a serialized Framed local-header field or header-literal
context, malformed or stale protected composition/restriction binding, a former
`context_not_to_render` or `protected_geometry` field, or an unrecognized
literal policy SHALL fail closed with the owning source/configuration repair
action before provider work.

#### Scenario: Adaptable supporting copy remains explicitly bounded

- **WHEN** a valid provider input contains a `presentation_adaptable`
  supporting-copy item
- **THEN** the raw contract records that explicit permission with the source
  literal
- **AND** no claim, fact, number, name, label, header, or unmarked literal is
  represented as adaptable

#### Scenario: Invalid current contract stops before authorization

- **WHEN** a compiled Framed contract omits its provider-input digest,
  protected-composition binding, or source restriction binding
- **THEN** raw planning fails before plan publication or provider authorization
- **AND** it returns one owning repair action rather than constructing a
  fallback request
