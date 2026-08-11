> Apply protocol: update this ledger immediately after each verified task group.
> Mark a task complete only with its named evidence; record failures and the
> recovery result here before moving to the next group.

## Verification Ledger

- 2026-08-11, group 1: verified only against synthetic temporary bundles. Passed
  `tests/01-content/test_narrative_source.mjs`,
  `tests/shared/run-bundle/test_page_image_layout.mjs`, and
  `tests/contracts/test_page_image_schema_definitions.mjs` (24 tests), plus
  `bundle_layout.mjs --self-check`, `openspec validate
  close-upstream-narrative-gap --strict`, and `git diff --check`. The initial
  list-parser defect that omitted later beats was repaired before verification;
  no Run Bundle or research data was read as a fixture.
- 2026-08-11, group 2: verified the candidate parser, deterministic compiler,
  scratch confinement, CLI preview, exact initial publication, injected initial
  State-binding recovery, and clean vNext publication with
  `tests/01-content/test_narrative_page_plan*.mjs` plus the existing structural,
  layout, source, and schema suites (38 tests). `node --check` and
  `git diff --check` passed. All fixtures were synthetic temporary bundles; no
  provider call, source-bound evidence inheritance, Run Bundle, or research data
  was used.
- 2026-08-11, group 3: verified the create-deck narrative-first route, the
  manifest and reader projection, non-persistent page-plan confirmation, initial
  Controller pointer, workflow inspection, layout initialization, CLI help, and
  direct narrative publication with five focused suites (38 tests), `node
  --check`, `openspec validate close-upstream-narrative-gap --strict`, and `git
  diff --check`. The direct E2E fresh-authoring observation passed. The broader
  legacy `test-workflow-inspection-flow.mjs` has three selected-source
  receipt/diagnostic assertions that remain to be reconciled with the mock
  journey work in group 4; the selected wrapper also correctly rejected that
  hyphenated filename as outside its `test_mock_*_journey.mjs` scope. All
  fixtures used here were synthetic temporary bundles; no Run Bundle or research
  data was read.
- 2026-08-11, group 4A: added and verified focused grammar, target-order,
  lineage/range, scratch-confinement, candidate locator/byte, Story Outline,
  Design Constraints, Visual Language, current-source, and exact-hash failure
  coverage. Each apply failure preserved current Page Source and State before
  any target mutation. Temporary-bundle coverage verifies preview, exact initial
  publication, injected State-binding replay, clean vNext publication, no
  provider `fetch`, no inherited evidence, and no historical-outline fallback.
  The selected `test_mock_narrative_authoring_journey.mjs` E2E proves the
  narrative-first Controller handoff and story-revision invalidation without a
  source write or authorization. Passed 30 focused tests and the selected mock
  journey; all fixtures were synthetic temporary bundles.
- 2026-08-11, group 4B: the final regression first exposed two prohibited
  ownership edges: `01-content` directly imported `02-visual-system`, and
  `shared/state` parsed narrative sources. Recovered by injecting the current
  Visual Language public-interface functions through `ppt_flow` and leaving
  source validation with the narrative-plan owner; the Controller's source node
  now has no duplicate State exit condition or stale reader allowlist entry.
  Added the four missing test-owner manifest entries. The final rerun passed
  the schema/layout/CLI/Controller focused suites (76 tests), `npm test`, and
  the registered selected mock E2E (1 test), plus `bundle_layout.mjs
  --self-check`, `openspec validate close-upstream-narrative-gap --strict`,
  `openspec validate --all --strict` (28 items), and `git diff --check`.
  Final verification used only synthetic temporary bundles; no Run Bundle or
  research data was used as a fixture.

## 1. Establish Current Narrative Sources

- [x] 1.1 Reconfirm the active Harness-only source inventory for `outline.md`, `design-constraints.md`, Story Outline, initialization, and structural publication; create only synthetic test fixtures and do not read `deck_*` or `dpt_*` data.
- [x] 1.2 Implement the `narrative-authoring` source parser/normalizer for the Block-first `story-outline.md` and the focused `design-constraints.md` grammar, including Deck Author repair guidance and content-versus-visual/layout ownership rejection.
- [x] 1.3 Materialize C3 in `schema/`: update the Story Outline, Design Constraints, Page Source flow, recovery route, and serialization inventory with real current owners and anchors, including `narrative-page-grouping-candidate` and `narrative-page-plan`; keep the definition home descriptive rather than executable.
- [x] 1.4 Clean-cutover the active backbone layout from `outline.md` to `story-outline.md`: update `bundle_layout.mjs`, initialization/structure checks, templates, workflow/reference guidance, and source maps; remove the retired active path without reader, migration, or fallback behavior.
- [x] 1.5 Update the Run Bundle layout/init focused tests to prove new bundles seed only the current editable narrative-source pair and create no plan, source-bound target evidence, provider, or review evidence; retain the ordinary initialization-owned Controller state.

## 2. Compile And Publish Page Plans

- [x] 2.1 Define and implement the confined Agent-authored `narrative-page-grouping-candidate` UTF-8 JSON grammar under the active version `_scratch/`: one complete target Page Source text plus ordered target `slide_id` entries with Block ordinal/heading and beat-ordinal lineage. Require valid current mnemonic IDs without treating the candidate as durable source or state.
- [x] 2.2 Implement the deterministic narrative page-plan compiler: bind story, constraints, current Visual Language registry, candidate bytes plus confined scratch-relative locator, source, target workflow/version, and complete target source bytes; require candidate IDs to exactly equal parsed target Page Source order; validate beat/range lineage and existing Page Source grammar; produce a reproducible `narrative-page-plan` and bounded provenance.
- [x] 2.3 Extend the existing `ppt_flow slides` surface with provider-free `narrative-plan <run-dir> --candidate <path>` preview and its registered diagnostics. Require lexical and realpath confinement beneath the current `_scratch/`; write only `_scratch/narrative-plans/<plan_sha256>.json` and return its page lineage and exact hash; do not add force, direct-source-write, legacy, migration, or provider controls.
- [x] 2.4 Extend the existing exact-plan publisher so a matching narrative plan can populate only the exact current `v1` deck-type seed with no source-bound target evidence in place, while every authored/current version continues through clean vNext structural publication. Revalidate every binding, candidate locator/bytes, and hard-stop before any source/state/derived/provider mutation. If the initial source write succeeds but the existing State binding fails, allow only the same exact plan to finish that binding from its exact target bytes; every other recovery hard-stops.
- [x] 2.5 Update structural/source integration contracts so a successful narrative publication has valid canonical Page Source, uses the existing Page Image source-State owner to report render debt for every target slide, makes zero provider calls, and inherits no raw, review, final, or delivery evidence.

## 3. Integrate The Agent Workflow

- [x] 3.1 Update the create-deck playbook, controller manifest/reader coverage, and content methodology so Story Outline and Design Constraints precede workflow selection, current Visual Language registry use, Agent candidate preparation, page-plan review, and Page Source materialization.
- [x] 3.2 Implement the `guide`/`confirm`/`hard-stop` interaction boundary: Agent-owned deterministic repair, one Deck Author content/structure confirmation, and existing non-bypassable input/identity/hash/target invariants. Do not persist a second confirmation, controller state, or provider authorization.
- [x] 3.3 Update command/help and repository guidance for `slides narrative-plan <run-dir> --candidate <path>` and `slides apply-plan <run-dir> --plan <path> --apply --plan-sha256 <hash>`, including the first concrete repair action for malformed source/candidate or stale plan.

## 4. Verify And Record Evidence

- [x] 4.1 Add focused unit coverage for source grammar, ownership-boundary rejection, candidate JSON grammar, target-source/ID-order agreement, candidate lineage/range validation, candidate confinement and stale locator/byte rejection, deterministic plan hashing, and every stale/invalid precondition. Prove each failure short-circuits before the wrong-owner mutation.
- [x] 4.2 Add temporary-bundle integration coverage for layout/init, CLI preview, exact apply, initial-draft publication, exact replay after injected initial State-binding failure, and authored-version vNext publication. Prove no provider call, source-bound evidence inheritance, or historical-outline fallback.
- [x] 4.3 Add a mock Controller/E2E journey proving narrative authoring precedes canonical page source and a story revision invalidates the preview without a source write or redundant authorization; do not run paid or real-provider E2E.
- [x] 4.4 Run schema/layout/CLI/Controller focused suites, `npm test`, the selected mock E2E suite, `openspec validate close-upstream-narrative-gap --strict`, `openspec validate --all --strict`, and `git diff --check`. Record the results in this ledger and the recovery route; confirm no Run Bundle or research data was used as a fixture.
