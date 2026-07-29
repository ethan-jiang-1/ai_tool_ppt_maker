## Why

`separate-framed-pure-workflows` correctly activated the v2 Framed/Pure workflow graph and retained the exact CURRENT v1 mixed lifecycle as bounded compatibility. Post-archive inspection found that this compatibility boundary is still physically and operationally porous: an otherwise read-only `ppt_flow status` for a selected v2 run writes the v1 source receipt, an uncalled `05-iteration` wrapper remains registered as an active interface, and several legacy workflow/test paths are empty or describe a generic current workflow.

The resulting topology obscures the one new-authoring route, makes observation mutate derived artifacts, and leaves maintainers unable to distinguish a required v1 owner from dead scaffolding. This is now a separately deployable cleanup boundary: it can preserve exact v1 bytes and public CLI grammar while removing the accidental routes and making both protocols locally understandable.

## What Changes

- Route CLI status and controller observation through one marker-first, read-only inspection seam. Observation will not initialize state, write either protocol's source receipt, create `_generated/` artifacts, alter history/metadata, or call a provider.
- Isolate the retained exact CURRENT v1 Page Authority implementation, guidance, and focused proof under an explicit compatibility ownership surface. TARGET code, observation, and public routes will not import or invoke a v1 writer.
- Remove the demonstrably uncalled `scripts/05-iteration` pass-through and stale test/E2E placeholder directories; move any still-valid v1 classifier and documentation links into the declared compatibility surface instead of retaining long-lived re-exports.
- Preserve `03-framed-image XOR 04-pure-image -> 05-delivery -> 06-iteration` as the only visible new-authoring graph. `05-delivery` remains the sole shared delivery owner for both selected v2 workflows and bounded v1 delivery.
- Update the directory/script inventories, source-to-test ownership, governance/retirement ledgers, and command-reference links so they describe the cleaned ownership graph and fail closed on an accidental cross-protocol route.

**BREAKING**: No public CLI grammar, v1 receipt/byte semantics, provider-authorization rules, or user run-bundle data will change. Framework-internal source and documentation paths may move as part of the explicit compatibility-home migration.

This change adds no gate, durable state, retry, fallback, or human decision. Under `human-centered-gates.md`, an observation result retains the existing owner-issued `guide`, `confirm`, or `hard-stop` posture; the non-bypassable invariant is that an observer cannot manufacture evidence. Under `agent-assistance-and-control.md` and `simple-reliable-control.md`, the change replaces a writer-based duplicate validity check with the existing read-only evaluator, reports the earliest direct-fact failure and its one legal next action, and avoids a second controller authority or cached status verdict.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `workflow-inspection`: Extend the read-only observation contract to cover the status/controller projection for exact v1, selected v2, and workflow-selection-pending runs without receipt or generated-artifact writes.
- `image-production`: Make the retained v1 adapter an explicit compatibility-only owner and prohibit TARGET/observer routing through its mutation surface.
- `framework-directory-layout`: Define a single explicit compatibility home and remove stale generic/placeholder framework, workflow, and test entry paths while preserving the target method graph.
- `framework-script-layout`: Update registered interfaces, import boundaries, executable/source-to-test inventory, and architecture checks after deleting dead wrappers and cross-protocol writer routes.
- `commands-reference`: Move compatibility classifier/document routing to the declared compatibility surface while preserving concise new-authoring guidance and the one selected v2 route.

## Impact

- **Framework source:** `ppt_flow.mjs`, the retained v1 Page Authority adapter, controller/inspection integration, workflow/documentation locations, and architecture inventories under `PPTMAKER_FRAMEWORK/`.
- **Tests:** focused v1 compatibility tests, target observation non-mutation coverage, E2E tree snapshots, documentation/link checks, and source-to-test ownership records under `tests/` and `tests_e2e/`.
- **Run-bundle contract:** compatible. Exact v1 and v2 run bundles remain readable through their established protocols; this change performs no deck migration and reads no user production data as a fixture.
- **Control ownership:** JS retains deterministic marker/state/artifact inspection and mutation ownership; Markdown Controllers consume the single read-only projection; humans make no new decision; Agents may perform the mechanical cleanup only through the accepted change.
- **Dependencies / public surface:** no new dependency, no provider transport change, and no direct CLI grammar or diagnostic-schema change.
