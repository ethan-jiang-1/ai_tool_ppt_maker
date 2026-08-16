# Image2 Live Probe Reference

This `00-setup` reference checks the health of resolved Image2 channels. It does
not choose a workflow, change a source, create authorization, or approve a
production operation.

## Offline readiness first

For the exact raw-generation run, first use the provider-free readiness check:

```bash
node ppt_maker_harness/scripts/ppt_flow.mjs preflight <run-dir> --operation raw-generation
```

Read the owner-issued result. Repair a local prerequisite only when its
recommended action permits that mechanical repair, then rerun the same check.
Do not edit `.env`, retained lessons, source, state, or derived output as part
of this reference.

## Disclose and confirm

Before any live call, count the resolved providers and clearly state the total
submit count ("明确说出总 submit 数"), that each resolved provider receives one
submit, and that the calls may incur cost. Then ask: "是否同意这次 live probe？"
Only an explicit approval permits the probe; no response or a refusal ends the
reference without a provider call.

### run-probe

After that confirmation, run:

```bash
node ppt_maker_harness/scripts/ppt_flow.mjs probe --probe-vendors
```

Report the bounded owner result without exposing credentials. 不自动运行 `probe --smoke`; it is a separate live diagnostic that needs its own disclosure and confirmation.

## Result boundary

A probe success does not equal production authorization and does not approve a
raw plan, a generation request, review, or delivery. Continue only through the
existing receipt-bound workflow and its applicable human gates.
