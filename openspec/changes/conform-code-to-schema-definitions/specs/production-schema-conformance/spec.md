## Purpose

Keep Page Image implementation terminology, frozen-identifier preservation,
and Deck Author repair projections conformant with the authoritative C1 YAML
definitions without creating a second runtime controller or record format.

## ADDED Requirements

### Requirement: Page Image code mirrors one conceptual YAML vocabulary

The Harness SHALL maintain one deterministic conformance inventory for every
schema-shaped Page Image implementation identifier. Each inventory entry SHALL
classify the identifier as a conceptual-stage mirror, a C1 frozen identifier,
or an explicit non-schema implementation detail. A conceptual-stage mirror
SHALL resolve to exactly one C1 stage definition and name its code anchor;
unmapped schema-shaped identifiers and anchors without a current stage
definition SHALL fail the conformance check.

The YAML definition home remains the authority for conceptual vocabulary. The
conformance inventory, code anchors, and test output are executable mirrors and
diagnostics only; they SHALL NOT introduce a lifecycle controller, state schema,
or second source of record.

#### Scenario: A mapped code mirror is inspected

- **WHEN** a maintainer inspects a Page Image implementation identifier that
  represents a conceptual artifact
- **THEN** the conformance inventory resolves it to one current C1 stage and
  its declared code anchor
- **AND** the stage YAML remains the conceptual-vocabulary authority

#### Scenario: A code mirror drifts from its authority

- **WHEN** a mapped identifier, stage reference, or required anchor is removed
  or changed without a matching C1 authority update
- **THEN** the deterministic conformance test fails with that direct mismatch
- **AND** it does not infer a replacement, write a record, mutate source/state,
  or begin provider work

### Requirement: C1 frozen identifiers preserve readable evidence

The Harness SHALL preserve every identifier in C1's frozen inventory according
to its declared read and write policy. Historical record-schema identifiers
remain readable and valid for their existing evidence, while live protocol,
mode, and identity literals remain exactly writable where their current owners
require them. A C1 frozen identifier SHALL NOT be renamed, migrated, or
reinterpreted as a new conceptual-stage name.

A conformance failure involving a frozen identifier SHALL be an integrity and
recoverability hard-stop before dependent record mutation or provider work. It
shall reuse the current owner-issued failure and recovery path, with no force,
conversion, compatibility writer, or parallel record store.

#### Scenario: Historical evidence is read after conformance work

- **WHEN** an existing record carries a historical C1 record-schema identifier
- **THEN** its current owner continues to read and validate the record under
  that exact identifier
- **AND** C2 does not rewrite the record bytes or create a replacement record

#### Scenario: A frozen literal would be changed

- **WHEN** a change would alter the exact text or write policy of a C1 frozen
  identifier
- **THEN** the conformance check rejects the mismatch before a dependent
  provider, state, source, or record action
- **AND** it gives the Agent the one existing owner recovery route without a
  force or migration option

### Requirement: Defaults and Repair Guidance retain their existing owners

For a C1 field whose producer is materialized and whose current owner has the
relevant validation path, an omitted declared default SHALL normalize to that
value rather than becoming an author error. The existing owner-issued Deck
Author recovery text for a materialized constrained field SHALL use its
`means`, `ask`, and `never` guidance without exposing a schema identifier or
source field name.

A C1 field on a planned C3-C5 stage SHALL remain declarative until its named
producer exists. C2 SHALL neither add an implementation-only substitute nor
claim that a planned default or Repair Guidance is already enforced.

This projection is a `guide` through the existing producer and diagnostic
handoff. It SHALL NOT create a confirmation, approval, gate outcome, state
mutation, persistent record, CLI envelope field, or second message channel.
Identity, integrity, and preservation failures retain their existing
non-bypassable hard-stop classification and nearest legal action.

#### Scenario: A planned Page Class remains declarative

- **WHEN** a maintainer inspects C1's `standard` Page Class defaults before C4
  materializes `page-source` and `layout-config`
- **THEN** C2 preserves the declared defaults and their planned owner boundary
- **AND** it does not add a Page Class validator, author error, confirmation,
  or new state record

#### Scenario: An author needs to repair a constrained value

- **WHEN** the existing owner reports a constrained Page Image value that needs
  a Deck Author decision
- **THEN** its one current recovery action uses the matching C1 Repair Guidance
  in Deck Author terms
- **AND** it does not reveal a schema filename, source field name, or a second
  technical recovery route
