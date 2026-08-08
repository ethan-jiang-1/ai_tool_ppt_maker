## 1. Style Master Candidate Projection

- [x] 1.1 [`style-master-generation`] Add a read-only pending-successor candidate projection that accepts only an exact current scope/head plan with non-stale inputs, validates its predecessor through the existing historical selection replay, requires the exact predecessor digest and stale intent/context/profile binding, and returns the existing owner `next_action`.
- [x] 1.2 [`style-master-generation`] Make that projection revalidate local-existing and succeeded generated media through their existing direct byte/provenance chains; return an absolute confined locator only for verified media and report planned/claimed/submitted/failed/unknown generated slots by stable ID and lifecycle state without a locator. It must write no state, grant, attempt, decision, selection, raw record, or provider request, and invalid required facts must retain the owner hard-stop.

## 2. Artifact View Handoff

- [x] 2.1 [`image-generation`] Update the artifact-view adapter to consume the owner projection and short-circuit a pending successor before raw-owner, stored-raw-plan, or raw-only accepted-selection inspection. Render verified candidates as pending-not-accepted and generated unavailable slots by stable ID/state, without turning the renderer into a lifecycle reader.
- [x] 2.2 [`cli-surface`] Return the owner `next_action` with the ordinary run/workflow/view success fields only for a pending successor; retain the current accepted-selection success shape, selector/authorization boundaries, and unsupported-protocol behavior. Route failed owner projection facts through the bounded owner-issued hard-stop rather than an internal diagnostic, and do not write the view on that failure.

## 3. Focused Regression Coverage

- [x] 3.1 [`style-master-generation`] Add owner coverage for a stale predecessor plus valid successor plan: local-existing and succeeded media are revalidated before projection; planned/claimed/submitted/failed/unknown slots have no locator; mismatched/invalid predecessor and scope/media corruption hard-stop; and no lifecycle or state record mutates.
- [x] 3.2 [`image-generation`] Add adapter coverage proving owner-validated candidates render as pending, unavailable slots retain stable ID/state, the pending path does not inspect raw authority, and every failed projection leaves a preexisting artifact view plus raw lifecycle/state bytes unchanged.
- [x] 3.3 [`cli-surface`] Add direct process CLI coverage proving pending-successor `artifact-view` is normal provider-free success with the owner `next_action`, ordinary run/workflow/view fields, pending/unavailable view facts, no internal/self-referential diagnostic, and no mutation of authorization, attempt, selection, or provider controls.

## 4. Verification And Handoff

- [x] 4.1 Run focused Style Master, human artifact-view, and process CLI suites plus the protected `npm test` baseline; record that no provider or production-deck mutation occurred.
- [x] 4.2 Run `openspec validate expose-style-master-successor-artifact-view --strict`, `openspec validate --all --strict`, and `git diff --check`; update completed task checkboxes before requesting spec sync/archive.
