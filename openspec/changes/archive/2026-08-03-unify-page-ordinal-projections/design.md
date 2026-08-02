## Context

See [proposal.md](proposal.md) for motivation.  Target-v2 final manifests
already validate and write `NN_slideID.png`, but the format expression is
duplicated locally.  Rebuildable v2 raw files and both Pilot publishers still
write bare stable IDs.  Their progressive plan, materialization, accepted
evidence, and direct records are intentionally keyed by stable ID/digest.

Target-v2 delivery assembles a PPTX in `05-delivery/index.mjs`; bounded CURRENT
delivery uses `internal/page_authority_pptx_assembly_v1.mjs`.  Each currently
adds only a full-page image.  The two writers need the same small visual
annotation without introducing another assembly owner.

## Goals / Non-Goals

**Goals:**

- Define and reuse one ordinal filename/text formatter for Page Authority
  human-facing page projections.
- Rename only rebuildable raw/Pilot image files and preserve their stable-ID
  evidence interfaces.
- Add an identical, readable footer in both Page Authority PPTX writers.
- Verify the behavior through direct artifact tests and generated PPTX XML.

**Non-Goals:**

- Migrate, rename, or hand-edit existing run bundles or `_generated/` trees.
- Change raw-plan, accepted-evidence, CAS, provider-attempt, provenance,
  receipt, or source schema.
- Add a page-number setting, a second order store, a new gate, or a provider
  call.
- Change bounded CURRENT manifest filenames; target-v2 final filename behavior
  is the production contract covered by this change.

## Decisions

### 1. One shared derived-ordinal formatter

The existing shared Page Authority artifact module will export a formatter for
a positive `position` and valid stable `slide_id`.  It will return
`String(position).padStart(2, "0") + "_" + slide_id + ".png"`; a companion
ordinal-text formatter will return the same padded number without the suffix.
Final-manifest creation and validation will call it rather than reproduce the
string expression.

JS owns this pure projection because it is deterministic artifact formatting,
not a Controller decision.  The source document remains the direct owner of
order, and the raw/final plan or manifest remains the direct owner of the
current ordered IDs.

Keeping format expressions local to each writer was rejected because it is how
raw/Pilot/final output diverged.  Persisting a display position map was
rejected because the ordered plan already owns that fact and a second store
would need freshness and recovery rules.

### 2. Use the formatter only at derived image boundaries

`rawPath` will receive the current plan position as well as the stable ID, so
the version-derived raw image directory uses the shared filename.  Reads and
writes will derive that position from the plan's ordered items.  Pure and
Framed Pilot publishers will map each covered stable ID back to its position in
the complete current plan before writing images; they will not renumber a
subset.

The raw-byte maps and Pilot evidence objects remain keyed by `slide_id`; their
current field sets and hashes stay unchanged.  In particular, an existing
accepted-evidence `path` is a stable evidence field, not the derived browsing
path.  Adding presentational paths to immutable Pilot evidence was rejected:
it would make reordering mutate an otherwise reusable provider-evidence
record.

The only affected paths are version-derived outputs.  A normal owning rebuild
replaces them, so no compatibility reader or automatic migration is added for
old bare files.

### 3. Share a fixed footer primitive between delivery writers

A small delivery-internal footer helper will add a right-aligned, lower-right
text box with a translucent backing and the shared ordinal text.  The fixed
geometry will fit a three-digit ordinal inside the wide Page Authority slide;
there is no configuration surface.  Target-v2 calls it using the final manifest
item's `position`; bounded CURRENT calls it using the entry's one-based array
index.

JS owns this visual annotation as part of PPTX assembly.  It is written after
the full-page image and before existing notes injection; it does not change
final PNG bytes or any manifest/receipt identity.  Two separate local
`addText` calls were rejected because they could drift in format and geometry;
adding the number to generated image bytes was rejected because it would alter
raw/final evidence and require image regeneration.

### 4. Test the contracts at their smallest useful boundaries

Unit coverage will exercise formatter output at positions 1, 10, and 100 plus
invalid arguments.  Existing Pure/Framed workflow tests will assert raw/Pilot
output paths while preserving their stable-ID evidence assertions.  Delivery
tests will create minimal PNG-backed target-v2 and bounded CURRENT manifests,
open their resulting PPTX files with the existing `jszip` dependency, and
assert the expected footer text in each slide XML alongside the full-page
image/receipt behavior.

No new end-to-end test is needed: the change exposes no CLI, Controller, or
network behavior.  Focused integration tests cover the two delivery owners and
the workflow-derived output paths; the full repository verification remains
the regression sweep.  Generated PPTX output will additionally be visually
inspected when the locally available renderer can render it, without making a
renderer a runtime dependency.

## Risks / Trade-offs

- [A raw reader misses a renamed derived file] -> Every runtime raw read/write
  will route through the same positional helper; fixture tests exercise both
  materialization and readback.  Old generated output is rebuilt by its owner.
- [A Pilot sample gets renumbered from one] -> Publishers derive its prefix
  from the complete plan, and a subset-at-position-ten regression test locks
  the behavior.
- [A footer disappears during notes injection] -> Delivery tests inspect the
  completed PPTX after notes injection, not the pre-injection temporary file.
- [A footer is hard to read on variable imagery] -> It uses a compact
  translucent backing and contrasting text; XML tests prove its existence and
  an available local renderer is used for a visual check.
- [Changing an ordinal appears to change evidence] -> Evidence remains stable
  ID/digest keyed; tests assert no ordinal is inserted into evidence records.

## Migration Plan

1. Release the formatter, derived-path writers, and footer helper together.
2. Existing source/state and irreversible progressive records remain valid.
3. On the next owning raw/Pilot/delivery rebuild, version-derived files are
   emitted with current ordinal names and PPTX footers.
4. No deck is automatically migrated or edited.  Rolling back the framework
   code does not require a state migration; generated output is disposable and
   can be rebuilt through the version's owning path.
