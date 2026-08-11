# Page Image Production Schema Definitions

This directory is the authoritative, non-executable vocabulary for Page Image
production. Its YAML files describe meaningful source, derived, and record
artifacts from a deck argument through delivery. They are readable by humans
and Agents now; C2 will make code constants a tested mirror of this vocabulary.

These files do not introduce a runtime validator, a lifecycle controller, a
gate outcome, or a record migration. They never authorize provider work. Run
Bundles remain the owner of deck source, derived data, state, and records; do
not copy this directory into a `deck_*` bundle or edit a bundle from it.

## Contents

- `META.yaml`: the required shape and writing rules for one stage definition.
- `flow.yaml`: logical transformations, owners, producer status, and
  invalidation causes.
- `recovery-route.yaml`: the authoritative C1-C7 recovery-route labels used
  by planned producers.
- `stages/`: exactly nineteen conceptual definitions, one per filename.
- `frozen-identifiers.yaml`: historical record identifiers and live identity
  literals that later code must preserve rather than rename.

The stage names are conceptual and unversioned. A current implementation may
serialize multiple internal records for one stage. A planned C3-C5 stage names
its planned owning change or capability and uses `producer_status: planned`; it
does not claim an implementation module that does not exist. Every planned
stage and flow producer also carries a `route_ref` that resolves in
`recovery-route.yaml`.

## Recovery Route Labels

`C1` through `C7` are labels for the current Page Image recovery route. They
are not lifecycle phases, workflow modules, CLI commands, schema names, or
authorization states. [`recovery-route.yaml`](recovery-route.yaml) is the
single authority for each label's work, execution kind, responsibility,
boundary, and exit evidence.

`planned` in `flow.yaml` means the matching route entry has not materialized
that producer yet. It never means that an Agent may implement, submit, or
authorize the later route entry merely because its schema is already named.

## Repair Guidance

A field is constrained only when it declares `rule`. Every such field carries
`on_violation.means`, `on_violation.ask`, and `on_violation.never`. Those three
strings are written for a Deck Author: they explain the content decision at
hand without naming a source field or schema file. They are collaboration
context, not an authorization, diagnostic, state mutation, record, or gate.

An omitted value that intentionally normalizes declares `default` in the stage
definition. C1 only documents that behavior; C2 owns applying those defaults
and projecting Repair Guidance through an existing runtime handoff.

## Verification

[`tests/contracts/test_page_image_schema_definitions.mjs`](../../tests/contracts/test_page_image_schema_definitions.mjs)
is the verification owner for this definition home. It checks the exact stage
set, field Repair Guidance, C1-C7 route completeness, planned-producer
references, and the declared `standard` Page Class defaults. Run it as a
targeted test sweep after changing these YAML definitions.

The test is C1 evidence only. It does not grant a source mutation, a provider
submission, or a delivery action.
