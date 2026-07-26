# Legacy Compatibility Contract

## Boundary

Legacy is not an alternate adapter. It is one read-only observation boundary used solely to guide an
explicit provider-free adoption into Page Authority.

```text
normal production: resolveCurrentProductionProtocol() -> Page Authority only
legacy observation: inspectLegacyProtocol() -> inert observation only
adoption bridge:    prepare -> preview -> confirm -> apply
```

## Observation Module

`inspectLegacyProtocol(canonicalLegacyRunDir)` is the only legacy reader. It accepts a canonical
version run directory and returns:

```text
{
  kind: "legacy-observation",
  protocol: "html-first-v1" | "whole-page-image2-v1" | "unsupported",
  source_sha256,
  state_sha256,
  stable_slide_ids,
  historical_artifact_summary_digest,
  next_action: "prepare-production-mode-transition image2-page-authority"
}
```

It is deterministic and read-only. It cannot return a production adapter, make a provider request,
write state, mutate source, copy `_generated/`, publish review/PPTX/notes evidence, or initiate a
refresh. Historical files are evidence only, never Page Authority raw/final authority.

## Only Bridge

The sole bridge is the existing versioned transaction, generalized to every retired historical
protocol:

```text
state --prepare-production-mode-transition image2-page-authority
  -> preview source-version scratch candidate + outer plan.json
  -> exact-hash confirm
  -> exact-hash apply
```

Preparation consumes an immutable legacy observation. Preview stores its digest in the sole outer
`plan.json`, alongside the candidate source SHA and one explicit adoption row per carry-forward stable
ID. Apply re-inspects the legacy observation and rejects source/state/artifact-summary drift before
creating the target version.

There is no target version before apply. The candidate is authored only in the source version's
`_scratch/production-mode-transition/` owner. All historical protocols use the same rule: the Agent
authors a new Page Authority candidate; no source grammar, render mode, raw image, header-locked image,
HTML page, or old review is automatically converted into Pure or Framed authority.

## User-Visible Legacy Behavior

For a legacy run, normal `init`, stage, build, refresh, header-lock, visual-slot, review, and delivery
commands return `LEGACY_PROTOCOL_ADOPTION_REQUIRED` before state/provider/generated-artifact work. The
diagnostic identifies the provider-free adoption preview. Existing historical bytes remain visible and
exportable as historical output, but the framework no longer produces or refreshes that protocol.

This is an explicit breaking product retirement, not an accidental loss of support. A user who wants
new work on a historical deck adopts it into a clean Page Authority version first.

## Framed Compositor Isolation

The local `framed_image2_compositor` is allowed to reuse browser/font capture primitives, but only
through this input/output seam:

```text
input:  verified full-canvas underlay + typed Text Frame + resolved theme/preset/font evidence
output: verified final PNG + provenance
```

It cannot read HTML slide source, the HTML asset manifest, visual-slot state, HTML review records, or
HTML delivery artifacts. Thus HTML is an implementation runtime for Framed composition, not a surviving
deck-output protocol.
