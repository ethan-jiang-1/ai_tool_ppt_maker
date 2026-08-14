## Context

See `proposal.md` for motivation and the delta specs for the observable
contracts. Change 1 made `openspec/config.yaml` an exact projection of current
main specs and public owners. Its current registry still contains
`html-slide-rendering`, whose main spec records no active route, while active
requirements and guidance retain a retired protocol vocabulary. The existing
inspection evaluator already supplies the intended owner-issued result for an
unsupported source marker, but state and CLI consumer projections have not yet
converged on that result.

The direct sources of truth are deliberately already narrow:

```text
source marker + state marker + directly bound evidence
                         |
                         v
          existing production-protocol inspection evaluator
                         |
                         v
  one hard-stop / one owner action / no dependent route selection
```

`production_marker.mjs` accepts only the declared current pipeline and the
selected `framed|pure` workflow.  `inspectWorkflow()` already creates the
authoritative invalid-current-contract projection, while Controller guidance,
CLI diagnostics, and reference material are consumers.  This change converges
those consumers; it does not make them validators.

`vN` has two distinct meanings today.  A `3_versions/vN/` directory is a
current Work Version identifier and continues to be read/written by the
run-bundle owner.  A historical production protocol called `v2` is not current
and has no reader, writer, recovery, or data-migration path.  The distinction
is semantic, not a broad token allowlist.

## Goals / Non-Goals

**Goals:**

- leave one active production protocol, one invalid-protocol owner, and one
  action taxonomy across specifications, code, guidance, CLI, and tests;
- retire the empty capability through OpenSpec while preserving the existing
  private Framed runtime and Page Image owners;
- prove the boundary remains byte-preserving and provider-free, and that a
  planted active-surface regression is detectable;
- preserve legitimate structural version notation without making it a
  protocol-compatible exception.

**Non-Goals:**

- scanning, reading, editing, migrating, deleting, or repairing `deck_*`,
  `dpt_*`, `_generated/`, or any production Run Bundle;
- a compatibility reader, marker parser, converter, exporter, alias, fallback,
  migration, reset command, historical fixture translation, or new recovery
  command;
- changing the current `page-image-workflow`, `framed|pure` selection,
  existing state protocol, delivery semantics, provider behavior, or public
  command inventory;
- deleting the private Framed browser/font/compositor runtime or treating it as
  a resurrected whole-deck renderer;
- the later removal of the workflow-inspection baseline reference or competing
  agent routing surfaces, except for the one conflicting recovery row that
  must converge now.

## Decisions

### 1. Reuse `production-protocol` as the single invalid-contract authority

The existing inspection evaluator remains the fact authority for whether an
exact source/state/evidence tuple is declared current. Direct finalization and
delivery validators retain authority for the final-manifest, delivery-media,
assembly-receipt, and notes-receipt records they consume, but project the same
material recovery record when those direct facts cannot establish current
protocol identity:

| Field | Current value | Owner |
| --- | --- | --- |
| posture | `hard-stop` | `human-centered-gates.md` classification, emitted by inspection |
| protected invariant | exact, attributable current production identity and bytes | `production-protocol` |
| root cause | `current-protocol-invalid` | `production-protocol` |
| action | `repair-current-protocol-identity` | `production-protocol` |
| action kind | `repair` | action producer |
| human decision | not required | existing Task Mandate/control policy |

That shared result is intentionally narrower than every current repair-like
outcome. Direct facts select the owner before a consumer projects an action:

| Direct facts | Required owner/outcome |
| --- | --- |
| The exact local Harness locator/binding is missing or undeclared | existing Harness-binding owner |
| A present record is foreign, unreadable, incomplete, or cross-lineage, so exact current protocol identity cannot be established | `production-protocol` / `current-protocol-invalid` hard-stop |
| The target is a declared fresh authoring draft with no production identity yet | existing narrative/workflow-selection owner |
| A state establishes declared-current protocol identity but has a state-owned defect | existing state owner; only a provably one-to-one, fence-clear repair may write |
| The requested Work Version differs from the exact active execution version | existing execution-version owner |
| An attributable current delivery lineage lacks or has drift in rebuildable derived output | existing delivery rebuild owner |

Controllers, `COMMANDS.md`, CLI diagnostics, state observation, finalization,
PPTX assembly, and notes delivery consume this record or fail before their own
work. Direct finalization/delivery owners expose one typed
`current_protocol_invalid` cause when the `production-protocol` row applies; the
existing CLI producer projects the canonical owner/action fields. They do not
duplicate the action schema, invent `unsupported-protocol/export`, replace one
of the other current owners above, or construct another workflow. The runtime
owns the direct fact and diagnostic projection; MD owns the presentation of
that owner-issued action; no consumer owns protocol adoption.

This is a `hard-stop` under `human-centered-gates.md`, because identity,
integrity, recoverability, and attributable current lineage cannot be
established. There is no `guide` or `confirm` outcome, waiver, force flag, or
human reason that can cross it. Under `agent-assistance-and-control.md`, the
Agent may continue legal read-only diagnosis, repair through the existing
owner, and rerun the same checkpoint. Under `simple-reliable-control.md`, the
loop is the existing shortest one: direct facts -> existing evaluator -> first
root cause -> owner repair -> same evaluator.

Alternative considered: retain the old `export` action as a general escape
hatch. Rejected because it names a non-existent production route and creates a
second recovery taxonomy. Alternative: have each consumer report its own local
repair action. Rejected because it duplicates a source/state/evidence decision
outside the direct evaluator.

### 2. Keep state recovery bounded and byte-preserving

When a present record cannot establish exact current protocol identity, no
current writer is admitted. `inspectWorkflow`, `status`, `state --json`,
`state --validate-state`, and all dependent route selectors stop before
state/history/journal/task-projection/generated-artifact writes or provider
initialization. This boundary does not absorb an exact Harness binding failure,
a declared fresh authoring draft, a state-owned defect after current identity is
established, an exact requested/active Work Version mismatch, or an attributable
current delivery rebuild. Existing owner-authorized canonicalization remains
available only for a verified declared-current record with a one-to-one repair
and no fence; this change does not broaden it.

The terminal invariant is that the original source/state/evidence/delivery bytes
remain identical until a sanctioned current owner can establish valid current
identity. Completion evidence is a rerun of the same owning direct checkpoint
that returns a current owner action or lifecycle result. No recovery record is
persisted merely to explain the hard-stop.

Alternative considered: initialize a fresh state or replace an invalid marker
from directory topology. Rejected because a version path does not prove source,
state, evidence, or ownership identity and would violate the protected bytes.

### 3. Retire the HTML deck-rendering capability, retain the private runtime

`html-slide-rendering` has no current requirements and is an active registry
tombstone. The change declares `retire_capabilities: true`, supplies the
required `REMOVED Requirements` reason/migration record, and retires the
capability during apply in one bounded cutover. First the implementation verifies
that all retained Framed browser/font/compositor behavior has current owners in
`html-render-runtime`, `harness-script-layout`, and the selected Page Image
finalization contract. It then runs the sanctioned spec-sync workflow narrowed
to `html-slide-rendering`; removal of its final requirement must delete the main
spec and directory under the retirement rules. Immediately afterward apply
removes the exact `openspec/config.yaml` registry row and runs the authority-map
check. The main spec is never deleted by hand, and the registry row is not
allowed to remain until final archive.

The public or persisted surface being removed is the main-spec navigation entry
only: it had no command, parser, writer, runtime adapter, or run-bundle
contract. The cutover is a clean deletion because the current owner surfaces
and their consumers are explicit. Archive records preserve historical evidence;
the active registry remains bijective after removal. Final archive compares the
delta to the post-sync main-spec set, observes this retirement as already
synced, and moves the change record without attempting a second deletion.

Alternative considered: leave the tombstone spec so future Agents know it was
removed. Rejected because archives already preserve that evidence and the
active registry is for current authority only.

### 4. Delete unreachable public shadows rather than preserve rejected names

The `refresh` parser accepts only `title`, `visual`, and `notes`; its
`reset-html-production` branch cannot be reached by public input. Apply removes
that branch and wording instead of preserving a rejection-only alias. The same
rule applies to retired action labels and fixtures: adapt generic invalid
current-shaped test input or delete the historical fixture; never convert it to
exercise a compatibility implementation.

Alternative considered: keep rejected names to explain the old route. Rejected
because executable code and prompts are active discovery surfaces, not archive
notes.

### 5. Add one provider-free residue guard with a semantic structural-version boundary

`production-schema-conformance` owns the active-surface scan because it already
defines current serialization consumers and runs only in repository
verification. Implementation adds a pure evaluator input for scanned
occurrences or a similarly bounded pure seam to the existing architecture
contract; the repository adapter enumerates only declared active roots:
`ppt_maker_harness/`, `tests/`, `tests_e2e/`, `openspec/specs/`, and the one
OpenSpec maintenance-context file `openspec/config.yaml`. It excludes all
`openspec/changes/` content (both active and archived), `_backlog/`, `deck_*`,
`dpt_*`, and `_generated/` by construction. Change artifacts document the
retired terms being removed and are not active operational authority, so they
cannot be an input to this control.

The repository adapter enumerates every regular file under those roots and
classifies a closed active-text set (`.mjs`, `.md`, `.json`, `.yaml`, `.css`,
`.html`, and `.txt`) for content scanning. Checked-in `.woff2` font assets are
known binary inputs and are enumerated but never decoded as text. Any other file
extension in a declared root is an unclassified coverage failure until it is
explicitly admitted as text or binary; a new prompt/template surface therefore
cannot silently escape the guard.

The guard detects three semantic categories:

1. a numeric `vN` identity coupled to a production source, state, receipt, plan,
   evidence, route, adapter, candidate, or acceptance role;
2. the retired compound invalid-protocol action or the competing phrase
   `repair or export`; and
3. an affirmative claim that invalid protocol identity is read, migrated,
   converted, adopted, exported, or handled through fallback.

It reports the exact path and bounded category. JavaScript `export` syntax,
unrelated-domain compatibility language, normative specification text that
defines or forbids a residue category, structural Work Version notation, and
exact execution-version mismatch coverage are not violations. This is a semantic
occurrence classification, not a global ban on `v2`, `export`, `migration`, or
`compatibility`. The guard does not parse Run Bundles, call a provider, write a
file, or become production startup behavior.

The implementation represents the classification in a small explicit
occurrence category or owner-root predicate. A numeric literal attached to one
of the production roles above remains a violation regardless of its spelling;
an ordinary `3_versions/vN/` path or exact requested/active execution mismatch
remains owned by the Work Version contract.

Focused negative controls construct retired literals from neutral fragments and
plant each forbidden category in a supplied synthetic snapshot or temporary
active-surface text. This keeps the guard's own test source free of an
affirmative retired claim and avoids a scanner exception for the test. The controls assert
failure, exact issue location, no mutation, no provider call, and a passing rerun
after restoration. Focused positive controls retain representative
`3_versions/v2` creation and execution-version mismatch cases. This satisfies
the Keel guard condition: known planted violations fail, restoring the exact
input passes, and no file can silently escape a declared scan root.

Alternative considered: a broad global `v2` ban. Rejected because it breaks the
current structural versioning contract. Alternative: no automatic guard, just a
final search. Rejected because the program requires a falsifiable, repeatable
drift control.

### 6. Test at the bounded surfaces that own risk

| Layer | Scope | Required proof |
| --- | --- | --- |
| Unit/integration | inspection, marker/state/CLI, finalization, assembly, notes, conformance evaluator | one generic hard-stop with action kind `repair`; typed consumer cause; prerequisite short-circuit; unchanged bytes; no provider call; fresh draft, state repair, execution mismatch, and current delivery drift retain their owners; restored valid input passes |
| Mock E2E | existing temporary-bundle invalid marker/state journeys | `status`/`state` emit the current diagnostic and no source/state/history/task-projection/generated mutation occurs; stale route/action expectations are removed |
| Repository contract | architecture/coherence and conformance scans | active registry stays bijective after capability retirement; planted residue fails; valid structural `vN` remains accepted |

No real-provider E2E is needed: the changed paths must terminate before provider
initialization, and tests can prove that directly with existing fetch/process
spies and temporary bundles. No production Run Bundle is a test fixture.

## Risks / Trade-offs

- [A regex guard mistakes a structural Work Version for protocol residue] ->
  classify each occurrence by its owning root/contract context and retain
  focused structural-version positives.
- [A broad prose cleanup removes current Framed runtime documentation] ->
  delete only whole-deck historical protocol language; preserve
  `html-render-runtime` and its explicit private header-overlay ownership.
- [Capability sync temporarily leaves a stale registry row] -> keep retirement
  as one bounded apply task: sanctioned capability-scoped sync, immediate exact
  registry-row removal, then Change 1's bijection guard and a planted
  missing/extra-capability control.
- [Consumers drift back to divergent recovery wording] -> make the conformance
  scan test the action vocabulary and run it with the normal repository checks.
- [A byte-preservation test overlooks a dependent write] -> snapshot the whole
  temporary bundle tree and spy on provider entry points before the direct
  inspection/CLI action; verify the same checkpoint after repair.

## Migration Plan

1. Add/adjust focused negative and positive controls first, including the
   action-kind mismatch, CLI/process zero-write checks, structural `vN` cases,
   and planted residue cases.
2. Converge the existing runtime consumer projections, active specs, guidance,
   tests, and unreachable CLI branch on the one owner-issued contract; delete
   historical fixtures/aliases instead of translating them.
3. Verify retained Framed runtime ownership; run sanctioned spec sync narrowed
   to `html-slide-rendering` and require it to delete the main capability; then
   immediately remove the exact registry row and verify registry/spec bijection.
4. Run the focused unit/integration and mock E2E tests that establish owner
   boundaries, zero writes, zero provider calls, and guard sensitivity.
5. Sync every remaining accepted delta, verify the capability retirement is
   already synchronized, then run the provider-free residue scan, scoped
   searches, `npm test`, `npm run test:sweep`, strict OpenSpec validation, and
   `git diff --check` against the synchronized active surface.
6. Archive only after all deltas compare as already synchronized, repeat strict
   all-spec validation, commit exact intended paths, fast-forward push normally,
   and reconcile `HEAD`, local `master`, `origin/master`, and remote `master`.

There is no production-data migration or rollback operation. Before push an
ordinary edit corrects the working tree; after push a new forward-fix commit is
the only recovery. No reset, rebase, force push, or history rewrite is part of
this change.
