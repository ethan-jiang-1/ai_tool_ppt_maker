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
  or shared owner, and delete the remainder.
- Leave one current workflow graph in executable code, documentation, tests,
  inventories, and main specs: `03-framed-image XOR 04-pure-image ->
  05-delivery -> 06-iteration`.
- Treat every non-v2 source/state pair as a read-only, fail-closed
  unsupported-protocol hard-stop. Normal status/state observation, target work,
  and public workflow execution must neither initialize v1 state nor import a
  v1 writer.
- Delete active compatibility paths and remove their historical language from
  main specs after the migration window has closed.

**Non-Goals:**

- Do not silently rewrite, scan, or batch-migrate user production data.
- Do not create a general-purpose or framework-resident migration tool. A later
  conversion of a user-named deck is a separately authorized deck operation.
- Do not retain a permanent `compatibility/` runtime, CLI fallback, or second
  controller solely to ease retirement.
- Do not loosen source/state identity, byte, evidence, authorization, or
  structural-plan invariants.
- Do not update version files during apply; after archive, follow
  `project-versioning` by recommending the specified 0.x breaking-change bump
  and waiting for user confirmation before changing version locations.

## Decisions

### 1. Use an absorb-or-delete matrix before removing code

For every v1 branch, classify its behavior as one of: (a) a v2 owner invariant,
(b) a shared invariant, or (c) deletion.
The matrix is checked in as
`openspec/changes/retire-current-v1-compatibility/retirement-matrix.md` before
the first deletion. Each row names the discovered source or contract reference,
its behavior, classification (`v2 owner`, `shared invariant`, or `delete`),
absorbing owner or deletion target, retained-proof owner, and the verification
command. The matrix is change evidence: it archives with this change and is not
an active framework registry. No unclassified call site may be deleted or
retained.

This is owned jointly by MD for semantic intent/routing and JS for deterministic
source/state/evidence facts. It avoids a superficial rename that preserves a
hidden second graph. An alternative—delete all v1 files first and repair
regressions—was rejected because it cannot demonstrate which evidence and
structural invariants were actually inherited.

### 2. A retirement result has one direct, non-mutating control path

The source marker and state are the direct facts. The active marker-first
classifier/evaluator recognizes only an exact v2 pair; every other pair receives
the same owner-issued `unsupported-protocol` hard-stop. It does not decode,
classify, or dispatch a v1 lifecycle. A hybrid/corrupt pair remains a hard-stop
for its identity invariant.

`hard-stop` is required by `human-centered-gates`: a non-v2 pair cannot be
waived because identity, provenance, and recovery are uncertain. The nearest
action is export or a separately authorized deck operation; the normal
controller, status projection, and target adapters never treat it as authority
to write. This reuses the direct protocol evaluator and removes the v1 fallback
instead of adding a third control path, as required by
`agent-assistance-and-control` and `simple-reliable-control`.

### 3. No unspecified production-data migration belongs in this change

The framework repository has no user-named production bundle in scope. It
therefore removes active compatibility support without creating a decoder,
preview, converter, or migration command. A non-v2 bundle remains byte-
preserving under the generic hard-stop and can be exported. If a user later
names a bundle that needs conversion, that work requires a separate
deck-scoped authorization and plan.

The alternative—a general migration tool or permanent `migrate` subcommand—was
rejected because both make the retired protocol a long-lived Agent-visible
workflow and would broaden this framework-maintenance change to production data.

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
one bounded next action for non-v2 or hybrid input. E2E proves valid v2
Framed/Pure journeys remain complete and unsupported input does not mutate its
source. Architecture, link, directory, ownership, and
main-spec audits fail if a compatibility path, v1 import, writer, receipt,
classifier, or current-route language reappears.

### 6. Retire protocol-specific specs, not unrelated historical vocabulary

The main-spec sweep covers every requirement, purpose, and cross-link that
creates a Page Authority v1/legacy-adoption execution, observer, migration, or
current ownership path. Empty retired capability specs (`header-lock`,
`html-slide-contract`, and `visual-slot-refinement`) are removed with their
last retired requirement rather than kept as negative documentation.

The sweep does not delete generic historical concepts that have an independent
current contract, such as JSON compatibility, project version history, or a
visual-language compatibility field. This boundary comes from their accepted
capability ownership, not text matching; it prevents a broad grep cleanup from
damaging still-current contracts.

## Risks / Trade-offs

- **[A production v1 run needs a behavior not represented in v2]** → The
  generic hard-stop preserves its bytes and routes to export; a user-named
  deck-scoped change, not this framework change, may later plan conversion.
- **[Removing specs loses recovery information]** → Preserve full historical
  deltas/design/evidence in the archived change; main specs retain only the
  current recovery contract.
- **[A broad text audit creates false positives in archives]** → Audit active
  framework roots and `openspec/specs/` separately; archives are deliberately
  excluded from the no-legacy-noise assertion.
- **[Breaking removal needs a version decision]** → `project-versioning`
  already classifies it as a MINOR recommendation on the 0.x line after
  archive; user confirmation remains required before version files change.

## Retirement Plan

1. Produce and approve the absorption matrix using source/state contracts and
   temporary fixtures only.
2. Move retained behavior into v2/shared owners and prove it before deleting
   its v1 producer or reader.
3. Remove all v1 execution, compatibility directories, tests, controller
   routes, inventories, docs, protocol-specific main-spec requirements, and
   empty retired capability specs; sync the removal deltas.
4. Run absence and v2 regression suites, archive the change, then recommend
   the breaking-change MINOR bump under `project-versioning` and await the
   user's confirmation before updating version files.

Rollback before deletion restores only source-controlled framework files from
the change commit. A user production bundle is never rewritten by this change;
it is never repaired by resurrecting v1 runtime fallback.

## Open Questions

None for framework apply. A future user-named production bundle conversion is
explicitly outside this change's scope.
