## Why

The current process-document audit fails because three active Pure Pilot
descriptions retain terminology from a retired production surface. The current
v2 Page Authority workflow already owns the same raw evidence; its playbook and
main specification need to describe that evidence precisely so active guidance
does not imply a second production model.

## What Changes

- Replace the three stale Pure Pilot descriptions in the `create-deck`
  playbook and `playbook-execution` main specification with current raw-page
  evidence terminology, preserving their existing workflow-local evidence and
  sibling-control boundaries.
- Add a `playbook-execution` contract that makes active Pure Pilot prose use
  current Page Authority evidence vocabulary and remain free of retired
  production labels.
- Reuse the existing process-document coherence audit as the observable proof.
  No new validator, exception list, recovery path, persisted record, CLI,
  Controller node, authorization, or production behavior is introduced.

This is a terminology correction, not a workflow migration. It applies
`openspec/policies/simple-reliable-control.md` by reusing the existing direct
audit and correcting its smallest reported root set, rather than adding another
quality-control layer or fallback.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `playbook-execution`: require current Pure Pilot guidance and its main-spec
  contract to name v2 Page Authority raw evidence without a retired production
  label.

## Impact

- **Framework source:** `PPTMAKER_FRAMEWORK/playbook/create-deck.md`.
- **Main specification:** `openspec/specs/playbook-execution/spec.md`.
- **Verification:** existing `tests/contracts/test_process_docs_consistency.mjs`.
- **Control ownership:** unchanged; MD Controller remains the workflow owner and
  the raw interface remains the evidence owner.
- **Run-bundle contract:** `none`. No `deck_*` or `dpt_*` input/output, state,
  receipt, grant, attempt, history, generated artifact, provider call, or
  public CLI behavior is read or changed.
