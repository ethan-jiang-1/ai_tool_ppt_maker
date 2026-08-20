## Context

See proposal.md for why. Request transport is already a closed pairing in
`provider_profile.mjs`; submit lives privately in `command_support.mjs`;
retrieve is JSON inline Base64 plus `GET ${base}/tasks/{id}`.
`scripts/shared/cli/commands/probe.mjs` currently only child-processes
`env-check` with `--smoke` or `--probe-vendors`. `env-check` must not
statically import YAML/profile. Nineteen production stages stay nineteen.
`_lab/` is Run Bundle data. Deck-root scaffold already lives in
`bundle_layout.mjs` init (`_state/`, `_lessons/`).

Policies in force: `human-centered-gates.md`,
`agent-assistance-and-control.md`, `simple-reliable-control.md`.

## Goals / Non-Goals

**Goals:**

- One canonical Call Shape value, one validator, one executor, three wrappers.
- `_lab/` always scaffolded, empty-safe for PPT flow.
- Probe and env-check cut over in the same change as Lab.
- Production generate external behavior unchanged for omitted-transport
  profiles (named default digest).

**Non-Goals:**

- Packy direct-PNG / URL-download dialects.
- Style Master transport.
- Cloning authorize into Lab.
- `last-proven.json` or a current-proof lifecycle owner.

## Decisions

1. **Identifiers locked here (plan left them open).**
   - Value hash covers the canonical Call Shape fields only.
   - Candidate envelope `schema`: `pptmaker-image2-call-shape`.
   - Trial record `schema`: `pptmaker-image2-lab-trial`.
   - Sole registered `result_protocol`: `json-inline-b64`.
   - Named default: generations + json + 2000×1125 + multiple 1 + async-poll +
     `json-inline-b64`.
   Alternative: keep retrieve implicit in `completion` — rejected; Lab could
   then "prove" a dialect production cannot replay.

2. **Module layout.** Validator `call_shape.mjs`, executor
   `provider_executor.mjs`, Lab CLI `lab_cli.mjs`, all under
   `scripts/shared/image2/`. Profile resolver keeps identity/envelope fields
   and calls the validator for the page-image value. Production wrapper stays
   in command support / generate: binds plan, Style Master lineage, grant,
   attempt, receipts. Probe wrapper binds confirmed value + Style Master bytes
   when edits. Lab wrapper binds candidate + explicit reference + trial seal.
   Alternative: a twentieth `scripts/image2-lab/` stage — rejected.

3. **Executor contract.** Inputs: validated value, runtime credentials,
   prompt bytes, optional reference bytes, idempotency key, injectable
   fetch/clock/deadline. No `runDir`. Output: inspector-valid PNG bytes plus
   sanitized facts, or a typed failure. Deadline remains the existing 600,000 ms
   covering POST plus poll. Redirects rejected. Unregistered dialect → fail
   before treating bytes as PNG. Same `inspectExactPageImagePng` as generate.
   Submit currently lives in `command_support.mjs` beside the HTTP/poll helpers
   generate still needs for Style Master. The executor SHALL own page-image
   submit/retrieve; those helpers may be imported by the executor, and the
   generate wrapper may import the executor, but the HTTP helper module SHALL
   NOT statically import the executor (no load cycle).

4. **Lab CLI grammar.** Standalone, like `lessons.mjs`, not a `ppt_flow`
   subcommand.
   - `plan --run-dir <vN> --candidate <file> [--prompt-file] [--reference-file] ...`
     writes a bounded plan under `_lab/` temp-then-seal or a confined plan
     path and prints `plan_hash`.
   - `execute --run-dir <vN> --plan-hash <hash>` runs it.
   Multiple candidates are listed in one plan; execute submits each at most
   once. Playbook file: `ppt_maker_harness/playbook/image2-lab.md`.
   Alternative: interactive confirm per candidate — rejected by Task
   Mandate. Alternative: `ppt_flow lab` — rejected to keep Lab off the
   production router and the closed `ppt_flow` inventory; inventory still
   registers the standalone executable.

5. **Trial files (CLI convention, not layout whitelist).** Inside
   `_lab/runs/vN/trials/<trial-id>/`: `trial.json` (sealed manifest) and on
   success `output.png`. Plan files live under `_lab/runs/vN/plans/` with the
   same atomic-seal rule. Nested `.gitignore` ignores `output.png`, prompt
   bodies, and other large artifacts by default.

6. **Reference bytes.** Lab `--reference-file` is fixtures PNG or an import
   of already-verified Style Master **bytes** hashed before execute. Probe
   edits uses current selected Style Master bytes or hard-stops. Generate
   keeps today's selection lineage. Executor never searches the deck.

7. **`_lab/` heal.** `init` always writes README, `.gitignore`, `fixtures/`,
   `runs/`. `bundle_layout --check` reports missing `_lab/` as repairable
   (guide), not identity hard-stop. `checkDeckRootControls` today does not even
   require `_state/` or `_lessons/` to exist; missing `_lab/` is a new
   repairable finding, not an identity hard-stop. One new shared
   `ensureLabScaffold()` is owned by `bundle_layout.mjs` and is invoked from
   `initBundleForDraft`'s existing deck-root directory seed (the mkdir +
   `_DIR_READMES` loop that already creates `_state/` and `_lessons/`) and from
   Lab CLI before plan/trial writes. There is no current post-init
   `ensureDeckRoot()` helper; `ensureStateDirHints` in `state.mjs` only heals
   `_state/` README on state writes and SHALL NOT become the Lab heal owner.
   Generate, probe, and authorize do not write `_lab/`. Empty scaffold never
   changes Call Shape resolution. Alternative: lazy create only when Lab
   runs — rejected by the human override. Alternative: every mutating Image2
   command heals — rejected; that would make generate a layout writer.

8. **Probe cutover sentence.** Today `ppt_flow probe <run-dir>` already
   implies `--smoke` (hardcoded generations POST via env-check). After this
   change, flagless `probe <run-dir>` is exactly one confirmed Call Shape
   submit through the executor. Pending → Lab next, zero fetch. `--smoke` /
   `--probe-vendors` on env-check, doctor, and probe are usage migration
   diagnostics (they do not silently become the new flagless probe).
   env-check JSON drops live-probe result fields. Probe CLI stays
   non-interactive; the playbook Work Request covers the one submit.
   Alternative: keep smoke as "tiny generations POST" — rejected; that is the
   dual truth.

9. **Capability registry.** Add `image2-lab` to the harness capability
   registry in `openspec/config.yaml` during apply, with owner paths on the
   Lab CLI and lab playbook. Call Shape field authority stays
   `production-schema-conformance` + `run-bundle-management`.

10. **CONTEXT.md.** Write Call Shape / Lab Workspace terms in the last apply
    task, same cutover as docs/charter, not during planning.

**Authority (keel).**

| Fact | Authority | Writer | Not owner |
|---|---|---|---|
| Call Shape fields | serialization + validator | profile YAML / candidate file | trial copy |
| Adopted production value | confirmed profile (version override > backbone) | Deck Author | Lab, lesson |
| Credentials / base URL | `.env` + selector | environment | Call Shape |
| Trial evidence | sealed trial + executor inspector | Lab CLI | generate |
| Production authorization | existing mandate/plan/grant | image2 CLI | Lab trial |
| `_lab/` presence | layout constitution | init / heal | generate reader |

## Risks / Trade-offs

| Risk | Mitigation |
|---|---|
| Extracting submit changes generate behavior | Golden mock: omitted-transport profile keeps generations JSON 2000×1125 async-poll `json-inline-b64`; existing generate tests stay green before Lab lands |
| Adding `result_protocol` to hashed page-image operations changes `profile_sha256` | YAML needs no rewrite; existing current plans/grants take the already specified stale-plan / Generated Image Rebuild path |
| Heal writes surprise directories on old decks | Scaffold is empty + gitignored large files; `--check` is repairable not hard-stop; no trial invention; generate does not heal |
| env-check JSON consumers of smoke booleans | Playbooks cut over in the same change; residue tests fail on `--smoke` docs |
| Lab plan files become a second profile | Plan is a bounded work record with hash; execute does not write confirmed YAML |
| Executor grows to Packy dialects mid-change | Fail closed on unregistered retrieve; follow-up change only |

## Migration Plan

1. Ship validator + named default; omitted YAML is still a valid confirmed
   source. Including resolved `result_protocol` in hashed page-image operations
   changes `profile_sha256`; former current plans use the existing stale-plan /
   Generated Image Rebuild path.
2. Move generate retrieve onto executor; omitted-transport submit URL/method/
   encoding/size stay the named default.
3. Scaffold `_lab/` on init; Lab CLI heals a missing scaffold; `--check`
   reports repairable absence.
4. Ship Lab CLI + playbook.
5. Cut probe/env-check/docs together; retire live flags with migration
   diagnostics. Exact-run readiness remains `preflight`, not `doctor --run-dir`.
6. Write CONTEXT.md terms. Rollback is revert of the change; omitted YAML
   remains a valid source throughout.

Existing confirmed profiles without `transport`/`result_protocol` need no
rewrite. Missing `_lab/` heals on init's deck-root seed or Lab CLI, not on
generate. Production `deck_*` bytes are not batch-migrated.

## Verification Strategy

- **Unit (`tests/`):** Call Shape canonicalize/hash/illegal pairing;
  named-default digest identity; `json-inline-b64` decode; unregistered
  dialect fail-closed; secret-safe diagnostics; `_lab/` scaffold/heal/`--check`;
  admission (symlink, non-vN, binding); plan-hash mismatch; atomic trial seal;
  planted-secret absence.
- **Integration (`tests/`):** generate / probe / Lab wrappers against one
  mock fetch: same URL, method, encoding, model, size, reference bytes, and
  inspector dimensions; pending probe zero fetch with Lab next; env-check
  `--smoke` usage diagnostic and zero POST; architecture guard rejects a
  second decoder.
- **E2E (`tests_e2e/`):** none required. There is no existing Image2 CLI e2e
  covering probe/generate flag parsing; this change does not add one. Init
  `_lab/` and retired-flag fail-closed are proven in `tests/`. Do not use
  production `deck_*` as fixtures.
- Not required: live vendor network tests.

## Open Questions

None. Dialect id, envelope schemas, CLI path, execute flag, trial filenames,
and probe cutover are locked above.
