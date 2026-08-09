## Context

See [proposal.md](proposal.md) for the motivation and the delta specs for the behavior contract.
Today `ppt_flow.mjs` is the cross-owner adapter: it obtains already-validated artifact facts and
passes them to `page_image_human_artifact_reference.mjs`. That renderer validates confined regular
source locators but writes only the long
`_generated/page_image_workflow/reference/human-artifact-reference-v1.md` document, which exposes
the original source locators to people.

`pageImageWorkflowPaths()` owns the path vocabulary, and `_generated/` is already the rebuildable
derived-artifact area. Immutable Style Master and progressive raw owners remain SHA-addressed and
must not be renamed or linked into a human-facing path.

## Goals / Non-Goals

**Goals:**

- Make one deep navigation Module materialize a complete short physical tree from the same
  owner-validated input already used by the artifact view.
- Keep one small Interface for the `ppt_flow` adapter: pass normalized artifact facts in and
  receive the short index/root paths out. The Module hides name assignment, copying, staging,
  confinement, collision handling, and index rendering from callers.
- Make the next explicit provider-free `artifact-view` command migrate a supported current run's
  derived human view without modifying any immutable source/evidence bytes.

**Non-Goals:**

- Do not make a Human Navigation Path a lifecycle, review, authorization, or CLI selector.
- Do not change plan/batch/attempt SHA grammar, CAS-head naming, provider calls, state records,
  delivery bytes, or the unsupported-v2 hard-stop.
- Do not rename immutable directories, use symlinks or hardlinks, scan history, or introduce a
  persistent source-to-short-path mapping.
- Do not automatically visit or migrate production `deck_*` bundles; their next explicit
  `artifact-view` invocation performs the derived migration.

## Decisions

### 1. Reserve `_generated/nav/` as a concise physical projection

`page_image_paths.mjs` will define the canonical derived navigation root
`_generated/nav/`, its index `_generated/nav/index.md`, and a short artifact directory
`_generated/nav/art/`. `bundle_layout.mjs` will render this location as the only human artifact
entry point, replacing the long `reference/human-artifact-reference-v1.md` leaf in the layout
tree and generated deck guide.

The index will use relative paths such as `art/s-26a6f1f8.png`; it will not serialize an original
absolute locator, full SHA, or source filename. `artifact-view` may return the absolute index/root
needed to enter the run, but all paths it asks a person to use after that are under `nav/`.

The 24-character component rule belongs to `run-bundle-layout`. The controlled file name format
will be a one-letter typed display prefix, eight hexadecimal characters, an optional existing
collision suffix, an optional short occurrence suffix when two entries share a display reference,
and the safe original extension. It fits the bound without relying on variable-length slide IDs,
candidate labels, source filenames, or full digests.

Alternative: keep the existing long reference leaf and add short aliases beside SHA owners.
Rejected because it leaves the long locator as the handoff surface and would couple human paths to
immutable storage layout. Alternative: place `nav/` at the deck root. Rejected because a current
artifact view is version/workflow scoped and must not create a mutable current-version alias.

### 2. Extend the existing renderer into the navigation Module; keep owner composition in `ppt_flow`

The existing artifact-reference Module will retain its dependency-light owner-fact input shape,
but its exported writer will become `writeHumanArtifactNavigation`. Its Interface accepts only the
current owner-validated Style Master, page, deck, and unavailable entries plus run/workflow scope
and returns `{ path, root, run_dir, workflow }`. It will not import lifecycle owners or implement
reverse lookup.

The Module first runs the existing plain-object, bounded-text, current ordering, and confined
regular-file validation. It then builds a deterministic flattened artifact list, reuses
`createPageProductionDisplayReferenceIndex`, assigns short copy names, writes a Markdown index
with relative `art/...` paths, and copies source bytes into a staged tree. The index preserves
stable candidate/slide ordering and type/purpose text, but its locators are the new derived copies.

`ppt_flow.mjs` remains the only cross-owner Adapter. It continues to determine which artifacts are
current, including pending Style Master successor behavior, and hands facts to the navigation
Module only after every owner check succeeds. The Module's Depth comes from centralizing all
physical-path mechanics behind one interface; callers and tests cross that same seam rather than
reconstructing filenames or performing their own file copies.

Alternative: add a separate map/database translating short paths to SHA roots. Rejected because it
would create a second authority and a selector temptation. Alternative: put copying into every
owner. Rejected because it would duplicate layout, collision, atomicity, and human-index logic
across owners and reduce locality.

### 3. Use regular copies and staged replacement, never links

Each available original is copied into a staging directory under `_generated/`; the navigation
root is replaced only after every input has validated and every copy plus `index.md` has been
written. The module checks that `_generated/`, an existing `nav/`, and the staged target are
directories rather than symbolic links. It rejects a source or target that cannot establish those
facts before changing the current navigation tree.

After the staged tree is complete, the module temporarily moves a valid existing `nav/` aside,
renames the completed staging tree into place, then removes the previous derived tree. If final
replacement cannot complete, it restores the previous tree before surfacing the bounded failure.
The optional deletion of the exact retired long reference leaf happens only after the new tree is
published; failure to remove that non-authoritative leaf does not make the short tree unsafe or
alter lifecycle authority.

Regular copies are intentional. A symlink violates the existing confinement/regular-file model and
does not provide the requested physical artifact. A hardlink would expose the immutable owner's
inode to mutations through a user-facing path. A copy is derived data: it can be changed or deleted
without changing canonical evidence, and a later rebuild restores it from the owner.

### 4. Preserve exact owner controls while eliminating SHA from human handoff

`commandTargetPageImageImage2` will return the existing `artifact_view` key pointed at
`nav/index.md`, add `human_navigation_root` pointed at `nav/`, and retain the existing
run/workflow and pending-successor `next_action` behavior. It will not return the original
locators, add an input flag, or parse a short name. The existing `artifact-view` success schema is
the only direct CLI result altered by this change; `status`, `state`, `style-master`, and other
Image2 success results remain unchanged.

`AGENT_CONTRACT.md`, generated `deck-guide.md`, and the consumer guidance will call the short
index the required inspection surface. The Agent may use stable slide/candidate IDs to explain a
human decision, but it sends exact hashes only to the owner-controlled JS command when the current
contract requires them. A person never has to type or browse a full SHA to inspect an artifact.

This is a `guide` path under `human-centered-gates.md`: the Agent can mechanically invoke the
provider-free rebuild. Invalid protocol identity, invalid owner facts, path confinement failure,
unsafe tree, or failed copy remain hard-stops protecting canonical bytes and recoverability. There
is no `confirm`, waiver, retry, or new state. Under
`agent-assistance-and-control.md` and `simple-reliable-control.md`, the direct loop is owner facts
-> one navigation Module -> one `artifact-view` result. It removes manual long-path reconstruction
instead of adding a control layer.

## Risks / Trade-offs

- [Derived copies consume extra disk space] -> Copy only currently owner-established available
  artifacts into the one current navigation tree; the next rebuild replaces stale copies, and the
  tree is safely deletable.
- [A short digest prefix collides] -> Reuse the existing deterministic kind-prefixed collision
  index and add a bounded occurrence suffix only for distinct entries sharing the same display
  reference; the index is rebuilt from the same ordered owner facts.
- [A user modifies the short copy] -> Treat all `nav/` bytes as derived and never read them for
  lifecycle truth; focused tests prove original owner media remain byte-identical and the next
  rebuild restores the tree.
- [A failed rebuild destroys the prior human surface] -> Complete validation and copying in staging
  before replacement; test failed input/copy paths preserve the prior navigation root and index.
- [A navigation path becomes an accidental control key] -> Expose no resolver, input option, or
  map; keep the existing selector rejection tests and require Agent guidance to describe it as a
  read target only.

## Migration Plan

1. Update source path vocabulary, the navigation Module, `ppt_flow` projection, layout tree, and
   generated guidance in one Harness release; no provider request or production deck mutation is
   part of apply.
2. For a supported current run, the next explicit `image2 artifact-view` validates current owners,
   publishes `_generated/nav/`, and may remove only the retired long derived reference leaf after
   publication. Existing immutable SHA owners remain byte-identical.
3. A run that never invokes `artifact-view` remains unchanged until explicitly rebuilt. An
   unsupported v2 run keeps its existing hard-stop and gets no navigation tree.
4. Rollback removes the Harness behavior; any remaining `nav/` tree is ordinary derived output and
   may be deleted. It cannot become source, evidence, state, or an immutable storage migration.

## Verification Strategy

- **Unit:** extend the existing human-artifact-reference suite to verify deterministic short paths,
  24-character components, collision suffixing, byte-equal regular copies, no full SHA/original
  locator in the index, edited-copy regeneration, source confinement, unsafe symlink rejection,
  and preservation of a prior tree after a failed rebuild.
- **Integration:** use current Pure and Framed fixture owner facts, including a pending Style Master
  successor and current/accepted review states, to prove every available category reaches `nav/`
  while unavailable categories have no copy. The existing `ppt_flow` adapter remains the sole
  cross-owner composition seam.
- **Process CLI:** update artifact-view contract tests to assert the new index/root fields, no
  source SHA paths in stdout or index, unchanged `_state`/owner records, retained
  pending-successor `next_action`, and the existing unsupported-v2 hard-stop.
- **Layout/guidance:** update path and render-tree tests plus Charter/deck-guide/MD consumer
  coverage so no human inspection handoff cites the retired long leaf.
- **E2E:** no provider-backed E2E is needed because this change deliberately performs no remote
  work; isolated owner/CLI fixtures exercise the navigation, integrity, and no-mutation contracts
  more directly. Run the protected `npm test` baseline before archive.
