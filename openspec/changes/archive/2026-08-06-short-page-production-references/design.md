## Context

See [proposal.md](proposal.md) for motivation and the delta specifications for
the required behavior. The existing task-projection payload retains verified
full owner facts and the renderer is the only writer of the human-facing card.
Workflow inspection does not read that card, and the normal `state` command
already refreshes it after a read-only inspection.

The design must preserve that one-way flow. Complete digests remain exact
identity and content-addressing inputs; a card reference is only a scoped
presentation of an already validated fact.

## Goals / Non-Goals

**Goals:**

- Make plan, batch, evidence, review, manifest, and delivery facts legible in
  one progressive task card without exposing a complete digest.
- Centralize typed reference validation, collision behavior, and deterministic
  formatting in a pure helper.
- Preserve the existing payload, owner records, state, refresh eligibility,
  atomic card write, and direct CLI behavior.
- Redact complete digest-looking note text only in the rendered card.

**Non-Goals:**

- No new identifier, persistent registry, storage alias, resolver, CLI
  selector, or provider-facing value.
- No changes to raw-owner schema, content-addressed paths, locks, idempotency,
  workflow inspection, Controller routing, gate posture, or historical decks.
- No expansion to Style Master, structural transactions, or other
  hash-heavy presentation surfaces.

## Decisions

### 1. Build references only at the task-card rendering seam

The projection payload remains a full-fact machine object. Immediately before
Markdown is rendered, the renderer collects `references[].sha256` and every
present `human_handoffs.*.reference_sha256`, classifies them, and creates one
card-scoped display index. Reference rendering and handoff rendering query that
index; no other layer receives a short value.

The direct sources of record remain workflow inspection and typed Controller
handoffs. JS owns the pure formatting and redaction; the MD Controller still
uses inspection and direct owners for routing; the human makes the same
existing quality decisions. The card has no reader in the lifecycle control
path, so this introduces no writer, durable state, evaluator, or recovery
route.

Keeping the index out of the raw owner, store, provider adapter, and state
payload avoids a second identity representation. Adding display fields to the
payload was rejected because it would change the machine projection digest for
presentation-only metadata and invite a future consumer to treat that metadata
as owner fact.

### 2. Use a fixed typed vocabulary and bounded collision ranks

The renderer maps its fixed current labels to these display kinds before it
creates the index:

| Current fact | Display kind | Prefix |
| --- | --- | --- |
| raw work plan | plan | `p` |
| current batch | batch | `b` |
| Pilot or accepted raw evidence | evidence | `e` |
| Pilot decision or complete raw review | review | `r` |
| final manifest | manifest | `m` |
| delivery receipt | delivery | `d` |

The visible owner label remains the detailed semantic explanation. The prefix
only provides a compact type namespace. The same mapping applies to the
corresponding typed handoff reference: partial Pilot and complete raw review
handoffs use `r`; delivery handoffs use `d`.

The pure helper accepts only an allowed kind and a lowercase 64-character
digest. It deduplicates `(kind, digest)` pairs and normally emits
`<prefix>-<eight lowercase hex characters>`. For a same-kind/eight-character
collision group, it sorts the full digests lexically and appends that group's
one-based ordinal rank. Thus `p-671d4555~1` and `p-671d4555~2` are deterministic
within one card without ever extending a raw digest prefix toward 64 characters.

The helper provides `describe` only. An unknown kind, malformed digest, or
digest absent from the constructed index is a programmer error in the
presentation boundary, not a user-selectable recovery state. A resolver was
rejected because no first-phase consumer may select work from a short value;
adding one would require a separate scope, ambiguity, audit, and CLI design.

### 3. Keep complete facts and direct CLI surfaces unchanged

The renderer uses the display index without modifying the projection payload.
Its machine return value continues to expose the full projection digest and
full owner facts. The human-facing HTML comment no longer prints that digest,
because it has no card-scoped semantics and no runtime reader.

The `image2` exact hash selectors, workflow-inspection result, state/owner
records, raw store, provider request, and idempotency key are not touched.
This is intentionally a compatible card refresh: new output is produced only
when the existing refresh owner writes a current card.

### 4. Redact note tokens only while presenting the card

The existing note normalization remains responsible for its current bounded
presentation input. A separate rendering-only sanitization replaces every
case-insensitive, bounded 64-hexadecimal token with the fixed text
`[digest redacted]`. It does not look up or turn a note token into a display
reference, so prose cannot become a hidden selector channel.

The persisted Controller decision and note are not rewritten. The renderer is
therefore the sole reader of the redacted presentation; card deletion or manual
edit remains harmless because the next refresh returns to direct owner facts.

### 5. Reuse the existing control and gate path

There is no new quality gate, validation checkpoint, retry, fallback, or
human decision. Existing identity, integrity, authorization, provenance, and
recovery hard-stops remain owned by their current direct records and evaluators.
The card is a presentation preference, so no `guide`, `confirm`, or
`hard-stop` classification changes and no waiver can rely on a display
reference.

This is a net simplification: all short-display policy lives in one pure helper
and one renderer seam instead of being duplicated by Markdown, CLI, or
Controller call sites. The nearest action after an owner failure remains the
existing owner-issued action; display logic does not create a competing
diagnostic.

### 6. Verify behavior at the renderer, then preserve the state boundary

Focused identity tests cover validation, fixed kinds, deduplication, input
order invariance, ordinary references, same-kind collisions, cross-kind
separation, and a near-complete common-prefix pair. Task-projection tests
exercise every present `references[].sha256` and
`human_handoffs.*.reference_sha256`, the removed comment digest, and free-form
note redaction. They also verify that the machine payload and persisted note
remain complete and unchanged.

Existing normal-state tests remain the high-level seam for the authority-read-
only refresh: they verify that a card refresh does not change owner artifacts
or invoke a provider. Existing raw-owner, direct exact-hash CLI, and mock
journey tests remain the compatibility regression layer. New E2E coverage is
not necessary unless the focused state-boundary coverage cannot observe the
full-digest direct CLI contract after implementation.

## Risks / Trade-offs

- **[Card-scoped references can change when the candidate set changes]** ->
  This is deliberate and documented; labels, deck, and run scope remain
  visible, and no authority consumes the value.
- **[A collision rank is less compact than a bare prefix]** -> It appears only
  in a collision group and prevents both ambiguity and full-digest leakage.
- **[Redaction can hide a digest a human intentionally typed in a note]** ->
  The original persisted note remains available through its owner; the card
  explicitly presents a bounded placeholder instead of silently modifying it.
- **[A future reference label lacks a kind mapping]** -> Keep the mapping next
  to reference collection and cover every current structured card field in
  tests; a code author must deliberately classify a new field.

## Migration Plan

No migration runs. Existing production decks, owner records, and historical
cards remain untouched until the normal current-card refresh path writes a new
derived presentation. A rollback only restores the previous renderer; any
already-written short card remains non-authoritative and can be rebuilt under
the restored code without owner-data recovery.
