## Why

The HTML-first production path can reach pilot successfully and then become permanently
unusable: review plans are rebuilt with different projections, visual plans lose composition
evidence, approval rejects a valid hash, and the resulting deadlock prevents build, delivery
review, and optional Phase-4 refinement. The same path also treats quality evidence as an
absolute blocker, gives weak diagnostics, and leaves the CLI unable to construct the modern
Image2 transport.

This change makes the lifecycle recoverable and humane. Gates will recommend the best repair,
allow an explicit, reasoned waiver for reversible quality/process risks, and preserve a clear
hard-stop boundary for wrong identities, concurrent writes, corrupted state, unsafe paths, and
unauthorized provider work.

## What Changes

- Make content and visual review plan publication and revalidation use one canonical projection,
  including composition evidence, so a fresh pilot plan can be approved without body or evidence
  drift (BUG-016, BUG-018, BUG-019).
- Keep approval, build, delivery review, and Image2 continuation on one version-scoped state
  authority. Add explicit `--waive` / `--force --reason` paths for reversible evidence risks;
  publish `decision: waived` with the failed checks and current source/reset/version identity,
  never as `approved` or complete evidence (BUG-017, BUG-020).
- Separate identity freshness from evidence completeness in HTML readiness/status. Reuse the
  existing reserved nodes and publication/CAS fences; do not add a second top-level readiness
  authority or let a force path bypass journal/reset/CAS protections.
- Make source ownership projections explicit: speaker-note-only edits remain notes/delivery work,
  while content, visual-system, recipe, asset, and structural changes stale only their owning
  evidence (BUG-030). Accept the documented multiline speaker-note blockquote form (BUG-023).
- Add read-only state validation and producer-owned diagnostics for version-key, schema,
  delivery-record, SHA, path, expected/actual, and stale-plan mismatches (BUG-024, BUG-027,
  BUG-029, BUG-031).
- Provide a CLI-owned Phase-4 transport adapter using the existing Image2 credential and endpoint
  authority, while preserving explicit plan authorization, chargeable-attempt persistence, and
  safe reconciliation (BUG-021).
- Add the project-level OpenSpec gate policy at
  `openspec/policies/human-centered-gates.md` and wire its concise principles into
  `openspec/config.yaml`, so future gate/readiness changes must specify guide, confirm, and
  hard-stop behavior.

The change does not remove gates, make invalid source/state continue, invent approval evidence,
edit generated artifacts by hand, or make `--force` submit to a provider.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `framework-charter`: formalize the guide-first, user-choice-preserving gate posture and its
  non-overridable safety boundaries.
- `cli-surface`: add/align waiver, force, state-validation, and Phase-4 transport command
  behavior, diagnostics, JSON envelopes, and return-audit coverage.
- `node-specification`: extend version-scoped HTML gate/delivery evidence to distinguish approved,
  waived, identity freshness, evidence completeness, and auditable waived checks without creating
  a second state authority.
- `pipeline-orchestration`: canonical review-plan projections, composition-aware revalidation,
  owner-specific stale sets, and explicit continuation behavior for HTML build/delivery/refinement.
- `playbook-execution`: make MD Controller gate handling recommend repair first and record explicit
  human continuation decisions without treating conversation memory as evidence.
- `notes-injection`: accept blank lines inside multiline speaker-note blockquotes while retaining
  required-note and slide-ID validation.
- `image-generation`: expose a CLI-injectable modern visual-slot transport through the existing
  credential/provider contract without coupling HTML Phase 3 to the private adapter.
- `visual-slot-refinement`: allow an explicitly recorded delivery prerequisite waiver for offline
  planning only; plan authorization and provider generation remain separate hard boundaries.

## Impact

- **Framework source:** `PPTMAKER_FRAMEWORK/charter/`, `PPTMAKER_FRAMEWORK/playbook/`,
  `PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs`, HTML review/state contracts, notes injection, and
  Phase-4 refinement adapter modules.
- **OpenSpec governance:** new `openspec/policies/human-centered-gates.md`, updated
  `openspec/config.yaml`, and deltas for the capabilities above.
- **CLI surface:** `approve`, `build`, `state --validate-state`,
  `state --record-delivery-review`, and `image2 plan`/`authorize`/`generate` behavior and
  diagnostics.
- **State and compatibility:** existing `3_versions/vN` keys, reserved node ownership, atomic
  gate journal, reset fences, exact plan hashes, and legacy markerless routes remain compatible;
  explicit waiver records gain the additional audit fields required by the new contract.
- **Tests:** targeted contract/state/CLI tests, fake-transport integration coverage, and an
  HTML-first end-to-end fixture from pilot through delivery and optional refinement without a
  real provider submit.
