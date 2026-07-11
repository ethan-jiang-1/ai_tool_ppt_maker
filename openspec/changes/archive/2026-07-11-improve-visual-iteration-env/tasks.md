## 1. Readiness: preview vs pipeline

- [x] 1.1 Extend `checkBundle` with `structure` / `preview` / `pipeline` (keep bool aliases)
- [x] 1.2 Add `unified_pipeline --preview`; Stage 2 uses preview vs pipeline readiness accordingly
- [x] 1.3 Wire `ppt_flow pilot` to preview readiness + pass `--preview` into Stage 2; never mutate gates
- [x] 1.4 Tests: preview allows pending gates; pipeline/build without `--preview` still blocks

## 2. Slide selectors + force semantics

- [x] 2.1 Add shared `resolveSlideIds` helper; use from `unified_pipeline` + `ppt_flow pilot`
- [x] 2.2 Unknown/ambiguous `--only` → envelope `hint` with available ids
- [x] 2.3 Stage 2: `force = !!forceImages` only (remove `|| only`)
- [x] 2.4 `pilot`: drop unconditional `--force-images`; add `pilot --force-images`
- [x] 2.5 Update change-classifier / COMMANDS examples for explicit force
- [x] 2.6 Unit tests: resolver cases + skip/force matrix

## 3. Long render + fixtures

- [x] 3.1 Poll heartbeat every 30s in `image_api_client.mjs`
- [x] 3.2 Timeout error clearly identifies per-image `MAX_WAIT_MS` failure
- [x] 3.3 Export unwrap/extract helpers; add `tests/fixtures/image-api/` + tests

## 4. Style master ↔ deck_system

- [x] 4.1 Share/reuse Stage 1 `loadDeckSystem`; append when file present
- [x] 4.2 Add `--no-deck-system` escape hatch
- [x] 4.3 Tests: with file / without file / `--no-deck-system`

## 5. Optional doctor smoke

- [x] 5.1 `env-check --smoke`: POST generations; pass on `task_id`; fail → NOT READY
- [x] 5.2 `ppt_flow doctor --smoke` forward + help
- [x] 5.3 Mocked fetch tests; default path stays offline

## 6. Playbooks / docs / close plan

- [x] 6.1 Update `playbook/quick-preview.md` (pending OK; no waive-to-pilot; build still gated)
- [x] 6.2 Touch create-deck / iterate-style / `status` next-steps only where they still imply “must approve/waive before pilot”
- [x] 6.3 `npm test` green
- [x] 6.4 `git mv` plan to `_backlog/_done/_closed_plans/`
