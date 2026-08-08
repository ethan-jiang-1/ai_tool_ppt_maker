## Context

See [proposal.md](proposal.md) for motivation. The shared Image2 response
reader currently reads an HTTP-success body and converts every JSON parse
failure into an `invalid_json` known-failure error. Page Image projects a
strictly filtered subset of that error's facts into its existing
`provider_failure` CLI success result. Style Master recognizes the same error
only to persist its existing terminal attempt; it has no response-fact record
or result projection.

This is a diagnostic and control-path change. `human-centered-gates.md` keeps
the already terminal known failure as its existing hard-stop for the submitted
item. `agent-assistance-and-control.md` assigns deterministic classification to
the JS provider boundary and retains the existing owner-issued next action.
`simple-reliable-control.md` favors one shared evaluator and a bounded fact
over a second diagnostic mechanism or provider-content logging.

## Goals / Non-Goals

**Goals:**

- Classify only fully read, HTTP-success JSON parse failures into one closed,
  non-content response-shape value.
- Reuse the existing Page Image fact projection while keeping a strict
  producer-owned allowlist.
- Let Style Master use the same classified error without changing its durable
  lifecycle model.

**Non-Goals:**

- Inspecting, retaining, logging, hashing, measuring, or presenting provider
  response content or metadata.
- Changing provider requests, deadline handling, retry/failover, grants,
  attempts, progress, reconciliation, CLI commands, user gates, or next
  actions.
- Adding Style Master response-shape persistence or a Style Master CLI field.

## Decisions

### One shared classifier after a successful body read

JS owns a small pure classifier invoked only after the common reader has fully
received a successful response body and JSON parsing fails. It returns exactly
one of:

- `empty` for whitespace-only text;
- `html_like` when leading whitespace is followed by `<!doctype html` or an
  opening `<html` tag, case-insensitively and with a tag/doctype boundary; or
- `other_non_json` otherwise.

This avoids duplicated Page Image and Style Master classification and preserves
the existing distinction between a definite unusable response and an unreadable
or lost response. Broad HTML heuristics, body snippets, content types, status
families, lengths, and hashes are rejected: they either expose provider data,
make the taxonomy unstable, or duplicate existing HTTP/transport facts.

### Enforce the closed schema at each producer boundary

The two existing provider-response known-failure factories accept the shape
only for `invalid_json` and only from the closed enum. They construct a fresh
frozen response fact rather than forwarding an input record. The Page Image
raw owner then applies its own allowlist when forming `provider_failure`:
classification plus the recognized shape only for `invalid_json`; current
HTTP-status filtering remains unchanged.

Layered validation is intentional. The shared reader is the direct source of
truth; factory validation prevents accidental propagation from future callers;
the CLI-facing projection protects durable compatibility and the secret
boundary from arbitrary thrown-error fields. Passing through an object, or
accepting shapes on all classifications, would weaken that boundary.

### Keep Style Master terminal records schema-stable

The Style Master generation owner catches the classified known-failure error
and persists its current terminal attempt just as it does today. It does not
write the error facts into the attempt record or project them from the command.
This preserves existing replay, cost, and recovery semantics and prevents a
diagnostic extension from becoming a second state/control surface.

### Compatibility, ownership, and control posture

The direct source of record is the already-read response text in the current
provider invocation. JS classifies it; Page Image's existing owner projects a
closed diagnostic fact; the CLI merely emits that producer-owned projection;
Agent and human continue to follow the existing `next_action`. Older Page
Image known-failure records lacking `response_shape` remain valid and project
exactly as before. No generated artifact has an invalidation or manual rebuild
path because this change writes no derived media or new records.

## Risks / Trade-offs

- A short HTML fragment that lacks a document marker becomes `other_non_json`
  rather than `html_like` -> Limit `html_like` to explicit document markers so
  classification remains deterministic and content-safe.
- A future caller supplies arbitrary error facts -> Construct fresh closed
  factory objects and retain the Page Image projection allowlist.
- A provider body read fails after HTTP success -> Preserve the existing
  unresolved/uncertain result; classify only text that was actually read.
- New information could be mistaken for recovery authority -> Keep the same
  terminal outcome and next action, with focused tests asserting no additional
  retry, state, or request.

## Migration Plan

1. Deploy the shared classifier and closed factory/projection handling with
   focused synthetic tests.
2. Existing Page Image records need no migration: absent shape remains absent
   under the read-time projection.
3. Roll back by removing the optional classified field and its projection;
   no data migration, state repair, provider action, or generated-artifact
   rebuild is required.

## Validation Strategy

- Unit/integration: extend the existing shared transport tests for all three
  shapes, valid JSON, non-OK responses that do not read a body, and body-read
  interruption; assert both Page Image and Style Master factory behavior.
- Lifecycle: extend the Page Image raw-owner filtering tests and Style Master
  generation tests to prove extra fields remain excluded and lifecycle replay,
  attempts, and control flow do not change.
- Process: extend the existing `image2 generate` diagnostic test with synthetic
  empty, HTML-document, and other non-JSON responses; assert the CLI result is
  bounded and provider sentinels never appear.
- E2E: no new end-to-end suite is needed because the public command already has
  process-level coverage and the change makes no user workflow, gate, or
  cross-service change.
