## ADDED Requirements

### Requirement: Pilot uses preview readiness and does not waive gates

`ppt_flow.mjs pilot` SHALL treat readiness as **preview** (structure + style master): it SHALL NOT require metadata `content_gate`/`visual_gate` to be `approved`/`waived`, and SHALL NOT write `waived` or otherwise mutate gate fields. When invoking Stage 2, pilot SHALL pass `unified_pipeline --preview` so the child process uses the same readiness. Full `build` and non-preview Stage 2 SHALL continue to use pipeline readiness (gates required).

#### Scenario: Pilot runs while gates are pending

- **WHEN** metadata gates are `pending`
- **AND** style master exists and structure is valid
- **AND** Agent runs `ppt_flow.mjs pilot <run_dir>`
- **THEN** pilot proceeds (including Stage 2 under `--preview`)
- **AND** metadata gate fields remain `pending`

#### Scenario: Build / non-preview Stage 2 still blocked

- **WHEN** gates are `pending`
- **AND** Agent runs `ppt_flow.mjs build` or `unified_pipeline --stage 2` without `--preview`
- **THEN** the command fails for gate readiness
- **AND** prior pilot success is not treated as approval

### Requirement: Pilot accepts --force-images and skips by default

`ppt_flow.mjs pilot` SHALL expose `--force-images`. Without it, pilot SHALL NOT pass force into Stage 2 (existing pilot images are skipped). With it, selected pilot images regenerate.

#### Scenario: Default pilot skips existing images

- **WHEN** pilot target images already exist
- **AND** pilot runs without `--force-images`
- **THEN** Stage 2 skips those files

#### Scenario: Pilot --force-images regenerates

- **WHEN** `pilot … --force-images` runs
- **THEN** Stage 2 regenerates the pilot selection

### Requirement: --only accepts friendly slide selectors

`ppt_flow` paths that accept `--only` (including `pilot`) SHALL use the same `resolveSlideIds` rules as `pipeline-orchestration`. Unknown/ambiguous selectors SHALL fail with a JSON envelope whose `hint` lists available slide ids (truncated if long).

#### Scenario: Page number selects a slide

- **WHEN** `--only 3` is passed and the third plan entry has id `s03_one_tool_two_modes`
- **THEN** pilot / Stage 2 targets that slide id

#### Scenario: Unknown selector lists ids

- **WHEN** `--only slide_03` matches nothing
- **THEN** the command exits non-zero with an envelope
- **AND** `hint` includes real ids from `slide_plan.json`

### Requirement: doctor forwards optional --smoke

`ppt_flow.mjs doctor` SHALL accept `--smoke` and forward it to `env-check.mjs`. Without `--smoke`, doctor remains presence-only (no Image2 network).

#### Scenario: doctor --smoke flag is accepted

- **WHEN** Agent runs `ppt_flow.mjs doctor --smoke`
- **THEN** the flag is passed through to env-check
- **AND** help text documents `--smoke`
