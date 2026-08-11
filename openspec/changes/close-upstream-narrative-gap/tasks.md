> Apply protocol: update this ledger immediately after each verified task group.
> Mark a task complete only with its named evidence; record failures and the
> recovery result here before moving to the next group.

## 1. Establish Current Narrative Sources

- [ ] 1.1 Reconfirm the active Harness-only source inventory for `outline.md`, `design-constraints.md`, Story Outline, initialization, and structural publication; create only synthetic test fixtures and do not read `deck_*` or `dpt_*` data.
- [ ] 1.2 Implement the `narrative-authoring` source parser/normalizer for the Block-first `story-outline.md` and the focused `design-constraints.md` grammar, including Deck Author repair guidance and content-versus-visual/layout ownership rejection.
- [ ] 1.3 Materialize C3 in `schema/`: update the Story Outline, Design Constraints, Page Source flow, recovery route, and serialization inventory with real current owners and anchors; keep the definition home descriptive rather than executable.
- [ ] 1.4 Clean-cutover the active backbone layout from `outline.md` to `story-outline.md`: update `bundle_layout.mjs`, initialization/structure checks, templates, workflow/reference guidance, and source maps; remove the retired active path without reader, migration, or fallback behavior.
- [ ] 1.5 Update the Run Bundle layout/init focused tests to prove new bundles seed only the current editable narrative-source pair and create no plan, provider, review, or lifecycle evidence.

## 2. Compile And Publish Page Plans

- [ ] 2.1 Define and implement the confined Agent-authored page-grouping candidate grammar under the active version `_scratch/`; require complete Page Source content, declared Block/beat references, and valid current mnemonic IDs without treating the candidate as durable source or state.
- [ ] 2.2 Implement the deterministic narrative page-plan compiler: bind story, constraints, Visual Language, candidate, source, target workflow/version, and complete target source bytes; validate beat/range lineage and existing Page Source grammar; produce a reproducible exact plan and bounded provenance.
- [ ] 2.3 Extend the existing `ppt_flow slides` surface with provider-free narrative-plan preview and its registered diagnostics. Return only one confined derived plan location, page lineage, and exact hash; do not add force, direct-source-write, legacy, migration, or provider controls.
- [ ] 2.4 Extend the existing exact-plan publisher so a matching narrative plan can populate the known evidence-free initial draft in place, while every authored/current version continues through clean vNext structural publication. Revalidate every binding and hard-stop before any source/state/derived/provider mutation.
- [ ] 2.5 Update structural/source integration contracts so a successful narrative publication has valid canonical Page Source, correct render debt, zero provider calls, and no inherited raw, review, final, or delivery evidence.

## 3. Integrate The Agent Workflow

- [ ] 3.1 Update the create-deck playbook, controller manifest/reader coverage, and content methodology so Story Outline and Design Constraints precede workflow/Visual Language selection, Agent candidate preparation, page-plan review, and Page Source materialization.
- [ ] 3.2 Implement the `guide`/`confirm`/`hard-stop` interaction boundary: Agent-owned deterministic repair, one Deck Author content/structure confirmation, and existing non-bypassable input/identity/hash/target invariants. Do not persist a second confirmation, controller state, or provider authorization.
- [ ] 3.3 Update command/help and repository guidance for the current `slides narrative-plan` and `slides apply-plan` route, including the first concrete repair action for malformed source/candidate or stale plan.

## 4. Verify And Record Evidence

- [ ] 4.1 Add focused unit coverage for source grammar, ownership-boundary rejection, candidate lineage/range validation, deterministic plan hashing, and every stale/invalid precondition. Prove each failure short-circuits before the wrong-owner mutation.
- [ ] 4.2 Add temporary-bundle integration coverage for layout/init, CLI preview, exact apply, initial-draft publication, and authored-version vNext publication. Prove no provider call, state/evidence inheritance, or historical-outline fallback.
- [ ] 4.3 Add a mock Controller/E2E journey proving narrative authoring precedes canonical page source and a story revision invalidates the preview without a source write or redundant authorization; do not run paid or real-provider E2E.
- [ ] 4.4 Run schema/layout/CLI/Controller focused suites, `npm test`, the selected mock E2E suite, `openspec validate close-upstream-narrative-gap --strict`, `openspec validate --all --strict`, and `git diff --check`. Record the results in this ledger and the recovery route; confirm no Run Bundle or research data was used as a fixture.
