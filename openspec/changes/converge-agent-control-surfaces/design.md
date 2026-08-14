## Context

See [proposal.md](proposal.md) for motivation and the delta specs for behavior.
The post-Change-2 active surface has the following verified drift:

- `reference/agent-prompts.md`,
  `reference/workflow-inspection-baseline.md`, and
  `reference/workflow-inspection-ledger.md` have no inbound active filename
  reference. The last two repeat direct-fact and zero-write assertions already
  owned by `workflow-inspection`; the checked-in contract ledger remains a
  non-runtime test input with a live test consumer.
- `intent-routes.json` is read only by its own static reader and contract test.
  It is not an entry path used by the CLI or a Controller.
- `production_mode` has exactly one allowable value. Its `mode` field and all
  Controller mode declarations are fixed-value projections. Its `workflow` and
  `source_epoch` fields, however, establish an exact state/source agreement and
  invalidate state-owned evidence across invocations.
- Controller YAML rejects duplicate keys but accepts any other unconsumed key.
  This makes a misspelled or retired control field silent rather than failing at
  its declaration boundary.

The implementation must remain inside Harness maintenance source roots. No
production Run Bundle, research input, or generated output is read, converted,
or migrated.

## Goals / Non-Goals

**Goals:**

- Leave one reachable, attributable Agent control model: COMMANDS and MD
  Controllers for intent, JS for deterministic source/state checks, and direct
  owner actions for mutation.
- Replace the fixed singleton mode dialect with the smallest state identity
  fence that preserves exact workflow agreement and source invalidation.
- Make malformed Controller metadata fail where it is declared, and prove that
  deleted control surfaces cannot return through an unguarded active root.

**Non-Goals:**

- No new Controller, CLI command, lifecycle state machine, human confirmation,
  provider operation, recovery action, compatibility reader, or migration.
- No change to Page Image workflow choices, the existing source/state identity
  hard-stop classification, or the retained machine-only workflow control
  ledger's non-runtime role.
- No repair, conversion, validation sweep, or deletion against existing run
  bundle bytes.

## Decisions

### 1. Retire unconsumed routing and prose projections

**Owner:** MD guidance owns intent routing; `workflow-inspection` owns
read-only workflow facts; the machine ledger is test-only evidence.

Delete the prompt cookbook, both duplicate inspection prose files, the Intent
Route Catalog JSON/reader/schema declaration/test, and every active reference
to them. Transfer the baseline's zero-write/direct-owner assertions to the
existing inspection specification and focused inspection checks; retain the
JSON workflow control ledger only as a test fixture because its source test is
an explicit live consumer and it neither routes work nor runs in production.

`COMMANDS.md` becomes the concise human entry and names the current Controller
or direct CLI owner. The Controller receives an exact-run resume through
inspection and an explicit change through `classify-change`; it does not need a
pre-routing registry.

The alternative, retaining a smaller catalog, is rejected: a static discovery
reader with no production caller would still be a competing authority with no
unique invariant. Moving it into the controller manifest is also rejected
because the manifest owns registered Controller inventory, not natural-language
intent interpretation.

### 2. Close Controller metadata at the parser boundary

**Owner:** MD Controller files own declarations; the JS reader owns parsing and
deterministic validation. The manifest remains the normative registry but does
not define a second node grammar.

Validate exact key sets before node normalization:

| Declaration | Allowed keys |
| --- | --- |
| Controller frontmatter | `playbook`, `description`, `supported_pipelines`, `includes` |
| Shared-node frontmatter | node keys plus literal `shared: true` |
| Fenced node | `node`, `method_module`, `requires`, `entry`, `exit`, `produces`, `decisions`, `production_workflows`, `adapter`, `draft_route` |

`production_modes`, `supported_production_modes`, `phase`,
`lifecycle_phase`, and `mode_transition_handoff` are retired instead of being
silently tolerated. The current source selects `framed|pure`; nodes therefore
filter by `production_workflows` only. The reader reports the exact file, line,
and unsupported key before it can build an index, draft route, resume card, or
diagnostic projection.

The alternative, allowing unknown keys for forward compatibility, is rejected:
this program intentionally optimizes for a current-only Agent environment, and
an undeclared key is a direct routing ambiguity. Duplicate-key rejection remains
the YAML parser's existing exact check; no second duplicate detector is added.

### 3. Collapse `production_mode` into production identity

**Owner and authority:** source frontmatter owns
`production.pipeline` and `production.workflow`; State owns
`production_identity.by_version[3_versions/vN]` after an exact current source
is accepted. The record has exactly `{ workflow, source_epoch }`. State
transitions are the only writers; workflow inspection, Controller eligibility,
and CLI status/state are readers. `source_epoch` is the state-owned freshness
fence for task, authorization, review, finalization, and delivery evidence.

Replace the single-purpose `production_mode` evaluator with a
`production_identity` evaluator that validates an exact version key, record
shape, current source marker, and workflow agreement. It returns the selected
workflow and source epoch, not a fixed mode or policy object. Shared code
derives the one Page Image pipeline and adapter from the current source contract
rather than re-encoding them in Controller metadata or state.

Fresh authoring state remains intentionally unbound: it has the current
pipeline draft but no identity record until a human selects a source workflow
and the State owner accepts it. A new structural target likewise has no target
identity until its source is accepted. For a current version, source replacement
advances `source_epoch` only through the existing State mutation/CAS route and
invalidates only the state-owned evidence already fenced by that epoch.

The alternative of deleting the whole record is rejected: a source-only model
cannot preserve the cross-invocation invalidation epoch or distinguish state
evidence bound to a former accepted source. Retaining `production_mode` is
rejected because its mode value is a non-branching duplicate. Renaming just the
field while retaining `{ mode, workflow, source_epoch }` is rejected because it
does not reduce the fixed-value dialect.

This is a clean cutover. State bytes carrying `production_mode` are not read as
current, migrated, or repaired automatically; they meet the existing
byte-preserving identity hard-stop. The nearest legal recovery remains the
owner-issued repair action and same-check rerun. This is an integrity
`hard-stop`, not a `guide` or `confirm`; there is no force/waive path and no new
human choice. Legal deterministic diagnosis remains Agent-owned under the
existing Task Mandate.

### 4. Use one bounded active-surface guard

**Owner:** the production-schema conformance architecture test owns static
repository verification; runtime owners retain runtime validation.

Extend the existing provider-free evaluator with a named Change-3 control
surface inventory. It enumerates only the current Harness source, unit tests,
E2E tests, main specs, and OpenSpec configuration. It reports the exact file
and residue category for a retired prompt/route surface, metadata key, or mode
dialect. Its exceptions remain shrink-only and structurally grounded; active
change artifacts, archives, Backlog material, Run Bundles, research inputs, and
generated outputs remain out of scope.

The negative controls use supplied synthetic or temporary roots: plant an
orphan catalog/prompt file, a stale Controller field, and an old state record;
assert a bounded failure and then restore the input. They must prove zero
repository mutation and zero provider access. This reuses a static verification
seam rather than adding a startup gate, checker chain, or recovery controller.

### 5. Verification layers

| Layer | Required evidence |
| --- | --- |
| Unit | Identity evaluator/state writer-reader behavior; strict Controller grammar; deleted-reader absence and planted invalid metadata/state controls. |
| Integration | Current init, workflow selection, structural target, status/state projection, and direct CLI hard-stop preserve selected workflow plus epoch without a mode field. |
| E2E | Existing mocked lifecycle/inactive-state suite proves the clean current identity still fences writes and never triggers provider work on invalid input. |
| Repository | Reachability/residue scan, strict OpenSpec validation, `npm test`, `npm run test:sweep`, and `git diff --check`. |

## Risks / Trade-offs

- [Clean break rejects existing `production_mode` bytes] -> This is intentional:
  no production data is touched, and the existing identity hard-stop preserves
  bytes and gives the one owner-issued repair action.
- [Strict grammar exposes previously ignored metadata] -> It fails before route
  output with the exact declaration location; the active Controller inventory
  is validated before commit and has planted unknown-key coverage.
- [Deletion could remove a unique useful sentence] -> Compare each retired
  prose invariant with main specs and the live machine ledger before deletion;
  preserve a missing invariant in its owner rather than retaining a projection.
- [Broad lexical guard could flag history] -> The evaluator's fixed active root
  inventory excludes archives, active changes, Backlog history, production data,
  research data, and generated outputs; tests prove scope and exact categories.

## Migration Plan

1. Implement and verify the cutover entirely in Harness source and synthetic
   test fixtures; do not open or alter a production Run Bundle.
2. Create only the new `production_identity` shape in newly initialized or
   accepted current state. Old mode-shaped bytes always take the existing
   non-writing identity hard-stop; no heal, dual reader, or conversion exists.
3. Before archive, run the focused and full verification matrix, inspect
   residue results, and synchronize accepted delta specs.
4. Rollback before commit means reverting the source change as one unit. After
   the clean-break release there is deliberately no runtime rollback/migration
   mechanism; restoring an older Harness is an explicit maintainer decision,
   not an automatic reader path.

## Open Questions

None. The user-directed no-compatibility constraint and the direct consumer
inventory make the deletion and identity outcome determinate.
