## Context

The framework currently has two Page Authority protocol graphs. The v2 graph is
the intended authoring and delivery graph; the exact v1 graph was intentionally
quarantined beneath `compatibility/current-v1-page-authority` during the prior
cleanup. Quarantine stopped target-to-v1 contamination, but it did not remove
the v1 parser, state, controller, inspection, structural, finalization,
documentation, test, and main-spec branches that a coding agent can still
discover.

This is therefore a protocol retirement and semantic absorption change, not a
directory cleanup. It touches MD controller intent/routing, JS deterministic
protocol classification, source/state/evidence contracts, and generated-output
publication. Framework source remains limited to `PPTMAKER_FRAMEWORK/`,
`openspec/`, `tests/`, and `tests_e2e/`; production `deck_*`, `dpt_*`, and
`_generated/` content is neither input nor fixture unless a later user-approved
operator migration explicitly names it.

## Goals / Non-Goals

**Goals:**

- Absorb every v1 behavior that is still a business invariant into a named v2
  or shared owner, and classify the remainder as one-off migration or deletion.
- Leave one current workflow graph in executable code, documentation, tests,
  inventories, and main specs: `03-framed-image XOR 04-pure-image ->
  05-delivery -> 06-iteration`.
- Treat a retired v1 source/state pair as a read-only, fail-closed
  migration-or-export hard-stop. Normal status/state observation, target work,
  and public workflow execution must neither initialize v1 state nor import a
  v1 writer.
- Make any needed migration preview-first and exact-plan-bound; preserve the
  source v1 bundle and create a distinct v2 target only after human
  confirmation.
- Delete active compatibility paths and remove their historical language from
  main specs after the migration window has closed.

**Non-Goals:**

- Do not silently rewrite, scan, or batch-migrate user production data.
- Do not retain a permanent `compatibility/` runtime, CLI fallback, or second
  controller solely to ease retirement.
- Do not loosen source/state identity, byte, evidence, authorization, or
  structural-plan invariants.
- Do not decide the project version or release policy in implementation; the
  separately authorized H.10 decision is a prerequisite for applying this
  breaking removal.

## Decisions

### 1. Use an absorb-or-delete matrix before removing code

For every v1 branch, classify its behavior as one of: (a) a v2 owner invariant,
(b) a shared invariant, (c) a one-off migration operation, or (d) deletion.
The matrix names the existing source of record, absorbing owner, direct tests,
and deletion target. No unclassified call site may be deleted or retained.

This is owned jointly by MD for semantic intent/routing and JS for deterministic
source/state/evidence facts. It avoids a superficial rename that preserves a
hidden second graph. An alternative—delete all v1 files first and repair
regressions—was rejected because it cannot demonstrate which evidence and
structural invariants were actually inherited.

### 2. A retirement result has one direct, non-mutating control path

The source marker and state are the direct facts. The existing marker-first
classifier/evaluator will recognize v2 or retired/unsupported input; it will
not dispatch to a v1 lifecycle evaluator. An exact retired pair receives one
owner-issued `hard-stop` whose nearest action is the explicitly configured
migration preview or export. A hybrid/corrupt pair remains a hard-stop for its
identity invariant.

`hard-stop` is required by `human-centered-gates`: a retired pair cannot be
waived because identity, provenance, and recovery are uncertain. A migration
preview is a read-only `guide`; materialization is `confirm`, records a human
reason and exact plan identity, and creates a v2 target only. The normal
controller, status projection, and target adapters never treat either result
as authorization to write. This reuses the direct protocol evaluator and
removes the v1 fallback instead of adding a third control path, as required by
`agent-assistance-and-control` and `simple-reliable-control`.

### 3. Migration is a sunset operator artifact, not a current framework route

If the absorption matrix finds production inputs needing conversion, a
versioned migration deliverable will first preview a named source, exact
target, and plan hash. The Agent performs deterministic preparation after the
user chooses that named migration; only the user confirms materialization.
The original bundle remains immutable, and failures are repaired by rerunning
the same preview or terminalized for export.

The artifact has an explicit support deadline. After the migration window it,
its tests, and any legacy decoder leave active framework roots; archived change
evidence remains the historical record. The alternative—a permanent `migrate`
subcommand in `ppt_flow`—was rejected because it makes the retired protocol a
long-lived Agent-visible workflow.

### 4. Main specs are current contracts, not a legacy encyclopedia

Every main-spec occurrence is classified with the same matrix. A requirement
that only supports v1 is removed with a reason and migration note. A
requirement that also owns v2 behavior is replaced in full with a v2/shared
requirement and all still-valid scenarios. Historical contracts remain in the
archived change, not in `openspec/specs/` as an exception or explanatory
dependency.

This keeps the implementation, tests, and specifications on one graph. The
alternative—leave compatibility prose for context—was rejected because it is
exactly the coding-agent noise this change retires.

### 5. Verification proves absence as well as retained behavior

Unit tests cover parser/state/inspection/structural rejection and v2 invariant
absorption. Process tests prove ordinary observation makes zero writes and has
one bounded next action for retired or hybrid input. E2E proves valid v2
Framed/Pure journeys remain complete and a named migration preview (if needed)
does not mutate its source. Architecture, link, directory, ownership, and
main-spec audits fail if a compatibility path, v1 import, writer, receipt,
classifier, or current-route language reappears.

## Risks / Trade-offs

- **[A production v1 run needs a behavior not represented in v2]** → The
  absorb-or-delete matrix stops deletion; implement and prove a v2/shared
  invariant or explicit preview-first migration before continuing.
- **[Migration becomes a hidden permanent workflow]** → Give it a release
  deadline, isolate it from normal controller routing, and delete it with the
  retirement closeout evidence.
- **[Removing specs loses recovery information]** → Preserve full historical
  deltas/design/evidence in the archived change; main specs retain only the
  current recovery contract.
- **[A broad text audit creates false positives in archives]** → Audit active
  framework roots and `openspec/specs/` separately; archives are deliberately
  excluded from the no-legacy-noise assertion.
- **[Breaking removal is released without product authorization]** → H.10 is a
  hard apply prerequisite. Until it is recorded, this change may be proposed
  and reviewed but not implemented or released.

## Migration Plan

1. Obtain H.10 release/version authorization and freeze the retirement support
   window.
2. Produce and approve the absorption matrix using source/state contracts and
   temporary fixtures only.
3. Move retained behavior into v2/shared owners and prove it before deleting
   its v1 producer or reader.
4. If necessary, deliver a preview-first, exact-plan-bound migration artifact
   for named operator use; do not run it against production data by default.
5. Remove all v1 execution, compatibility directories, tests, controller
   routes, inventories, docs, and main-spec requirements; sync the removal
   deltas.
6. Run absence and v2 regression suites, archive the change, and delete the
   sunset migration artifact after its authorized window.

Rollback before deletion restores only source-controlled framework files from
the change commit. A named migration never overwrites its source, so a failed
or rejected migration is rolled back by discarding its unaccepted v2 target;
it is never repaired by resurrecting v1 runtime fallback.

## Open Questions

- H.10 must determine the release/version category and authorize the support
  deadline before implementation starts.
- The absorption matrix must establish whether any in-scope user data actually
  requires an operator migration artifact; no such data will be read to answer
  this question without a later explicit user scope.
