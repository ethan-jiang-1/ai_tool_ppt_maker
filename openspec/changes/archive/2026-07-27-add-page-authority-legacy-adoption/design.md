## Context

Slice A introduced the exact `page-authority-image2-v1` / `image2-page-authority` pair and left
legacy adapters readable only as a bridge. Current production-mode transition code already owns an
exact-hash, CAS-bound source suspension, source-version scratch directory, target staging, apply journal,
and recovery path. It must remain the single writer boundary for a cross-protocol version handoff.

The bridge cannot infer Page Authority semantics from legacy content, prompts, images, approvals, or
generated artifacts. A person must select the target authority and semantic disposition for every slide.
The Agent can then create and validate the candidate, calculate evidence, and publish the target
mechanically. This design follows `human-centered-gates.md`,
`agent-assistance-and-control.md`, and `simple-reliable-control.md`: direct facts first, one durable
transaction owner, earliest failure, and one legal recovery path.

## Goals / Non-Goals

**Goals:**

- Recognize only intact, canonical legacy source/state pairs through one read-only evaluator.
- Convert a human-authored candidate into a clean Page Authority target through a preview/hash/confirm/
  apply/recovery transaction with stable-ID preservation only where explicitly declared.
- Prevent all legacy production authority, generated artifacts, provider work, and review decisions from
  crossing the version boundary.
- Replace normal legacy production dispatch with one typed adoption-required action once the bridge is
  available.
- Keep verification fast and deterministic: selected provider-free fixtures prove the protocol boundary;
  human raw review and an explicitly authorized pilot remain the only Image2 quality checks.

**Non-Goals:**

- Automatic conversion of legacy markdown, prompts, pixels, approvals, raw files, or final artifacts.
- Reusing a legacy image as a Page Authority raw/final artifact, even when its bytes look usable.
- Changing Page Authority raw generation, finalization, visual-language semantics, or adding a third
  renderer.
- Retiring the legacy observer or deleting legacy code; that is the following change.
- Running the full E2E tree during normal development or scoring Image2 aesthetics in automation.

## Decisions

### 1. One observer classifies protocol facts before any route

`inspectLegacyProtocol(canonicalRun)` will live beside the state-owned production-mode evaluator. It
reads the canonical source bytes, marker probe, exact version record, stable slide ledger, and a bounded
historical-artifact summary digest. It never reads a generated file to select an adapter, writes files,
creates state, or initializes provider code.

It returns one of four disjoint outcomes:

| Outcome | Meaning | Result |
|---|---|---|
| `recognized-legacy` | Exact `html-first-v1`/HTML mode or `whole-page-image2-v1`/`image2-only` pair | `guide` to prepare adoption; emit immutable observation facts. |
| `current` | Exact Page Authority pair | No adoption route; normal Page Authority resolution remains authoritative. |
| `current-pair-corrupt` | Either side claims Page Authority but its pair is invalid | `hard-stop` to the Page Authority repair owner. |
| `unsupported-or-corrupt` | Missing, unknown, malformed, or unrecognized cross-pair | `hard-stop` to repair/export; never infer legacy. |

The observer is the direct evaluator reused by status, inspection, adoption prepare, and legacy command
fencing. This removes per-command marker/state heuristics and gives every mismatch the same nearest
action.

### 2. Candidate content is explicit, confined, and human-semantic

The source version's existing `_scratch/production-mode-transition/candidate-run/` owns the candidate
inputs. The Agent may author its files only after the observer returned `recognized-legacy`; no CLI flag
accepts an arbitrary external source or generated-artifact path. The candidate contains a valid Page
Authority `slide-specifications.md`, the existing target intake, and an adoption identity matrix.

The matrix has one explicit row for every retained legacy stable ID and records source ID, target ID,
retained/removed/addition disposition, `pure-image2` or `framed-image2`, Text Frame disposition,
visual-brief/reference disposition, and speaker-note disposition. Each target row must bind a candidate
source slide. Fresh additions and removals are explicit. The Page Authority source parser validates the
candidate; legacy prompt/pixel values may appear only in the observer's diagnostic provenance and never
as candidate raw/final material.

The alternate design, heuristic conversion from a legacy source or image, was rejected: it would give
an unaudited old ownership model authority over final pixels. Using a second deck-level migration
directory was also rejected because the existing transition scratch already provides confinement and
cleanup semantics.

### 3. Reuse the one transition transaction; distinguish adoption by its plan kind

Prepare validates the observer, candidate, and matrix, then writes the existing canonical plan path with
an `adoption` subrecord. The outer plan hash covers source marker/state SHA-256 values, observation
digest, candidate bytes, target intake digest, every matrix row, target default, and target version.
Preview is read-only with respect to visible versions and provider state. It reports the exact plan hash,
all per-slide dispositions, and that every target slide has `needs_raw_generation`.

The human `confirm` action accepts only the exact plan hash after seeing the semantic matrix and target
intake. It records a target-intake `proceed` fact in the state owner's active transaction checkpoint; it
is not a waiver and accepts no `--reason` or `--force`. Invalid source/state/matrix/hash, a live or
uncertain journal, target collision, or source/candidate drift are `hard-stop`s because they protect
identity, integrity, or recovery. Each returns its one owning repair/recovery action.

Apply re-observes all plan-bound source and candidate facts, claims the existing journal, stages a
target-owned Page Authority run, and atomically publishes it. The target starts at `source_epoch: 1`,
has only its Page Authority source/control/state baseline, and contains no copied raw manifest, raw
review, final manifest/projection, PPTX/notes receipt, provider authorization, active execution, or
delivery decision. Recovery uses the same journal owner/age/CAS matrix as production-mode transition;
no second journal, fallback writer, or synthetic success receipt is introduced.

### 4. Fencing follows the observer rather than deleting legacy reads

After the bridge exists, `resolveRunAdapter` and workflow inspection call the observer before ordinary
legacy build/refresh/review/provider paths. `recognized-legacy` returns the producer-owned
`LEGACY_PROTOCOL_ADOPTION_REQUIRED` diagnostic and only the provider-free preview/prepare action.
`current` remains Page Authority, while corrupt outcomes retain their repair action. The legacy observer
and its bounded historical summary remain readable for adoption; only normal legacy production is
fenced. This avoids deleting the very evidence needed to safely migrate a run.

### 5. Verification proves protocol, not image quality

The default check remains the bounded core tier. A changed seam adds only its focused unit/contract or
local-render test. This change has one named provider-free adoption journey covering observer,
candidate/preview, hash confirmation, target publication, target raw-review block, and drift/recovery
rejection. It uses a deterministic fixture deck and a provider-call counter that must stay zero.

The existing Page Authority delivery journey demonstrates the real local relay boundary in about 19
seconds; it is not rerun unless that delivery boundary changes. The adoption journey must not invoke a
real Image2 endpoint, compare rendered aesthetics, or retry for visual quality. Image quality remains a
human raw-review or a separately authorized pilot after adoption.

## Risks / Trade-offs

- **A verbose adoption matrix may be burdensome for large decks** → it is intentionally explicit because
  semantics cannot be inferred safely; the Agent prepares the confined candidate and human confirms only
  the concise preview.
- **A legacy run may be malformed enough to be non-adoptable** → observer returns repair/export rather
  than inventing a legacy adapter or silently repairing bytes.
- **Transaction reuse can expose old transition assumptions** → extend the existing state owner by a
  discriminated `adoption` plan kind and add focused recovery/CAS tests instead of duplicating its
  journal or state path.
- **A clean target needs new raw generation before delivery** → this is intentional; it prevents stale
  legacy pixels from becoming Page Authority evidence. Provider authorization happens later on the
  target and is outside adoption apply.
- **A developer may use full E2E by habit** → docs and named test entrypoints select the one affected
  provider-free journey; broad sweeps are explicit release/change-boundary work only.

## Migration Plan

1. Add observer and candidate/matrix validation with no changes to existing legacy production dispatch.
2. Add the transaction forms, target staging/publication, recovery, CLI, inspection, and controller
   handoff, all provider-free.
3. Verify one representative HTML and one whole-page legacy fixture through preview/apply into clean
   Page Authority targets; verify target raw review is required before finalization.
4. Fence normal legacy production commands to the observer's adoption-required diagnostic. Existing
   Page Authority targets proceed through their normal receipt-bound lifecycle.
5. A failed or abandoned adoption remains source-byte-preserving. Recovery either removes only the
   owned staging/journal after exact validation or completes the exact confirmed target; no in-bundle
   downgrade or rollback from a published target is supported.

## Open Questions

None. The target candidate, matrix fields, and operation names will be fixed in the capability delta
specifications before implementation; no source conversion heuristic is left for implementation-time
choice.
