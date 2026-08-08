## Why

Current Page Image owners expose some isolated paths and task cards can shorten a small set of
digests, but an Agent still has no single, trustworthy way to hand a person the exact Style
Master, raw/review, final, PPTX, notes, or delivery artifact to inspect. The resulting
"generated/opened" handoffs force users to reconstruct paths and expose content-addressed
directory hashes as the primary human interface.

This change makes artifact inspection deliberate and repeatable without weakening the existing
content-addressed lifecycle or adding another workflow authority.

## What Changes

- Add an explicit, provider-free `ppt_flow image2 artifact-view <run-dir>` operation for an exact
  current Page Image Workflow scope. It rebuilds a run-scoped Markdown human artifact reference
  view from canonical owner records and returns its locator while leaving `_state/` unchanged; it
  is not implicitly run by ordinary `status`, `state`, planning, review, or delivery commands.
- The view groups available Style Master candidates, provider-input inspection, raw/review
  evidence, final PNG/PPTX, notes, and delivery receipt by stable candidate or full-plan
  `NN_slide_id` order. Its visible display references are kind-prefixed and collision-aware; each
  entry supplies an absolute locator, artifact type, and inspection purpose without making a
  display reference an input selector.
- Add one Agent/display contract: whenever an Agent asks a person to inspect one or more Page
  Image artifacts, it obtains the current view and cites every requested artifact's locator,
  type, and inspection purpose. The locator is view-only and never grants permission to hand-edit
  `_generated/`.
- Keep normal machine-oriented CLI JSON, exact SHA-256 arguments, lifecycle record paths,
  compare-and-swap heads, authorization, review decisions, and recovery actions unchanged. This
  change creates no short physical directory, resolver, symlink, storage migration, new state
  fact, provider call, retry, or approval gate.
- Treat the reference view as a rebuildable collaboration projection. A current protocol identity
  failure retains its existing hard-stop; an absent not-yet-produced artifact is represented as
  unavailable rather than guessed, recovered, or treated as a new blocking failure.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `harness-charter`: Agent-facing Page Image inspection handoffs must cite owner-issued artifact
  locators and preserve the view-only ownership boundary.
- `run-bundle-layout`: declare the reference view's canonical derived location and rebuildability
  without making it a source, lifecycle record, or storage alias.
- `image-generation`: derive a bounded human artifact view from current canonical Page Image
  owners, preserving stable ordering and display/reference separation.
- `cli-surface`: expose the explicit, provider-free artifact-view operation while retaining all
  existing success JSON and exact-hash command grammar.
- `node-specification`: generated runtime guidance must direct Agents to use the reference view
  for human inspection handoffs and must state that its locators are read targets, not edit or
  control authority.

## Impact

- **Harness source:** Page Image artifact-path/inspection helpers, `ppt_flow` Image2 routing,
  generated deck guidance, and possibly the existing non-authoritative task-projection display
  formatter where a shared typed display-reference helper removes duplication.
- **Tests:** focused owner/projection tests, CLI process coverage, run-bundle layout/guidance
  checks, and negative tests proving that display paths/short references cannot select work,
  authorize provider cost, mutate state, or bypass unsupported-protocol identity handling.
- **Run-bundle contract:** compatible. Existing decks receive the view only through explicit
  rebuild; deleting or editing it has no lifecycle effect and it never changes existing immutable
  storage roots or artifact bytes.
- **Control ownership:** MD/Agent owns the conversational handoff; JS owns deterministic current
  owner inspection and reference-view rendering. Humans retain existing review and authorization
  decisions. The view is a `guide`, not a confirm or a new gate; current identity/integrity
  hard-stops remain owner-issued and non-bypassable.
