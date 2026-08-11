## ADDED Requirements

### Requirement: Current provider compilation binds one resolved Page Class projection

Before compiling a current provider input, the selected adapter SHALL receive
exactly one validated presentation projection for the source receipt page's
normalized Page Class and the version's selected workflow. The binding SHALL
retain the normalized class, selected profile identity, and inherited-value
provenance required to establish the compiled input's exact direct sources. For
Framed, every raw contract and provider-input binding SHALL use the profile and
protected geometry resolved for that same stable page ID.
Framed SHALL use only its resolved local header/protected-region facts and
Pure SHALL use only its resolved whole-page Pure facts.

The adapter SHALL not accept a caller-supplied profile, reuse a projection from
another workflow or class, consult a C5-derived file, or revive raw evidence
whose bound projection differs. This binding is part of the existing immutable
raw contract; it SHALL not create a provider call, a separate approval, a
duplicate header-controller JSON, or a durable resolved-layout publication.

#### Scenario: Framed compilation receives its class-bound header treatment

- **WHEN** a current Framed page with a valid resolved presentation projection
  reaches compilation
- **THEN** its provider input and local header controller bind that one
  Framed class/profile projection
- **AND** the compiler does not accept a source `FRAME PRESET` or a Pure fact

#### Scenario: Projection drift cannot reuse raw evidence

- **WHEN** a selected page's resolved class/profile or inherited default differs
  from the binding on existing raw evidence
- **THEN** the existing lifecycle routes through raw rebuild before provider submission or review
- **AND** it does not reuse the former provider page or Complete Page Review

### Requirement: Framed raw-plan proof is exact per page, not per batch

Before ordinary or progressive Framed raw-plan materialization, the compiler
SHALL validate each raw contract against that page's resolved Framed profile.
Its browser proof SHALL return exactly the candidate's ordered stable page IDs
and SHALL bind each returned page's profile digest and protected-region guide to
the same candidate page. A mismatching, missing, duplicate, reordered, or
extra page result, or a profile/guide mismatch for any one page, SHALL stop
before receipt, State, raw-plan, provider authorization, provider work, review,
or local-rebind publication.

The Framed header-contract batch verifier and compositor SHALL derive each page
from its own resolved profile. They SHALL NOT require, publish, or compare a
single batch/deck-wide render-profile digest. This removes no per-page
raw-contract, provider-input, composite, or review binding and creates no new
durable proof record or control state.

#### Scenario: A mixed-profile candidate receives one exact proof per page

- **WHEN** one current Framed candidate contains `standard` and `opening`
  pages whose selected profiles differ
- **THEN** both raw contracts validate against their own selected profiles and
  browser proof binds each stable page ID to its own digest and guide
- **AND** raw planning does not reject the candidate for lacking one global
  Framed render profile

#### Scenario: One stale proof result blocks the complete candidate

- **WHEN** a Framed browser proof returns the expected page set but one page's
  selected profile digest or protected-region guide differs from its candidate
- **THEN** raw planning stops with the bounded profile/proof repair action
- **AND** it does not materialize or rebind any lifecycle record merely because
  every other page matched

### Requirement: Framed review coverage binds each page's selected presentation profile

A Framed raw-review contribution SHALL retain the exact selected presentation
profile digest and protected-region guide for each covered stable page ID. A
complete or Pilot review MAY contain pages whose class-bound Framed profiles
differ, provided every page's composite, guide, and raw-contract lineage bind
that page's own selected projection. The contribution SHALL NOT require one
deck-wide Framed profile, merge a sibling page's profile into another page, or
create a second review decision/control state.

#### Scenario: Mixed Framed classes remain reviewable as one exact scope

- **WHEN** a current Framed raw plan covers one `standard` page and one `opening`
  page with different resolved profiles
- **THEN** the one review contribution retains each page's own profile digest
  and protected-region guide with its exact raw lineage
- **AND** the existing Complete Page Review still exposes one `proceed` or
  `repair` decision without a deck-wide profile check
