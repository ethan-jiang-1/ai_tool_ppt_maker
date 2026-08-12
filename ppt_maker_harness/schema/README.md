# Page Image Production Schema Definitions

This directory is the authoritative, non-executable vocabulary for Page Image
production. Its YAML files describe meaningful source, derived, and record
artifacts from a deck argument through delivery. They are readable by humans
and Agents, and `serialization-contracts.yaml` is the tested declaration home
for active durable contracts.

These files do not introduce a runtime validator, a lifecycle controller, a
gate outcome, or a record migration. They never authorize provider work. Run
Bundles remain the owner of deck source, derived data, state, and records; do
not copy this directory into a `deck_*` bundle or edit a bundle from it.

## Contents

- `META.yaml`: the required shape and writing rules for one stage definition.
- `flow.yaml`: logical transformations, owners, producer status, and
  invalidation causes.
- `stages/`: exactly nineteen conceptual definitions, one per filename.
- `serialization-contracts.yaml`: active unversioned selectors, shared
  contracts, and wire-schema-to-stage/role mappings used by code mirrors.

The stage names are conceptual and unversioned. A current implementation may
serialize multiple precise wire shapes for one stage; each maps to a declared
stage reference and role in `serialization-contracts.yaml`. Every stage and
flow transformation names its current owner; this directory does not track
delivery routes, future work, or implementation progress.

## Current Framed Composition Terms

`SUBJECT RESTRICTIONS` is a closed parser-owned page fact on both workflows.
Its normalized receipt value is one of `none`, `no-generic-metal-robot`, or
`no-identity-subject`. Page Image Core retains that fact. Framed alone binds it
into its raw contract and canonical provider request; Pure retains its existing
receipt and identity-resolution use without a Framed request binding.

Framed has one selected-profile CSS-pixel `header_region`, with exactly `x`,
`y`, `width`, and `height`. It contains every permitted deterministic local
header field and leaves positive canvas height below it. The resolver derives
the only provider-facing composition in `normalized-canvas`: `reserved_header`
is the normalized region, and `body_safe` is the full-width rectangle directly
below it. This is provider best-effort guidance and Complete Page Review
context, never a native provider region/mask claim or an automated acceptance
check.

Local header literals remain exclusively in Framed's deterministic renderer.
The Framed request has no `local_header`, header-derived context, or former
`protected_geometry` field. Independently source-owned provider content can
still use the same literal spelling as a local header. These definitions are
current-only: no legacy reader, converter, alias, or migration path is
declared here.

## Repair Guidance

A field is constrained only when it declares `rule`. Every such field carries
`on_violation.means`, `on_violation.ask`, and `on_violation.never`. Those three
strings are written for a Deck Author: they explain the content decision at
hand without naming a source field or schema file. They are collaboration
context, not an authorization, diagnostic, state mutation, record, or gate.

An omitted value that intentionally normalizes declares `default` in the stage
definition. The declaration does not itself apply that default or project
Repair Guidance; those remain responsibilities of their existing runtime owner.

## Verification

[`tests/contracts/test_page_image_schema_definitions.mjs`](../../tests/contracts/test_page_image_schema_definitions.mjs)
is the verification owner for this definition home. It checks the exact stage
set, every current owner, field Repair Guidance, serialization declarations,
and the declared `standard` Page Class defaults. Run it as a targeted test
sweep after changing these YAML definitions.

The test does not grant a source mutation, a provider submission, or a delivery
action.
