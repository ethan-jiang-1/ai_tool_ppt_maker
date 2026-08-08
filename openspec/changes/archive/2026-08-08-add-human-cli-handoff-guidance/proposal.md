## Why

Content-addressed SHA-256 values are necessary in Page Image records and exact CLI arguments, but
ordinary successful CLI JSON exposes those machine keys directly. The existing `image2 artifact-view`
already supplies collision-aware typed display references and locatable current artifacts, yet the
Agent Contract only requires it for an explicit inspection request. An Agent can therefore still
relay a raw normal success payload to a person, making an implementation identifier the human-facing
result.

This change closes BUG-062 at the conversation boundary rather than changing the protocol boundary.

## What Changes

- Add a general human-success-summary rule for direct Harness CLI results: an Agent retains exact
  SHA-256 values only for the owner-controlled command that needs them and reports purpose,
  outcome, and next human action with domain identifiers rather than relaying the machine payload.
- Extend the Page Image branch of that rule: after a successful current Page Image operation, an
  Agent uses stable slide/candidate IDs plus the current artifact view's typed display references
  and locators as the human display source.
- Require the Agent to rebuild `image2 artifact-view <run-dir>` before it needs a current Page Image
  human display reference. In every direct Harness CLI success summary, it must not quote ordinary
  success JSON or make a raw 64-hex digest the conversational status label unless the person
  explicitly asks for the exact identifier. A required owner-issued locator may still contain
  content-addressed path segments.
- Preserve ordinary CLI JSON, exact SHA-256 argument grammar, immutable directory names, display
  reference non-selector status, existing human decisions, and all existing guide/confirm/hard-stop
  outcomes. This creates no runtime command, state, provider work, physical alias, retry, or gate.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `harness-charter`: Agent guidance gains a bounded human-readable success-summary convention for
  direct Harness CLI work and a Page Image artifact-view branch, while preserving existing runtime
  authority.

## Impact

- **Harness source:** `ppt_maker_harness/charter/AGENT_CONTRACT.md` only; the JS/CLI producer
  remains the source of exact machine facts and its output schema does not change.
- **OpenSpec and tests:** the `harness-charter` delta spec and a focused documentation-contract test
  will make the handoff boundary durable.
- **Control owner:** MD/Agent owns the conversational projection and invokes the existing JS-owned,
  provider-free artifact view. The human retains the existing explicit review and cost decisions.
- **Run-bundle contract:** none. No existing or production `deck_*` bundle is edited or migrated;
  following the guidance invokes the existing provider-free rebuild of the derived human artifact
  view only. It does not mutate source, `_state/`, receipts, immutable records, or delivery media.
