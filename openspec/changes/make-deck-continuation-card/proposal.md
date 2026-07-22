## Why

A person returning to a finished or paused deck should not have to remember where the
framework lives, where the deck data lives, or which version to inspect. The earlier
direction incorrectly made `deck-guide.md` a continuation card and required the attachment
host to preserve that file's local path. That both erased the guide's existing operating role
and failed the novice workflow: a copied `deck-guide.md` byte stream cannot locate anything.

This framework needs one portable run-bundle locator that carries the static local anchors a
repository Agent needs to resume work. Current state and authority remain outside that card.

## What Changes

- Add deck-root `RUN_BUNDLE.md` as the create-if-absent portable locator manifest for new
  run bundles. It contains the initialized absolute `deck_root`, absolute `framework_root`,
  and normalized relative `framework_relation`, plus a short human handoff invitation.
- Preserve `deck-guide.md` as the in-bundle operating guide. `AGENTS.md` and `CLAUDE.md`
  route an Agent through `RUN_BUNDLE.md` for locating a deck and then `deck-guide.md` for
  operating rules; `README.md` tells a human to hand over `RUN_BUNDLE.md`.
- Define a bounded zero-write entry for card bytes: resolve and verify the declared local
  roots, use the state-owned exact-version selector, then reuse the existing exact-version
  structure check and state/status. A readable original card path is only a controlled
  fallback when its declared deck root became stale, not a prerequisite.
- Retain `continuation_target_version` as the inactive state selector. It selects a version
  only after `RUN_BUNDLE.md` has located a verified deck.
- Keep legacy bundles valid and untouched. New cards are forward-only; ordinary commands do
  not add or rewrite them in existing production `deck_*` data.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `run-bundle-layout`: admit and document `RUN_BUNDLE.md` as an optional compatibility-safe
  root control with a distinct locator role.
- `run-bundle-management`: seed a deterministic locator manifest from init's actual deck and
  framework roots without rewriting existing cards; retain read-only exact-run checking.
- `framework-charter`: define the card-byte resolution, verification, fallback, and bounded
  guide behavior.
- `node-specification`: retain the state-owned inactive target as the second-stage exact-run
  selector.

## Impact

- `bundle_layout.mjs`, its root constants/tree text, and fresh bundle seeds.
- `workflow/00-setup` templates, charter/bootstrap/reference pointer text, and documentation
  coherence fixtures.
- Fresh temporary-deck tests only. No new CLI, dependency, marker migration, or production
  `deck_*` mutation.
