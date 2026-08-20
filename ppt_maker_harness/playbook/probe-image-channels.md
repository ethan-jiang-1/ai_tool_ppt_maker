# Image2 Live Probe Reference

This playbook checks whether the **confirmed** Image2 Call Shape can still
retrieve an inspector-valid PNG. It does not choose a workflow, change a
source, create authorization, or approve a production operation. It does not
walk vendors.

If the exact run has no confirmed Call Shape, stop before probe, name
[Image2 Lab](image2-lab.md) as the discovery owner, and make zero live calls.

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

Entering this playbook with a confirmed profile is the Work Request for exactly
one shared-executor submit of that Call Shape. Clearly state the total submit
count ("明确说出总 submit 数") is **1**, that the call may incur cost, then
ask: "是否同意这次 live probe？" Only an explicit approval permits the probe;
no response or a refusal ends the reference without a provider call and does
not invalidate offline foundation evidence.

### run-probe

After that confirmation, run:

```bash
node ppt_maker_harness/scripts/ppt_flow.mjs probe <run-dir>
```

Report the bounded owner result without exposing credentials. Do not invoke
retired `--smoke` or `--probe-vendors`. Edits without a selected Style Master
hard-stop; do not invent a blank PNG.

## Result boundary

A probe success proves declared-Call-Shape connectivity only. It does not equal
production authorization and does not approve a raw plan, a generation request,
review, or delivery. Continue only through the existing receipt-bound workflow
and its applicable human gates. After an optional configuration write, report
that write without automatically invoking a second readiness command.
