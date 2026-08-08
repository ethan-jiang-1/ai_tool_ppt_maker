## Context

See `proposal.md` for motivation. `image2 artifact-view` already rebuilds a current, provider-free
human projection from owner-issued records. It exposes typed, collision-aware display references
and confined locators while normal CLI JSON and exact SHA-256 arguments remain machine protocol.
The current Charter limits that view to explicit inspection requests, and it has no general rule for
an Agent to summarize any successful direct CLI payload for a person.

## Goals / Non-Goals

**Goals:**

- Make a bounded human success summary the normal Agent projection for direct Harness CLI results.
- Make the already-existing artifact view the one human display source for current Page Image
  statuses and requests for human action.
- Keep the Agent's conversational projection separate from JS/CLI machine facts and exact control
  values.
- Cover the result with a focused Charter documentation test.

**Non-Goals:**

- No JS/CLI output, option, schema, path, display-reference formatter, or exact-hash input change.
- No physical short-path alias, selector reverse lookup, state/receipt/immutable-record mutation,
  provider call, retry, new guide/confirm/hard-stop, or changed human decision. The existing
  artifact-view command may atomically rebuild its one derived reference-view file.
- No promise to remove content-addressed segments from the filesystem locator itself.

## Decisions

### 1. The MD/Agent owns the general conversational projection

The CLI remains the source of exact owner facts and returns its existing machine JSON. When it must
communicate a successful result to a person, the Agent reports the command's purpose, result, and
next human action using its domain identifiers, retaining a full SHA only while it needs to issue
the existing exact CLI command. A person who explicitly requests the identifier may receive it;
otherwise a raw digest is not the human status label.

This follows `agent-assistance-and-control.md`: the Agent performs the mechanical, authorized
projection without creating a competing state or evaluator; the human still makes only existing
review and cost decisions. It also avoids the rejected alternative of a global `--short-refs` or
extra JSON display fields, which would broaden every machine consumer without becoming a valid
control key.

The canonical addition belongs in a new `Human-facing CLI success handoff` section immediately
before the existing `Human inspection handoff` section. The former covers every successful direct
Harness CLI summary; the latter remains the Page Image-specific branch that supplies the current
artifact view. This keeps general conversational status distinct from a request to inspect a
particular generated artifact.

### 2. Current Page Image uses the existing artifact view as its specialized display source

For a current Page Image result or action request, the Agent first rebuilds `image2 artifact-view`
and uses its stable slide/candidate IDs, typed display references, unavailable facts, and locators.
The view does not currently create a display reference for every internal batch record; where no
entry exists, the Agent describes the owner-issued scope in domain terms and retains any required
exact batch SHA internally. It must not invent a short reference.

### 3. Presentation remains advisory and cannot create a control path

This is a guidance rule, not a validator. A missing display entry is reported as the view's
owner-issued unavailable fact; it does not prevent legal work or cause the Agent to infer a ref.
Short references remain display-only, and locators remain read-only. There is no new writer,
reader, durable field, freshness contract, or recovery branch.

The existing `writeHumanArtifactReference` writer is the one deliberate exception to a no-write
description: it atomically replaces only the canonical derived view after its existing owner
validation. This change neither alters that writer nor grants the Agent a new mutation permission;
it only directs the Agent to invoke the already-public, provider-free command when a current Page
Image human display source is needed.

Per `human-centered-gates.md`, existing guide, confirm, and hard-stop classifications remain
unchanged: the change neither authorizes provider work nor supplies a waiver. If the view cannot
be rebuilt because current protocol identity or owner validation fails, the Agent uses the existing
producer-issued diagnostic and its existing nearest legal action.

Per `simple-reliable-control.md`, this removes the raw-JSON-to-human translation rather than adding
another checker: direct owner facts still determine the workflow; a single existing display view
supplies human presentation; and no status record or fallback is created.

### 4. Test the canonical instruction rather than a simulated conversation

The behavior is a soft-bundle Agent instruction. Extend the existing focused Charter contract test
to require the general human-success-summary rule, and to require the Page Image handoff section to
name typed display references and retain the locator's non-authoritative boundary. The assertions
must allow a required locator to contain a physical content-addressed path segment. No unit,
integration, or provider-backed E2E fixture is needed because JS behavior, run-bundle bytes, and
external calls do not change. The focused test need not create a production run bundle: existing
artifact-view CLI coverage already proves the command's derived-view-only write boundary on temporary
fixtures.

### 5. Verification plan and evidence boundary

After apply, run `npx vitest run tests/contracts/test_diagnostic_recovery_handoff.mjs` because it
is the canonical focused documentation-contract suite that reads `AGENT_CONTRACT.md`; it must prove
the new success-summary heading names the purpose/outcome/next-human-action shape, preserves the
explicit-exact-identifier exception, and does not disturb producer-first failure recovery. The same
test must prove that the Page Image handoff requires typed display references when available while
retaining the locator's read-only/non-selector boundary.

Run `npm test` because root `README.md` declares the `core` tier for every normal Harness change
and root `AGENTS.md` names it as the regression command; `package.json` defines that protected
baseline. Run `openspec validate add-human-cli-handoff-guidance --strict`, `openspec validate --all
--strict`, and `git diff --check` because the project's progressive plan requires those change and
repository integrity checks before apply/archive. No sweep, mock E2E, real E2E, renderer, or
provider check is selected: the README reserves those tiers for changed public journeys or explicit
authorization, while this change alters only Charter guidance and a local documentation contract
test.

## Risks / Trade-offs

- [A person explicitly needs the exact identifier] -> the rule permits a full SHA only after an
  explicit request; the Agent does not discard the machine result it needs for the next command.
- [A view has no current artifact] -> report its bounded unavailable entry rather than inventing a
  display reference or falling back to an unrelated digest.
- [A non-Page-Image success has no specialized display view] -> summarize the purpose, outcome,
  and next human action with its existing domain terms rather than creating a generic short-ref
  protocol.
- [A locator still contains a content-addressed path segment] -> use the typed display reference
  and stable ID as the conversational label; retain the locator as an exact read target.
- [A human status unexpectedly writes lifecycle authority] -> the guidance invokes only the
  existing artifact-view command, whose accepted CLI contract permits rebuilding its derived view
  but forbids state, grant, decision, provider, and immutable-record mutation.
- [Guidance drifts from the accepted spec] -> synchronize the one `harness-charter` requirement and
  protect the canonical wording with the existing documentation-contract suite.

## Migration Plan

No data migration is required. Existing bundles, records, outputs, and command invocations remain
valid. On archive, synchronize the accepted Charter requirement; rollback is a documentation/test
revert with no run-bundle recovery action.

## Polish Record (2026-08-08)

### Pass 1: Whole-change coherence

- **Authority:** root `AGENTS.md` routes PPT work to `charter/AGENT_CONTRACT.md`; the accepted
  `harness-charter` spec makes that Charter the owner of Agent behavior. The proposal therefore
  modifies only `harness-charter`, not the CLI producer or consumer capabilities.
- **Traceability:** the new success-summary requirement and the complete updated Page Image handoff
  requirement both map to explicit Charter tasks, one focused documentation-contract test, and the
  required closeout checks. Design records the exact section placement and evidence boundary.
- **Correction:** an earlier Page Image-only scope would have left `ppt_flow` structural and
  `style-master` success reports outside BUG-062. Existing `ppt_flow.mjs` output paths establish
  that all three named command families expose machine results, so the final delta covers each
  successful direct Harness CLI result while using artifact view only for current Page Image.
- **Correction:** a raw 64-hex fragment can occur inside an owner-issued locator. The final contract
  prohibits using that digest as a human status label, not its unavoidable appearance inside the
  exact read-only locator.

### Pass 2: Authority, mutation, and failure boundary

- **Machine versus display:** `ppt_flow.mjs` serializes ordinary `image2` and `style-master` owner
  results. `page_production_display_references.mjs` exposes no reverse lookup, and the accepted
  `cli-surface` requirement prohibits abbreviated selectors. The design therefore requires an
  internal exact hash plus a display-only human summary, never a new control grammar.
- **Artifact-view scope:** `ppt_flow.mjs` dispatches `artifact-view` before lifecycle task-projection
  refresh; the accepted `cli-surface` spec and existing CLI tests establish no provider/state/grant/
  decision transition. The view intentionally has no display entry for every internal batch record,
  so the design requires an owner-issued domain summary rather than inventing a short batch key.
- **Correction:** `writeHumanArtifactReference` atomically replaces the existing derived reference
  view. The initial no-generated-write wording was false and has been narrowed across proposal,
  design, and tasks: this change permits only that pre-existing derived-view rebuild, never source,
  state, receipt, immutable-record, media, or delivery mutation.
- **Failure path:** `targetPageImageFailure` emits the existing bounded failure envelope after a
  non-zero image operation, and the current Charter requires producer-first recovery. The new
  success-summary requirement explicitly excludes failures and introduces no fallback or gate.

### Final Clean Pass: Ready for Apply

No materially new actionable issue remained after the mutation-boundary correction. The focused
`tests/contracts/test_diagnostic_recovery_handoff.mjs` baseline passes 4/4; it currently proves the
pre-apply canonical-handoff contract and will be extended by Task 2.1 to prove the new requirement.
The protected `npm test` core baseline passes. `openspec validate
add-human-cli-handoff-guidance --strict`, `openspec validate --all --strict`, and `git diff --check`
also pass.

The change is ready for apply. This polish remains planning-only: no Harness implementation, test
task, provider request, lifecycle state, or production run bundle has been changed. Apply may now
perform only the six unchecked tasks, followed by the existing sync, archive, and user-confirmed
release-decision workflow.
