## Context

See [proposal.md](proposal.md) for motivation and
[production-schema-conformance](specs/production-schema-conformance/spec.md)
for the required behavior. C1 made `schema/stages/*.yaml` and
`frozen-identifiers.yaml` authoritative for conceptual vocabulary and the
bounded frozen set, but deliberately did not change executable code.

Current static ownership checks already live in
`scripts/contracts/harness_architecture.mjs`; its source/test owner is recorded
in `tests/contracts/source-test-ownership-v1.json`. Existing Page Image runtime
owners already read and validate historical identity values through their own
record and identity paths. C2 must strengthen the relationship to C1 without
making a schema parser into a production lifecycle dependency.

## Goals / Non-Goals

**Goals:**

- Make every schema-shaped Page Image implementation identifier inspectable as
  a stage mirror, a C1 frozen entry, or an intentional non-schema detail.
- Keep C1 YAML as the vocabulary and preservation authority while making drift
  fail before a changed source can be relied on.
- Keep historical evidence readable and preserve existing producer-owned repair
  paths in Deck Author terms.

**Non-Goals:**

- Parsing YAML at every production CLI entry, adding a lifecycle gate, or
  creating a second controller, record, state field, CLI envelope, or provider
  request format.
- Rewriting source, state, records, `_generated/` artifacts, or any Run Bundle.
- Implementing C3-C5 planned stage producers, including Page Class validation
  and its `standard` default before C4 owns that behavior.

## Decisions

### One checked-in mirror inventory complements, but does not compete with, C1

C2 will add a checked-in implementation-mirror inventory beside the C1 schema
home. It will classify each discovered schema-shaped identifier as:

1. a stage mirror with one `stage_ref` and one or more code anchors;
2. a frozen reference pointing to `frozen-identifiers.yaml`; or
3. a documented non-schema implementation detail.

The C1 stage files and frozen inventory remain authoritative for the meaning,
default, Repair Guidance, and preservation policy. The new inventory records
only where code mirrors that authority. It is manually reviewed source data,
not generated output and not a runtime source of record.

Alternative considered: infer all mappings from imports or string literals at
test time. Rejected because source scans cannot determine semantic intent or
distinguish a frozen record identity from a non-schema implementation detail.

### Extend the existing architecture contract, not a new runtime validator

JS owns deterministic source conformance. The C2 test will extend the existing
`harness_architecture.mjs` contract and its contracts test owner to load the
C1 definitions and mirror inventory, scan the bounded Page Image source set,
and fail on an unclassified identifier, missing stage/frozen reference, or
missing anchor. It will use the existing `yaml` dependency in an opt-in
contracts sweep rather than the dependency-restricted core inventory.

Production owners retain their current exact constants and record/identity
evaluators. A frozen-name mismatch is prevented by conformance coverage before
release; existing owner checks continue to hard-stop unsafe identity or record
use before dependent mutation or provider work. This avoids a new startup
gate, repeated YAML parsing, duplicate state, and a separate failure envelope.

Alternative considered: load YAML from every production path and dynamically
validate it before each action. Rejected because it would create a second
control path and introduce a new availability failure unrelated to the owning
record or identity fact.

### Preserve frozen evidence through owner-specific tests

The C2 inventory will refer to C1 frozen entries rather than repeat their read
or write policies. Tests will cover a representative existing-record fixture
for byte-preserving validation and deliberate frozen-literal drift. No test may
rewrite a real Run Bundle. The final C2 checkpoint can validate an owner-chosen
existing production record only after the owner names that bundle and record;
until then, checked-in focused fixtures establish the repository boundary.

Alternative considered: scan a `deck_*` directory to discover a record during
test execution. Rejected because production data is not a Harness fixture and
an unscoped scan violates the Run Bundle ownership boundary.

### Project guidance only where a current producer exists

For a materialized C1 stage, its current JS owner consumes declared defaults
and Repair Guidance through the existing validation and `next_action` handoff.
The resulting author-facing recovery is a `guide`: it names the one next
content decision without adding a confirmation record, approval, or state
mutation. Identity, integrity, and evidence-preservation failures remain their
existing non-bypassable `hard-stop` with the current owner-issued recovery.

For a planned C3-C5 stage, C2 preserves the definition and explicitly verifies
that no runtime projection is claimed. C3/C4 will make those defaults and
guidance executable once their named producer exists. This keeps the shortest
correct loop: direct owning fact -> existing evaluator -> one nearest action ->
same-check rerun.

Alternative considered: implement Page Class solely to exercise C1's
`standard` default. Rejected because it would prematurely build C4 behavior
and hide a source/layout change inside a conformance change.

### Verification follows ownership and blast radius

- Unit/contract: add targeted source and YAML conformance tests for complete
  classification, missing anchors, frozen drift, materialized guidance/default
  projection, and the planned-stage boundary.
- Integration: retain and extend the existing owner tests for affected record
  and identity evaluators; validate a byte-preserving fixture through the real
  owner path.
- E2E: not selected. C2 adds no command, public journey, provider interaction,
  Run Bundle format, or state transition.

## Risks / Trade-offs

- [The identifier scan over-classifies incidental `-vN` strings] -> First
  produce and review the complete inventory; each exception must be explicit
  rather than silently filtered.
- [A mapping becomes a second conceptual vocabulary] -> The inventory can only
  reference C1 stage names and frozen entries; the contracts test rejects a
  locally invented stage or policy.
- [A planned-stage rule is advertised as currently enforced] -> Require a
  producer-status boundary in the inventory and negative coverage for planned
  Page Class behavior.
- [A frozen literal change breaks paid evidence] -> Preserve exact literals,
  use owner fixtures, and require a named production record only for final
  checkpoint evidence.
- [Author text leaks implementation terminology] -> Test the newly projected
  owner messages for schema filenames and source field names; retain the
  existing producer-owned envelope and one-next-action limit.

## Migration Plan

1. Re-derive the source identifier inventory without reading or mutating a Run
   Bundle, classify it, and review the proposed mirror inventory.
2. Add source anchors and focused contract coverage before changing non-frozen
   mirrors; prove deliberate stage, anchor, and frozen drift fails.
3. Align only classified non-frozen code mirrors and materialized owner
   projections, then run affected owner tests, the contracts sweep, and the
   core verification inventory.
4. Obtain a named existing record for the final compatibility checkpoint;
   validate it through its owner without writing it. Rollback is a source
   revert: no record migration, provider work, or generated-artifact repair is
   needed.

## Open Questions

- Which owner-designated existing production record will supply final C2
  compatibility evidence? This does not affect the source-only implementation
  path; it must be named before Checkpoint 2, not discovered by a deck scan.
