## 1. Correct Root Roles

- [x] 1.1 **(run-bundle-layout)** Add `RUN_BUNDLE.md` as an allowed optional root control, factor the existing root-control enforcement into its one reusable narrow validator, and update tree/role text without making legacy absence invalid or adding state/version behavior.
- [x] 1.2 **(run-bundle-management)** Replace the erroneous continuation-card seed with a producer-owned `RUN_BUNDLE.md` renderer containing canonical physical absolute anchors and a measured normalized relation; preflight framework sentinels before deck writes and emit no partial card on a failed proof.
- [x] 1.3 **(run-bundle-management)** Restore `deck-guide.md` and its setup template as the operating guide; route README, AGENTS, and CLAUDE through locator then guide without duplicating either procedure.

## 2. Bounded Locator Entry

- [x] 2.1 **(run-bundle-management)** Replace `continuation_card.mjs` with the deep `run_bundle_locator.mjs` resolver. Hide closed-frontmatter parsing, canonical-record equality, physical-path/card/sentinel proof, candidate ordering, bounded guide codes, and relocation rules behind its one zero-write interface; do not add a CLI, state parser/selector, version scan, or structure validator.
- [x] 2.2 **(framework-charter)** Replace the path-required `deck-guide.md` entry with locator-module-first `RUN_BUNDLE.md` byte resolution, then the state-owned exact-version selector and existing exact-run structure check.
- [x] 2.3 **(node-specification)** Revalidate the existing `continuation_target_version` owner/visibility/terminal behavior as the post-locator exact-version selector; remove no state authority and add no new CLI.
- [x] 2.4 **(framework-charter / docs)** Align bootstrap, quick start, glossary, constitution, NODE-SPEC, framework README, and coherence exceptions with the separate locator and guide roles.

## 3. Focused Verification

- [x] 3.1 **(run-bundle-management, unit/integration)** Test fresh generic and all active mode/deck-type seeds, canonical physical anchors for sibling/external decks, normalized relation, closed manifest fields, shared root controls, and restored guide content.
- [x] 3.2 **(run-bundle-management, resolver negative)** Test duplicate/extra/alias/noncanonical manifests, symlinked cards, every bounded guide code, stale versus conflicting roots, relation disagreement, conflict recovery only through a fresh corrected-card resolution, deck-only/framework-only relocation, explicit-root guides, and no filesystem write or path search.
- [x] 3.3 **(run-bundle-management, init failure)** Test an unprovable framework root fails before deck writes and leaves no partial `RUN_BUNDLE.md`.
- [x] 3.4 **(framework-charter / node-specification)** Add a black-box locator fixture from unrelated cwd using card bytes and accessible declared paths; prove the resolver precedes state, active precedence, terminal target, exact-run checks, and zero state writes.
- [x] 3.5 **(documentation contract)** Assert no card claims live status or approval, no guide loses operating ownership, and no generic remote-chat support is claimed.

## 4. Release Validation

- [x] 4.1 Run targeted locator/state/layout/doc tests, full `npm test`, `openspec validate make-deck-continuation-card --strict`, and `git diff --check`.
- [x] 4.2 Confirm the diff changes only framework/OpenSpec/tests and does not modify production `deck_*` data.
