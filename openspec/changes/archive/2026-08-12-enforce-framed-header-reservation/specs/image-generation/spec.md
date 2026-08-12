## MODIFIED Requirements

### Requirement: Framed protected composition binds one exact bounded provider request

For every current Framed page, Page Image Core and the selected Framed adapter
SHALL retain the existing parsed source-owned `subject_restrictions` and bind
one selected profile's protected-composition facts into the immutable raw
contract, canonical provider-input bytes, raw-plan bindings, and derived
inspection artifacts. The composition facts SHALL use `coordinate_space:
normalized-canvas`, identify one normalized canvas-relative reserved-header
region, and one normalized body-safe region that excludes it. The body-safe
region SHALL be the exact full-width rectangle below the reserved header:
`x: 0`, `y: reserved_header.y + reserved_header.height`, `width: 1`, and
`height: 1 - reserved_header.y - reserved_header.height`. They are derived only
from the selected Framed presentation projection; a slide, review projection,
derived file, or caller SHALL NOT supply substitute coordinates, restrictions,
or a profile.

The compiled request SHALL retain the full continuous provider canvas and state
one exact Framed-exclusive reservation: `reserved_header` is solely for the
deterministic local kicker, title, and subtitle overlay. It SHALL instruct the
provider to place every provider-rendered readable body literal, provider
label, and key subject in `body_safe`, and to place none of those elements in
`reserved_header`. The request SHALL contain no serialized local-header field,
header-derived `context_not_to_render` equivalent, or local header literal.
Independently source-owned provider content retains its own permitted literal
even when its spelling matches a local header literal. The raw contract retains
local-header facts only for deterministic local rendering.

The exclusive-reservation clause is an adapter-owned compiled-input invariant:
the current Framed compiler SHALL emit it with the exact selected normalized
composition, and provider-free planning SHALL fail closed at the existing
source/configuration repair action before derived publication, authorization,
provider initialization, grant, attempt, review, or lifecycle reuse when that
clause is missing, weakened, stale, cross-workflow, or bound to a different
composition. This deterministic invariant validates the local compiled
contract, not the remote raster result; it SHALL not claim a provider-native
region primitive or automatic remote compliance.

Pure SHALL not receive Framed composition, exclusive-reservation instruction,
or Framed raw/request subject-restriction binding. This SHALL not remove the
existing parser-owned source restriction from a Pure receipt or prevent its
existing Visual Config identity-resolution use.

#### Scenario: A Framed request carries its exact exclusive reservation

- **WHEN** a valid current Framed page reaches provider-free planning
- **THEN** its raw contract and canonical provider request bind the same
  selected normalized reserved-header region, body-safe region, parsed source
  restrictions, and exclusive-reservation clause
- **AND** the request remains an exact adapter-owned byte sequence with no
  provider submission or new human decision

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
  literal while the request carries the exact non-text composition and
  exclusive-reservation guidance

#### Scenario: A weakened local reservation stops before provider work

- **WHEN** a selected Framed projection lacks a valid body-safe region, its
  source restriction binding differs from the current receipt, or its compiled
  input lacks the exact exclusive-reservation clause for that composition
- **THEN** planning stops at the direct repair action before it publishes a
  current plan or authorizes provider work
- **AND** it does not substitute a prior geometry, silently weaken the
  instruction, omit restrictions, or create a partial derived publication

#### Scenario: An incomplete composition stops before provider work

- **WHEN** a selected Framed projection lacks a valid body-safe region or its
  source restriction binding differs from the current receipt
- **THEN** planning stops at the direct repair action before it publishes a
  current plan or authorizes provider work
- **AND** it does not substitute a prior geometry, silently omit restrictions,
  or create a partial derived publication

#### Scenario: Pure remains isolated from Framed reservation facts

- **WHEN** a valid current Pure page reaches its selected adapter
- **THEN** its raw contract and provider input contain no Framed reserved-header
  region, body-safe region, exclusive-reservation instruction, local header
  context, or Framed subject-restriction binding
- **AND** its source receipt may retain the parser-owned restriction for its
  existing identity-resolution use while the request continues to use only the
  selected Pure projection

#### Scenario: Pure remains isolated from Framed protection facts

- **WHEN** a valid current Pure page reaches its selected adapter
- **THEN** its raw contract and provider input contain no Framed reserved-header
  region, body-safe region, local header context, or Framed
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

The review decision SHALL treat provider-generated typography, labels,
provider-rendered body content, or key visual subjects that visibly encroach on
the exact `reserved_header` as a reason to select the existing `repair`
decision rather than `proceed`. The review remains a human visual quality
decision: it SHALL not add a protected-area occupancy, collision, OCR, or other
automated observation, and it SHALL not infer a remote-layout result from the
compiled instruction alone. The two composition guides remain review context
only: they SHALL not submit provider work, set `repair` or `proceed`, create
approval or waiver state, replace Complete Page Review, or become a runtime
dependency.

#### Scenario: A header-encroaching provider page routes through repair

- **WHEN** a Framed Complete Page Review shows provider-generated typography,
  labels, provider body content, or a key subject inside the exact reserved
  header guide or obscuring the local overlay in the composite
- **THEN** the human selects the existing `repair` decision and the owner
  returns the existing raw-rebuild recovery action
- **AND** it does not publish accepted raw evidence, final media, or delivery
  evidence from that page set

#### Scenario: A compliant-looking provider page still requires review

- **WHEN** a Framed provider page appears to respect its exclusive reservation
  and composition guidance
- **THEN** the existing Complete Page Review presents the exact provider and
  composite evidence and the two exact composition guides for the human's
  `proceed` or `repair` decision
- **AND** no prompt fact, deterministic contract check, diagnostic, or probe
  sample accepts the page itself

#### Scenario: Composition guides cannot control the lifecycle

- **WHEN** a Framed Complete Page Review includes the two composition guides
- **THEN** they remain context for the existing human review and repair path
- **AND** they create no additional gate, state transition, retry, or provider
  authorization
