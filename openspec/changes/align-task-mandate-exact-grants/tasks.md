## 1. Task Mandate State Contract

- [ ] 1.1 [node-specification] Add the optional, version-scoped Page Image Task Mandate record to the schema-5 State allowlist, canonical validation, digest calculation, and public typed helpers; bind it exactly to current `run_version`, workflow, execution ID, execution-start time, and the fixed normal-production scope without storing Work Request prose or provider secrets.
- [ ] 1.2 [node-specification] Implement one CAS-protected state mutation that establishes or replays the matching mandate during selected provider-free Page Image planning; make observation byte-preserving and reject reuse after a version, workflow, execution, identity, or explicit replacement boundary changes.
- [ ] 1.3 [node-specification] Add focused State tests for deterministic replay, same-execution source refinement, new-execution invalidation, observation non-mutation, malformed/stale records, and the earliest owner-issued recovery path.

## 2. Progressive Raw Protocol

- [ ] 2.1 [image-generation] Version the progressive raw full-plan schema to v2 with `task_mandate_sha256`; retain strict v1 readers for inspection, reconciliation, review, and historical evidence without rewriting, upgrading, or resubmitting legacy scopes.
- [ ] 2.2 [image-generation] Update Framed and Pure provider-free planning to establish/reuse the state-owned mandate before publishing a v2 full plan, and bind the new plan digest to that exact mandate while retaining all existing raw-contract, provider-input, Style Master, plan, batch, attempt, provenance, and CAS bindings.
- [ ] 2.3 [image-generation] Require the current State mandate and v2 plan binding before a new exact batch grant or provider attempt; return one bounded mandate-establishment or current-plan recovery action before provider initialization, grant publication, or attempt claim when the binding is missing, stale, invalid, or historical.
- [ ] 2.4 [image-generation] Reclassify only mandate-covered Pilot scope selection, successor planning, and exact batch grant creation as Agent-run `guide` actions; retain exact hashes, selected IDs, maximum submissions, one-item generation, unknown-attempt reconciliation, and all existing identity/integrity/recovery hard-stops.
- [ ] 2.5 [image-generation] Extend progressive schema/raw-owner tests for v2 binding, grant replay, invalid/mismatched mandate short-circuiting, v1 read/reconcile-only behavior, and unchanged partial-Pilot and Complete Page Review human-decision behavior.

## 3. CLI And Controller Handoff

- [ ] 3.1 [cli-surface] Preserve the registered `image2` command forms and exact hash arguments while surfacing valid Task-Mandate-covered Pilot, successor, and grant actions with `requires_human: false`; keep the bounded non-writing recovery diagnostic for missing or stale mandate before provider work.
- [ ] 3.2 [node-specification] Add an idempotent, state-owned post-`image2 authorize` handoff that verifies the direct plan, batch, grant, and mandate facts before recording typed `cli` evidence and completing the stable authorize node; prove a retry repairs only that handoff after a CAS race.
- [ ] 3.3 [playbook-execution] Revise the stable Framed and Pure authorize-target Pilot/Expansion nodes to use CLI evidence rather than a human cost decision, while preserving their IDs, downstream dependencies, and the existing typed human branches for Pilot visual review and Complete Page Review.
- [ ] 3.4 [cli-surface, node-specification, playbook-execution] Update public CLI/controller tests for Framed and Pure to prove guide actions flow through `plan -> pilot|expansion -> authorize -> generate`, task projections remain non-authoritative, and genuine human quality decisions and hard-stops retain their current posture.

## 4. Specification And Regression Validation

- [ ] 4.1 [image-generation, cli-surface, playbook-execution] Align the affected main-spec wording, including the Image Generation purpose, with Task-Mandate-backed exact grants; retain the explicit distinction between routine agent-run recordkeeping, human visual decisions, and non-bypassable hard-stops.
- [ ] 4.2 [image-generation] Extend the mock target-workflow end-to-end journey for both Framed and Pure through Pilot, Expansion, and Complete Page Review without a live provider or production-deck fixture.
- [ ] 4.3 Run focused unit/integration/CLI/MD Controller and Framed/Pure E2E coverage, then `openspec validate align-task-mandate-exact-grants --strict`, `git diff --check`, and the required repository regression suite; record any pre-existing unrelated failures separately.
