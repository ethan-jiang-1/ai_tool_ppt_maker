## Context

`ppt_flow new-version` deliberately uses `createVersion()` for a source-only
filesystem copy. That is correct for derived-artifact cleanliness, but a copied
selected Page Authority source is not usable when the deck-level Controller
still points at the source version or when that completed source has no active
Controller execution. The target has no durable mode by design, so normal route
resolution reaches `MODE_MISSING` before the pre-raw draft path can be used.

The observed `v6` is evidence of this missing handoff. It remains untouched:
the repair applies only to clean versions created after this change.

## Goals

- Let a new clean version of a current selected-workflow Page Authority run
  enter its existing provider-free authoring draft path.
- Preserve the source version's durable records and keep the target free of
  all production lineage and paid-work authority.
- Keep `createVersion()` as the filesystem-only owner.
- Make public CLI success contingent on both copy and state activation.

## Non-Goals

- Do not repair or mutate pre-existing unbound versions such as `v6`.
- Do not copy a mode, source receipt, Style Master selection, raw plan/grant,
  evidence, final manifest, or delivery receipt into the target.
- Do not authorize, submit, resize, or otherwise perform provider work.
- Do not add a second workflow registry or infer a workflow from metadata.

## Design

### Ownership and direct facts

`bundle_layout.createVersion()` remains the sole owner of copying
`slide-specifications.md`, overrides, and empty derived directories. The state
module owns the one new deterministic mutation. It reads the exact source
version's authoritative Page Authority mode, any active Controller binding, the
copied target's canonical Page Authority marker, and existing state maps. The
controller manifest remains the authority for the target draft route.

### Activation algorithm

After `createVersion()` succeeds, `ppt_flow new-version` classifies the source
with the existing exact-run production adapter. Only a current Page Authority
route with a selected workflow takes the activation path. The state helper then:

1. verifies the requested source has an exact current-v2 Page Authority mode
   that agrees with its source marker, and that any active Controller execution
   is bound to that same source version; an inactive source needs no inferred
   continuation pointer because the caller selected its exact run directory;
   the target source marker must declare the same current Page Authority
   protocol plus `framed` or `pure`;
2. verifies that every target lineage key is absent and validates the selected
   workflow's manifest draft route;
3. retains source durable maps, clears the old Controller execution frame while
   preserving reserved nodes, and begins one fresh `create-deck` execution for
   the target version at the selected-workflow content-authoring draft node;
4. writes state atomically, records the visible target as the continuation, and
   appends one bounded local history event.

The helper does not parse a source receipt or create a target production-mode
record. Existing Style Master and raw-plan owners continue to materialize those
facts later from their own direct inputs.

### Failure behavior

Identity, manifest, active-execution mismatch, and target-cleanliness failures
are hard-stops. The command returns the existing secret-safe CLI failure
envelope and never claims success. No rollback or manual repair of an already
visible target is introduced; a visible pre-existing unbound version is
intentionally not adopted by this change because that would loosen identity and
ownership bounds.

### Compatibility

Non-Page-Authority and non-current `new-version` copies retain their existing
filesystem behavior. Existing run bundles, including the observed `v6`, are
not migrated. New selected current Page Authority versions gain only a fresh
Controller draft, not new content or production evidence.

## Verification

- Unit/state test: activation preserves source records and creates no target
  records while binding a manifest-valid target draft from both active and
  inactive exact sources.
- Public CLI regression: create `v2` from a valid inactive `v1`, validate it,
  inspect the target state, and demonstrate that the next provider-free
  precondition is the regular Style Master path rather than `MODE_MISSING`.
- Negative coverage: source/state mismatch, an active execution bound to a
  different version, or pre-existing target lineage fails without state
  mutation or provider work.
- Run the focused suites, `openspec validate --strict`, and the full test suite
  before creating a fresh production acceptance version.
