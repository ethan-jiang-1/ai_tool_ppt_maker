## Why

Page Image production concepts are currently spread across implementation constants, records, and
workflow prose. That makes the source-to-delivery data flow hard to inspect, invites inconsistent
vocabulary, and has encouraged incremental fixes before the underlying contract was written down.

The first recovery change must publish the contract without changing runtime behavior. Humans, Agents,
and later JS validation need one readable YAML definition home before code can become its mirror.

## What Changes

- Add `ppt_maker_harness/schema/` as the authoritative, non-executable definition home for the
  Page Image production vocabulary.
- Publish a `README.md`, `META.yaml`, `flow.yaml`, nineteen stage definitions, and
  `frozen-identifiers.yaml` there. Together they describe the source-to-delivery flow, ownership,
  invalidation, field constraints, defaults, provenance expectations, and historically immutable
  identifiers.
- Require every constrained field to include author-term Repair Guidance (`means`, `ask`, and
  `never`). The guidance is a Collaboration Projection for a Deck Author; it neither authorizes
  work nor changes a gate, record, state, or diagnostic.
- Define `page-render-model` and `page-generation-spec` as distinct artifacts with reciprocal
  exclusion statements so a reviewable page representation cannot be confused with a provider
  instruction.
- Preserve historical protocol, mode, identity, and record identifiers in the frozen inventory with
  a specific reason for each. New conceptual schema names have no schema-version suffix.
- Keep the initial frozen inventory deliberately bounded to the protected persisted records and
  live identity literals selected by this route. It does not claim to classify every current
  implementation identifier; C2 re-derives that broader inventory before changing code.
- Document a static schema-integrity verification for the required Repair Guidance blocks without
  adding a runtime module. Runtime constants, drift enforcement, and author-facing refusal routing
  remain the subsequent `conform-code-to-schema-definitions` change.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `harness-directory-layout`: designate the new Harness-local schema definition home and its
  authoritative boundary without changing run-bundle layout or production execution.

## Impact

- Affected Harness source: new non-executable files under `ppt_maker_harness/schema/`; this change
  deliberately does not edit `scripts/`, CLI behavior, state, or production records.
- Affected OpenSpec source: one `harness-directory-layout` delta plus this change's planning
  artifacts.
- Control owner: no runtime control path changes. The YAML contract is read by humans and Agents
  now; C2 will make JS constants and refusal projections conform to it.
- Run-bundle contract impact: `none`. No `deck_*` or `dpt_*` data is read, migrated, or used as a
  fixture.
- Dependencies and public APIs: none. The new files are documentation and data contracts only;
  they introduce no executable dependency or external surface.
- Apply readiness: blocked on the documented C1 scope conflict in `design.md`. The fixed
  `ppt_maker_harness/schema/` location currently contradicts an existing exact Harness-directory
  assertion and the route's literal no-`.mjs` rule; implementation must not begin until the owner
  resolves that boundary.
