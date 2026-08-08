## 1. Canonical Human Handoff Guidance

- [x] 1.1 (`harness-charter`) Add a `Human-facing CLI success handoff` section immediately before `AGENT_CONTRACT.md`'s Human inspection handoff: for successful direct Harness CLI work, use purpose/outcome/next human action and domain identifiers, retain exact SHA-256 only for a required command or an explicit human request, and preserve the existing producer-first failure path.
- [x] 1.2 (`harness-charter`) Extend `AGENT_CONTRACT.md` Human inspection handoff so an Agent uses the current rebuilt artifact view for any human-facing current Page Image status or action request, reports unavailable artifacts without inventing a reference, and preserves the locator's read-only boundary.
- [x] 1.3 (`harness-charter`) Preserve the existing guide/confirm/hard-stop, authorization, selector, and generated-artifact ownership language while adding no CLI or runtime protocol behavior.

## 2. Contract Coverage

- [x] 2.1 (`harness-charter`, tests) Extend `tests/contracts/test_diagnostic_recovery_handoff.mjs` to require the new human-success-summary heading, purpose/outcome/next-human-action shape, explicit exact-identifier exception, and preserved producer-first failure handoff; also require the Page Image typed-display-reference handoff while preserving non-authoritative locators (including possible content-addressed path segments) and no selector/authorization use.

## 3. Verification and Closeout

- [x] 3.1 Run `npx vitest run tests/contracts/test_diagnostic_recovery_handoff.mjs`, protected `npm test`, `openspec validate add-human-cli-handoff-guidance --strict`, `openspec validate --all --strict`, and `git diff --check`; confirm no provider call, CLI schema change, or state/receipt/immutable-record mutation occurred, and that the only permitted run-bundle write remains the existing derived artifact-view rebuild.
- [x] 3.2 After green implementation evidence, update BUG-062 and the progressive backlog plan with the resolved display boundary; sync the accepted Charter delta to the main spec, archive the change, and make the version-bump recommendation for maintainer confirmation before any release edit.
