## 1. Shared Provider Failure Boundary

- [x] 1.1 In `ppt_flow.mjs`, add the closed, non-content classifier for a fully read HTTP-success response that fails JSON parsing: whitespace-only `empty`, explicit HTML-document `html_like`, otherwise `other_non_json`.
- [x] 1.2 Extend the Page Image and Style Master provider-response known-failure factories so only `invalid_json` can carry a recognized response shape; construct fresh frozen facts and retain all current behavior for HTTP, task, media, and transport failures.
- [x] 1.3 Extend the Page Image raw-owner response-fact projection to allowlist the recognized `invalid_json.response_shape`, preserve older records without it, and continue excluding arbitrary provider fields from CLI-visible output.

## 2. Focused Regression Coverage

- [x] 2.1 Extend the shared Page Image and Style Master transport tests with synthetic empty, HTML-document, and other non-JSON successful responses; prove valid JSON, non-OK responses that do not read their body, and unreadable responses retain their current outcomes.
- [x] 2.2 Extend Page Image raw-owner tests to prove recognized shapes project exactly once, unknown shapes and extra provider fields are filtered, and the known-failure attempt, progress, and next action retain their existing control path.
- [x] 2.3 Extend Style Master generation/lifecycle tests to prove classified invalid JSON reaches the existing terminal attempt while no response-shape state, replay change, retry, or new result field is created.
- [x] 2.4 Extend process-level `image2 generate` diagnostics with the three synthetic shapes and secret sentinels; prove output contains no provider body, headers, lengths, digests, task identifiers, prompts, credentials, or provider identity.

## 3. Validation

- [x] 3.1 Run the focused image2 transport, raw-owner, Style Master lifecycle, and process-diagnostic test files; fix any regression within this change's scope.
- [x] 3.2 Run `npm test`, `openspec validate add-bounded-provider-response-shape-diagnostics --strict`, `openspec validate --all --strict`, and `git diff --check`; record the outcomes before requesting archive/sync.

## Validation Record

- 2026-08-08: targeted Image2 suites passed (74 tests); the opt-in process
  diagnostic suite passed (12 tests).
- 2026-08-08: `npm test` passed; change strict validation passed; all-spec
  strict validation passed (27/27); `git diff --check` passed.
