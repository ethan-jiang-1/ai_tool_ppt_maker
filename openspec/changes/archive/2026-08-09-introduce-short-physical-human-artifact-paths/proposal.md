## Why

The current Page Image artifact view makes short display references readable, but every physical
locator still traverses long content-addressed directories and long generated filenames. A person
who needs to open, copy, or pass an artifact therefore still has to use a SHA-heavy path, which
does not meet the agreed Human Navigation Path requirement.

This change replaces that human-facing projection with a short physical navigation tree while
preserving full SHA-256 values as internal canonical identities, not human paths.

## What Changes

- **BREAKING** Replace the long-name Page Image human artifact reference leaf with a canonical,
  run-scoped Human Navigation Path tree under a short generated path. Its index and every
  human-exposed artifact directory/filename component are short, stable within the rebuilt view,
  collision-safe, and contain no full SHA-256.
- Materialize regular derived copies of only owner-validated available artifacts into that tree.
  The navigation tree is atomically rebuilt from current owners, never scanned for lifecycle
  truth, never symlinked into immutable storage, and never used as evidence, state, a grant, or
  an authorization record.
- Make `image2 artifact-view` return the short navigation index/root and make its human-facing
  Markdown cite only paths inside that tree. Existing long source locators stop being human
  handoff output.
- Update Agent/Controller guidance so people receive short physical navigation paths for
  inspection. A Human Navigation Path remains a read/navigation target, not a lifecycle selector:
  existing owner-controlled exact-hash command grammar stays internal to the Agent/JS control
  path, and no person is asked to enter a full SHA-256.
- Provide a provider-free migration on the next explicit artifact-view rebuild. It preserves all
  immutable SHA-owned records and media, removes only the retired generated view leaf when safe,
  and does not mutate production deck authority or run a provider request.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `run-bundle-layout`: reserve the short, run-scoped Human Navigation Path tree and retire the
  long human-reference leaf as the canonical human navigation location.
- `image-generation`: derive short physical artifact paths only from current owner-validated
  artifact facts, with atomic rebuild, collision handling, confinement, and no lifecycle
  authority.
- `cli-surface`: make `image2 artifact-view` expose the short physical navigation result while
  keeping provider, lifecycle, and direct exact-selector controls unchanged.
- `harness-charter`: require human artifact inspection handoffs to use a Human Navigation Path
  rather than a long canonical storage locator.
- `node-specification`: make generated Controller guidance consume the short navigation result
  for Page Image inspection handoffs without treating it as an approval or selection key.

## Impact

- **Harness source:** Page Image path vocabulary, the existing owner-validated artifact-view
  renderer/composer, Image2 CLI success projection, and Agent/Controller handoff guidance in
  `ppt_maker_harness/`.
- **Verification:** focused human-navigation renderer and CLI tests, run-bundle layout checks,
  plus guidance/controller tests under `tests/`; protected regression remains required.
- **Control owner:** JS owns deterministic validation and materialization from existing owners;
  the Agent owns the human handoff; humans retain only existing review and authorization
  decisions. No new gate, state record, provider permission, or selector protocol is introduced.
- **Run-bundle contract:** migration of a rebuildable derived surface. Existing immutable
  SHA-named storage remains byte-identical; an explicit provider-free `artifact-view` rebuild
  produces the new short tree for a supported current run.
- **Policy posture:** rebuilding a valid navigation tree is a `guide`. Existing identity,
  confinement, integrity, authorization, and recoverability failures remain non-bypassable
  hard-stops under the current owners.

## Authority And Control Boundaries

This change applies
[`human-centered-gates.md`](../../policies/human-centered-gates.md): materializing a valid derived
tree is a `guide`; an invalid current identity, invalid owner fact, escaping path, unsafe existing
navigation root, or failed copy is a hard-stop that protects canonical bytes and leaves the prior
tree untouched. There is no `confirm`, waiver, retry, or fallback.

It also applies
[`agent-assistance-and-control.md`](../../policies/agent-assistance-and-control.md) and
[`simple-reliable-control.md`](../../policies/simple-reliable-control.md): one existing owner
composition supplies the direct facts, one navigation module assigns/creates short paths, and one
explicit `artifact-view` operation rebuilds them. The change removes manual path reconstruction
and long-locator handoffs without adding a second lifecycle reader, durable mapping, or
human-operated SHA command step.
