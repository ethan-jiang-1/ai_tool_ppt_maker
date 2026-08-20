## 1. Call Shape value and named default

- [x] 1.1 Declare Call Shape value, envelope `pptmaker-image2-call-shape`, named default, and sole `result_protocol` `json-inline-b64` in `serialization-contracts.yaml` (`production-schema-conformance`). Done: inventory names the contract under `image2_provider_capability`; nineteen stages unchanged.
- [x] 1.2 Implement `scripts/shared/image2/call_shape.mjs` as the only validator/canonicalize/hash (`production-schema-conformance`, `harness-script-layout`). Done: omitted transport+result_protocol digest equals the named default constant; illegal pairing/vendor key/unregistered dialect fail with zero fetch.
- [x] 1.3 Point `provider_profile.mjs` page-image resolve at that validator so omitted fields remain compatible (`run-bundle-management`). Done: existing confirmed profiles without transport still bind generations/json/2000x1125/async-poll/`json-inline-b64`; style-master still rejects transport/result_protocol.
- [x] 1.4 Unit tests for digest identity, closed pairings, budget units, and unregistered dialect (`production-schema-conformance`). Done: focused tests fail closed without network.

## 2. Shared executor and production wrapper

- [x] 2.1 Implement `provider_executor.mjs`: credentials + validated value + prompt/reference bytes + injectable fetch/deadline → inspector PNG or typed failure (`image-generation`, `harness-script-layout`). Done: no `runDir`/profile/State; `json-inline-b64` only; redirects rejected; deadline covers POST+poll; same PNG inspector as generate.
- [x] 2.2 Switch production generate submit/retrieve to the executor wrapper without changing omitted-transport behavior (`image-generation`). Done: generate tests stay green; generate does not read `_lab/`; `command_support` HTTP helpers do not statically import the executor.
- [x] 2.3 Register validator and executor seams; forbid a second parser/submit/poll/decoder (`harness-script-layout`). Done: architecture guard fails a planted duplicate decoder.
- [x] 2.4 Integration mock: generate wrapper vs executor share URL, method, encoding, model, size, and inspector dimensions (`image-generation`). Done: one mock fetch proves the pairing.

## 3. `_lab/` layout, init, heal, check

- [x] 3.1 Admit required deck-root `_lab/` in `bundle_layout.mjs` tree text, whitelist, and Where Map (`run-bundle-layout`). Done: internals unwhitelisted; `_lab/` is not a version leaf.
- [x] 3.2 `init` always writes README, nested `.gitignore`, `fixtures/`, `runs/` (`run-bundle-layout`). Done: new bundle has empty scaffold; no trials required.
- [x] 3.3 `--check` reports missing `_lab/` as repairable layout (`run-bundle-layout`, `run-bundle-management`). Done: not identity hard-stop; not forever-optional.
- [x] 3.4 Shared `ensureLabScaffold()` from `initBundleForDraft`'s deck-root seed loop (mkdir + `_DIR_READMES`) and from Lab CLI (`run-bundle-management`). Done: missing `_lab/` is created there; `ensureStateDirHints` is not the owner; generate/probe/authorize neither read nor write `_lab/`.
- [x] 3.5 `new-version` neither copies nor deletes trials (`run-bundle-layout`). Done: vN partitions stay put.
- [x] 3.6 Layout tests for init, empty-valid, missing-repairable, and production-non-read (`run-bundle-layout`). Done: no production `deck_*` fixtures.

## 4. Lab CLI and playbook

- [x] 4.1 Implement `lab_cli.mjs` `plan` / `execute --plan-hash` with admission-before-fetch (`image2-lab`, `cli-surface`). Done: symlink/non-vN/binding failures occur before fetch and before trial write.
- [x] 4.2 Atomic trial seal under `_lab/runs/vN/trials/<id>/` as `pptmaker-image2-lab-trial` with `trial.json` and optional `output.png`; stdout `trial_id`+`trial_sha256` (`image2-lab`). Done: half-written dirs are not proven; no `last-proven.json`.
- [x] 4.3 Explicit `--reference-file` for edits; import Style Master bytes by hash only (`image2-lab`). Done: missing reference hard-stops; no blank canvas; no production selection write.
- [x] 4.4 Unregistered dialect and planted-secret tests (`image2-lab`, `cli-surface`). Done: cannot mark proven; secrets absent from stdout/stderr/envelope/trial.
- [x] 4.5 Register Lab CLI in executable inventory and the closed-inventory companions (`source-test-ownership.json`, `test_process_cli_error.mjs` executable maps), not as a method stage (`harness-directory-layout`, `harness-script-layout`, `cli-surface`). Done: inventory audit passes; nineteen stages unchanged; Lab is not a `ppt_flow` subcommand.
- [x] 4.6 Add `ppt_maker_harness/playbook/image2-lab.md` and routing for discovery intent (`playbook-execution`, `image2-lab`, `commands-reference`). Done: not a create-deck node and not in `controller-manifest.json`; COMMANDS and coherence required tokens name the lab playbook; optional `lessons.mjs add` only as recommendation; Lab CLI writes no lesson.

## 5. Probe and env-check cutover

- [x] 5.1 Replace today's flagless `probe` (which implies env-check `--smoke`) so `probe.mjs` no longer children to env-check. `ppt_flow probe <run-dir>` submits confirmed Call Shape once via executor; pending hard-stop next=Lab; edits without Style Master hard-stop (`cli-surface`, `image-generation`). Drop `COMMAND_CONTRACTS.probe` `decisionEnums` `smoke`/`vendors`. Done: zero fetch on pending; probe does not read `_lab/`.
- [x] 5.2 Retire `--smoke` / `--probe-vendors` on env-check, doctor, and probe with usage migration diagnostics. Flags remain recognized only long enough to emit that diagnostic; `--help` SHALL NOT advertise them as accepted (`cli-surface`, `environment-check`). Done: flags do not silently become offline or alias to flagless probe; zero Image2 POST from env-check/doctor in every mode.
- [x] 5.3 Drop live-probe JSON fields from env-check; keep zero-npm YAML/executor import guard (`environment-check`, `harness-script-layout`). Done: `--help` lists `--json` and `--operation` only.
- [x] 5.4 Rewrite `probe-image-channels` and first-failure guidance to probe vs Lab (`playbook-execution`). Done: no vendor walk; no `doctor --probe-vendors`.
- [x] 5.5 Residue tests: docs/help/inventory do not advertise retired live flags as current (`cli-surface`, `environment-check`). Done: grep-backed tests fail on leftover current-work claims.

## 6. Guidance, registry, CONTEXT, validation

- [x] 6.1 COMMANDS two-question mapping (`commands-reference`). Done: probe vs Lab vs generate; empty `_lab/` does not block drawing.
- [x] 6.2 BOOTSTRAP live Image2 is probe or Lab (`bootstrap-env-guidance`). Done: no env-check smoke as current live work.
- [x] 6.3 Charter: probe is connectivity; Lab is discovery; empty lab is not a drawing blocker (`harness-charter`). Done: `--smoke` not described as capability proof.
- [x] 6.4 Register `image2-lab` in `openspec/config.yaml` capability registry (`harness-directory-layout`). Done: coherence tests parse the new entry.
- [x] 6.5 Write CONTEXT.md Call Shape / Lab Workspace terms at this last apply task only. Done: both terms are defined; they were not added during planning.
- [x] 6.6 Targeted unit/integration tests from design Verification Strategy, plus `openspec validate --strict --change add-image2-call-shape-and-lab` and `npm test`. Done: specified scenarios have proof; no production deck used as a fixture.
