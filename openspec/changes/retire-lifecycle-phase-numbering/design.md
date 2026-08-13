## Context

`md_controller_reader.mjs` validates playbook node frontmatter. Each node
declares both `lifecycle_phase` (a coarse ordinal in `0/1/2/3/4/5`) and
`method_module` (the self-describing `00-setup`…`06-iteration` directory). The
reader enforces a partial mapping:

- `lifecycle_phase: "4"` ⇔ `method_module` ∈ {`03-framed-image`,
  `04-pure-image`, `05-delivery`} (`TARGET_STAGE_FOUR_MODULES`)
- `lifecycle_phase: "5"` ⇔ `method_module` = `06-iteration`
- `3` is declared in `LIFECYCLE_PHASES` but used by no node.

`method_module` alone is finer and self-describing, and is already validated
against `METHOD_MODULES`. `lifecycle_phase` adds no information that
`method_module` does not already carry.

## Decision

Retire `lifecycle_phase` entirely and let `method_module` be the single
lifecycle-location field. Concretely:

1. **Playbook frontmatter:** delete every `lifecycle_phase:` line. The adjacent
   `method_module:` line is unchanged and already present on every node.
2. **`md_controller_reader.mjs`:**
   - remove the `LIFECYCLE_PHASES` export;
   - remove `lifecyclePhase` and `unsupportedPhase` (`raw.phase`) from
     `normalizeNode`, and the `unsupported-phase` rejection;
   - remove the four validation branches that read `node.lifecyclePhase`
     (`lifecycle-phase`, `phase4-ownership`, and both `target-lifecycle`).
   - `TARGET_STAGE_FOUR_MODULES` remains: it still names the target modules
     used by the `image-production-adapter` and `production-workflows` checks.
3. **Prose:** rename lifecycle "Phase N" headings/summaries to their
   method-module names (e.g. `# Phase 1: Page Image Content` →
   `# 01-content: Page Image Content`; `Agent 在 Phase 0 …` →
   `Agent 在 00-setup …`). Leave customer-roadmap examples in
   `block-arc-catalog.md` untouched — those are content, not lifecycle
   terminology.
4. **`harness_coherence.mjs`:** update the `hierarchy-ambiguity` regex so it no
   longer treats the retired "Phase" phrasing as a canonical hierarchy form,
   while continuing to flag genuine lifecycle/module conflation.
5. **Tests:** update `tests/shared/state/test_md_controller_reader.mjs` and
   `test_target_authoring_draft_route.mjs` fixtures/assertions to drop
   `lifecycle_phase`; add/keep a negative case asserting a stray `phase` key is
   rejected as undeclared.

## Trade-offs

- **`method_module` is not documented in `charter/NODE-SPEC.md` today.**
  Retiring `lifecycle_phase` leaves `method_module` as the only lifecycle field
  but does not add its charter documentation here; that belongs to the
  follow-on terminology-alignment change (C2) so this change stays a pure
  removal.
- **"Lifecycle Phase" as a concept word** (the `0 → 1/2 → 2.7 → 3 → 4` table
  in the OpenSpec context) is left untouched; it is distinct from the
  `lifecycle_phase` field and is addressed separately, if at all.

## Verification

- `npm test` and the focused reader/route suites pass after the fixture change.
- `openspec validate retire-lifecycle-phase-numbering --strict` passes.
- `grep -rn "lifecycle_phase"` over the four source dirs returns zero hits.
- `git diff --check` is clean.
