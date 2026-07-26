# Legacy Compatibility Contract

## Boundary

Legacy is not an alternate adapter. It is one read-only observation seam used only to guide explicit,
provider-free adoption into Page Authority:

```text
normal production: resolveCurrentProductionProtocol() -> Page Authority only
legacy observation: inspectLegacyProtocol() -> inert observation only
adoption bridge:    prepare -> preview -> confirm -> apply
```

There is no compatibility adapter. In particular, no wrapper may retain a direct legacy build, refresh,
header-lock, visual-slot, review, or delivery call behind a different import path. The observer is the
only surviving legacy module and it has no provider, state-write, generated-artifact-write, or
adapter-return capability.

The future physical owner is one `shared/run-bundle` module adjacent to production marker/mode
parsing. Its sole public interface is `inspectLegacyProtocol(canonicalLegacyRunDir)`.
`production_mode_transition` is its only production caller and may invoke it only while preparing or
applying the adoption transaction. Normal stage routing and workflow inspection consume the normal
resolver's typed diagnostic; they do not import this module.

## Eligible Historical Pairs

Only these internally consistent source/state pairs are recognized adoption inputs:

| Protocol | Exact source fact | Exact state fact |
|---|---|---|
| `html-first-v1` | `production.pipeline: html-first-v1` | `production_mode: html-only` or `html-then-image2` |
| `whole-page-image2-v1` | `production.pipeline: whole-page-image2-v1` | `production_mode: image2-only` |

Missing source/state, an unrecognized marker, a cross-pair, malformed YAML, or a marker/state that
partially declares Page Authority is not legacy. It is repair/export-only and cannot enter adoption.

## Observation Results

The observer returns one of two disjoint records:

```text
recognized legacy:
{
  kind: "recognized-legacy-observation",
  protocol: "html-first-v1" | "whole-page-image2-v1",
  legacy_production_mode: "html-only" | "html-then-image2" | "image2-only",
  source_sha256,
  state_sha256,
  stable_slide_ids,
  historical_artifact_summary_digest,
  next_action: "prepare-production-mode-transition image2-page-authority"
}

unsupported/corrupt:
{
  kind: "unsupported-protocol-observation",
  source_sha256: string | null,
  state_sha256: string | null,
  reason_code: "missing" | "malformed" | "mismatched" | "unknown",
  next_action: "repair-or-export-historical-output"
}
```

It is deterministic and read-only. Its allowed read set is canonical source/state/marker data,
stable-ID extraction, and bounded generated-artifact metadata needed to compute an artifact-summary
digest. It may not use raster bytes as vNext inputs, return a production adapter, make a provider call,
write state, mutate source, copy `_generated/`, publish review/PPTX/notes evidence, or initiate a
refresh.

## The Only Bridge

The sole adoption bridge is the versioned transaction:

```text
state --prepare-production-mode-transition image2-page-authority
  -> preview source-version scratch candidate + outer plan.json
  -> exact-hash confirm
  -> exact-hash apply
```

Prepare accepts only `recognized-legacy-observation`. It stores that observation digest in the sole
outer `plan.json`, alongside candidate source SHA and one explicit adoption row per carry-forward stable
ID. The candidate is authored only in the source version's `_scratch/production-mode-transition/`;
there is no target version before `apply`. Apply re-inspects the same recognized pair and rejects
source/state/artifact-summary drift before atomically creating the target. It never sends a provider
request.

Every candidate row explicitly chooses Pure or Framed, frame/callout values where applicable, identity
binding, and rewrite treatment. No old render mode, raw/header-locked image, HTML page, prompt, asset,
or review record is automatically converted to Page Authority authority.

## User-Visible Legacy Behavior

For a recognized legacy run, ordinary stage, build, refresh, header-lock, visual-slot, review, and
delivery commands return `LEGACY_PROTOCOL_ADOPTION_REQUIRED` before state/provider/generated-artifact
work. Unsupported/corrupt historical input returns its repair/export diagnostic instead. Historical
bytes remain visible/exportable as history, but no retired protocol receives new production work.

## Framed Compositor Isolation

HTML remains an implementation runtime, not a surviving output protocol. The compositor may reuse
pinned browser/font primitives only through its declared interface; it cannot read HTML source, HTML
asset manifests, visual-slot state, HTML review evidence, HTML delivery artifacts, or legacy images.
