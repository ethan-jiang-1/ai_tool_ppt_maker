## Context

See [proposal.md](proposal.md) for motivation. C4 now gives each current page a
single workflow-isolated presentation projection with value-level provenance.
Both adapters compile that projection, the parsed receipt, Page Image Core
facts, raw contract, and exact provider request into a complete candidate before
the progressive raw owner makes a plan current. The resulting raw plan is
provider-free, but its useful intermediate facts are currently either in memory,
inside owner records, or in the provider-input inspection sidecar.

That sidecar can contain request JSON under `prompt`, while `_generated/nav/`
is intentionally forbidden from exposing raw prompt prose. Existing
`pageImageWorkflowPaths()` is the public path authority for version-generated
artifacts, and `_generated/` is always rebuildable. The implementation must
reuse those boundaries, not treat published files as new input or lifecycle
storage.

## Goals / Non-Goals

**Goals:**

- Make the complete pre-spend chain inspectable per page: parsed receipt,
  resolved layout, reviewable page model, generation semantics, exact request,
  and Framed's exact local HTML.
- Publish the same typed facts the selected adapter already compiled, with
  stable identity, direct lineage, provenance, and explicit invalidation facts.
- Keep publication all-or-nothing for one candidate and outside every paid or
  human-decision path.
- Make the derived directory discoverable only through the shared Run Bundle
  layout interface and mechanically testable against the schema inventory.

**Non-Goals:**

- No provider call, grant, batch, submission, receipt rewrite, review decision,
  acceptance state, or new CLI command.
- No editable source mirror, Human Navigation copy, query/selection API,
  general artifact browser, or lifecycle-history index.
- No historical-protocol reader, migration, backfill, old-directory import, or
  production Run Bundle access. A missing C5 tree becomes available only after
  the next successful current `image2 plan`.
- No C6 protected-composition changes, including geometry semantics,
  `subject_restrictions`, or provider transport capability work.

## Decisions

### 1. Publish at the candidate-to-current-plan boundary

The selected adapter remains the sole compiler. After it has built and fully
validated its complete candidate (and, for Framed, completed the existing
overlay proof), it supplies the page facts to one shared deterministic
publisher. The publisher completes before `publishProgressiveRawWorkPlan()`
makes the progressive plan current and before the CLI exposes the existing
authorization action.

The publisher is JS-owned mechanical work. The MD Controller retains intent,
path selection, and conversation; the raw owner retains plan, grant, attempt,
and review authority. Failure is a plan-materialization integrity hard-stop,
not a new gate: the candidate does not become a current raw plan, no provider
is initialized, and the existing direct repair route remains the only next
action.

Alternative considered: publish after authorization or from a provider-input
inspection rebuild. Both make the chain unavailable at the point the owner can
still correct it without cost and risk publication drift from the actual
candidate. Publishing it as a separate controller state would duplicate raw
owner authority, so it is rejected.

### 2. Use one shared publisher, with adapters supplying typed facts

Add a small shared image2 module (for example,
`scripts/shared/image2/page_derived_data.mjs`) with a narrow input contract:
the validated source receipt; ordered stable IDs; resolved page projection;
Page Image Core page facts; raw-plan/item lineage; exact compiled provider
input; and the Framed-only deterministic header HTML. It validates the
cross-page identity and digest joins, serializes canonical JSON/UTF-8 bytes,
and returns a publication report for the adapter to attach to the existing
planning result.

The module does not parse source, resolve profiles, compile a provider request,
render a header, determine staleness, or read a previous derived tree. Those
facts come only from the existing parser, resolver, Core, selected adapter, and
header renderer. This keeps C5 a projection writer rather than a new compiler.

`page-render-model` is assembled from the source receipt, selected layout, and
registered visual selection as the complete pre-provider page representation.
It intentionally excludes the generation spec and exact request. Conversely,
`page-generation-spec` holds the Core's normalized semantic bindings and
`image2-request` holds the exact adapter serialization plus its digest. The
Framed writer receives the header renderer's actual HTML output; it does not
recreate HTML from a second JSON controller. Pure supplies neither HTML nor a
placeholder.

Alternative considered: have each adapter write its own directory. That would
duplicate path, provenance, index, atomicity, and workflow-presence rules, and
would make a later new adapter expensive. A generic shared writer with
adapter-owned typed inputs preserves the existing policy boundary.

### 3. Give derived data one private, agent-facing layout

Extend `page_image_paths.mjs` and its public `bundle_layout.mjs` re-export with
the one canonical root:

```
_generated/page_image_workflow/derived/
  index.json
  pages/<slide_id>/
    page-source-receipt.json
    page-layout.json
    page-render-model.json
    page-generation-spec.json
    image2-request.json
    framed-header.html             # Framed only
    page-artifact-index.json
```

`index.json` identifies the exact plan/source/workflow publication and lists
pages by current position plus stable ID. It records the purpose, adjustment
scope, downstream controller, and rebuild impact for each stage without copying
the stage payload. Each per-page index points at sibling artifact paths and byte
digests and has the same compact explanation, plus an observational availability
value limited to the plan-stage artifacts that C5 actually publishes. It does
not later become a mutable ledger for provider attempts, reviews, finalization,
or delivery.

Every JSON artifact uses an envelope with its declared current stage/role,
producer, stable page ID, exact plan/source/workflow bindings, direct upstream
artifact references, and an `invalidated_by` mapping. The mapping is a compact
explanation of direct input digests and source/configuration facts, not an
alternate invalidation evaluator. `image2-request.json` stores canonical UTF-8
request text and the digest the adapter submits. Raw prompt prose is therefore
available to the Agent through this directory but has no route into
`_generated/nav/`, CLI diagnostic JSON, or Human Navigation copies. The
existing aggregate provider-input inspection keeps its current contract and is
not an input to or copy of this per-page tree.

Alternative considered: one giant deck JSON or a Human Navigation subtree. One
giant file prevents independent stage inspection; Navigation must be safe for
human browsing and explicitly excludes raw prompt prose. Both alternatives
would obscure the ownership chain.

### 4. Publish as one validated replacement, never as current authority

The publisher builds every artifact in a private temporary sibling, writes
canonical bytes, hashes and cross-validates all references, then replaces the
canonical derived root only with that complete tree. The previous root is
retained only until replacement succeeds and is never an input. A staging,
missing, or manually changed tree is not a valid partial publication and is not
read to recover a candidate. This is an all-or-nothing logical publication; no
concurrent-reader protocol or persistent publication head is introduced.

The exact progressive plan hash and source/configuration digests name the
publication's lineage. Existing invalidation continues to compare the parser,
resolver, Core, and raw-plan bindings directly. A source or selected-profile
change can leave an old generated tree on disk, but it cannot make it current,
authorize work, preserve review evidence, or affect classification. The next
successful plan replaces it wholesale.

Alternative considered: an append-mostly C5 history with a current pointer.
That would create an unnecessary lifecycle owner and CAS state merely to retain
rebuildable inspection output, contradicting the simplest-control requirement.

### 5. Preserve the one human control path

The C5 directory is an advisory inspection surface: it helps the Agent explain
what will be sent, but cannot be accepted, waived, selected, or repaired in
place. Complete Page Review remains the only page-quality decision, and its
existing `proceed | repair` semantics and evidence stay unchanged.

This follows `human-centered-gates.md`: success is guide-only; publication
integrity failure protects the existing plan's source/provenance invariant and
has one direct repair action, without a new human confirmation. It follows
`agent-assistance-and-control.md`: the publisher writes a projection from
current owners, while the Agent can inspect and explain it without becoming a
new controller. It follows `simple-reliable-control.md`: publication adds no
validator/retry/fallback stack and short-circuits only before the existing plan
would expose authorization.

## Risks / Trade-offs

- **Raw provider prose is accidentally exposed through Human Navigation or a
  diagnostic** -> Keep C5 paths out of Navigation's artifact whitelist, do not
  add them to CLI diagnostics, and assert both negative cases in tests.
- **Published artifacts drift from the bytes the provider would receive** ->
  Serialize adapter-supplied canonical request bytes and validate their digest
  against the candidate/raw-plan binding; do not reconstruct a prompt in the
  publisher.
- **A Framed JSON/HTML pair becomes two header authorities** -> Publish only
  the header renderer's HTML. Structured header/profile facts remain in
  `page-layout`, and tests reject a sibling controller JSON.
- **Partial output is mistaken for a plan** -> validate a complete temporary
  tree before replacement and only publish the progressive plan afterward;
  tests force one-page serialization failure and assert no current plan,
  provider work, or partial root.
- **Scope expands into post-provider lifecycle tracking** -> keep the index's
  observation bounded to plan-stage artifacts and leave C6/finalization out of
  C5 tasks and test fixtures.

## Migration Plan

1. Add the current generated-layout constants and C5 schema/inventory entries.
2. Implement and unit-test the shared validator/publisher against synthetic
   candidate inputs.
3. Pass typed candidate facts from Framed and Pure planning through the shared
   publisher before their progressive plan publication.
4. Extend layout, schema-conformance, integration, and mock E2E coverage.
5. Run focused tests, `npm test`, strict OpenSpec validation, layout self-check,
   and whitespace validation. Record every success, failure, and recovery in
   this change's `tasks.md` as the apply work occurs.

There is no data migration or backfill. Existing production bundles are not
read, modified, or used as fixtures. Current bundles receive the new tree only
by running a successful current plan; a rollback removes Harness code and the
tree remains non-authoritative rebuildable output.
