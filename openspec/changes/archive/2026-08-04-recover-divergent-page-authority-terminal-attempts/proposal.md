## Why

The Page Authority raw owner correctly rejects a branched immutable attempt
history, but one real v7 record contains a redundant pair of terminal children
for the same submitted attempt: one `known_failure` and one `unknown`. The
global validator rejects that one historical branch before it can expose the
otherwise legal reconciliation action for a newer submitted attempt, leaving
the run permanently blocked without a sanctioned repair path.

## What Changes

- Teach the existing progressive raw direct-record evaluator to derive one
  effective terminal outcome from one narrowly defined redundant terminal
  branch: a shared submitted parent with exactly one child `known_failure` and
  one child `unknown`, neither of which has a child of its own.
- Retain every immutable attempt record unchanged; treat the validated
  `known_failure` child as the effective terminal record and exclude the
  redundant `unknown` child from current-progress, grant-consumption, and live
  claim derivation.
- Preserve the current hard-stop for every other branched, cyclic, foreign,
  nonterminal, or success-conflicting attempt shape. Do not add a repair CLI,
  retry, provider lookup, data migration, or durable normalization record.
- Add focused raw-owner and workflow-inspection regressions for the accepted
  redundant-terminal shape and for a rejected near-miss branch.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `image-generation`: Progressive Page Authority evaluation must recover a
  single effective terminal outcome from the narrowly validated redundant
  `known_failure` plus `unknown` history shape while remaining strict for all
  other attempt branches.

## Impact

- **Framework source:**
  `PPTMAKER_FRAMEWORK/scripts/shared/image2/page_authority_progressive_raw_owner.mjs`.
- **Tests:** focused progressive raw-owner and workflow-inspection seams.
- **Control owner:** JS remains the sole evaluator of immutable attempt facts;
  the Agent resumes only the action it already issues after that evaluation.
- **Gates:** the recognized historical shape is a deterministic `guide` inside
  the owner; every unrecognized divergent history remains an integrity
  `hard-stop` under `human-centered-gates.md`, with no waiver or force route.
- **Control path:** per `agent-assistance-and-control.md` and
  `simple-reliable-control.md`, this removes a false global block by reusing
  the one direct evaluator. It creates no second repair controller, status
  store, retry policy, or user-operated recovery step.
- **Run-bundle contract:** compatible. Existing attempts, grants, evidence,
  receipts, and generated files are neither rewritten nor migrated. The owner
  only derives an effective terminal projection from records it already owns.
