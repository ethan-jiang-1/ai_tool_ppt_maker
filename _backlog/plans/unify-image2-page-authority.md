# Plan: Unify Image2 Page Authority

> Type: Architecture and delivery roadmap | Updated: 2026-07-26 | Status: Discovery in progress; not yet an OpenSpec proposal
>
> Historical input: [legacy whole-page contract hardening](../_done/_closed_plans/legacy-whole-page-image2-contract-hardening.md)
>
> Working papers: [protocol](./unify-image2-page-authority/active-protocol-contract.md) | [visual-language registry](./unify-image2-page-authority/visual-language-registry-contract.md) | [legacy compatibility](./unify-image2-page-authority/legacy-compatibility-contract.md) | [review/versioning](./unify-image2-page-authority/review-and-versioning-contract.md) | [Agent reference](./unify-image2-page-authority/agent-reference-contract.md) | [exact spec ledger](./unify-image2-page-authority/main-spec-retirement-ledger.md) | [coverage audit](./unify-image2-page-authority/main-spec-retirement-audit.md) | [review log](./unify-image2-page-authority/review-log.md)

This is the durable architecture decision for the next production model. It is intentionally more
precise than a feature brief, but it is not a second runtime specification. OpenSpec changes will
turn these decisions into requirement-level deltas, design, tasks, and tests. No implementation may
invent a competing source marker, state mode, receipt owner, or migration journal while doing so.

This file is the single backlog authority. The companion papers linked above are accepted review
inputs and audit aids, not additional source grammars, state schemas, or public interfaces. Their
decisions are consolidated here; when a name or rule differs, this plan wins. Before a future
OpenSpec proposal is created, the companion set must remain explicitly linked or be archived as
historical notes. Runtime code must never discover a protocol by scanning that directory.

## Review Verdict

The direction is sound: the defect is not only a bad prompt clause, but two parties claiming the same
final pixels. A single declared page authority is the right organizing idea. The original roadmap was
not yet safe to implement because it left six decisions implicit:

1. The new source/state identity and the default variant were left for later design, which would let
   the three changes drift apart.
2. "Coexistence" and "historical adoption" were mixed. Without an activation rule, an old adapter
   could remain a new-production fallback indefinitely.
3. Raw review, final review, fingerprints, and provider ingress were named but not made into one
   enforceable evidence chain.
4. Retiring HTML output was stated at capability level even though the Framed compositor still needs
   a small, protocol-neutral browser/font runtime.
5. A free-form visual brief cannot mechanically guarantee that a Framed provider underlay contains no
   requested display text; a finite token scan is bypassable and would conflate prose with ownership.
6. The companion papers used different resolver outcomes, compositor names, readiness profile names,
   and digest fields, which would let the three OpenSpec changes drift into incompatible contracts.

This revision fixes those points and records the current baseline so later work can distinguish a
real Page Authority regression from pre-existing repository drift.

### Current baseline (observed 2026-07-26)

| Area | Current fact | Consequence for this plan |
|---|---|---|
| Source identity | `production_marker.mjs` accepts `html-first-v1` and `whole-page-image2-v1`; whole-page source also has `render.default`/`header-lock` policy | Page Authority needs a third, explicit marker and must reject the old render mapping |
| State identity | `production_mode.by_version` is authoritative for `html-only`, `html-then-image2`, and `image2-only`; metadata is a mirror | The new protocol must add one exact state value and keep source/state consistency checks in one resolver |
| Active adapters | HTML production, whole-page Image2, Canvas `header-lock`, and HTML-first visual-slot refinement have separate owners and generated artifacts | Slice A needs a side-by-side adapter and namespace; it cannot quietly repurpose a legacy manifest |
| Public entry | `ppt_flow` has 14 top-level commands and routes by the current mode policy; direct Stage 2/3 utilities still exist | Every new Page Authority ingress, including direct utilities, must be receipt-bound or explicitly non-production |
| Run-bundle authority | `bundle_layout.mjs` owns paths/whitelists; `_generated/` is rebuildable and `_scratch/` is temporary | New artifacts need a dedicated declared owner; no glob, filename, or old generated tree may become authority |
| Maintenance pointers | Top-level `AGENTS.md` names nonexistent `scripts/lib/cli_error.mjs` and `scripts/bundle_layout.mjs`; executable/spec authorities are `scripts/shared/cli/cli_error.mjs` and `scripts/shared/run-bundle/bundle_layout.mjs` | Page Authority CLI/layout work follows the capability specs and actual shared modules; reconcile stale pointers in the documentation cleanup |
| Runtime | `node v22.23.1`; `package.json` requires Node `>=22`; paired Playwright/Chromium/ECharts and Image2 checks are profile-scoped | The stale "Node 18+" prose must not become a new implementation target; reconcile documentation with the package/spec authority |
| Verification | `npm test` core verification passes; the full Vitest sweep currently has five failed tests and three fixture files with no test suite | Before Slice A, classify or repair these failures and record the clean baseline; do not claim the new route is green against a red suite |
| Planning inputs | The prior consolidation commit removed the working-paper directory, while a parallel review restored the papers and an exact Requirement ledger | Keep this parent plan as the sole authority; validate every ledger title against the current main specs before proposal creation |

The current environment passes both `doctor --mode image2-only` and `doctor --mode html-only` when its
local credentials/runtime are present. These checks are observations, not permission to persist
secrets or make a provider call.

The observed sweep debt is bounded: three state assertions disagree on the current
`STATE_UNAVAILABLE`/`transition_required`/`MODE_MISSING` projection, two refinement lifecycle tests
fail on legacy continuation/record-shape assumptions, and three development-verification fixture
files are executable negative fixtures rather than Vitest suites. This baseline was observed while
only this plan file was modified; it must be repeated at a known code checkpoint before Slice A.
Slice A must either repair these contracts or record an explicit exclusion with an owner and follow-up
test; it must not silently fold them into Page Authority evidence. No production code or deck-generated
artifact is changed by this plan review.

## Product Direction

After the migration program, a new deck has one active way to make a slide: a Page Authority Image2
page with exactly one final-pixel owner. There are exactly two closed per-slide variants:

| Variant | Image2 owns | Local compositor owns | Finalization |
|---|---|---|---|
| `pure-image2` | The entire final page, including visible text | Nothing | A verified raw result is verified again and published as the final slide |
| `framed-image2` | A text-free, full-canvas visual underlay | A typed kicker/title/subtitle/callout Text Frame | A verified underlay is composed locally into one verified final slide |

Both variants use one page intent, visual system, Image2 authorization boundary, raw review, final
review, final-slide manifest, PPTX assembly, and notes flow. The only semantic fork is the existence
of the local Text Frame.

`framed-image2` is not the historical `body+header-lock` route: Image2 is never asked to draw fields
owned by the frame. It is not `html-then-image2`: HTML is an internal deterministic implementation
runtime, not a source grammar, asset catalog, state branch, or user-facing production family.

New `init` defaults to `framed-image2` and may select a different default only through the Page
Authority source contract. A slide may explicitly override the deck default with `pure-image2` or
`framed-image2`. The variant is a source/version fact, never an inference from a filename, old render
mode, generated artifact, or review record.

## Target Vocabulary

These are target-state terms for this roadmap. `CONTEXT.md` and main specs remain current-code truth
until a matching implementation slice lands.

| Term | Meaning | Must not mean |
|---|---|---|
| **Page Authority protocol** | The one current production protocol identified by the fixed source/state pair. | A deck-wide choice between render families. |
| **Page authority** | The per-slide `pure-image2` or `framed-image2` owner of final pixels. | A legacy render mode or inferred artifact type. |
| **Visual Underlay** | The verified, text-free full-canvas raw Image2 result required by a Framed slide. | A body-only crop or old header-lock image. |
| **Text Frame** | Typed, deterministic local kicker/title/subtitle/callout composition for a Framed slide. | HTML slide source, a visual slot, or caller-authored CSS. |
| **Raw image contract** | Canonical semantic facts that determine requested raw pixels. | Provider execution settings or source spans. |
| **Raw generation profile** | Canonical provider/model/output facts that determine raw-byte reuse eligibility. | A source epoch or human authorization. |
| **Source epoch** | State-owner-issued version-scoped monotonic stamp for a raw-source-authority change. | A cache key, reset command, or caller-supplied counter. |
| **Page Authority finalizer** | The one deep module whose external Interface publishes a verified final slide. | The private compositor, HTML renderer, or Stage 4 caller. |
| **Legacy observer** | The sole read-only historical inspection module. | A production adapter, compatibility execution route, or prompt converter. |

## Fixed Protocol Identity

These names are architectural decisions now, not OpenSpec design placeholders:

```text
production.pipeline = page-authority-image2-v1
production_mode     = image2-page-authority
page authority      = pure-image2 | framed-image2 per stable slide ID
```

The ordering difference is intentional and still one closed mapping: the source contract is
`page-authority-image2-v1`, the routing mode is `image2-page-authority`, and both resolve only to the
`page-authority-image2` adapter. No other marker/mode/adapter combination is valid.

The canonical new source keeps the existing identity contract and closes the production mapping:

```yaml
identity:
  scheme: mnemonic-v1
production:
  pipeline: page-authority-image2-v1
  page_authority_default: framed-image2
```

`production` has exactly the two keys shown above. Top-level `identity` remains a separate mapping;
it is not an unknown production key. Duplicate keys, anchors, explicit tags, aliases/indirect
values, unknown production keys, a missing marker, and a non-canonical identity scheme fail before
Stage 1 publishes anything. New decks retain the existing mnemonic-v1 rule: 5-8 ASCII letters in
exactly two spoken BlockCase blocks. Adoption preserves an existing stable ID even when it is a
historical shape; it never renames an ID merely to satisfy the new protocol. Fresh authoring rejects
non-conforming IDs. An adoption candidate may retain a historical ID only when its explicit row in the
adoption plan marks that ID as retained and binds its source identity; that exception is not available
to fresh init or ordinary Page Authority edits. The adoption target still declares
`identity.scheme: mnemonic-v1`; only the retained ID shape is exceptional.

Variant resolution is closed and deterministic: a slide-level `PAGE AUTHORITY` value, when present,
overrides `production.page_authority_default`; otherwise the deck default applies. Both values must
be one of the two closed variants. No filename, old render mode, generated artifact, review record,
or Controller history participates in that resolution. The resolved receipt records the variant
explicitly for every slide, including slides that inherited the deck default.

The Page Authority parser rejects the legacy top-level `render` mapping, legacy `RENDER MODE`, and
free-form `IMAGE PROMPT` as current inputs. It must preserve unrelated supported frontmatter and
report source spans. The exact field parser is owned by `content-parsing`; downstream modules consume
its resolved receipt rather than reparsing Markdown.

### Normal Resolver Classification

`resolveCurrentProductionProtocol(canonicalRun)` reads only the canonical source marker and the
versioned authoritative state record. It never reads generated artifacts, metadata mirrors, history,
or a legacy adapter to choose a route. Its result is one of four disjoint classifications:

| Classification | Exact predicate | Result and next action |
|---|---|---|
| `current` | Page Authority marker and `production_mode: image2-page-authority` are both present, valid, and an exact pair | Return the single Page Authority adapter. |
| `recognized-legacy` | An exact retired pair is present: `html-first-v1` with `html-only`/`html-then-image2`, or `whole-page-image2-v1` with `image2-only` | Return `LEGACY_PROTOCOL_ADOPTION_REQUIRED`; only the read-only observer and provider-free adoption preparation may run. |
| `current-pair-corrupt` | Either side declares Page Authority, but the pair is missing, malformed, or mismatched | Return `CURRENT_PROTOCOL_REPAIR_REQUIRED`; preserve bytes and repair/export only. Never self-adopt. |
| `unsupported-or-corrupt` | Missing/unknown marker, malformed state, or any unrecognized cross-pair | Return `UNSUPPORTED_PROTOCOL_REPAIR_REQUIRED`; repair/export only. Never infer a legacy protocol. |

Only `recognized-legacy` is eligible for adoption. A generated filename, old render mode, metadata
mirror, review record, or Controller cursor can never change the classification.

## Source Contract

The new source has one typed visual brief and one closed display-field set. There is no free-form
`IMAGE PROMPT` escape hatch for Page Authority.

| Field | `pure-image2` | `framed-image2` |
|---|---|---|
| `PAGE AUTHORITY` | Optional explicit override | Optional explicit override |
| `KICKER`, `TITLE`, `SUBTITLE`, `CALLOUT` | Provider-owned display content; included in raw material | Local Text Frame fields; excluded from raw provider material |
| `FRAME PRESET` | Forbidden | Optional, currently only `standard-v1` |
| `VISUAL BRIEF` | Required | Required |
| `VISUAL IDENTITY: <profile>/<role>` | Optional registered Image2 identity/reference projection | Optional registered Image2 identity/reference projection |
| `IDENTITY SUBJECT COUNT: none|one` | Optional, defaults to `none` | Optional, defaults to `none` |
| `SUBJECT RESTRICTIONS: none|no-generic-metal-robot|no-identity-subject` | Optional, defaults to `none` | Optional, defaults to `none` |

`SPEAKER NOTE` remains a separate notes-owned field. It is never Image2 material or Text Frame
content; its current source digest is carried by the notes receipt and final delivery lineage.

An identity selection requires `IDENTITY SUBJECT COUNT: one`; absence requires `none`. A selected
identity plus `no-identity-subject` is a source error. `no-generic-metal-robot` is compatible with the
amber light-form profile. These identity restrictions never appear in `VISUAL BRIEF`.

For Framed slides, `TITLE` is required; the other Text Frame fields are optional and absence is
structural, not permission for layout drift. The `standard-v1` preset has compiler-owned
`callout_absent` and `callout_present` variants. It fixes the logical canvas, capture size, field
rectangles, line budgets, panel opacity, font/token resolution, and overflow policy. A slide cannot
provide CSS, geometry, fonts, colors, HTML, or markup. The normalized typed frame record is exactly
`{preset, kicker, title, subtitle, callout}` (with absent optional values represented canonically),
and is the only input the compositor receives for visible text.

`VISUAL BRIEF` is a fenced YAML value with exactly these semantic keys:

```yaml
recipe: <registered-lower-kebab-id>
composition: <registered-lower-kebab-id>
motifs: [<registered-lower-kebab-id>, ...]
negative_constraints:
  - no-readable-text
  - no-labels
```

This is deliberately a provider-safe selection language, not arbitrary prompt prose. Free scalars can
ask for a sign, poster, caption, or labeled diagram through wording a finite text-token filter misses.
The `visual-config`-owned
[page-authority visual-language registry](./unify-image2-page-authority/visual-language-registry-contract.md)
stores reviewed provider clauses, compatibility, and the semantic digest for each recipe/composition/motif
ID. `recipe` and `composition` are required lower-kebab IDs; `motifs` is an ordered, duplicate-free
list of zero to six registered IDs; `negative_constraints` is an ordered, duplicate-free list of only
`no-readable-text`, `no-labels`, `no-logo`, and `no-watermark`. No quoted literals, nested mappings,
aliases, tags, or unknown IDs are valid. The registry's physical home is the single deck-wide source
`2_backbone/visual-style/page-authority-visual-language.yaml`; version overrides, HTML asset-manifest
entries, CLI path overrides, and generated copies are invalid. Its semantic digest and selected clause
digests enter `raw_image_contract_digest`. The provider compiler sends only registered clauses,
canvas/frame facts, and the permitted identity/display projection, never arbitrary source prose.

For Framed slides, `no-readable-text` and `no-labels` are required and structured Text Frame values
are absent from every provider payload field. For Pure slides with any structured display field, those
two negative constraints are forbidden rather than silently discarded; `no-logo` and `no-watermark`
remain allowed. A Pure slide without structured display text may use all four constraints. Identity
restrictions are not visual-brief constraints: `SUBJECT RESTRICTIONS` is their single source of truth.

`image2-reference-material.yaml` is a separate registry owned by `visual-asset-management`; it is not
the HTML `asset-manifest.yaml` and cannot be selected through that catalog. A deck may optionally
promote a human-owned model sheet under its `2_backbone/visual-style/assets/` tree. The model sheet is
doctrine only and never a provider payload. A selected identity resolves only to a reviewed clean
single-pose role derivative (`guide`, `collaborating`, `working`, `orchestrating`, or `reviewing`) and
binds its SHA, role clause, subject class, cardinality, and restriction result into the raw contract.
An absent profile is a hard source error when selected; identity is never inferred from a scratch file,
HTML catalog, old prompt, or arbitrary path. The `amber-agent` profile is the first pilot fixture, not
a requirement that every deck carry an Agent identity.

The v1 reference registry has exactly `schema` and `profiles` at the root. Each profile has exactly
`subject_class`, `maximum_identity_subjects`, `compatible_restrictions`, `incompatible_restrictions`,
and `roles`; each role has exactly `reference_path`, `reference_sha256`, and `role_clause`. Paths are
relative, confined to the profile directory, and verified against the registered bytes. The normalized
profile/role/reference/restriction projection is part of `raw_image_contract_digest`; source spans and
physical paths are diagnostic provenance only.

## Ownership Model And Deep Module Seam

The ownership invariant is simple: every visible field or panel has exactly one owner. The resolver
must produce a complete, immutable `PageAuthorityResolution` containing the variant, normalized
source fields, raw contract projection, and (for Framed) the typed Text Frame. Callers do not infer
ownership from the prompt or branch on ad hoc field names.

The finalization seam is the external interface of one deep module with two internal adapters. The
public interface is `finalizePage`; a helper named `composeFramedImage2`, if used internally, is not a
second caller-facing seam and cannot be imported by Stage 4 or the CLI:

```text
finalizePage({
  authorityResolution: PageAuthorityResolution,
  verifiedRawResult: VerifiedRawResult,
  compositionReceipt: PageCompositionReceipt,
  framedRuntimeCapability: FramedRuntimeCapability | null
}) -> {
  finalArtifact,
  finalContractDigest,
  provenance,
  verification
}
```

`PageAuthorityResolution`, `VerifiedRawResult`, and `PageCompositionReceipt` are immutable values
produced by their owning modules. `VerifiedRawResult` contains verified bytes, SHA,
`raw_image_contract_digest`, and `raw_generation_profile_digest`, never an arbitrary path or provider
response. The
`FramedRuntimeCapability` is an opaque, runtime-owner-issued capability resolved from the
`framed-runtime` readiness profile; it carries runtime identity/evidence digests, not browser
settings, CSS, fonts, paths, provider options, or prompt text. It is required for `framed-image2`
and must be `null` for `pure-image2`. The interface therefore accepts receipt-resolved facts, not
caller-selected runtime configuration.

The canonical evidence field names are fixed: `raw_image_contract_digest` identifies normalized,
source-owned provider material; `raw_generation_profile_digest` identifies the provider/model/output
execution profile and generated style-master byte profile; `frame_contract_digest` identifies the typed
local frame; and `final_contract_digest` identifies the verified final artifact. Source-owned Visual
Brief semantics, selected Agent profile/role/clean-reference bytes, Pure display fields, visual-system
source facts, and reserved geometry belong only to `raw_image_contract_digest` and advance
`source_epoch` when changed through the source transaction. Provider/model/output facts and generated
style-master bytes belong only to `raw_generation_profile_digest`; they invalidate raw reuse/review but
do not advance `source_epoch`. No implementation may alternate `raw_contract_digest` and
`raw_image_contract_digest` for the same fact.

`pure-image2` uses a pass-through finalizer that still checks canonical dimensions, PNG bytes,
nonblank pixels, SHA, and manifest identity. `framed-image2` uses a private compositor adapter that
owns browser lifecycle, bundled fonts, opaque panels, geometry, network denial, capture, and cleanup.
Both adapters return the same final artifact contract; callers and tests cross this seam rather than
testing browser details through Stage 4. `final_contract_digest` includes the resolved variant, source
epoch, `raw_image_contract_digest`, `raw_generation_profile_digest`, `frame_contract_digest` when
present, frame preset, runtime capability digest when present, canvas, and final artifact facts.

The compositor may reuse the pinned HTML runtime only through typed data. It cannot read HTML slide
source, the HTML asset manifest, visual-slot state, HTML review records, or HTML delivery objects.
The runtime must retain the existing no-network/CSP/font/timeout/cleanup evidence required for safe
deterministic capture.

## Evidence, Artifacts, And Reviews

The new protocol has one evidence chain. Convenience prompts and human-readable plans are derived
views and cannot replace it:

```text
canonical source + visual system
        |
        v
Page composition receipt (source-known facts only)
        |
        v
raw manifest: exact raw contract + verified raw bytes
        |
        v
raw visual review: proceed coverage for exact raw tuples
        |
        v
final-slide manifest: final contract + final PNG + compositor proof
        |
        v
final projection/review -> PPTX receipt -> notes receipt -> delivery decision
```

Derived receipts and manifests live under the explicitly whitelisted Page Authority generated owner
`_generated/page_authority_image2/`. Durable raw/final review decisions remain in their owning
`_state` records and reference those generated facts; they are not generated-file authority. Slice A chooses leaf
filenames and schema versions, but it must not reuse `page_images_full`, `header_locked`,
`html_production`, or visual-slot directories as current authority. Every entry is addressed by
`slide_id`; current position is an ordering projection only.

Evidence ownership is single-writer even if implementation files are split:

| Evidence | Single writer | Readers |
|---|---|---|
| Page composition receipt | `content-parsing` Page Authority resolver | raw generation, finalizer, status |
| Raw manifest | `page-authority-image2` adapter after byte verification | raw review, finalizer, structural materialization |
| Raw review decision | `node-specification` state owner | finalizer, completion evaluator, status |
| Final-slide manifest | `image-production` finalization seam | projection, PPTX assembly, notes, delivery review |
| PPTX / notes receipts | `pptx-assembly` / `notes-injection` owners | final delivery review and completion |

No downstream reader may publish a second receipt or reinterpret another owner's digest.

### Raw and final evidence rules

- The Stage 1 receipt contains canonical source digest, a version-scoped Page Authority `source_epoch`,
  visual-system facts, page authority, `raw_image_contract_digest`,
  `raw_generation_profile_digest`, and frame-contract facts,
  but never a future image or final PNG SHA. `source_epoch` is owned by this protocol and is not the
  legacy HTML `html_production_reset_id`.
- A raw manifest entry contains the exact `raw_image_contract_digest`, `raw_generation_profile_digest`, source
  epoch, verified raw SHA, stable ID, artifact kind, and source/version lineage. A stale or missing entry is
  `needs_render`, not permission to call the provider.
- A raw review record covers a non-empty, lexically ordered set of exact raw tuples
  `{slide_id, raw_sha256, raw_image_contract_digest, raw_generation_profile_digest}`. Only `proceed`
  covers a tuple; the raw-review projection SHA/profile and source epoch are separate freshness facts
  bound by the coverage map, rather than hidden extra identity fields. Partial, stale, changed,
  reset-epoch, or profile-mismatched coverage blocks finalization before any write to the final manifest.
- A Framed text-only execution preserves raw coverage when the raw bytes, raw image contract, raw
  generation profile,
  review projection, source epoch, and source/version lineage are unchanged. A new local execution ID
  alone does not stale raw acceptance.
- The final manifest binds the current composition receipt, accepted raw coverage, `final_contract_digest`,
  final PNG SHA, and compositor verification. Assembly and notes consume only this manifest.
- Final delivery review is based on the actual final projection SHA/profile plus current PPTX and
  notes receipts. It cannot accept an old contact sheet, raw image, header-locked file, or filename
  as completion authority.
- Capability-owned evidence records use the values `proceed`, `repair`, or `redirect`. Gate
  classification follows `human-centered-gates`: deterministic repair is `guide`, reversible
  quality/process risk is `confirm`, and byte/identity/authorization/recovery uncertainty is a
  non-waivable `hard-stop`. A `confirm` classification is not a waiver of a hard-stop and never
  changes evidence completeness. No OCR or automatic provider retry is introduced by this plan.

### Refresh and invalidation matrix

| Change | Pure Image2 | Framed Image2 | Provider call? |
|---|---|---|---|
| Kicker/title/subtitle/callout | Rebuild raw and re-review | Recompose Text Frame and renew final delivery evidence | Pure yes; Framed no |
| Visual Brief, registered identity/reference bytes, or visual-system source facts | Rebuild raw and re-review; source epoch advances | Rebuild underlay, then recompose and re-review; source epoch advances | Yes |
| Generated style-master bytes or provider/model/output profile | Rebuild raw and re-review; source epoch does not advance | Rebuild underlay, then recompose and re-review; source epoch does not advance | Yes |
| Frame panel styling or local text tokens | Not applicable | Recompose, fit-check, and renew final delivery evidence | No |
| Frame preset, reserved geometry, canvas, or available visual area | Rebuild raw page and re-review | Rebuild underlay, then recompose | Yes |
| Notes only | Notes refresh | Notes refresh | No |
| Reorder/insert/delete or page-authority switch | Structural versioning path; no in-place inference | Structural versioning path; no in-place inference | No; only a later explicit raw-generation authorization may call the provider |

For a new structural target, raw materialization is part of the same hash-bound `apply` transaction,
not a later copy/import operation. Preview records every retained slide as either an exact source raw
tuple/manifest/normalizer/reference-evidence materialization row or `needs_raw_generation`; that map
is covered by the outer plan hash. Apply revalidates every declared materialization before the target
is visible, then atomically writes target-owned `unreviewed` raw provenance entries and declared raw
debt. It copies no final artifact and never calls a provider. Human raw acceptance is version-scoped
and must be renewed before finalization.

## Provider, Readiness, And Ingress Rules

The provider boundary is one explicit seam after all local proof:

1. Resolve the canonical source/state pair and Page Authority receipt.
2. Validate source, frame fit, source-owned reference hashes, raw generation-profile facts, and exact
   raw scope locally.
3. Plan and record an explicit, exact-hash authorization with maximum submission count and execution
   binding.
4. Recheck the same material immediately before transport; only then resolve credentials and create a
   provider client.

Preview, validation, structural materialization, adoption preview/apply, finalization, review
projection, and notes-only work make zero provider calls and must not initialize provider credentials.
All Page Authority Stage 2/3 entry points either require `--run-dir` plus the current receipt or are
marked test-only/non-production; arbitrary prompt paths, style paths, output paths, and provider
overrides cannot bypass the run-bound owner. There is no legacy compatibility adapter: from the first
cutover slice onward, retired direct utilities are unreachable from normal routing. The only remaining
legacy seam is the read-only observer defined in the legacy compatibility contract; it has no provider,
state-write, generated-artifact-write, or adapter-return capability.
Unknown-submit/recovery never resubmits an uncertain attempt.

Style-master generation remains a separate receipt-free bootstrap operation, but its effective prompt
must bind the canonical style prompt and `deck_system.txt` bytes. A bypass such as
`--no-deck-system` must either be included as an explicit choice in the style-master profile digest
or be rejected on a production route; it cannot silently reuse authorization for a different prompt.
A debug/test-only route may retain the flag with no production evidence. Style-master authorization is
still explicit and separate from per-slide raw authorization.

Readiness is source/operation aware:

```text
doctor --mode image2-page-authority
doctor --mode image2-page-authority --run-dir <canonical-run> \
  --operation <full-build|raw-generation|framed-local-refresh|assembly-notes>
```

An unbound invocation reports independent offline profiles and makes no aggregate source-ready claim.
A run-bound invocation resolves the current protocol first; legacy or corrupt runs return the resolver
diagnostic before readiness. The operation vocabulary is closed:

| Operation | Required profile(s) |
|---|---|
| `full-build` | `framed-runtime` when any selected slide is Framed; `image2-raw` when any selected slide needs raw work |
| `raw-generation` | `image2-raw`, plus `framed-runtime` for selected Framed slides because fit precedes authorization |
| `framed-local-refresh` | `framed-runtime` only |
| `assembly-notes` | no provider/runtime profile; current final, PPTX, and notes evidence is checked |

| Profile | Required by | Must not block |
|---|---|---|
| `framed-runtime` | Framed preflight, composition, and local Text Frame refresh | A valid local Framed refresh must not require Image2 credentials |
| `image2-raw` | Style master and any Pure/Framed raw generation | A local-only operation must not initialize it |
| common | Node, package, path, and assembly prerequisites | Nothing may bypass common integrity checks |

`environment-check` and `bootstrap-env-guidance` own these profiles. The implementation follows the
repository's package/spec Node line (22/24/26), not the stale top-level 18+ summary, and reconciles
that prose in the documentation change.

## State, Controller, And Coexistence Rules

`_state/state.yaml` remains the only mutable production-intent authority. The new version record is
`production_mode.by_version["3_versions/vN"].mode: image2-page-authority`; the source marker remains
the renderer contract; metadata remains a repairable mirror. A pure resolver returns the Page
Authority adapter only for an exact current pair. An exact recognized retired pair returns
`LEGACY_PROTOCOL_ADOPTION_REQUIRED`; a pair that partially declares Page Authority returns
`CURRENT_PROTOCOL_REPAIR_REQUIRED`; unknown, missing, malformed, or cross-paired input returns
`UNSUPPORTED_PROTOCOL_REPAIR_REQUIRED`. Neither repair result falls back to adoption, metadata,
history, prompts, or artifacts.

The Page Authority `source_epoch` is a monotonically increasing integer in the authoritative version
record (`production_mode.by_version["3_versions/vN"].source_epoch`), initialized at `1` and issued by
the state/source owner; callers cannot supply it. The source/structural transaction compares the
resolved raw-authority projection and increments the epoch once when that projection changes. The
projection includes the page-authority variant, Visual Brief registry selection and semantic digest,
identity/reference selection and registered bytes, visual-system source bytes, Pure display projection,
and reserved raw geometry. Editing only a Framed Text Frame, notes, or slide order does not increment
it. Mutating a canonical `2_backbone` source that appears in this projection must use the same
source/structural transaction for every affected current version or be rejected; direct file edits may
not silently change published raw authority. A runtime-selected raw generation-profile change, including
new generated style-master bytes, does not increment `source_epoch`, but changes
`raw_generation_profile_digest` and invalidates raw reuse/review. No second reset command or journal is
introduced; the existing transaction owns the CAS, epoch write, and recovery fence. A missing,
non-integer, decreasing, or caller-provided epoch is a state repair hard-stop.

The Controller owns intent and human choices; JS owns deterministic resolution, evidence, state CAS,
and diagnostics. One shared evaluator supplies routing, status, completion, and resume facts. New
Page Authority nodes are filtered by the resolved mode; inapplicable legacy nodes are not marked
`skipped` merely because they are inactive.

Changes to a slide's page authority are semantic source work and use preview -> exact plan hash ->
clean version materialization. They do not mutate a current version in place or infer a new variant
from old output. The existing state-owned structural transaction, reservation, journal, CAS, and
recovery fences are reused; no second migration state store is permitted.

### Explicit activation boundary

The three candidate delivery slices are applied serially and have different compatibility rules:

| Phase | New `init` / new source | Existing legacy version | Allowed bridge |
|---|---|---|---|
| Before Slice A | Current three-mode behavior | Current behavior | Existing state transition only |
| Slice A protocol cutover | Page Authority only; no new legacy choice | Read/export/diagnostic only; normal production is unavailable | No implicit conversion; legacy output remains historical evidence |
| Slice B adoption | Page Authority only | Read/export/diagnostic only; normal production remains unavailable | Read-only observation + provider-free prepare/preview/confirm/apply |
| Slice C retirement | Page Authority only | Only the bounded observer/adoption reader remains | No legacy adapter, refresh, or delivery publication |

The temporary presence of legacy implementation code is not product coexistence. It is reachable only
through bounded historical observation/export and the later adoption bridge, never through normal
stage, build, refresh, review, or delivery routing. Activation is monotonic: after Slice A no metadata
flag or source edit re-enables legacy production; a deployment rollback is the only release-level
rollback, and no in-bundle downgrade is supported.

## Proposal Gate

This roadmap is deliberately not an OpenSpec proposal. It is not ready to create one until all of the
following are true:

1. The parent roadmap and every working paper agree on target vocabulary, the one finalization
   Interface, readiness/profile names, legacy reachability, and raw/final evidence identity.
2. The visual-language registry, Agent-reference registry, raw/final review chain, and adoption
   transaction each have a closed owner, schema decision, invalidation rule, and focused test set.
3. The exact main-spec ledger passes both title-existence and affected-requirement coverage audits; no
   legacy parser is called `Collapse` unless the observer contract names its exact inert output.
4. Independent architecture, contract, deck-semantics, and main-spec reviews find no proposal blocker.
5. The observed test baseline has a named owner/exclusion or is clean at a recorded code checkpoint.

Only then may a later, explicit user decision create an `openspec/changes/` entry. `Apply ready` is a
future property of reviewed OpenSpec artifacts and implemented tasks, never of this backlog roadmap.

## Candidate Delivery Slices (Not OpenSpec Changes)

These are dependency sketches, not Change IDs or authorization to create one. They must not be applied
in parallel, and each must leave a valid repository before the next begins. A future proposal may rename,
merge, split, or reorder them only after satisfying the Proposal Gate.

### Slice A: Page Authority protocol cutover

**Purpose:** add the Page Authority protocol end to end for new production and make legacy production
unreachable while preserving bounded historical bytes/diagnostics needed for later adoption.

**Scope:**

- Add the fixed source marker/state pair, deck default, per-slide authority resolver, typed Text Frame,
  provider-safe visual-language registry, identity-scheme preservation, and deterministic source
  diagnostics. The registry is implemented under existing `visual-config` and
  `visual-asset-management` ownership; no new capability name is introduced. Identity/reference is
  optional per deck, but a selected profile must be registered and byte-verified; the amber-agent
  profile is a provider-free pilot fixture, not a hidden default.
- Add a distinct `page-authority-image2` adapter under `image-production`; do not overload the current
  whole-page adapter or Canvas header-lock module.
- Add the receipt-bound raw generation, authorization, raw manifest, raw review coverage, deep finalizer,
  final manifest, final projection, PPTX, notes, and completion evaluator for mixed Pure/Framed decks.
- Implement the Framed compositor through the narrow typed seam and retain only protocol-neutral HTML
  runtime primitives needed by it.
- Add source-aware readiness, playbook/controller routing, state registration, CLI commands/diagnostics,
  and run-bundle layout ownership. Direct paths must be fenced before provider/readiness/artifact work.
- Keep only the legacy records and code required for bounded observation/export and later adoption;
  no legacy production route is reachable from new init, Page Authority source, or normal commands.

**Primary capability owners:** `content-parsing`, `image-production`, `image-generation`,
`pipeline-orchestration`, `node-specification`, `cli-surface`, `pptx-assembly`, `notes-injection`,
`run-bundle-layout`, `run-bundle-management`, `slide-identity-and-ordering`, `playbook-execution`,
`environment-check`, `bootstrap-env-guidance`, `style-master-generation`, `visual-config`,
`visual-asset-management`, and `commands-reference`. `header-lock` is modified only to fence its
legacy ownership; it does not own the new compositor. `html-render-runtime` is modified only for the
shared runtime seam. No new capability is added unless OpenSpec proves that an existing owner cannot
hold the durable Page Authority responsibility.

**Exit evidence:**

- A fresh run delivers a mixed Pure/Framed deck through one final manifest and one assembly/notes
  lineage.
- A Framed Text Frame refresh makes zero provider calls, preserves current raw review coverage under
  the exact retention rule, and renews final delivery evidence.
- A Pure text change changes the raw contract, cannot reuse stale raw material, and requires fresh
  authorization and raw review.
- Partial/stale raw review coverage blocks finalization before writes.
- Direct raw prompt/style/output routes cannot bypass the receipt or authorization boundary.
- Legacy fixtures remain readable/exportable and every normal legacy command hard-stops before
  state/provider/generated-artifact work.

### Slice B: Explicit legacy adoption

**Purpose:** make historical runs explicitly adoptable and activate the adoption-only boundary;
historical routes may no longer remain an implicit current production choice.

**Scope:**

- Add one deterministic, read-only `inspectLegacyProtocol` module. It recognizes only an intact,
  canonical source/state pair (`html-first-v1` with its recorded HTML mode, or
  `whole-page-image2-v1` with `image2-only`) and returns protocol, source/state SHA, stable IDs, a
  bounded historical-artifact summary digest, and the single next action. It never returns an adapter,
  writes state/source/generated files, copies artifacts, calls a provider, or publishes evidence.
- Reuse and generalize the existing state-owned versioned transition transaction. The source-version
  `_scratch/production-mode-transition/plan.json` contains an adoption subrecord for every retained
  stable ID, the candidate source SHA, the observation digest, explicit target default,
  `pure-image2`/`framed-image2` choice, Text Frame disposition, visual-brief/reference disposition,
  speaker-note disposition, and additions/removals. The exact outer plan hash covers every row.
- Require preview, exact hash confirmation, target reservation/staging, target-intake confirmation,
  CAS, clean target publication, and crash recovery. There is no visible target before apply and no
  copied `_generated/`, review, approval, provider, or execution evidence in the target.
- Reinspect source/state/artifact-summary bytes at apply and reject drift. No full-page/header-lock
  heuristic mapping is allowed; each retained slide must be explicitly authored. Legacy prompts and
  pixels are evidence only, never Page Authority raw or final authority.
- Validate the candidate provider-free, then run a separately authorized pilot containing at least
  one Framed content slide, one Pure slide whose visible display text is provider-owned (the carrier
  page case), and one local Framed text refresh before any broad rebuild.
- Make normal legacy init/stage/build/refresh/review/delivery entry return one typed
  `LEGACY_PROTOCOL_ADOPTION_REQUIRED` diagnostic with the adoption preview as its only next action.

**Primary capability owners:** `node-specification`, `run-bundle-management`, `run-bundle-layout`,
`slide-identity-and-ordering`, `cli-surface`, `workflow-inspection`, `playbook-execution`,
`pipeline-orchestration`, and `commands-reference`.

**Exit evidence:** preview and materialization make zero provider calls; source and target remain
byte/ownership isolated; exact plan hash and target-intake facts bind apply/recovery; a representative
legacy run reaches a clean Page Authority target with explicit variants; all pre-adoption legacy entry
points hard-stop before provider/generated writes.

### Slice C: Retire the legacy production surface

**Purpose:** after the new protocol and adoption bridge are proven, remove historical production
families as current behavior and synchronize the main specifications with the code.

**Scope:**

- Remove `html-first`, `html-only`, `html-then-image2`, whole-page/header-lock production, and
  visual-slot refinement from current init, build, refresh, review, CLI, Controller, and playbook
  choices.
- Preserve only the bounded legacy observation/adoption reader from Slice B. Keep HTML browser/font
  capture requirements that are protocol-neutral and used by the Framed compositor; remove the HTML
  source/catalog/delivery contract and old final-pixel route.
- Extract or re-home shared runtime primitives before deleting `html-slide-contract`,
  `html-slide-rendering`, or `html-render-runtime` requirements. Do not delete a font, CSP, network,
  timeout, or cleanup guarantee that the Framed compositor still needs.
- Remove retired adapters, state records, artifact ownership, commands, fixtures, and active docs only
  after their replacement/compatibility owner and tests exist.
- Apply a requirement-level disposition (`replace`, `retire`, `collapse`, or `keep`) to every affected
  main-spec requirement in the same change. Active specs, Charter, COMMANDS, workflow, script
  inventory, and tests describe Page Authority as the only current production model. Historical terms
  remain only in the named compatibility reader, migration scenarios, or explicitly labelled fixtures.

**Primary capability owners:** `framework-charter`, `framework-directory-layout`,
`framework-script-layout`, `commands-reference`, `visual-slot-refinement`, `header-lock`,
`html-slide-contract`, `html-slide-rendering`, `html-render-runtime`, `visual-config`,
`visual-asset-management`, plus all Slice A/B owners.

**Exit evidence:** the normal resolver has exactly one successful Page Authority result; a legacy run
gets adoption guidance only; active CLI/help/playbook/spec scans do not present retired routes as
choices; every affected requirement has a deliberate disposition and a migration reason; focused
tests prove both the new route and the absence of old active routes.

## Main-Spec Cleanup Inventory

Capability-level labels are not enough for cleanup. Slice C must keep a requirement ledger with the
exact requirement heading, disposition, replacement owner, migration behavior, and focused test.
The minimum inventory is:

| Capability | End-state disposition | Required end state |
|---|---|---|
| `content-parsing` | Replace + collapse | Page Authority is the only current source grammar; legacy parsing is observation-only |
| `image-generation` | Replace | Raw generation is receipt-bound Page Authority material; old whole-page lineage is compatibility-only |
| `image-production` | Replace | One active adapter with Pure/Framed branches and one finalization seam |
| `header-lock` | Retire + collapse | Canvas overlay/header review is legacy-only; no active final-pixel path |
| `pipeline-orchestration` | Replace | Resolver, refresh matrix, and final evidence use one current protocol |
| `pptx-assembly` / `notes-injection` | Replace | Consume only current final-slide manifest and Page Authority receipts |
| `style-master-generation` | Replace selectively | Keep the shared Image2 client, but bind the effective style prompt/system bytes and profile digest explicitly |
| `visual-slot-refinement` | Retire + collapse | No active state, command, provider route, or completion debt |
| `html-slide-contract` | Retire as source contract | Any retained typed capture primitive moves behind the Framed compositor seam |
| `html-slide-rendering` | Retire as deck-output route | Browser capture guarantees retained only as internal runtime requirements |
| `html-render-runtime` | Keep/replace | Own protocol-neutral browser/font/security runtime, not HTML page authority |
| `visual-config` | Replace selectively | Shared style/frame tokens remain; HTML-only source semantics leave |
| `visual-asset-management` | Replace selectively | Confinement and byte hashes remain; an Image2 reference registry is a namespaced submodule, and the HTML catalog cannot become its identity authority |
| `run-bundle-layout` / `run-bundle-management` | Replace + collapse | New layout exposes Page Authority; legacy paths are observation-only |
| `cli-surface` / `commands-reference` / `playbook-execution` | Replace + retire | Current choices are Page Authority; old commands return adoption guidance or disappear |
| `node-specification` / `workflow-inspection` | Replace + collapse | One active state/evidence graph; historical state is inert observation |
| `framework-charter` / script and directory layout | Replace | Current guidance names one production protocol and one bounded compatibility reader |
| `environment-check` / `bootstrap-env-guidance` | Replace | Readiness follows operation profile; local Framed work does not require provider credentials |

The cleanup is not a documentation-only fourth slice. Main specs remain truthful during Slice A,
adoption deltas land in Slice B, and exact retirement deltas are synchronized with code removal in
Slice C. A requirement is never deleted merely because this plan calls it obsolete.

## Verification Program

Each change must include focused negative tests, not only a happy-path deck:

- **Source and resolver:** direct/duplicate/aliased marker rejection; identity preservation; closed
  variant/default; Framed text exclusion; negative constraints; source/state drift; stable ID and
  position separation.
- **Deep finalizer:** Pure pass-through and Framed composition cross the same interface; dimensions,
  nonblank pixels, fonts, network denial, cleanup, provenance, and final SHA are verified; callers
  cannot pass browser/CSS/provider options.
- **Evidence:** raw image-contract and raw generation-profile digests, plus final-contract hashes;
  exact raw-review coverage; partial/stale/profile
  mismatch rejection; Framed local refresh retention; final projection/PPTX/notes lineage; deletion
  and rebuild of `_generated/`.
- **Provider boundary:** provider-call counters prove preview, validation, adoption, materialization,
  local composition, review, and notes are provider-free; authorization is exact-scope, last-mile,
  CAS-bound, and never leaks credentials/prompt/provider bodies.
- **State and recovery:** missing/malformed state is byte-preserving observation; target reservation,
  target-intake, plan hash, journal ownership, stale writer, crash recovery, and conflicting target
  all fail closed before mutation.
- **Structural/refresh paths:** mixed-authority new deck; Pure text rebuild; Framed text-only refresh;
  visual/style/frame invalidation; notes-only refresh; structural version with raw materialization;
  page-authority switch requiring a new version.
- **Legacy adoption:** known legacy observation, unknown/unsupported source, explicit per-slide matrix,
  clean target, no copied evidence, exact-hash apply, pilot, and hard-stop of every old entry point.
- **Retirement:** executable/help/controller inventory, requirement-level spec scan with bounded
  historical exceptions, no active old adapter imports, and named historical fixtures only.

Verification order is: syntax/import and focused unit tests, affected integration/E2E journeys,
`npm test`, full sweep, `openspec validate --all`, strict validation for each future change, then a clean
review of the merged main-spec diff. The baseline sweep failures recorded above must be resolved or
explicitly isolated before Slice A is declared complete.

## Deliberately Deferred

The following are not prerequisites for the central Page Authority contract:

- provider-specific reference budgeting beyond the bounded existing projection;
- automatic OCR/image-review heuristics or automatic retry policy;
- additional frame presets, arbitrary slide-local CSS/markup, or HTML-first user-facing production;
- automatic conversion of historical content, prompts, pixels, approvals, or generated artifacts.

Deferral is explicit: the Agent identity/reference registry and v1 provider-safe visual-language
registry are part of this program. Broader provider-specific reference budgeting and new identity
taxonomies remain deferred; no implementation may infer identity from an HTML catalog or old prompt.

## Definition Of Done

The program is complete only when all of the following are true:

1. New decks use `page-authority-image2-v1` / `image2-page-authority`; every slide is explicitly Pure
   or Framed in its resolved receipt (including inherited defaults), with one owner for every visible
   field.
2. A mixed deck publishes one current final-slide manifest consumed by PPTX and notes; raw and final
   evidence are byte/hash/receipt bound and review-complete.
3. Framed text refresh is provider-free and honestly local; Pure text change cannot reuse stale raw
   material; all refresh paths match the invalidation matrix.
4. The Framed compositor is a deep module behind one typed interface, with deterministic fit, runtime,
   security, and artifact verification evidence.
5. Preview, adoption, structural materialization, local composition, review, and notes never make a
   provider call; only explicit last-mile authorization can do so.
6. Existing runs can leave legacy protocols only through a versioned, exact-plan-hash, provider-free
   adoption bridge that preserves stable IDs and never copies historical production authority.
7. Legacy production adapters are absent from current init, routing, help, Controller, and completion
   behavior; one bounded observer remains for safe adoption and diagnostics.
8. The v1 visual-language and reference registries are validated under existing capability ownership;
   an optional amber-agent pilot proves that a human doctrine sheet is never sent directly and only
   reviewed, checksum-bound clean role derivatives can enter selected raw contracts.
9. Every affected main-spec requirement has an explicit disposition synchronized with code, tests,
   Charter, workflow, CLI, and layout; no historical route is advertised as a current choice.
10. Core and full verification are green from a classified baseline, and strict OpenSpec validation and
   the final merged-spec review pass.

## Future OpenSpec Change Sequence

This is the complete execution sequence. These are planned Change IDs only: no
`openspec/changes/` directory is created until the Proposal Gate is passed and the user explicitly
approves the proposal.

| Order | Future Change ID | Delivers | Explicitly does not deliver |
|---|---|---|---|
| 1 | `introduce-page-authority-image2` | The new production path for new decks: the two per-slide authorities, Page Authority source/state pair, trusted visual-language and Agent-reference registries, raw/final evidence chain, `finalizePage(...)`, deterministic Framed composition, readiness, and one assembly/notes lineage. | Legacy adoption, deletion of old production code, automatic conversion of any old deck, or a third rendering authority. |
| 2 | `add-page-authority-legacy-adoption` | The sole read-only legacy observer plus previewed, hash-bound, provider-free adoption into a clean Page Authority version. Once its pilot passes, normal legacy production commands cut over to adoption guidance. | Reuse of legacy prompts, pixels, approvals, generated artifacts, or an implicit adapter/fallback. |
| 3 | `retire-legacy-production-surface` | Removal of legacy production routing, generated-artifact owners, commands, playbooks, fixtures, and main-spec requirements; only the bounded observer and shared Framed runtime primitives remain. | A rewrite of the new Page Authority path, new visual modes, or deletion of the adoption observer. |

The changes are strictly serial. Change 1 makes Page Authority the only choice for a new deck while
existing legacy runs remain usable during migration. Change 2 must prove adoption before those existing
runs are fenced from production. Change 3 removes the retired surface only after that bridge is proven;
there is no interval in which a legacy deck has neither its historical route nor an adoption route.

Each future proposal must map its tasks and delta specs only to the scope in its own row, carry forward
the preceding change's verification evidence, and leave the repository valid before the next proposal
is created. Work that introduces a third authority, free-form provider prompt ingress, HTML as a
user-facing production mode, or automatic legacy conversion is out of scope for all three changes.
