# Page Production Short References Research

> 类型: 已关闭研究 / 设计记录 | 状态: 已完成（CLS-024） | 初始日期: 2026-08-06 | 关闭: 2026-08-09

## Question

Can the proposed short references for progressive Page Production make the
Controller collaboration card easier to read without weakening the complete
SHA-256 protocol identity, storage, or paid-operation contracts?

## Primary Findings

### Full digests are protocol identity, not page identity

The progressive schema accepts a digest only when it is exactly 64 lowercase
hexadecimal characters. It uses those digests in cross-record bindings and in
the provider idempotency-key format. The store then uses the exact plan,
batch, attempt, and provenance digests directly in immutable record paths and
locks.

Sources:

- [Progressive schema](../../ppt_maker_harness/scripts/shared/image2/page_authority_progressive_schema.mjs) (`SHA256_RE`, `IDEMPOTENCY_KEY_RE`, and `assertDigest`)
- [Progressive store](../../ppt_maker_harness/scripts/shared/image2/page_authority_progressive_store.mjs) (`progressiveRawStorePaths`, immutable record publication, and plan locks)
- [CLI surface specification](../../openspec/specs/cli-surface/spec.md) (the fixed `image2` commands require exact `--plan-hash`, `--batch-hash`, and `--attempt-sha256`)
- [FIPS 180-4](https://csrc.nist.gov/pubs/fips/180-4/upd1/final), the SHA-256 specification (a SHA-256 digest is 256 bits, conventionally represented by 64 hexadecimal characters)

Conclusion: retaining complete digests in owner records, storage paths,
idempotency inputs, diagnostics, and direct CLI selectors is correct. A
display-only layer must not alter any of them.

### The task card is the correct presentation seam

The current renderer holds full owner facts in its in-memory payload, then
prints them in three human-visible places: Owner References, typed handoff
`reference=...` fields, and the HTML comment's payload digest. The refresher
returns a full `projection_sha256`, but no runtime code parses the rendered
card as authority input. Existing specifications explicitly require the card
to be rebuildable and non-authoritative.

Sources:

- [Task-projection renderer](../../ppt_maker_harness/scripts/shared/workflow/page_production_task_projection.mjs) (`ownerReferences`, `renderReferences`, `renderHandoff`, `renderPageProductionTaskProjection`, and `refreshPageProductionTaskProjection`)
- [Workflow inspection specification](../../openspec/specs/workflow-inspection/spec.md) (inspection neither reads nor relies on the card)
- [Playbook execution specification](../../openspec/specs/playbook-execution/spec.md) (the card cannot authorize cost, resume work, or choose a node)
- [Run-bundle layout specification](../../openspec/specs/run-bundle-layout/spec.md) (the card remains separate from raw-production ownership)

Conclusion: build the display mapping only after owner facts are already
validated, inside the card-rendering boundary. Do not put it in the raw owner,
store, provider adapter, or CLI selector path.

## Proposal Blockers

### An unbounded shortest prefix can leak a complete digest

The proposal currently asks for the shortest unique prefix of at least eight
hexadecimal characters. Two distinct same-kind digests can share their first
63 hexadecimal characters and differ only at the final character. For that
input, a pure shortest-prefix algorithm emits all 64 characters. This violates
the proposed card acceptance rule that human-visible text contain no complete
64-character digest.

This is a deterministic property of prefix comparison, not a likelihood claim.
The implementation must therefore set a display bound and define a collision
form that is not a longer raw prefix. A suitable first-phase rule is:

1. use an eight-character prefix when unique within the card and kind;
2. for a collision group, retain the bounded prefix and append a deterministic
   ephemeral rank, for example `p-671d4555~1` and `p-671d4555~2` after sorting
   distinct full digests lexically;
3. deduplicate identical `(kind, sha256)` entries before ranking;
4. document that the result is meaningful only together with the card's deck
   and run scope, and is never a CLI selector.

The exact maximum prefix length may be chosen during OpenSpec design, but it
must be bounded below 64 and covered by a synthetic near-total-prefix
collision test.

### Free-form handoff notes bypass the structured-field rewrite

`safeNote` only normalizes whitespace and length. `renderHandoff` then writes
the note verbatim. A human note can therefore contain a 64-character hex
token even after structured owner references and the HTML comment are changed.

Source: [Task-projection renderer](../../ppt_maker_harness/scripts/shared/workflow/page_production_task_projection.mjs) (`safeNote` and `renderHandoff`).

The proposal must choose one policy before implementation:

- redact every full SHA-256-looking token from the rendered note while
  preserving the persisted note unchanged; or
- narrow the no-full-digest acceptance criterion to structured protocol fields
  and explicitly allow free-form note content.

The first policy better matches the stated collaboration-card goal. Its tests
should include a note containing a known and an unrelated 64-character token.

## Scope Corrections

- `resolve(reference)` has no first-phase consumer: short references are not
  accepted by any CLI operation or Controller authority path. Keep the index
  one-way (`describe`) in the first change, or specify `resolve` as a strictly
  card-scoped, display-only helper with no caller outside the renderer. Adding
  it without a consumer creates an apparent selector capability and expands
  its error contract needlessly.
- Define a fixed, validated kind-to-prefix table in the specification. Do not
  derive kind from a Markdown label. The human-readable label can remain the
  semantic explanation; `p-...` and `b-...` are typed display references, not
  durable semantic IDs.
- Include every structured digest renderer input in one collected card-scoped
  entry set, including handoff references. Preserve a stable output for the
  same set regardless of entry order.
- The change must update `playbook-execution` and `run-bundle-layout`, which
  define what the card contains. `workflow-inspection` is intentionally
  unchanged because it must continue returning full owner facts and must not
  read the card. A `cli-surface` delta is warranted only if it adds an explicit
  non-regression statement for direct JSON/full selectors; it should not
  redefine the producer schema.
- The source links and terminology in the plan still use the retired
  `PPTMAKER_FRAMEWORK` directory and “framework source”. Update them to
  `ppt_maker_harness` and “Harness source” before opening the change.

## Decision

The design direction is sound and should proceed to an OpenSpec proposal after
the two blockers above are resolved in the plan. The recommended first change
is deliberately narrow: typed, card-scoped display references only; complete
digests remain in all authority and direct CLI surfaces; no migration and no
short-selector resolver.

## Current-HEAD Addendum (2026-08-09)

### Status

**Resolved for the agreed human-facing Page Image artifact path.** The original
display-only conclusion was superseded and implemented by
`introduce-short-physical-human-artifact-paths`, committed as
[`d8b9389`](../../openspec/changes/archive/2026-08-09-introduce-short-physical-human-artifact-paths/tasks.md).
The supported human entry is now a real, short physical copy tree, rather than
a short label referring a person back to a SHA-heavy locator.

This is intentionally **not** a rename of every internal generated directory
or immutable owner record. SHA-named storage remains in place below internal
owner roots. That is an explicit, current contract boundary rather than an
unnoticed incomplete migration.

### Evidence

- [`run-bundle-layout`](../../openspec/specs/run-bundle-layout/spec.md)
  requires `_generated/nav/index.md` as the sole canonical human entry and
  limits every component below `_generated/nav/` to 1--24 safe ASCII
  characters with no full SHA-256. Its immutable-owner scenario explicitly
  preserves the canonical SHA directory while keeping it out of the human
  path.
- The [Human Navigation Path writer](../../ppt_maker_harness/scripts/shared/image2/page_image_human_artifact_reference.mjs)
  assigns typed eight-hex display bases, bounded collision/occurrence suffixes,
  validates the resulting filename component, and writes regular copies to
  `nav/art/`; it neither creates links nor exposes the original locator.
  The [display-reference module](../../ppt_maker_harness/scripts/shared/workflow/page_production_display_references.mjs)
  fixes the digest portion at eight characters and handles collisions with a
  deterministic suffix.
- [`image2 artifact-view`](../../openspec/specs/cli-surface/spec.md) returns
  only the short index/root for a current supported run. The
  [Agent contract](../../ppt_maker_harness/charter/AGENT_CONTRACT.md) requires
  inspection handoffs to cite that index and forbids SHA-named storage
  locators.
- The delivered run has the physical tree at
  [`deck_dark_factory_current/3_versions/v1/_generated/nav/index.md`](../../deck_dark_factory_current/3_versions/v1/_generated/nav/index.md):
  for example, its PPTX is `art/x-2a110293.pptx` and its page images are
  `art/m-5a67bff4-{1,2,3}.png`. No 64-hex token occurs in that `nav/` tree.
- The [navigation writer tests](../../tests/shared/image2/test_human_artifact_reference.mjs)
  cover 24-character components, eight-character collision names, regular
  copies, regenerated edited copies, no full SHA/source locator in the index,
  and failed-publication preservation. They passed at current HEAD on
  2026-08-09. The [CLI contract suite](../../tests/contracts/test_human_artifact_reference_cli.mjs)
  covers current Pure/Framed/Pilot/review/delivery views, no state/provider
  mutation, and the unsupported-v2 hard-stop.

### Remaining Boundary And Recommendation

The same delivered run still contains SHA-named directories below
`_generated/page_image_workflow/review/complete-page/`; the archived change
lists renaming immutable directories, CAS naming, receipts, and state records
as non-goals. Those paths are protocol/internal storage, not supported human
navigation.

Therefore this research item needs no active follow-up plan for the stated
human usability outcome: humans should use `_generated/nav/index.md` and its
`nav/art/` files exclusively, and that behavior is implemented and verified.
By explicit owner decision, this resolved research record is archived as
`CLS-024` under `_done/_closed_plans/`.
If the intended requirement is instead that **every** directory and filename
inside a deck, including immutable internal owner storage, must be short, that
is unresolved by design and requires a new OpenSpec proposal. It would change
the current SHA-addressed integrity and recovery boundary, so it should not be
treated as a follow-up patch to the completed navigation feature.
