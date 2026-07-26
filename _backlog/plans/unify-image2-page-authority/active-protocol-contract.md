# Active Protocol Contract

## Product Decision

Page Authority is the only active deck-output family after this work lands. The active protocol is
exactly:

```text
production.pipeline = page-authority-image2-v1
production_mode      = image2-page-authority
page authority       = pure-image2 | framed-image2 per stable slide ID
```

`pure-image2` and `framed-image2` are never production modes, adapters, or deck-wide fallbacks.
They are mutually exclusive per-slide pixel authorities inside one protocol.

New init exposes no old production-mode choice. Existing legacy run directories remain readable only
through the compatibility contract and must adopt into a clean Page Authority version before any new
production, refresh, review publication, or delivery work.

## Normal Resolver

`resolveCurrentProductionProtocol(runDir)` has one successful result: the exact Page Authority
marker/state pair plus its `page-authority-image2` adapter. It does not parse or return an old
adapter. A legacy/missing/mismatched record returns one non-writing typed result,
`LEGACY_PROTOCOL_ADOPTION_REQUIRED`, whose only next action is the adoption bridge.

The normal resolver never reads generated files, historical metadata, or a legacy marker to select a
fallback. The compatibility reader is separate and cannot be called by normal stage routing.

## Canonical Source

The top-level source keeps the existing identity contract and adds a closed production mapping:

```yaml
identity:
  scheme: mnemonic-v1
production:
  pipeline: page-authority-image2-v1
  page_authority_default: framed-image2
```

`production` has exactly those two keys. `identity` remains a separate existing top-level mapping and
is never rejected as an unknown production key. Duplicate keys, aliases, anchors, explicit tags,
indirect values, unknown production keys, and a missing marker are hard-stops with source spans.

Each slide may use these fields at most once:

| Field | Pure Image2 | Framed Image2 |
|---|---|---|
| `PAGE AUTHORITY` | Optional override | Optional override |
| `KICKER`, `TITLE`, `SUBTITLE`, `CALLOUT` | Optional model-owned display content | TITLE required; others optional local Text Frame fields |
| `FRAME PRESET: standard-v1` | Forbidden | Optional; resolves to the one v1 preset |
| `VISUAL BRIEF` | Required | Required |
| `VISUAL IDENTITY: <profile>/<role>` | Optional | Optional |
| `IDENTITY SUBJECT COUNT: none|one` | Optional, defaults to `none` | Optional, defaults to `none` |
| `SUBJECT RESTRICTIONS: none|no-generic-metal-robot|no-identity-subject` | Optional, defaults to `none` | Optional, defaults to `none` |

A selected identity requires subject count `one`; no selected identity requires `none`; a v1
multi-identity request has no representation and is rejected. The canonical serialized resolution,
including source spans, enters the slide receipt and raw contract.

## One Typed Visual Brief

Both authorities use one fenced YAML `VISUAL BRIEF` with exactly:

```yaml
scene: <visual description>
composition: <visual description>
subjects: <visual description>
motifs: [<visual description>, ...]
negative_constraints:
  - no-readable-text
  - no-labels
```

`negative_constraints` is a closed enum: `no-readable-text`, `no-labels`, `no-logo`,
`no-watermark`, `no-generic-metal-robot`, and `no-identity-subject`. It can say `no-labels` because
that is a prohibition, never a request to draw text. Legacy free-form `IMAGE PROMPT`, `MODEL TEXT`,
`LABELS`, `CAPTIONS`, `TABLE TEXT`, `LOGO`, and `WATERMARK` fields are forbidden.

The parser rejects only deterministic imperative display directives in visual-description fields:
English `write|render|display|show` followed by a display-token, and the exact equivalent CJK verb
plus display-token forms. It does not use NLP, similarity scoring, substring bans, or OCR. The
compiler excludes all structured Text Frame values for Framed slides and adds one fixed
no-readable-text provider rule. Pure compilation includes the slide's structured display fields
because Image2 owns those pixels.

## Readiness

`doctor --mode image2-page-authority` reports two independent offline capability profiles:

| Profile | Required by | Checks |
|---|---|---|
| `frame-runtime` | Framed preflight/composition and local text refresh | pinned browser/runtime, bundled fonts, canonical compositor inputs |
| `image2-raw` | style-master and any raw generation | Image2 configuration/credential presence and local transport prerequisites |

Source-aware operation readiness selects only the profile it needs. A valid Framed text-only refresh
with current raw review coverage requires `frame-runtime` and must not fail merely because Image2
credentials are absent. A raw/style operation requires `image2-raw`; a mixed production build may
require both. Neither doctor profile makes a provider call without an explicit live probe.
