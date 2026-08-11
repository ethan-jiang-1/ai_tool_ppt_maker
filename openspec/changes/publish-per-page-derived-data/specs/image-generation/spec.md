## MODIFIED Requirements

### Requirement: Current provider compilation binds one resolved Page Class projection

Before compiling a current provider input, the selected adapter SHALL receive
exactly one validated presentation projection for the source receipt page's
normalized Page Class and the version's selected workflow. The binding SHALL
retain the normalized class, selected profile identity, and inherited-value
provenance required to establish the compiled input's exact direct sources. For
Framed, every raw contract and provider-input binding SHALL use the profile and
protected geometry resolved for that same stable page ID. Framed SHALL use only
its resolved local header/protected-region facts and Pure SHALL use only its
resolved whole-page Pure facts.

The adapter SHALL not accept a caller-supplied profile, reuse a projection from
another workflow or class, consult a C5-derived file, or revive raw evidence
whose bound projection differs. This binding is part of the existing immutable
raw contract; it SHALL not create a provider call, a separate approval, or a
duplicate header-controller JSON. The exact bound projection MAY be published
only through the independent C5 `page-layout` artifact for the same successful
provider-free plan.

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

## ADDED Requirements

### Requirement: Provider-free raw planning publishes one complete page-derived chain

After the selected adapter has compiled a valid current full raw-plan candidate
and before any authorization or provider initialization, the raw-planning owner
SHALL publish a deck index and one independent page directory for every ordered
stable `slide_id`. Each page directory SHALL contain a separately serialized
`page-source-receipt`, `page-layout`, `page-render-model`,
`page-generation-spec`, `image2-request`, and `page-artifact-index`; a Framed
page SHALL additionally contain only the exact deterministic
`framed-header-html` representation, and a Pure page SHALL contain no Framed
placeholder or sibling header-controller JSON.

Every published artifact SHALL name its declared schema/stage, stable page
identity, purpose, producing owner, exact upstream bindings or canonical digest,
adjustment scope, downstream controller, and the direct
source/configuration/raw-plan inputs that make it stale. The `image2-request`
artifact SHALL expose the adapter's exact canonical UTF-8 request serialization
and matching digest for local inspection. The page index and deck index SHALL
refer to independent artifacts by confined path and digest, identify each
page's current full-plan position and stable ID, and explain the rebuild impact
of their bindings; they SHALL not duplicate page payloads, authorize work,
select a plan, or record an acceptance state.

The publisher SHALL validate the whole candidate and replace the derived-data
tree only as one complete validated publication. A publication failure is a
provider-free plan-materialization failure: it SHALL not expose a partial
current tree, publish a current raw plan, initialize a provider, create a
grant/attempt/review, or offer a fallback from a previous publication.

#### Scenario: A Pure plan publishes an inspectable request without provider work

- **WHEN** a valid current Pure full plan is compiled
- **THEN** each page has the complete non-Framed derived chain, including its
  exact canonical request bytes and provenance, before authorization
- **AND** the operation creates no provider client, grant, attempt, review, or
  new human decision

#### Scenario: A Framed plan publishes HTML but no duplicate header controller

- **WHEN** a valid current Framed full plan is compiled
- **THEN** each page publishes its selected layout and the exact deterministic
  `framed-header-html` file alongside its request chain
- **AND** no sibling JSON header controller or provider-visible body copy is published

#### Scenario: One broken page prevents a partial publication

- **WHEN** one page cannot supply a valid declared artifact or matching lineage
- **THEN** the publisher reports the owning provider-free repair action before
  current raw-plan publication
- **AND** it leaves prior derived data non-authoritative and starts no provider work

### Requirement: Detailed provider input remains outside Human Navigation

The independent C5 derived-data directory SHALL be the canonical per-page
publication for its canonical request serialization and raw prompt prose. The
existing aggregate provider-input inspection retains its own current contract;
it SHALL neither be a C5 publication input nor cause C5 payloads to be copied
into Human Navigation. The existing Human Navigation Path remains a short,
secret-safe, non-authoritative browsing projection and SHALL not copy, link, or
render C5 request payloads into its tree. Detailed-derived files remain Agent
inspection inputs; a path or digest from them SHALL not be accepted as a
lifecycle selector.

#### Scenario: Rebuilding Human Navigation does not expose a provider request

- **WHEN** an exact current plan has a published C5 `image2-request` artifact
  and its Human Navigation Path is rebuilt
- **THEN** navigation can continue to describe available review artifacts
  without copying the request's raw prompt prose
- **AND** its short locator cannot authorize, select, or submit that request
