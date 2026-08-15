## Context

See [proposal.md](proposal.md) for motivation. The current Style Master path
mixes three unrelated roles: an optional local candidate, an accepted visual
projection, and a JPEG-specific replay obligation. The selection record is the
authority, while `style_master.jpg` is derived; however, selection replay still
performs projection I/O after its CAS commit. This makes a non-authoritative
JPEG failure visible as a lifecycle failure.

The existing final delivery path is already separate: accepted final PNGs are
converted into a fixed-profile delivery JPEG package immediately before PPTX
assembly. No Harness PDF exporter exists. The change does not define one,
move delivery behavior upstream, or introduce a state or media pipeline.

The affected public/persisted surfaces are the current layout filename, local
provenance media type/path, Style Master acceptance result/diagnostic, State
readiness, and human-navigation artifact description. This is a current-media
cutover that preserves append-only immutable history rather than a format-
preserving internal refactor.

## Goals / Non-Goals

**Goals:**

- Keep one authority chain: immutable PNG candidate bytes -> review decision ->
  selection CAS -> raw-plan binding.
- Isolate JPEG encoding to the already-owned final delivery package without
  changing final PNG bytes, review evidence, or delivery profile.
- Remove the post-selection JPEG projection, its replay branch, and its
  diagnostics so acceptance has one terminal successful result.
- Make old JPEG evidence attribution-only, then use the existing successor
  lifecycle to establish a new current PNG selection.

**Non-Goals:**

- Adding PDF export, changing PPTX assembly quality, or changing the
  final-PNG/delivery-JPEG manifest contract.
- Migrating, deleting, or modifying any production `deck_*` bundle or its
  immutable Style Master history as part of Harness repository maintenance.
- Re-encoding final PNGs, loosening Style Master provenance, or creating an
  alternate raw-image provider route.
- Adding a user confirmation, override, or force flag for media conversion.

## Decisions

### 1. PNG is the only current Style Master candidate representation

The Style Master owner will admit a local or generated candidate to a new plan,
and promote it as current, only when its exact bytes are CRC-valid PNG with
positive native dimensions. The optional local input changes from
`style_master.jpg` to `style_master.png`; the exact input path and PNG media
fact are recorded in existing local provenance. The local file remains
candidate source only. It never proves an accepted selection, and accepted
generated candidates do not need a root-level copy.

The persisted media enum remains able to parse an old immutable JPEG candidate
or selection. That is not a current-media compatibility route: the current
candidate builder, promotion path, State readiness, and raw-reference resolver
enforce PNG separately. Retaining the parser preserves immutable predecessor
hashes and append-only history without converting or reviving the old bytes.

JS owns the byte check, provenance, immutable record, and selection. The MD
controller only relays the owner-issued source-refresh action. This reuses the
existing Style Master candidate evaluator instead of introducing a second
format validator.

Alternatives rejected:

- Retain JPEG as an eligible new candidate and only bypass the failing
  projection. This leaves JPEG upstream of final delivery and does not meet the
  requested boundary.
- Keep the `.jpg` filename with PNG contents. That creates a misleading
  layout contract and leaves consumers to infer media from bytes.
- Transcode a JPEG automatically during planning. That silently alters
  deck-owned source and creates a compatibility/migration path outside the
  immutable candidate lineage.

### 2. Selection ends at the immutable selection CAS

Promotion will retain the existing decision and selection records, but it will
not write `style_master.jpg`, encode a JPEG, or enter a separate replay state.
The selected PNG remains reachable from the immutable candidate store; raw
planning already resolves its selected immutable bytes. Human navigation will
copy or link its own confined PNG projection from that owner rather than from a
root-level Style Master file.

The selection record is the fact authority. The CAS writer is the only writer
of acceptance, and navigation is a rebuildable replica. Removing the
post-CAS projection makes an otherwise valid selection idempotent without
requiring recovery for an unrelated filesystem write.

Alternatives rejected:

- Replace the JPEG projection with a `style_master.png` projection. It would
  retain the same dual source/projection path and another post-CAS I/O branch
  without adding authority.
- Make navigation read arbitrary files in `visual-style/`. That would make a
  filename an input selector instead of using the exact selected candidate.

### 3. JPEG remains exclusively final delivery media

Shared delivery continues to derive a fixed-profile JPEG from every accepted
final PNG after its manifest validates and before PPTX assembly. It is the only
active JPEG writer; the declared delivery package and PPTX assembly are the
only current consumers of newly derived JPEG. Historical immutable JPEG
records remain readable only for audit and predecessor binding. The existing
manifest binding, image dimensions, alpha flattening, and rebuild behavior
remain intact.

The final PNG manifest is the fact authority. Delivery owns JPEG derivation;
PPTX assembly consumes the declared delivery package; no Style Master, raw,
review, or navigation owner may consume a JPEG. This isolates lossy encoding
to the one boundary that requires it, without adding a PDF abstraction.

### 4. Cut over current paths while preserving immutable history

The layout constant, current-candidate writer, help/reference text, test
fixtures, and structure checks will change together to `style_master.png`.
Current Harness paths will not inspect or convert a root-level
`style_master.jpg`. Existing immutable JPEG records remain parseable as history
only. A JPEG selection cannot satisfy State readiness or raw planning, but it
retains its predecessor hash so the normal successor lifecycle can establish a
new PNG selection without rewriting history.

The `hard-stop` applies at the first attempted current use: raw planning cannot
continue from a JPEG selection, and JPEG bytes at `style_master.png` fail the
existing local-source validator before plan creation. The protected invariant
is exact, attributable PNG current-selection provenance. There is no
`confirm`, because JPEG-to-PNG conversion changes source bytes and selection
identity. A historical root-level JPEG file alone is not a blocker or a
migration trigger. Normal final-PNG-to-delivery-JPEG work remains covered by
the current task mandate and requires no reconfirmation.

The shortest control loop is: read the exact selection/current source -> reuse
the Style Master media validator -> report the first current PNG prerequisite
that is absent -> Agent refreshes the deck-owned PNG source when a local
candidate is wanted, or follows the ordinary replacement-selection path ->
rerun the same checkpoint. The change deletes the projection/replay special
case; it adds no state field, retry, fallback, or human-operated repair command.

This control path follows
[`human-centered-gates.md`](../../policies/human-centered-gates.md): it rejects
only the unsafe current use as a non-bypassable `hard-stop`, names the PNG
provenance invariant, and leaves the Agent the safe deck-source refresh or
replacement-selection route. It follows
[`agent-assistance-and-control.md`](../../policies/agent-assistance-and-control.md)
and [`simple-reliable-control.md`](../../policies/simple-reliable-control.md)
by keeping the existing Style Master ownership path: its candidate evaluator
validates local bytes, while the existing State and raw-selection resolvers
read the exact selection record. The removed JPEG projection/replay branch is
the complexity reduction that justifies the stricter current-media check; no
new state, validator, retry, fallback, or human confirmation is added.

## Risks / Trade-offs

- [Existing JPEG selection is treated as current after the cutover] -> State
  readiness and raw-reference tests require an exact current PNG selection;
  the retained historical record is never rewritten or promoted.
- [A test or controller still names `style_master.jpg`] -> Repository-wide
  semantic search and focused layout/CLI tests cover code, docs, fixtures, and
  active specs before release.
- [A generated selected candidate becomes harder to inspect] -> Artifact
  navigation derives its PNG copy from the exact immutable selected candidate,
  preserving a human-readable route without turning it into authority.
- [The change accidentally alters final PPTX pixels] -> Delivery regression
  tests retain the existing fixed JPEG profile and assert final PNG bytes and
  delivery manifest bindings remain unchanged.
- [Historical JPEG history becomes unreadable] -> Schema and successor-plan
  tests preserve its immutable parser/provenance path while proving it cannot
  establish readiness, raw-plan publication, authorization, or provider work.

## Migration Plan

1. Apply the current-media cutover across layout, Style Master plan/promotion,
   State readiness, CLI/artifact navigation, guidance, and tests. Remove the
   JPEG-projection implementation rather than adapting it; retain only the
   existing parser needed to read immutable historical JPEG records.
2. Run focused unit and integration coverage, followed by the relevant
   provider-free workflow suite. No real provider work is required to validate
   this deterministic media boundary.
3. Upgrade consumers together: a new Harness recognizes only
   `style_master.png` as current local source and does not write, adopt, or
   migrate `style_master.jpg`. Existing bundles and immutable history remain
   untouched.
4. For a deck that needs local existing-style work, the Deck Agent explicitly
   refreshes its source as PNG, observes the resulting replacement Style Master
   scope, and runs the normal provider-free plan/review/accept lifecycle. A
   deck may also use its ordinary generated PNG candidate route. It never edits
   `_generated/`, receipts, journals, or selection records by hand.
5. Rollback before deck refresh is a source-code rollback to the preceding
   Harness contract. After a deck refresh, rollback requires restoring that
   deck-owned source through its own version-control/source process; the
   Harness does not reinterpret new PNG lineage as old JPEG lineage.

## Verification Strategy

- **Unit**: validate PNG-only new local/generated candidate admission; reject a
  structurally valid JPEG at the current local source before plan or state
  mutation; preserve a historical JPEG selection as readable history while
  rejecting it for readiness/raw authority; verify selection replay contains no
  projection write/result; and verify raw binding consumes exact selected PNG
  bytes.
- **Integration**: exercise bundle layout/checking, Style Master command
  output and diagnostics, artifact navigation, and final delivery's unchanged
  PNG-to-JPEG package/assembly boundary with temporary initialized bundles.
- **E2E**: run the existing provider-free/mock workflow coverage with a local
  PNG Style Master. No real provider E2E is needed because the change neither
  changes provider submission nor provider response handling.

## Open Questions

None. The proposed scope uses the existing final delivery/PPTX assembly as the
only implementation of the requested final-composition JPEG boundary; it does
not imply a new PDF feature.
