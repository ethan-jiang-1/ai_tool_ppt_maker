## Why

After a terminal partial Pilot creates a legal successor batch, a transport
interruption on the successor's first submitted item is currently misread as an
invalid attempt chain. That converts a recoverable `unknown` hard-stop into an
inapplicable rebuild action and leaves the exact attempt without its required
reconciliation route.

## What Changes

- Restore distinct successor attempt identity while preserving raw-contract and
  provider-request binding for the same current slide tuple.
- Make the existing raw-owner evaluator recognize the normal
  `claimed -> submitted` successor chain and return its exact reconciliation
  action after a transport interruption.
- Add a focused regression that exercises terminal predecessor, successor
  planning, successor authorization, and the successor's first unresolved
  submission through both the raw-owner and inspection path.

This change does not edit historical attempts, resend a provider request,
reopen a grant, add a retry command, add durable state, or migrate a run
bundle. The existing `unknown` hard-stop continues to protect provider-cost
recoverability under `human-centered-gates.md`; the one legal recovery remains
reconciliation of the exact submitted attempt. Per
`agent-assistance-and-control.md` and `simple-reliable-control.md`, the fix
reuses the current direct attempt evaluator and removes a false-invalid branch
rather than creating a second recovery controller.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

None. This restores the already accepted `image-generation` and
`workflow-inspection` contracts for unresolved submitted attempts, so
`.openspec.yaml` declares `skip_specs: true` rather than duplicating existing
requirements.

## Impact

- **Framework source:** the shared progressive raw owner and, if needed, its
  existing attempt-identity constructor.
- **Framework tests:** `tests/shared/image2/test_progressive_raw_owner.mjs`
  and the existing workflow-inspection seam.
- **Control owner:** JS retains ownership of direct attempt graph validation and
  the exact reconcile action; the Agent performs only owner-issued mechanical
  work.
- **Run-bundle contract:** compatible. Existing records are neither rewritten
  nor migrated; the corrected evaluator permits a valid current successor
  attempt to follow its existing reconciliation path.
