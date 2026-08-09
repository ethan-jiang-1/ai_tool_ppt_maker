## Why

An exact progressive raw submission can persist a verified `succeeded` terminal
record and an `unknown` terminal sibling for the same submitted parent when
provider result handling crosses invocation boundaries. The current validator
declares every such pair an integrity failure, while the CLI only advertises a
`rebuild_progressive_raw_work` repair that no public operation can execute.
This traps the Run Bundle despite retaining direct verified media/provenance and
causes an Agent to stop before any further authorized work.

The existing hard-stop must remain for ambiguous or invalid evidence. This
change is needed now because the `deck_dark_factory_current` production run
exercised the exact terminal-sibling sequence; its records are immutable and
must neither be edited nor retried.

## What Changes

- Define the one safe terminal-sibling reconciliation rule: a childless
  `succeeded` + `unknown` pair for one submitted attempt is a valid effective
  success only when the existing `succeeded` record's exact provenance and
  provider bytes validate. The `unknown` sibling remains immutable audit
  history and cannot authorize a retry or overwrite the success.
- Make a direct reconcile request for that already-effective submitted parent
  idempotent and provider-free: it must return the current owner projection
  without lookup or a third terminal record.
- Preserve the existing childless `known_failure` + `unknown` compatibility
  rule, while retaining a hard-stop for every other previously-invalid terminal
  branch, absent or invalid success provenance, and any attempt
  identity/batch/grant mismatch.
- Make the progressive raw owner, workflow inspection, and direct `image2`
  diagnostics use the same effective-attempt evaluator, so a valid state
  reports its registered CLI action and a valid next eligible item can continue
  under its pre-existing exact grant; an unrepairable state reports only
  bounded maintenance.
- Add focused owner and CLI regressions for the real sequence and for invalid
  sibling branches. No production Run Bundle bytes are edited or used as a test
  fixture.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `image-generation`: Progressive raw attempt terminalization, direct
  provenance evaluation, recovery, and next-action projection change for the
  bounded verified-success/unknown sibling case.
- `cli-surface`: Progressive `image2` diagnostics must preserve the owner's
  executable nearest action for a valid terminal-sibling evaluation and report
  bounded maintenance rather than advertising an unreachable generic repair.

## Impact

- Harness source: `ppt_maker_harness/scripts/shared/image2/page_image_progressive_raw_owner.mjs`, the
  existing progressive schema/store validation path, and
  `ppt_maker_harness/scripts/ppt_flow.mjs` diagnostic routing.
- Harness verification: focused progressive raw-owner and public CLI tests;
  protected regression suite as appropriate.
- Control owner: the existing JS progressive raw owner remains the only writer
  and evaluator; CLI remains a consumer of its result. Human confirmation is
  still required only for a new nonzero authorization scope, not for this
  deterministic evidence classification.
- Run-bundle contract: compatible. Existing records remain append-only and
  byte-preserved; no migration, mutation, retry, replacement authorization, or
  provider call is part of this change.

## Control Policy

This change applies
[`human-centered-gates.md`](../../policies/human-centered-gates.md),
[`agent-assistance-and-control.md`](../../policies/agent-assistance-and-control.md),
and [`simple-reliable-control.md`](../../policies/simple-reliable-control.md).
The verified pair is a deterministic `guide`, because the existing immutable
owner evidence decides it without human risk acceptance. Every unproven or
ambiguous pair is a non-bypassable `hard-stop` protecting plan, attempt,
provenance, bytes, authorization, and append-only history. No `confirm`,
waiver, additional state, retry path, or controller rule is introduced. The
change removes the fake rebuild projection and reuses the one direct evaluator
and evidence path across inspection and operations.
