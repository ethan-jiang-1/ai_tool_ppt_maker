## Context

See proposal.md for why. Constraints that shape HOW:

- `deckRoot(runDir)` is `dirname(dirname(runDir))`. Passing a Deck root makes
  binding look at the parent of the repository. CONSTITUTION already documents
  `--check deck_<name>/3_versions/v1`. `checkBundle` already rejects a
  non-version dir via `isVersionDir` / `isPageImageVersionDir`, but `_main`
  `--check` calls `verifyCurrentBindingForCli` first. Reuse that existing
  shape check before binding; wrap it as current `usage`, not a new detector.
- `inspect_workflow` only uses `resolveTargetAuthoringDraftRoute` inside the
  pending-workflow branch. A selected `framed|pure` marker leaves that branch,
  `inspectStateProtocol` sees `validateStateReadOnly` fail without identity, and
  the result is `current-protocol-invalid`. `state --json` consumes that
  inspection. `resolveRunAdapter` already prefers the draft adapter when the
  draft route returns; inspection is the broken reader.
- `printStatus` builds Next from style_master / pptx / gates. It never reads
  `workflow_inspection.primary_action`, which `state --json` and AGENT_CONTRACT
  already use.
- `ppt_flow init` already prints `Next: ppt_flow.mjs status ${v1Path}`.
  `bundle_layout --init` prints a different sentence.
- `style-master` commander surface has no `--json`; `image2` does.
  `cli-surface` already requires text and JSON to be two renderers of one owner
  result.

Policies: `human-centered-gates.md` (wrong `--check` target is `guide`; real
binding failure stays `hard-stop`; selected-workflow draft is not protocol
`hard-stop`). `agent-assistance-and-control.md` (one owner action; Agent does
not hand-edit state). `simple-reliable-control.md` (reuse inspection; fail at
target shape before a competing binding projection).

## Goals / Non-Goals

**Goals:**

- Diagnose the actual target-shape / draft failure first.
- Reuse inspection as the only Next source for `status`.
- Keep init Next as the sentence `ppt_flow init` already emits.

**Non-Goals:**

- Cursor rewind, v1 reset, capability-vector transport, novice CLI copy, Gate
  glosses, price lists, PAGE CLASS body closed-set, changing `known_failure`
  exit 0, teaching `--check` to accept a Deck root.

## Decisions

1. **`--check` target shape before `deckRoot()`.** Call existing `isVersionDir`
   before `verifyCurrentBindingForCli`. If false, emit current `usage` naming
   `3_versions/vN`. Alternative: teach `deckRoot` to accept a Deck root —
   rejected; `--check` semantics stay run-dir. Alternative: invent a new
   reason.kind — rejected; `CLI_ERROR_CODES.USAGE` already exists.

2. **Draft route includes selected workflow without identity.** After a
   selected `framed|pure` marker, call the existing
   `resolveTargetAuthoringDraftRoute` (today it already returns a draft when
   identity is absent; inspection simply never asks). If the resolver returns
   a draft, keep narrative/paginate. If it returns null, keep the existing
   protocol hard-stop. Do not add a new provider-evidence scanner — that is
   `reset-unproduced-v1` admission. Alternative: write identity when the human
   types `pure` into source — rejected; State still binds identity only
   through paginate apply.

3. **`status` Next = `workflow_inspection.primary_action`.** Human `status`
   prints Next the same way `state` already does (`primary_action.command` /
   `display_label` / `owner:action_id`). `status --json` additively includes
   `workflow_inspection` (the existing inspection object `state --json`
   already carries). Do not invent a second `next` vocabulary. Delete the
   build/refresh special case as the sole generator. Alternative: hard-code
   style-master / image2 strings — rejected; that is a second route table.

4. **Init Next copies the existing `ppt_flow init` sentence.** Do not invent a
   new path form. `bundle_layout --init` must print that same line.

5. **`style-master inspect --json`.** Register the flag on the command. Default
   remains JSON (`harness-charter` Agent machine surface). Alternative: switch
   default to prose now — rejected.

## Risks / Trade-offs

| Risk | Mitigation |
|---|---|
| Draft route swallows a pair the resolver does not accept | Keep protocol hard-stop when `resolveTargetAuthoringDraftRoute` returns null; no new evidence API |
| status JSON consumers relied on missing Next | Additive `workflow_inspection` on the existing command report; no envelope field rename |
| `--check` usage confused with binding | Distinct existing `usage` category; binding tests still use a real run-dir |

## Migration Plan

No run-bundle migration. Existing identity-bound versions are unchanged.
Wrong `--check` invocations start getting usage instead of binding failure.

## Open Questions

None for this change. Cursor rewind, v1 reset, and transport capability are
named sibling changes, not open decisions here.
