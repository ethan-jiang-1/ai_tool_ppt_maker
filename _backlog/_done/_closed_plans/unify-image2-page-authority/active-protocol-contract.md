# Active Protocol Contract

## Product Decision

After this work lands, the only current deck-output protocol is:

```text
production.pipeline = page-authority-image2-v1
production_mode      = image2-page-authority
page authority       = pure-image2 | framed-image2 per stable slide ID
```

`pure-image2` and `framed-image2` are mutually exclusive page authorities, never production modes,
adapters, or deck-wide fallback paths. New init exposes no old mode. Old run directories are historical
until an explicit provider-free adoption creates a clean Page Authority version.

## Normal Resolver

`resolveCurrentProductionProtocol(canonicalRun)` reads only canonical source and state/marker facts.
It never reads generated artifacts, does not call the legacy observer, and has four mutually exclusive
results:

| Classification | Predicate | Result / allowed next action |
|---|---|---|
| `current` | exact current source marker and exact current state mode | return the one Page Authority adapter |
| `recognized-legacy` | an exact retired source/state pair listed in the legacy contract | `LEGACY_PROTOCOL_ADOPTION_REQUIRED`; only prepare adoption |
| `current-pair-corrupt` | either source or state declares Page Authority but the pair is missing, malformed, or mismatched | `CURRENT_PROTOCOL_REPAIR_REQUIRED`; repair only |
| `unsupported-or-corrupt` | anything else: missing/unknown marker, malformed source/state, or an unrecognized pair | `UNSUPPORTED_PROTOCOL_REPAIR_REQUIRED`; repair/export only |

Only `recognized-legacy` reaches adoption. A damaged current Page Authority run never adopts itself,
and an unrecognized historical directory is not silently treated as safe input.

## Canonical Source

The top-level source retains the existing identity contract and adds one closed production mapping:

```yaml
identity:
  scheme: mnemonic-v1
production:
  pipeline: page-authority-image2-v1
  page_authority_default: framed-image2
```

`production` has exactly those two keys. `identity` is a separate existing mapping, not an unknown
production key. A single source AST preserves diagnostic spans but rejects duplicate keys, aliases,
anchors, explicit tags, indirect values, unknown production keys, and a missing marker at the relevant
span. Semantic Page Authority values serialize through canonical JSON without comments, whitespace,
physical paths, timestamps, or source locations.

Source spans are diagnostic provenance only. A receipt may carry a noncanonical diagnostic map from
field to span, but raw contracts, authorization fingerprints, cache/reuse digests, materialization
plans, and final-frame fingerprints contain only the normalized semantic projection. Reformatting,
moving a block, or reordering unchanged slides therefore cannot alter a raw contract.

Each slide may use these fields at most once:

| Field | Pure Image2 | Framed Image2 |
|---|---|---|
| `PAGE AUTHORITY` | optional override | optional override |
| `KICKER`, `TITLE`, `SUBTITLE`, `CALLOUT` | optional provider-owned display content | `TITLE` required; all others optional local Text Frame fields |
| `FRAME PRESET: standard-v1` | forbidden | optional; resolves to the one v1 preset |
| `VISUAL BRIEF` | required typed provider-safe selection | required typed provider-safe selection |
| `VISUAL IDENTITY: <profile>/<role>` | optional | optional |
| `IDENTITY SUBJECT COUNT: none|one` | optional, defaults to `none` | optional, defaults to `none` |
| `SUBJECT RESTRICTIONS: none|no-generic-metal-robot|no-identity-subject` | optional, defaults to `none` | optional, defaults to `none` |

An identity selection requires count `one`; absence requires `none`; a v1 multi-identity request has no
representation and fails. `SUBJECT RESTRICTIONS` is the sole owner of identity restrictions. A selected
identity with `no-identity-subject` is rejected; `no-generic-metal-robot` remains compatible with
`amber-agent` because it is an amber light form, not a metal robot.

## Provider-Safe Visual Brief

The v1 `VISUAL BRIEF` is deliberately not arbitrary prompt prose. Free source scalars can ask for a
sign, poster, caption, or labeled diagram through wording a finite token filter misses. To make Framed
text ownership mechanically true, all provider-facing positive visual language is selected from a
reviewed registry:

```yaml
recipe: <registered-lower-kebab-id>
composition: <registered-lower-kebab-id>
motifs: [<registered-lower-kebab-id>, ...]
negative_constraints:
  - no-readable-text
  - no-labels
```

The mapping has exactly `recipe`, `composition`, `motifs`, and `negative_constraints`. The first two
are required registered IDs; `motifs` is an ordered, duplicate-free sequence of zero to six registered
IDs; `negative_constraints` is an ordered, duplicate-free sequence. No quoted literals, free prose,
nested mappings, aliases, tags, or unregistered IDs are valid. The `visual-config`-owned
[visual-language registry contract](./visual-language-registry-contract.md) owns each ID's reviewed
no-text provider clause, compatibility, physical home, and semantic digest. It is versioned with the
shared visual system. Its deterministic `page-authority-text-guard-v1` also applies to selected Agent
role clauses before payload construction. The raw compiler may
send only registry clauses, fixed canvas/reserved-frame facts, selected identity projection, and the
authority-allowed structured display fields below. It never sends arbitrary source text.

The visual registry is where visual richness lives: it can provide rich editorial, architectural,
human-collaboration, or abstract-system recipes and motifs. Adding new visual language is a reviewed
registry/version change, not a hidden per-slide prompt escape hatch.

`negative_constraints` has only `no-readable-text`, `no-labels`, `no-logo`, and `no-watermark`.
Identity restrictions do not appear in this field. Validation is authority-aware and never silently
drops a selected constraint:

| Authority | Constraint rule |
|---|---|
| Framed | `no-readable-text` and `no-labels` are required; `no-logo` and `no-watermark` are optional. The compiler carries all selected values verbatim and adds no model-owned display text. |
| Pure with any structured display field | `no-readable-text` and `no-labels` are forbidden as contradictory; `no-logo` and `no-watermark` remain allowed. |
| Pure with no structured display field | all four values are allowed. |

Thus a Framed underlay request cannot express an instruction to render readable text at all, while Pure
can explicitly own display text without a conflicting negative clause. The Framed compiler additionally
asserts that no KICKER/TITLE/SUBTITLE/CALLOUT literal is present in any provider payload field.

## Raw, Generation, And Frame Contracts

Pure compilation includes its structured display fields because Image2 owns every final pixel.
Framed compilation emits two disjoint projections:

1. a visual-only raw underlay contract: registry clauses, visual system, optional identity, full
   canonical canvas, and reserved frame geometry;
2. a local Text Frame contract: exact human-readable fields, preset, resolved theme/fonts, geometry,
   and measured fit evidence.

The Framed raw image contract excludes every Text Frame value. A v1 frame uses logical `1000 x 562.5` CSS
pixels and exact `2000 x 1125` capture. `standard-v1` has only compiler-owned
`callout_absent`/`callout_present` variants; callers cannot inject CSS, font, color, geometry, or HTML.
The pinned runtime proves fit before any provider authorization and again during final capture.

The **raw image contract digest** is the canonical source-owned semantic visual request: authority,
compiled registry clauses and selected semantic digest, visual-system source facts, selected identity
profile/role/clean-reference bytes, canonical canvas, reserved geometry, and Pure-only structured display
fields. The **raw generation-profile digest** is the canonical provider execution profile: provider/model/
output facts, reference transport facts, and generated style-master byte profile. Both must match for
byte reuse or raw-review freshness. `source_epoch` is a state-ordering fact, not a substitute for either
digest: it advances only for raw-source authority changes, while a generation profile change invalidates
raw reuse/review without advancing that epoch.

## Private Framed Composition Adapter

The Page Authority finalizer owns the one external Interface, `finalizePage(...)`, defined in the parent
roadmap. `framed_image2_compositor` is its private adapter, not a second public Interface. Internally it
uses this typed handoff:

```text
composeFramedImage2({ verified_underlay, text_frame, composition_receipt, framed_runtime_capability })
  -> { verified_final_slide, final_frame_provenance }
```

The input requires a canonical full-canvas verified underlay, receipt-resolved/preflight-fit Text Frame,
and opaque capability/profile evidence resolving theme, preset, fonts, capture, and normalizer facts.
The adapter owns browser
setup, zero-network enforcement, opaque panels, font wait, bounds checks, capture, PNG verification,
and provenance. Callers cannot supply CSS, markup, local asset paths, alternate capture options, or a
publication root. It cannot read HTML slide source, HTML asset manifest, visual-slot state, HTML review
records, HTML delivery artifacts, or legacy generated images. Contract tests cross `finalizePage(...)`;
private adapter tests are implementation-local and use verified disposable fixture underlays.

## Readiness

`doctor` has a closed Page Authority input contract:

```text
doctor --mode image2-page-authority
doctor --mode image2-page-authority --run-dir <canonical-run> \
  --operation <full-build|raw-generation|framed-local-refresh|assembly-notes>
```

An unbound new-deck invocation reports both independent offline profiles and has no aggregate
source-ready claim. A run-bound invocation first resolves current Page Authority source and then uses
the closed operation selection:

| Operation | Required profile(s) |
|---|---|
| `full-build` | `framed-runtime` if any selected slide is Framed; `image2-raw` if any selected slide needs raw work |
| `raw-generation` | `image2-raw`, plus `framed-runtime` for any selected Framed raw because fit precedes authorization |
| `framed-local-refresh` | `framed-runtime` only |
| `assembly-notes` | no runtime/provider profile; current final/assembly evidence is checked instead |

Neither profile makes a provider call without an explicit live probe. Legacy and corrupt runs do not
derive a Page Authority readiness selection; they return their resolver diagnostic first.
